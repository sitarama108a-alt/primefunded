'use client';

import { initializeApp, getApps, type FirebaseApp, FirebaseError } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { firebaseConfig } from './config';

/**
 * Initializes the Firebase Client App Instance with production services.
 * Hardened with validation to prevent Vercel deployment failures due to missing keys.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
} {
  // Enhanced validation for production readiness
  const isConfigMissing = !firebaseConfig.apiKey || 
                          firebaseConfig.apiKey === '' || 
                          firebaseConfig.apiKey.includes('REPLACE');
  
  if (isConfigMissing) {
    if (typeof window !== 'undefined') {
      console.warn('[Firebase] Configuration is missing. Ensure NEXT_PUBLIC_FIREBASE_* variables are set in Vercel.');
    }
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    
    // Enable offline persistence for better UX in unstable networks
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(firestore).catch((err) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a time.
        } else if (err.code === 'unimplemented') {
          // The current browser does not support persistence.
        }
      });
    }

    // Initialize App Check if configured
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      try {
        initializeAppCheck(firebaseApp, {
          provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (err) {
        console.warn('[Firebase] App Check initialization skipped.');
      }
    }

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error('[Firebase] Critical Initialization Error:', error);
    return { firebaseApp: null, firestore: null, auth: null };
  }
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-doc';
export * from './firestore/use-collection';