import * as admin from 'firebase-admin';

// Singleton guard — Next.js serverless functions may re-import this module
let app: admin.app.App;

function getFirebaseAdmin(): admin.app.App {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = rawKey
      ? rawKey.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1')
      : undefined;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Firebase Admin environment variables are missing. ' +
        'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.'
      );
    }

    app = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    app = admin.apps[0] as admin.app.App;
  }
  return app;
}

export function getAdminApp(): admin.app.App {
  return getFirebaseAdmin();
}

export function getAdminFirestore(): admin.firestore.Firestore {
  getFirebaseAdmin();
  return admin.firestore();
}

export function getAdminAuth(): admin.auth.Auth {
  getFirebaseAdmin();
  return admin.auth();
}

export { admin };
