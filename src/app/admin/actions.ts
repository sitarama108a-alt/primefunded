'use server';

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * @fileOverview Administrative Server Actions
 * Uses Firebase Admin SDK to perform high-privilege operations that bypass Security Rules.
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY environment variable.
 */

function getAdminDb() {
  if (!getApps().length) {
    let serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.error('[Admin-SDK] FIREBASE_SERVICE_ACCOUNT_KEY is missing.');
      throw new Error('Administrative terminal requires FIREBASE_SERVICE_ACCOUNT_KEY to be configured in .env');
    }

    try {
      // Clean up string if it was wrapped in quotes by some .env parsers
      if (serviceAccountKey.startsWith("'") && serviceAccountKey.endsWith("'")) {
        serviceAccountKey = serviceAccountKey.slice(1, -1);
      } else if (serviceAccountKey.startsWith('"') && serviceAccountKey.endsWith('"')) {
        serviceAccountKey = serviceAccountKey.slice(1, -1);
      }

      const serviceAccount = JSON.parse(serviceAccountKey);
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('[Admin-SDK] Initialized successfully via Server Action');
    } catch (e: any) {
      console.error('[Admin-SDK] Initialization failed:', e.message);
      // Log the first few chars of the key for debugging without exposing secrets
      console.error('[Admin-SDK] Key Preview:', serviceAccountKey.substring(0, 20) + '...');
      throw new Error(`Admin SDK Config Error: ${e.message}. Ensure .env key is valid single-line JSON with escaped newlines.`);
    }
  }
  return getFirestore();
}

export async function fetchAdminTerminalData() {
  try {
    const db = getAdminDb();

    // Fetch collections individually to prevent one failure blocking all stats
    const fetchCollection = async (name: string, limitCount = 100, orderByField?: string) => {
      try {
        let q = db.collection(name);
        if (orderByField) {
          q = q.orderBy(orderByField, 'desc') as any;
        }
        const snap = await q.limit(limitCount).get();
        return snap.docs;
      } catch (err: any) {
        console.warn(`[Admin-Action] Failed to fetch collection: ${name}`, err.message);
        return [];
      }
    };

    const [usersDocs, ordersDocs, payoutsDocs, referralsDocs, broadcastsDocs] = await Promise.all([
      db.collection('users').get().then(s => s.docs).catch(() => []),
      fetchCollection('orders', 200, 'date'),
      fetchCollection('payouts', 200, 'date'),
      fetchCollection('referrals', 100, 'createdAt'),
      fetchCollection('broadcasts', 20, 'sentAt'),
    ]);

    const serialize = (doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || doc.data().sentAt,
      lastCodeChange: doc.data().lastCodeChange?.toDate?.()?.toISOString() || doc.data().lastCodeChange,
      kycSubmittedAt: doc.data().kycSubmittedAt,
    });

    return {
      users: usersDocs.map(serialize),
      orders: ordersDocs.map(serialize),
      payouts: payoutsDocs.map(serialize),
      referrals: referralsDocs.map(serialize),
      broadcasts: broadcastsDocs.map(serialize),
      success: true
    };
  } catch (error: any) {
    console.error('[Admin-Action] Critical fetch error:', error.message);
    return { success: false, error: `Sync Failure: ${error.message}` };
  }
}

export async function processKycAction(userId: string, action: 'verified' | 'rejected', reason?: string) {
  try {
    const db = getAdminDb();
    const userRef = db.collection('users').doc(userId);
    
    const updates: any = {
      kycStatus: action,
      kycVerified: action === 'verified',
      updatedAt: FieldValue.serverTimestamp()
    };

    if (action === 'rejected' && reason) {
      updates.kycRejectionReason = reason;
    } else {
      updates.kycRejectionReason = FieldValue.delete();
    }

    await userRef.update(updates);

    // Post notification
    await userRef.collection('notifications').add({
      title: action === 'verified' ? "✅ KYC Approved" : "❌ KYC Rejected",
      message: action === 'verified' ? "Your documents were verified! Payouts unlocked." : `Your KYC was rejected. Reason: ${reason}`,
      type: action === 'verified' ? 'kyc_approved' : 'kyc_rejected',
      isRead: false,
      createdAt: FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyOrderAction(orderId: string) {
  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    
    if (!orderSnap.exists) throw new Error('Order not found');
    const order = orderSnap.data();

    // Verify order
    await orderRef.update({ status: 'verified' });

    // Create MT5 account reference in subcollection
    const login = Math.floor(1000000 + Math.random() * 9000000).toString();
    const pass = Math.random().toString(36).substring(2, 12);
    const initialBalance = parseFloat(order?.size?.replace('$', '').replace(',', '').replace('k', '000') || '0');

    await db.collection('users').doc(order?.userId).collection('accounts').add({
      userId: order?.userId,
      email: order?.email,
      plan: order?.plan,
      size: order?.size,
      mt5Login: login,
      mt5Password: pass,
      mt5Server: "PrimeFunded-Live",
      balance: initialBalance,
      status: "active",
      startDate: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
