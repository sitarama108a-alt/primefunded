'use server';

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * @fileOverview Administrative Server Actions
 * Uses Firebase Admin SDK to perform high-privilege operations that bypass Security Rules.
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY environment variable.
 */

function getAdminDb() {
  if (!getApps().length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing from environment variables.');
    }
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (e: any) {
      throw new Error('Failed to initialize Admin SDK: ' + e.message);
    }
  }
  return getFirestore();
}

export async function fetchAdminTerminalData() {
  try {
    const db = getAdminDb();

    // Fetch all primary collections for the terminal
    // Using Admin SDK .get() to bypass all Security Rules
    const [usersSnap, ordersSnap, payoutsSnap, referralsSnap, broadcastsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('orders').orderBy('date', 'desc').limit(200).get(),
      db.collection('payouts').orderBy('date', 'desc').limit(200).get(),
      db.collection('referrals').orderBy('createdAt', 'desc').limit(100).get(),
      db.collection('broadcasts').orderBy('sentAt', 'desc').limit(20).get(),
    ]);

    const serialize = (doc: any) => ({
      id: doc.id,
      ...doc.data(),
      // Handle timestamp serialization for Next.js Server Actions
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
      sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || doc.data().sentAt,
      lastCodeChange: doc.data().lastCodeChange?.toDate?.()?.toISOString() || doc.data().lastCodeChange,
      kycSubmittedAt: doc.data().kycSubmittedAt,
    });

    return {
      users: usersSnap.docs.map(serialize),
      orders: ordersSnap.docs.map(serialize),
      payouts: payoutsSnap.docs.map(serialize),
      referrals: referralsSnap.docs.map(serialize),
      broadcasts: broadcastsSnap.docs.map(serialize),
      success: true
    };
  } catch (error: any) {
    console.error('[Admin-Action] Fetch error:', error.message);
    return { success: false, error: error.message };
  }
}
