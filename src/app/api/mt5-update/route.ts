import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview MT5 Update API Endpoint
 * 
 * This endpoint is a pure server-side Route Handler.
 * It is optimized for terminal compatibility and avoids all 'use client' dependencies.
 */

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Initialize Firebase (Safe check for Node environment)
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // 2. Parse payload
    const contentType = request.headers.get('content-type') || '';
    let data: any = {};

    try {
      if (contentType.includes('application/json')) {
        data = await request.json();
      } else {
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

    // 4. Data Preparation
    const docRef = doc(db, 'mt5_accounts', String(accountId));
    const updatePayload = {
      login: login ? String(login) : null,
      balance: Number(balance) || 0,
      equity: Number(equity) || 0,
      margin: Number(margin) || 0,
      profit: Number(profit) || 0,
      updatedAt: serverTimestamp()
    };

    // 5. Fire-and-forget mutation (following non-blocking guidance for performance)
    // Note: In a serverless route, we return the response immediately after dispatching the write.
    setDoc(docRef, updatePayload, { merge: true });

    // 6. Return raw text OK for terminal compatibility
    return new Response('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });

  } catch (error: any) {
    // Catch-all for server errors to prevent HTML error page rendering
    return new Response(`Error: ${error.message || 'Internal Server Error'}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Support GET for simple connectivity verification
export async function GET() {
  return new Response('OK', { 
    status: 200, 
    headers: { 'Content-Type': 'text/plain' } 
  });
}
