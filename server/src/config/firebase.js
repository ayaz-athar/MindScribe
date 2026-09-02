import admin from 'firebase-admin';
import { env } from './env.js';

/**
 * Initializes Firebase Admin SDK.
 * 
 * On Google Cloud Run:
 * - Automatically utilizes Application Default Credentials (ADC) attached to the Cloud Run Service Account.
 * - No private key or credential file needs to be stored or packaged with the container!
 * 
 * In Local Development:
 * - Reads from GOOGLE_APPLICATION_CREDENTIALS environment variable if pointing to a service account JSON,
 *   or connects to local Firebase Emulators (FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST).
 */

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: env.GCP_PROJECT_ID,
    });
    console.log(`🔒 Firebase Admin SDK initialized successfully for project: ${env.GCP_PROJECT_ID}`);
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  }
}

export const auth = admin.auth();
export const db = admin.firestore();
export default admin;
