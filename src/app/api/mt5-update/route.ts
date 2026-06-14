import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, addDoc, Timestamp } from 'firebase/firestore';

/**
 * @fileOverview MT5 Update API with Automated Breach Detection & Plan Progression
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
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      return new Response('Config Missing', { status: 500, headers: { 'Content-Type': 'text/plain' } });
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Robust Body Parsing
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
      return new Response('Payload Error', { status: 400 });
    }

    const accountId = String(payload.accountId || payload.login || '');
    if (!accountId || accountId === 'undefined') {
      return new Response('Missing accountId', { status: 400 });
    }

    // Sanitize Metrics
    const currBalance = parseFloat(String(payload.balance)) || 0;
    const currEquity = parseFloat(String(payload.equity)) || 0;
    const currProfit = parseFloat(String(payload.profit)) || 0;
    const login = String(payload.login || accountId);

    const accRef = doc(db, 'mt5_accounts', accountId);
    const accSnap = await getDoc(accRef);
    
    let accountData: any = {};
    
    if (!accSnap.exists()) {
      // First-time provision
      accountData = {
        login,
        balance: currBalance,
        equity: currEquity,
        profit: currProfit,
        status: 'active',
        startingBalance: currBalance > 0 ? currBalance : 100000,
        planType: '1-step-pro',
        phase: 'evaluation',
        tradingDays: 0,
        updatedAt: serverTimestamp(),
      };
      await setDoc(accRef, accountData, { merge: true });
      return new Response('OK', { status: 200 });
    }

    accountData = accSnap.data();
    const startingBalance = parseFloat(String(accountData.startingBalance)) || currBalance || 100000;
    const planType = String(accountData.planType || '1-step-pro');
    const phase = String(accountData.phase || 'evaluation');
    const userId = accountData.userId;
    const currentStatus = String(accountData.status || 'active');

    if (currentStatus === 'terminated' || currentStatus === 'passed') {
      return new Response('OK', { status: 200 });
    }

    // 1. Calculate Core Metrics
    const profitPct = startingBalance !== 0 ? ((currEquity - startingBalance) / startingBalance) * 100 : 0;
    const floatingLossPct = currBalance !== 0 ? ((currBalance - currEquity) / currBalance) * 100 : 0;
    const dailyDrawdownPct = startingBalance !== 0 ? ((startingBalance - currEquity) / startingBalance) * 100 : 0;
    const maxDrawdownPct = dailyDrawdownPct; 

    let newStatus = 'active';
    let newPhase = phase;
    let breachType: 'hard' | 'soft' | null = null;
    let breachReason = '';

    const triggerHardBreach = (reason: string) => {
      newStatus = 'terminated';
      breachType = 'hard';
      breachReason = reason;
    };

    // 2. Risk Engine
    if (planType === '1-step-pro') {
      if (phase === 'funded') {
        if (floatingLossPct > 1) triggerHardBreach(`Floating loss limit exceeded (1%)`);
        if (dailyDrawdownPct > 3) triggerHardBreach(`Daily drawdown limit exceeded (3%)`);
        if (maxDrawdownPct > 6) triggerHardBreach(`Maximum drawdown limit exceeded (6%)`);
      } else {
        if (dailyDrawdownPct > 3) triggerHardBreach(`Evaluation daily drawdown exceeded (3%)`);
        if (maxDrawdownPct > 6) triggerHardBreach(`Evaluation max drawdown exceeded (6%)`);
        else if (profitPct >= 10 && (accountData.tradingDays || 0) >= 5) newStatus = 'passed';
      }
    } 
    else if (planType === '2-step-classic') {
      const dailyLimit = 5;
      const maxLimit = 10;
      
      if (phase === 'funded' && floatingLossPct > 1) triggerHardBreach(`Floating loss limit exceeded (1%)`);
      if (dailyDrawdownPct > dailyLimit) triggerHardBreach(`Daily drawdown exceeded (${dailyLimit}%)`);
      if (maxDrawdownPct > maxLimit) triggerHardBreach(`Max drawdown exceeded (${maxLimit}%)`);
      
      if (newStatus === 'active') {
        if (phase === 'phase1' && profitPct >= 8 && (accountData.tradingDays || 0) >= 5) {
          newPhase = 'phase2';
          newStatus = 'active'; // Move to next phase
        } else if (phase === 'phase2' && profitPct >= 5 && (accountData.tradingDays || 0) >= 5) {
          newStatus = 'passed';
        }
      }
    }
    else if (planType === '3-step-classic') {
      const dailyLimit = 4;
      const maxLimit = 8;
      
      if (phase === 'funded' && floatingLossPct > 1) triggerHardBreach(`Floating loss limit exceeded (1%)`);
      if (dailyDrawdownPct > dailyLimit) triggerHardBreach(`Daily drawdown exceeded (${dailyLimit}%)`);
      if (maxDrawdownPct > maxLimit) triggerHardBreach(`Max drawdown exceeded (${maxLimit}%)`);
      
      if (newStatus === 'active') {
        if (phase === 'phase1' && profitPct >= 10 && (accountData.tradingDays || 0) >= 7) newPhase = 'phase2';
        else if (phase === 'phase2' && profitPct >= 8 && (accountData.tradingDays || 0) >= 6) newPhase = 'phase3';
        else if (phase === 'phase3' && profitPct >= 5 && (accountData.tradingDays || 0) >= 5) newStatus = 'passed';
      }
    }
    else if (planType === 'instant-funding') {
      if (dailyDrawdownPct > 2) triggerHardBreach(`Instant account daily drawdown exceeded (2%)`);
      if (maxDrawdownPct > 4) triggerHardBreach(`Instant account max drawdown exceeded (4%)`);
      if (floatingLossPct > 1) triggerHardBreach(`Instant account floating loss exceeded (1%)`);
    }

    // 3. Status Change Notifications
    if (newStatus !== currentStatus && userId) {
      const notifRef = collection(db, 'users', String(userId), 'notifications');
      if (newStatus === 'terminated') {
        await addDoc(notifRef, {
          title: "🚨 Account Terminated",
          message: `Account PF-${login} breached: ${breachReason}`,
          type: 'challenge_failed',
          isRead: false,
          createdAt: serverTimestamp()
        });
      } else if (newStatus === 'passed') {
        await addDoc(notifRef, {
          title: "🎉 Challenge Passed!",
          message: `Congratulations! Account PF-${login} reached the target. Advancement pending.`,
          type: 'challenge_passed',
          isRead: false,
          createdAt: serverTimestamp()
        });
      }
    }

    // 4. Persistence
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
      phase: newPhase,
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
    console.error('[MT5-API] Crash:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}

export async function GET() {
  return new Response('API_ACTIVE', { status: 200 });
}
