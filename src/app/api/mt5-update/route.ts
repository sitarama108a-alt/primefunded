import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview MT5 Update API Endpoint
 * 
 * Optimized for terminal compatibility and pure server-side execution.
 * Returns raw text "OK" as expected by MetaTrader 5 Expert Advisors.
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

export async function POST(request: Request) {
  try {
    // 1. Initialize Firebase in-route to ensure standard environment isolation
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // 2. Parse payload with support for JSON and Form-Encoded (Terminal Defaults)
    let data: any = {};
    const contentType = request.headers.get('content-type') || '';

    try {
      if (contentType.includes('application/json')) {
        data = await request.json();
      } else {
        // Fallback for form-encoded data which some terminals send
        const formData = await request.formData();
        data = Object.fromEntries(formData.entries());
      }
    } catch (parseError) {
      return new Response('Invalid Payload', { 
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const { accountId, login, balance, equity, margin, profit } = data;

    // 3. Validation
    if (!accountId) {
      return new Response('Missing accountId', { 
        status: 400, 
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 4. Data Sync (Must AWAIT in Route Handlers)
    const docRef = doc(db, 'mt5_accounts', String(accountId));
    const updatePayload = {
      login: login ? String(login) : null,
      balance: Number(balance) || 0,
      equity: Number(equity) || 0,
      margin: Number(margin) || 0,
      profit: Number(profit) || 0,
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, updatePayload, { merge: true });

    // 5. Return raw text OK for terminal compatibility
    return new Response('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error: any) {
    // Return error as plain text to prevent HTML error page rendering
    return new Response(`Error: ${error.message || 'Internal Server Error'}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * GET Handler for connectivity verification via browser
 */
export async function GET() {
  return new Response('API_ACTIVE', { 
    status: 200, 
    headers: { 'Content-Type': 'text/plain' } 
  });
}
