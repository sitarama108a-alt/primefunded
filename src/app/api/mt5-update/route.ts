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

export async function POST(request: Request) {
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    let payload: any = {};
    const contentType = request.headers.get('content-type') || '';
    
    try {
      if (contentType.includes('application/json')) {
        payload = await request.json();
      } else if (contentType.includes('form')) {
        const formData = await request.formData();
        payload = Object.fromEntries(formData.entries());
      }
    } catch (e) {
      console.error('[MT5-API] Body parse error:', e);
      return new Response('Invalid request body', { status: 400 });
    }

    // Identify account via accountId or login fallback
    const accountId = payload.accountId || payload.login;
    const login = payload.login;
    const balance = payload.balance;
    const equity = payload.equity;
    const profit = payload.profit;

    if (!accountId) {
      return new Response('Missing account identification', { status: 400 });
    }

    const accRef = doc(db, 'mt5_accounts', String(accountId));
    const accSnap = await getDoc(accRef);
    
    // Sanitize inputs to prevent NaN Firestore errors
    const currBalance = parseFloat(String(balance)) || 0;
    const currEquity = parseFloat(String(equity)) || 0;
    const currProfit = parseFloat(String(profit)) || 0;

    if (!accSnap.exists()) {
      // First-time sync: Provision basic account structure
      await setDoc(accRef, {
        login: String(login || accountId),
        balance: currBalance,
        equity: currEquity,
        profit: currProfit,
        status: 'active',
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return new Response('OK', { status: 200 });
    }

    const accountData = accSnap.data();
    
    // Use stored startingBalance or initialize from current balance
    const startingBalance = parseFloat(String(accountData.startingBalance || currBalance)) || 100000;
    const planType = accountData.planType || '1-step-pro';
    const phase = accountData.phase || 'evaluation';
    const userId = accountData.userId;
    const currentStatus = accountData.status || 'active';

    // Skip monitoring for accounts already in a terminal state
    if (currentStatus === 'terminated' || currentStatus === 'passed') {
      return new Response('OK', { status: 200 });
    }

    // Calculate metrics with division-by-zero guards
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

    // Rule Engine Implementation
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

    // Handle User Notifications for status changes
    if (newStatus !== currentStatus && userId && typeof userId === 'string') {
      const notifRef = collection(db, 'users', userId, 'notifications');
      if (newStatus === 'terminated') {
        await addDoc(notifRef, {
          title: "🚨 Account Terminated",
          message: `Your account PF-${login || accountId} has been terminated. Reason: ${breachReason}`,
          type: 'challenge_failed',
          isRead: false,
          createdAt: serverTimestamp()
        });
      } else if (newStatus === 'passed') {
        await addDoc(notifRef, {
          title: "🎉 Challenge Passed!",
          message: `Congratulations! Account PF-${login || accountId} has reached the target. Advancement pending review.`,
          type: 'challenge_passed',
          isRead: false,
          createdAt: serverTimestamp()
        });
      }
    }

    // Persist finalized metrics to Firestore
    const updatePayload: any = {
      login: String(login || accountId),
      balance: currBalance,
      equity: currEquity,
      profit: currProfit,
      profitPct: profitPct || 0,
      floatingLossPct: floatingLossPct || 0,
      dailyDrawdownPct: dailyDrawdownPct || 0,
      maxDrawdownPct: maxDrawdownPct || 0,
      startingBalance,
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
