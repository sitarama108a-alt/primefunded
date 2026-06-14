'use client';

import { initializeFirebase } from '@/firebase';

/**
 * Initializes and exports Firebase services for use in client components.
 * This uses the idempotent initialization logic from the main firebase module.
 * We use type casting as a fallback to allow the server to compile even if 
 * config is missing (errors will be caught in the initialization log).
 */
const { auth, firestore: db, firebaseApp: app } = initializeFirebase();

export { auth, db, app };
export default app;
