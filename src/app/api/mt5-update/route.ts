
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview MT5 Update API Endpoint
 * 
 * This endpoint receives real-time metrics from external trading terminals
 * and synchronizes the state with the PrimeFunded Firestore database.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, login, balance, equity, margin, profit } = body;

    // 1. Validation
    if (!accountId) {
      return NextResponse.json({ error: 'Missing accountId' }, { status: 400 });
    }

    // 2. Reference the terminal record
    const docRef = doc(db, 'mt5_accounts', accountId);
    
    // 3. Save/merge metrics into Firestore
    await setDoc(docRef, {
      login,
      balance,
      equity,
      margin,
      profit,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // 4. Return success response
    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('[MT5 Update Failure]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
