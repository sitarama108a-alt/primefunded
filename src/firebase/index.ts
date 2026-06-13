
'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getPerformance, type FirebasePerformance } from 'firebase/performance';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { firebaseConfig } from './config';

/**
 * Initializes the Firebase Client App Instance with production services.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  performance?: FirebasePerformance;
} {
  const firebaseApp =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  
  let performance;
  if (typeof window !== 'undefined') {
    performance = getPerformance(firebaseApp);
  }

  // Initialize App Check
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    try {
      initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      console.warn('App Check failed to initialize:', err);
    }
  }

  return { firebaseApp, firestore, auth, performance };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';
