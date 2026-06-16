import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const db = getAdminDb();
    const payload = await request.json();
    const loginStr = String(payload.login || '');
    const trades = payload.trades || [];

    if (!loginStr) return new Response(JSON.stringify({ status: "ERROR", message: "Missing login" }), { status: 400 });
    const loginNum = Number(loginStr);

    const accountsRef = db.collection('mt5_accounts');
    let snapshot = await accountsRef.where('login', '==', loginStr).limit(1).get();
    let matchType = 'string';

    if (snapshot.empty && !isNaN(loginNum)) {
      snapshot = await accountsRef.where('login', '==', loginNum).limit(1).get();
      matchType = 'number';
    }

    if (snapshot.empty) {
      console.warn(`[MT5-Trades] No user found with login: ${loginStr} (tried string and number)`);
      return new Response(JSON.stringify({ status: "OK", note: "User not found" }), { status: 200 });
    }

    const userDoc = snapshot.docs[0];
    console.log(`[MT5-Trades] Matched login ${loginStr} as ${matchType}. Doc ID: ${userDoc.id}`);
    
    const userData = userDoc.data();
    const userId = userData.userId;

    if (!userId) return new Response(JSON.stringify({ status: "OK", note: "No userId linked" }), { status: 200 });

    const batch = db.batch();
    for (const trade of trades) {
      const tradeRef = db.collection('users').doc(userId).collection('trades').doc(String(trade.ticket));
      batch.set(tradeRef, {
        ticket: trade.ticket,
        symbol: trade.symbol,
        type: trade.type,
        volume: trade.volume,
        price: trade.price,
        pnl: trade.profit,
        date: new Date(trade.time * 1000),
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    await batch.commit();

    return new Response(JSON.stringify({ status: "OK", saved: trades.length }), { status: 200 });
  } catch (error: any) {
    console.error('[MT5-Trades] Error:', error.message);
    return new Response(JSON.stringify({ status: "ERROR", message: error.message }), { status: 500 });
  }
}