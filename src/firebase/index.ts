'use client';

import { initializeApp, getApps, type FirebaseApp, getApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { firebaseConfig } from './config';

/**
 * Singleton state to ensure Firebase is only initialized once.
 */
let cachedFirebase: {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
} | null = null;

/**
 * Initializes the Firebase Client App Instance with production services.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
} {
  // Return cached instance if it exists
  if (cachedFirebase) return cachedFirebase;

  const isConfigMissing = !firebaseConfig.apiKey || firebaseConfig.apiKey === '';
  
  if (isConfigMissing) {
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    
    // Enable offline persistence only once on the client
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(firestore).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('[Firestore] Persistence failed: Multiple tabs open.');
        } else if (err.code === 'unimplemented') {
          console.warn('[Firestore] Persistence failed: Browser not supported.');
        }
      });
    }

    cachedFirebase = { firebaseApp, firestore, auth };
    return cachedFirebase;
  } catch (error) {
    console.error('[Firebase] Initialization Error:', error);
    return { firebaseApp: null, firestore: null, auth: null };
  }
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
