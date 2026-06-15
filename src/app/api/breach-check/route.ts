
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * @fileOverview Institutional Breach Detection Engine
 * Algorithmic evaluation of MT5 metrics against plan-specific prop firm rules.
 */

function getAdminDb() {
  if (!getApps().length) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY');
    const serviceAccount = JSON.parse(serviceAccountKey);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

export async function POST(request: Request) {
  try {
    const { userId, mt5Data } = await request.json();
    if (!userId || !mt5Data) return new Response('Missing payload', { status: 400 });

    const db = getAdminDb();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) return new Response('User not found', { status: 404 });
    const userData = userSnap.data()!;
    
    // Skip if already breached
    if (userData.accountStatus === 'breached') return new Response('Account already breached', { status: 200 });

    const plan = userData.accountPlan || '1-Step Pro';
    const phase = userData.currentPhase || 'evaluation';
    const { balance, equity, dailyDrawdown, maxDrawdown, floatingLoss, lastLotSize, prevLotSize } = mt5Data;

    let breachType: 'hard' | 'soft' | null = null;
    let breachReason = '';

    // RULE EVALUATION LOGIC
    if (plan === '1-Step Pro') {
      if (dailyDrawdown > 3) { breachType = 'hard'; breachReason = 'Daily drawdown exceeded 3%'; }
      else if (maxDrawdown > 6) { breachType = 'hard'; breachReason = 'Maximum drawdown exceeded 6%'; }
      else if (floatingLoss > 1) { breachType = 'hard'; breachReason = 'Floating loss exceeded 1% threshold'; }
      else if (lastLotSize > prevLotSize * 1.5 && phase === 'evaluation') { breachType = 'soft'; breachReason = 'Martingale pattern detected in evaluation'; }
    } 
    else if (plan === '2-Step Classic') {
      const limit = (phase === 'funded') ? 5 : 5;
      const maxLimit = (phase === 'funded') ? 10 : 10;
      
      if (dailyDrawdown > limit) { breachType = 'hard'; breachReason = `Daily drawdown exceeded ${limit}%`; }
      else if (maxDrawdown > maxLimit) { breachType = 'hard'; breachReason = `Max drawdown exceeded ${maxLimit}%`; }
      else if (floatingLoss > 1) { breachType = 'hard'; breachReason = 'Floating loss exceeded 1% threshold'; }
    }
    else if (plan === 'Instant Funding') {
      if (dailyDrawdown > 2) { breachType = 'hard'; breachReason = 'Instant Account: 2% Daily Drawdown hit'; }
      else if (maxDrawdown > 4) { breachType = 'hard'; breachReason = 'Instant Account: 4% Max Drawdown hit'; }
      else if (floatingLoss > 1) { breachType = 'hard'; breachReason = 'Instant Account: 1% Floating Loss hit'; }
    }

    if (breachType === 'hard') {
      // EXECUTE TERMINATION
      await userRef.update({
        accountStatus: 'breached',
        accountActive: false,
        breachType: 'hard',
        breachReason,
        breachedAt: FieldValue.serverTimestamp()
      });

      await db.collection('breaches').add({
        userId,
        userEmail: userData.email,
        userName: userData.name,
        plan,
        phase,
        breachType: 'hard',
        breachReason,
        breachedAt: FieldValue.serverTimestamp()
      });

      await userRef.collection('notifications').add({
        title: "🚫 Account Terminated",
        message: `Your account has been breached: ${breachReason}. Please contact support for appeal options.`,
        type: 'hard_breach',
        isRead: false,
        createdAt: FieldValue.serverTimestamp()
      });
    } 
    else if (breachType === 'soft') {
      // ISSUE WARNING
      await db.collection('breaches').add({
        userId,
        userEmail: userData.email,
        userName: userData.name,
        plan,
        phase,
        breachType: 'soft',
        breachReason,
        breachedAt: FieldValue.serverTimestamp()
      });

      await userRef.collection('notifications').add({
        title: "⚠️ Strategy Warning",
        message: `Violation detected: ${breachReason}. Your account is still active, but further violations may lead to termination.`,
        type: 'soft_breach_warning',
        isRead: false,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    return new Response(JSON.stringify({ status: breachType || 'compliant', reason: breachReason }), { status: 200 });

  } catch (error: any) {
    console.error('[Breach-Engine] Error:', error);
    return new Response(error.message, { status: 500 });
  }
}
