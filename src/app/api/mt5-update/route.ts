import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * @fileOverview MT5 Update API with Automated Breach Detection & Plan Progression
 * Uses Firebase Admin SDK for secure server-side Firestore access.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize Firebase Admin once
function getAdminDb() {
  if (!getApps().length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.error('[MT5-Update] FIREBASE_SERVICE_ACCOUNT_KEY is missing.');
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing from environment variables.');
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('[MT5-Update] Admin SDK Initialized');
    } catch (e: any) {
      console.error('[MT5-Update] Admin SDK Init Failed:', e.message);
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ' + e.message);
    }
  }
  return getFirestore();
}

export async function POST(request: Request) {
  try {
    const db = getAdminDb();

    // 1. Robust Body Parsing
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

    const accDoc = db.collection('mt5_accounts').doc(accountId);
    const accSnap = await accDoc.get();
    
    let accountData: any = {};
    
    if (!accSnap.exists) {
      // First-time provision: establish starting balance and plan
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
        updatedAt: FieldValue.serverTimestamp(),
      };
      await accDoc.set(accountData, { merge: true });
      return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    accountData = accSnap.data();
    const startingBalance = parseFloat(String(accountData.startingBalance)) || currBalance || 100000;
    const planType = String(accountData.planType || '1-step-pro');
    const phase = String(accountData.phase || 'evaluation');
    const userId = accountData.userId;
    const currentStatus = String(accountData.status || 'active');

    // Skip processing if already terminated or passed
    if (currentStatus === 'terminated' || currentStatus === 'passed') {
      return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    // 2. Risk Engine Metrics
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

    // 3. Plan-Specific Rule Evaluation
    if (planType === '1-step-pro') {
      if (phase === 'funded') {
        if (floatingLossPct > 1) triggerHardBreach(`Funded Stage: 1% Max Floating Loss limit hit`);
        if (dailyDrawdownPct > 3) triggerHardBreach(`Funded Stage: 3% Daily Drawdown limit hit`);
        if (maxDrawdownPct > 6) triggerHardBreach(`Funded Stage: 6% Max Drawdown limit hit`);
      } else {
        if (dailyDrawdownPct > 3) triggerHardBreach(`Evaluation: 3% Daily Drawdown exceeded`);
        if (maxDrawdownPct > 6) triggerHardBreach(`Evaluation: 6% Max Drawdown exceeded`);
        else if (profitPct >= 10 && (accountData.tradingDays || 0) >= 5) newStatus = 'passed';
      }
    } 
    else if (planType === '2-step-classic') {
      const dailyLimit = 5;
      const maxLimit = 10;
      
      if (phase === 'funded') {
        if (floatingLossPct > 1) triggerHardBreach(`Funded Stage: 1% Max Floating Loss limit hit`);
        if (dailyDrawdownPct > dailyLimit) triggerHardBreach(`Funded Stage: ${dailyLimit}% Daily Drawdown exceeded`);
        if (maxDrawdownPct > maxLimit) triggerHardBreach(`Funded Stage: ${maxLimit}% Max Drawdown exceeded`);
      } else {
        if (dailyDrawdownPct > dailyLimit) triggerHardBreach(`Evaluation Phase: Daily Drawdown limit hit`);
        if (maxDrawdownPct > maxLimit) triggerHardBreach(`Evaluation Phase: Max Drawdown limit hit`);
        
        if (newStatus === 'active') {
          if (phase === 'phase1' && profitPct >= 8 && (accountData.tradingDays || 0) >= 5) {
            newPhase = 'phase2';
          } else if (phase === 'phase2' && profitPct >= 5 && (accountData.tradingDays || 0) >= 5) {
            newStatus = 'passed';
          }
        }
      }
    }
    else if (planType === '3-step-classic') {
      const dailyLimit = 4;
      const maxLimit = 8;
      
      if (phase === 'funded') {
        if (floatingLossPct > 1) triggerHardBreach(`Funded Stage: 1% Max Floating Loss limit hit`);
        if (dailyDrawdownPct > dailyLimit) triggerHardBreach(`${dailyLimit}% Daily Drawdown hit`);
        if (maxDrawdownPct > maxLimit) triggerHardBreach(`${maxLimit}% Max Drawdown hit`);
      } else {
        if (dailyDrawdownPct > dailyLimit) triggerHardBreach(`Evaluation: Daily Drawdown limit hit`);
        if (maxDrawdownPct > maxLimit) triggerHardBreach(`Evaluation: Max Drawdown limit hit`);
        
        if (newStatus === 'active') {
          if (phase === 'phase1' && profitPct >= 10 && (accountData.tradingDays || 0) >= 7) newPhase = 'phase2';
          else if (phase === 'phase2' && profitPct >= 8 && (accountData.tradingDays || 0) >= 6) newPhase = 'phase3';
          else if (phase === 'phase3' && profitPct >= 5 && (accountData.tradingDays || 0) >= 5) newStatus = 'passed';
        }
      }
    }
    else if (planType === 'instant-funding') {
      if (dailyDrawdownPct > 2) triggerHardBreach(`Instant Account: 2% Daily Drawdown hit`);
      if (maxDrawdownPct > 4) triggerHardBreach(`Instant Account: 4% Max Drawdown hit`);
      if (floatingLossPct > 1) triggerHardBreach(`Instant Account: 1% Max Floating Loss hit`);
    }

    // 4. Persistence & Notifications
    if (newStatus !== currentStatus && userId) {
      const notifRef = db.collection('users').doc(String(userId)).collection('notifications');
      if (newStatus === 'terminated') {
        await notifRef.add({
          title: "🚨 Account Terminated",
          message: `Account PF-${login} breached: ${breachReason}`,
          type: 'challenge_failed',
          isRead: false,
          createdAt: FieldValue.serverTimestamp()
        });
      } else if (newStatus === 'passed') {
        await notifRef.add({
          title: "🎉 Challenge Passed!",
          message: `Congratulations! Account PF-${login} reached the target. Advance to next stage.`,
          type: 'challenge_passed',
          isRead: false,
          createdAt: FieldValue.serverTimestamp()
        });
      }
    }

    const updatePayload: any = {
      login,
      balance: currBalance,
      equity: currEquity,
      profit: currProfit,
      profitPct: Number(profitPct.toFixed(2)) || 0,
      floatingLossPct: Number(floatingLossPct.toFixed(2)) || 0,
      dailyDrawdownPct: Number(dailyDrawdownPct.toFixed(2)) || 0,
      maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)) || 0,
      status: newStatus,
      phase: newPhase,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (breachType) {
      updatePayload.breachType = breachType;
      updatePayload.breachReason = breachReason;
      updatePayload.breachTime = FieldValue.serverTimestamp();
    }

    await accDoc.set(updatePayload, { merge: true });

    return new Response('OK', { status: 200, headers: { 'Content-Type': 'text/plain' } });

  } catch (error: any) {
    console.error('[MT5-API] Global Error:', error.message);
    return new Response(`Error: ${error.message}`, { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}

export async function GET() {
  return new Response('API_ACTIVE', { status: 200, headers: { 'Content-Type': 'text/plain' } });
}