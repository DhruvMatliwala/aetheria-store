import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:000000000000',
};

// Singleton for browser
let firebaseApp: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    // Server-side guard
    if (!getApps().length) {
      return initializeApp(firebaseConfig, 'server-client-app');
    }
    return getApps()[0];
  }

  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }
  return firebaseApp;
}

export function getClientAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getClientFirestore(): Firestore {
  return getFirestore(getFirebaseApp());
}
