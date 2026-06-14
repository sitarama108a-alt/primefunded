'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { firebaseConfig } from './config';

/**
 * Initializes the Firebase Client App Instance with production services.
 * Includes a safety check for missing configuration to prevent invalid-api-key crashes.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
} {
  // Validate config presence
  const isConfigMissing = !firebaseConfig.apiKey || firebaseConfig.apiKey === '' || firebaseConfig.apiKey.includes('REPLACE');
  
  if (isConfigMissing) {
    if (typeof window !== 'undefined') {
      console.error('[Firebase] CRITICAL: Configuration is missing or using placeholders. Auth and Firestore will fail. Please check your .env file.');
    }
    // Return nulls rather than crashing the entire Node process during SSR/Compilation
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    // Initialize app only if not already initialized
    const firebaseApp =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    
    // Initialize App Check (Optional: Only if site key is provided)
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      try {
        initializeAppCheck(firebaseApp, {
          provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (err) {
        console.warn('[Firebase] App Check failed to initialize:', err);
      }
    }

    return { firebaseApp, firestore, auth };
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
