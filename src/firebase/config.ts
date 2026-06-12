/**
 * Firebase configuration for the client SDK.
 * Values are populated from environment variables.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB_REPLACE_WITH_ACTUAL_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "primefunded-8b8a5.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "primefunded-8b8a5",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "primefunded-8b8a5.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "777000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:777000000000:web:abcdef123456",
};
