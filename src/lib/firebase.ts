'use client';

import { initializeFirebase } from '@/firebase';

/**
 * Initializes and exports Firebase services for use in client components.
 * This uses the idempotent initialization logic from the main firebase module.
 */
const { auth, firestore: db, firebaseApp: app } = initializeFirebase();

export { auth, db, app };
export default app;
