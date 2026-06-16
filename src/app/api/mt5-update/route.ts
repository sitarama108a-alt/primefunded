
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * @fileOverview MT5 Update API with Direct User Sync & Breach Detection
 * Receives metrics from MT5 EA and synchronizes them with the User Profile.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getAdminDb() {
  if (!getApps().length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      console.error('[MT5-Update] FIREBASE_SERVICE_ACCOUNT_KEY is missing.');
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

    // 1. Search for user by mt5Login
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('mt5Login', '==', login).limit(1).get();

    if (querySnapshot.empty) {
      console.warn(`[MT5-Update] No user found with login: ${login}`);
      return new Response(JSON.stringify({ status: "OK", note: "User not found" }), { status: 200 });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Sanitize Metrics
    const currBalance = parseFloat(String(payload.balance)) || 0;
    const currEquity = parseFloat(String(payload.equity)) || 0;
    const currMargin = parseFloat(String(payload.margin)) || 0;
    const currProfit = parseFloat(String(payload.profit)) || 0;

    // Skip if already breached
    if (userData.accountStatus === 'breached') {
      return new Response(JSON.stringify({ status: "OK", note: "Account already breached" }), { status: 200 });
    }

    // 2. Risk Engine Logic
    const startingBalance = parseFloat(String(userData.accountBalance)) || currBalance || 100000;
    const planType = String(userData.accountPlan || '1-step-pro').toLowerCase();
    const phase = String(userData.currentPhase || 'evaluation');

    const profitPct = startingBalance !== 0 ? ((currEquity - startingBalance) / startingBalance) * 100 : 0;
    const dailyDrawdownPct = startingBalance !== 0 ? ((startingBalance - currEquity) / startingBalance) * 100 : 0;
    const maxDrawdownPct = dailyDrawdownPct; // Simplified for MVP

    let newStatus = userData.accountStatus || 'active';
    let breachReason = '';

    // Simplified Breach Check (Syncing with Dashboard Rules)
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

    // 3. Update User Document
    const updates: any = {
      liveBalance: currBalance,
      liveEquity: currEquity,
      liveMargin: currMargin,
      liveProfit: currProfit,
      lastMT5Update: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (newStatus === 'breached') {
      updates.accountStatus = 'breached';
      updates.accountActive = false;
      updates.breachReason = breachReason;
      updates.breachedAt = FieldValue.serverTimestamp();

      // Log to global breaches collection
      await db.collection('breaches').add({
        userId,
        userEmail: userData.email,
        userName: userData.name,
        plan: userData.accountPlan,
        phase,
        breachType: 'hard',
        breachReason,
        breachedAt: FieldValue.serverTimestamp()
      });

      // Add Notification
      await usersRef.doc(userId).collection('notifications').add({
        title: "🚨 Account Terminated",
        message: `Breach detected: ${breachReason}`,
        type: 'hard_breach',
        isRead: false,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    await userDoc.ref.update(updates);

    // Also update redundant mt5_accounts collection for backward compatibility if needed
    await db.collection('mt5_accounts').doc(login).set({
      ...updates,
      userId,
      login,
      status: newStatus
    }, { merge: true });

    return new Response(JSON.stringify({ status: "OK" }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error('[MT5-API] Global Error:', error.message);
    return new Response(JSON.stringify({ status: "ERROR", message: error.message }), { status: 500 });
  }
}
