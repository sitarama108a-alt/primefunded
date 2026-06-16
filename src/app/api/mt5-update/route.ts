import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getAdminDb() {
  if (!getApps().length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY');
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({ credential: cert(serviceAccount) });
    } catch (e: any) {
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ' + e.message);
    }
  }
  return getFirestore();
}

function getTradingDayKey(date: Date): string {
  // Trading day: 7:30 AM IST to 7:30 AM IST next day
  const ist = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  if (hours < 7 || (hours === 7 && minutes < 30)) {
    ist.setUTCDate(ist.getUTCDate() - 1);
  }
  return ist.toISOString().split('T')[0];
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

    const accountsRef = db.collection('mt5_accounts');
    const querySnapshot = await accountsRef.where('login', '==', login).limit(1).get();

    if (querySnapshot.empty) {
      console.warn(`[MT5-Sync] No user found with login: ${login}`);
      return new Response(JSON.stringify({ status: "OK", note: "User not found" }), { status: 200 });
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userData.userId;

    const currBalance = parseFloat(String(payload.balance)) || 0;
    const currEquity = parseFloat(String(payload.equity)) || 0;
    const currMargin = parseFloat(String(payload.margin)) || 0;
    const currProfit = parseFloat(String(payload.profit)) || 0;

    if (userData.accountStatus === 'breached') {
      return new Response(JSON.stringify({ status: "OK", note: "Account already breached" }), { status: 200 });
    }

    const startingBalance = parseFloat(String(userData.accountBalance)) || currBalance || 5000;
    const planType = String(userData.accountPlan || '1-step-pro').toLowerCase();
    const phase = String(userData.currentPhase || 'evaluation');
    const dailyDrawdownPct = startingBalance !== 0 ? ((startingBalance - currEquity) / startingBalance) * 100 : 0;
    const maxDrawdownPct = dailyDrawdownPct;

    let newStatus = userData.accountStatus || 'active';
    let breachReason = '';

    const checkBreach = () => {
      if (planType.includes('1-step')) {
        if (dailyDrawdownPct > 3) return "1-Step: 3% Daily Drawdown Exceeded";
        if (maxDrawdownPct > 6) return "1-Step: 6% Max Drawdown Exceeded";
      } else if (planType.includes('2-step')) {
        if (dailyDrawdownPct > 5) return "2-Step: 5% Daily Drawdown Exceeded";
        if (maxDrawdownPct > 10) return "2-Step: 10% Max Drawdown Exceeded";
      } else if (planType.includes('instant')) {
        if (dailyDrawdownPct > 3) return "Instant: 3% Daily Drawdown Exceeded";
        if (maxDrawdownPct > 4) return "Instant: 4% Max Drawdown Exceeded";
      }
      return null;
    };

    const breachMsg = checkBreach();
    if (breachMsg) { newStatus = 'breached'; breachReason = breachMsg; }

    const updates: any = {
      balance: currBalance,
      equity: currEquity,
      margin: currMargin,
      profit: currProfit,
      lastMT5Update: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (newStatus === 'breached') {
      updates.accountStatus = 'breached';
      updates.accountActive = false;
      updates.breachReason = breachReason;
      updates.breachedAt = FieldValue.serverTimestamp();
      await db.collection('breaches').add({
        userId, userEmail: userData.email, userName: userData.name,
        plan: userData.accountPlan, phase, breachType: 'hard',
        breachReason, breachedAt: FieldValue.serverTimestamp()
      });
      await userDoc.ref.collection('notifications').add({
        title: "🚨 Account Terminated",
        message: `Breach detected: ${breachReason}`,
        type: 'hard_breach', isRead: false,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    await userDoc.ref.update(updates);

    // Update users collection
    if (userId) {
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();
      const userDataFull = userSnap.data() || {};

      const todayKey = getTradingDayKey(new Date());
      const storedDayKey = userDataFull.dailyStartBalanceDate || '';

      const userUpdates: any = {
        liveBalance: currBalance,
        liveEquity: currEquity,
        lastMT5Update: FieldValue.serverTimestamp(),
      };

      // Reset daily start balance at start of new trading day (7:30 AM IST)
      if (storedDayKey !== todayKey) {
        userUpdates.dailyStartBalance = currBalance;
        userUpdates.dailyStartBalanceDate = todayKey;
      }

      await userRef.update(userUpdates);

      // Save performance snapshot
      const perfRef = userRef.collection('performance').doc(todayKey);
      await perfRef.set({
        date: todayKey,
        balance: currBalance,
        equity: currEquity,
        profit: currProfit,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    return new Response(JSON.stringify({ status: "OK" }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[MT5-API] Global Error:', error.message);
    return new Response(JSON.stringify({ status: "ERROR", message: error.message }), { status: 500 });
  }
}
