import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

/**
 * @fileOverview MT5 Update API with Automated Breach Detection
 * Handles real-time metric syncing and enforces prop firm rules.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // 1. Validate Configuration
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      return new Response('Firebase Configuration Missing', { status: 500 });
    }

    // 2. Initialize Firebase (Client SDK on Node.js)
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // 3. Robust Body Parsing
    let payload: any = {};
    const contentType = request.headers.get('content-type') || '';
    
    try {
      if (contentType.includes('application/json')) {
        payload = await request.json();
      } else {
        const formData = await request.formData();
        payload = Object.fromEntries(formData.entries());
      }
    } catch (e) {
      return new Response('Malformed Request Body', { status: 400 });
    }

    // 4. Identify Account
    const accountId = payload.accountId || payload.login;
    if (!accountId) {
      return new Response('Missing accountId', { status: 400 });
    }

    // 5. Sanitize Metric Inputs
    const currBalance = parseFloat(String(payload.balance)) || 0;
    const currEquity = parseFloat(String(payload.equity)) || 0;
    const currProfit = parseFloat(String(payload.profit)) || 0;
    const login = String(payload.login || accountId);

    const accRef = doc(db, 'mt5_accounts', String(accountId));
    const accSnap = await getDoc(accRef);
    
    if (!accSnap.exists()) {
      // First-time sync: Provision basic account structure
      await setDoc(accRef, {
        login,
        balance: currBalance,
        equity: currEquity,
        profit: currProfit,
        status: 'active',
        startingBalance: currBalance > 0 ? currBalance : 100000,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return new Response('OK', { status: 200 });
    }

    const accountData = accSnap.data();
    const startingBalance = parseFloat(String(accountData.startingBalance)) || currBalance || 100000;
    const planType = accountData.planType || '1-step-pro';
    const phase = accountData.phase || 'evaluation';
    const userId = accountData.userId;
    const currentStatus = accountData.status || 'active';

    // Skip monitoring for terminal accounts
    if (currentStatus === 'terminated' || currentStatus === 'passed') {
      return new Response('OK', { status: 200 });
    }

    // 6. Calculate Compliance Metrics
    const profitPct = startingBalance !== 0 ? ((currEquity - startingBalance) / startingBalance) * 100 : 0;
    const floatingLossPct = currBalance !== 0 ? ((currBalance - currEquity) / currBalance) * 100 : 0;
    const dailyDrawdownPct = startingBalance !== 0 ? ((startingBalance - currEquity) / startingBalance) * 100 : 0;
    const maxDrawdownPct = dailyDrawdownPct; 

    let newStatus = 'active';
    let breachType: 'hard' | 'soft' | null = null;
    let breachReason = '';

    const checkHardBreach = (rules: { daily: number, max: number, float?: number }) => {
      if (dailyDrawdownPct > rules.daily) return `Daily drawdown limit exceeded (${dailyDrawdownPct.toFixed(2)}% > ${rules.daily}%)`;
      if (maxDrawdownPct > rules.max) return `Maximum drawdown limit exceeded (${maxDrawdownPct.toFixed(2)}% > ${rules.max}%)`;
      if (rules.float && floatingLossPct > rules.float) return `Floating loss limit exceeded (${floatingLossPct.toFixed(2)}% > ${rules.float}%)`;
      return null;
    };

    // 7. Rule Engine
    if (planType === '1-step-pro') {
      const reason = checkHardBreach(phase === 'funded' ? { daily: 3, max: 6, float: 1 } : { daily: 3, max: 6 });
      if (reason) { breachReason = reason; breachType = 'hard'; }
      else if (phase === 'evaluation' && profitPct >= 10 && (accountData.tradingDays || 0) >= 5) newStatus = 'passed';
    } 
    else if (planType === '2-step-classic') {
      const reason = checkHardBreach(phase === 'funded' ? { daily: 5, max: 10, float: 1 } : { daily: 5, max: 10 });
      if (reason) { breachReason = reason; breachType = 'hard'; }
      else if (phase === 'phase1' && profitPct >= 8 && (accountData.tradingDays || 0) >= 5) newStatus = 'passed';
      else if (phase === 'phase2' && profitPct >= 5 && (accountData.tradingDays || 0) >= 5) newStatus = 'passed';
    }
    else if (planType === '3-step-classic') {
      const reason = checkHardBreach(phase === 'funded' ? { daily: 4, max: 8, float: 1 } : { daily: 4, max: 8 });
      if (reason) { breachReason = reason; breachType = 'hard'; }
      else if (phase === 'phase1' && profitPct >= 10 && (accountData.tradingDays || 0) >= 7) newStatus = 'passed';
      else if (phase === 'phase2' && profitPct >= 8 && (accountData.tradingDays || 0) >= 6) newStatus = 'passed';
      else if (phase === 'phase3' && profitPct >= 5 && (accountData.tradingDays || 0) >= 5) newStatus = 'passed';
    }
    else if (planType === 'instant-funding') {
      const reason = checkHardBreach({ daily: 2, max: 4, float: 1 });
      if (reason) { breachReason = reason; breachType = 'hard'; }
    }

    if (breachType === 'hard') newStatus = 'terminated';

    // 8. Trigger Notifications on Status Change
    if (newStatus !== currentStatus && userId) {
      const notifRef = collection(db, 'users', String(userId), 'notifications');
      if (newStatus === 'terminated') {
        await addDoc(notifRef, {
          title: "🚨 Account Terminated",
          message: `Your account PF-${login} has been terminated. Reason: ${breachReason}`,
          type: 'challenge_failed',
          isRead: false,
          createdAt: serverTimestamp()
        });
      } else if (newStatus === 'passed') {
        await addDoc(notifRef, {
          title: "🎉 Challenge Passed!",
          message: `Congratulations! Account PF-${login} has reached the target. Advancement pending review.`,
          type: 'challenge_passed',
          isRead: false,
          createdAt: serverTimestamp()
        });
      }
    }

    // 9. Persist Metrics
    const updatePayload: any = {
      login,
      balance: currBalance,
      equity: currEquity,
      profit: currProfit,
      profitPct: profitPct || 0,
      floatingLossPct: floatingLossPct || 0,
      dailyDrawdownPct: dailyDrawdownPct || 0,
      maxDrawdownPct: maxDrawdownPct || 0,
      status: newStatus,
      updatedAt: serverTimestamp(),
    };

    if (breachType) {
      updatePayload.breachType = breachType;
      updatePayload.breachReason = breachReason;
      updatePayload.breachTime = serverTimestamp();
    }

    await setDoc(accRef, updatePayload, { merge: true });

    return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });

  } catch (error: any) {
    console.error('[MT5-API] Global Error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}

export async function GET() {
  return new Response('API_ACTIVE', { status: 200 });
}
