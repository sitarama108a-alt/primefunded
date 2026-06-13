
import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * @fileOverview MT5 Update API Endpoint
 * 
 * This endpoint receives real-time metrics from external trading terminals.
 * It is optimized for compatibility with MT5 EAs by supporting multiple content types
 * and returning a plain text "OK" response.
 */

export async function POST(request: Request) {
  try {
    // 1. Initialize Firebase safely for server-side environment
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);

    // 2. Parse payload based on content-type (MT5 often sends form-urlencoded)
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
      return new Response('Invalid Payload', { status: 400 });
    }

    const { accountId, login, balance, equity, margin, profit } = data;

    // 3. Validation
    if (!accountId) {
      return new Response('Missing accountId', { status: 400 });
    }

    // 4. Reference the terminal record
    const docRef = doc(db, 'mt5_accounts', String(accountId));
    
    // 5. Save metrics into Firestore (Using the non-blocking pattern as per guidelines)
    const updatePayload = {
      login: login || null,
      balance: Number(balance) || 0,
      equity: Number(equity) || 0,
      margin: Number(margin) || 0,
      profit: Number(profit) || 0,
      updatedAt: serverTimestamp()
    };

    setDoc(docRef, updatePayload, { merge: true })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: updatePayload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });

    // 6. Return plain text OK for terminal compatibility
    return new Response('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error: any) {
    console.error('[MT5 Update Failure]:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Ensure the route handler only responds to POST
export async function GET() {
  return new Response('Method Not Allowed', { status: 405 });
}
