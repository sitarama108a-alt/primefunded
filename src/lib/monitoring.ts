
'use client';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

/**
 * Logs an error to Firestore for administrative tracking.
 */
export async function logError(error: Error | string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
  try {
    const errorData = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? '' : error.stack,
      userId: auth.currentUser?.uid || 'anonymous',
      path: typeof window !== 'undefined' ? window.location.pathname : 'server',
      severity,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, 'error_logs'), errorData);
  } catch (err) {
    // Fail silently to avoid infinite error loops
    console.error('Failed to log error to Firestore:', err);
  }
}

/**
 * Tracks a critical user action.
 */
export async function trackAction(action: string, details: any = {}) {
  if (!auth.currentUser) return;

  try {
    await addDoc(collection(db, 'activity_logs'), {
      userId: auth.currentUser.uid,
      action,
      details,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to track action:', err);
  }
}

/**
 * Handles automatic retry for critical operations.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}
