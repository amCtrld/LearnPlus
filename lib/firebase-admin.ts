/**
 * Firebase Admin SDK initialization (server-only)
 * This file must never be imported from client components
 */

import 'server-only';

import { initializeApp as initializeAdminApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: ReturnType<typeof initializeAdminApp> | undefined;

function getAdminApp() {
  if (!adminApp) {
    // Check if already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminApp = existingApps[0];
      return adminApp;
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
      throw new Error('Missing Firebase admin credentials in environment variables');
    }

    adminApp = initializeAdminApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return adminApp;
}

export function getAdminFirestore() {
  const app = getAdminApp();
  return getFirestore(app);
}
