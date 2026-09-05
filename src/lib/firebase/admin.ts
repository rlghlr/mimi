import "server-only";

import { getApps, initializeApp, applicationDefault, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

/**
 * Admin SDK singleton. On the deployed Cloud Run / Cloud Functions backend
 * this picks up Application Default Credentials automatically. For local
 * development set GOOGLE_APPLICATION_CREDENTIALS to a service-account key.
 */
export const adminApp: App = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });

export const adminAuth: Auth = getAuth(adminApp);

export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days (seconds)
