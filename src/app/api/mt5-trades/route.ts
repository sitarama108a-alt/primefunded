import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const payload = await request.json();
    const login = String(payload.login || '');
    const trades = payload.trades || [];

    if (!login || login === 'undefined') {
      return new Response(JSON.stringify({ status: "ERROR", message: "Missing login" }), { status: 400 });
    }

    // Search users collection for the trader with this MT5 Login
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('mt5Login', '==', login).limit(1).get();

    if (querySnapshot.empty) {
      console.warn(`[MT5-Trades] No user found with login: ${login}`);
      return new Response(JSON.stringify({ status: "OK", note: "User not found" }), { status: 200 });
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    const batch = db.batch();
    for (const trade of trades) {
      // Use ticket as ID to prevent duplicates
      const tradeRef = db.collection('users').doc(userId).collection('trades').doc(String(trade.ticket));
      
      batch.set(tradeRef, {
        ticket: trade.ticket,
        positionId: trade.positionId || trade.position_id || null, // Link deals together
        symbol: trade.symbol,
        type: trade.type, // 'buy' or 'sell'
        lots: parseFloat(trade.volume) || 0,
        price: parseFloat(trade.price) || 0,
        pnl: parseFloat(trade.profit) || 0,
        time: trade.time, // Unix number
        date: new Date(trade.time * 1000).toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await batch.commit();
    console.log(`[MT5-Trades] Synced ${trades.length} trades for user ${userId}`);

    return new Response(JSON.stringify({ status: "OK", saved: trades.length }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[MT5-Trades] Error:', error.message);
    return new Response(JSON.stringify({ status: "ERROR", message: error.message }), { status: 500 });
  }
}
