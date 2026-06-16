import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Institutional temporal helper: Boundary at 7:30 AM IST (2:00 AM UTC)
 */
const getTradingDayKey = (date: Date) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(date.getTime() + istOffset);
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  if (hours < 7 || (hours === 7 && minutes < 30)) {
    istTime.setUTCDate(istTime.getUTCDate() - 1);
  }
  return istTime.toISOString().split('T')[0];
};

function getAdminDb() {
  if (!getApps().length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      console.error('[Admin-SDK] Missing FIREBASE_SERVICE_ACCOUNT_KEY');
      throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY');
    }
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({ credential: cert(serviceAccount) });
    } catch (e: any) {
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ' + e.message);
    }
  }
  return getFirestore();
}

export async function POST(request: Request) {
  try {
    const db = getAdminDb();
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
      return new Response(JSON.stringify({ status: "ERROR", message: "Payload Error" }), { status: 400 });
    }

    const login = String(payload.login || payload.accountId || '');
    if (!login || login === 'undefined') {
      return new Response(JSON.stringify({ status: "ERROR", message: "Missing login" }), { status: 400 });
    }

    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('mt5Login', '==', login).limit(1).get();

    if (querySnapshot.empty) {
      console.warn(`[MT5-Sync] No user found with login: ${login}`);
      return new Response(JSON.stringify({ status: "OK", note: "User not found" }), { status: 200 });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    const currBalance = parseFloat(String(payload.balance)) || 0;
    const currEquity = parseFloat(String(payload.equity)) || 0;
    const currMargin = parseFloat(String(payload.margin)) || 0;
    const currProfit = parseFloat(String(payload.profit)) || 0;

    if (userData.accountStatus === 'breached') {
      return new Response(JSON.stringify({ status: "OK", note: "Account already breached" }), { status: 200 });
    }

    // Trading Session Logic (7:30 AM IST Boundary)
    const sessionKey = getTradingDayKey(new Date());
    const updates: any = {
      liveBalance: currBalance,
      liveEquity: currEquity,
      liveMargin: currMargin,
      liveProfit: currProfit,
      lastMT5Update: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    /**
     * CRITICAL SESSION RESET LOGIC
     * Only update dailyStartBalance if the session key has changed.
     * This ensures the baseline stays frozen for the entire trading day.
     */
    const existingDate = userData.dailyStartBalanceDate;
    
    if (existingDate !== sessionKey) {
      console.log(`[MT5-Sync] SESSION TRANSITION detected for ${userId}. Previous: ${existingDate}, Current: ${sessionKey}`);
      
      // If this is the VERY first time we initialize session data (e.g. new account)
      // we use accountBalance as baseline to capture day-one growth.
      // Otherwise, we use current balance as the baseline for the NEW day.
      if (!existingDate) {
        updates.dailyStartBalance = userData.accountBalance || currBalance;
      } else {
        updates.dailyStartBalance = currBalance;
      }
      updates.dailyStartBalanceDate = sessionKey;
    }

    // Risk Calculation (Using the latest baseline)
    const activeStartBalance = updates.dailyStartBalance || userData.dailyStartBalance || userData.accountBalance || currBalance;
    const startingCapital = parseFloat(String(userData.accountBalance)) || currBalance || 100000;
    const planType = String(userData.accountPlan || '1-Step Pro').toLowerCase();
    
    const dailyDrawdownPct = activeStartBalance !== 0 ? ((activeStartBalance - currEquity) / activeStartBalance) * 100 : 0;
    const maxDrawdownPct = startingCapital !== 0 ? ((startingCapital - currEquity) / startingCapital) * 100 : 0;

    let newStatus = userData.accountStatus || 'active';
    let breachReason = '';

    const checkBreach = () => {
      if (planType.includes('1-step')) {
        if (dailyDrawdownPct > 3) return "1-Step: 3% Daily Drawdown Exceeded";
        if (maxDrawdownPct > 6) return "1-Step: 6% Max Drawdown Exceeded";
      } else if (planType.includes('2-step')) {
        if (dailyDrawdownPct > 5) return "2-Step: 5% Daily Drawdown Exceeded";
        if (maxDrawdownPct > 10) return "2-Step: 10% Max Drawdown Exceeded";
      } else if (planType.includes('3-step')) {
        if (dailyDrawdownPct > 4) return "3-Step: 4% Daily Drawdown Exceeded";
        if (maxDrawdownPct > 8) return "3-Step: 8% Max Drawdown Exceeded";
      } else if (planType.includes('instant')) {
        if (dailyDrawdownPct > 3) return "Instant: 3% Daily Drawdown Exceeded";
        if (maxDrawdownPct > 4) return "Instant: 4% Max Drawdown Exceeded";
      }
      return null;
    };

    const breachMsg = checkBreach();
    if (breachMsg) { 
      newStatus = 'breached'; 
      breachReason = breachMsg; 
    }

    if (newStatus === 'breached') {
      updates.accountStatus = 'breached';
      updates.accountActive = false;
      updates.breachReason = breachReason;
      updates.breachedAt = FieldValue.serverTimestamp();
      
      await db.collection('breaches').add({
        userId,
        userEmail: userData.email,
        userName: userData.name,
        plan: userData.accountPlan,
        phase: userData.currentPhase || 'evaluation',
        breachType: 'hard',
        breachReason,
        breachedAt: FieldValue.serverTimestamp()
      });

      await userDoc.ref.collection('notifications').add({
        title: "🚨 Account Terminated",
        message: `Institutional risk violation: ${breachReason}. Your credentials have been revoked.`,
        type: 'challenge_failed',
        isRead: false,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    // Update Daily Performance Snapshot
    const dailyPnL = currBalance - activeStartBalance;
    await userDoc.ref.collection('performance').doc(sessionKey).set({
      date: sessionKey,
      balance: currBalance,
      equity: currEquity,
      pnl: dailyPnL,
      cumulativePnL: currBalance - startingCapital,
      timestamp: FieldValue.serverTimestamp()
    }, { merge: true });

    // Commit all updates
    await userDoc.ref.update(updates);

    return new Response(JSON.stringify({ status: "OK", session: sessionKey, baseline: activeStartBalance }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('[MT5-Sync] Server Error:', error.message);
    return new Response(JSON.stringify({ status: "ERROR", message: error.message }), { status: 500 });
  }
}
