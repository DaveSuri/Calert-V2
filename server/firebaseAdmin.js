// Firebase Admin initialization for server-side Firestore
// Uses Application Default Credentials by default (GOOGLE_APPLICATION_CREDENTIALS or Workload Identity)

const { initializeApp, getApps, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function getDb() {
  if (!getApps().length) {
    try {
      // Try to use Application Default Credentials first (for Cloud Run)
      initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'calert-470621'
      });
    } catch (error) {
      console.error('Failed to initialize Firebase with default credentials:', error);
      // Fallback initialization without credentials for local development
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'calert-470621'
      });
    }
  }
  return getFirestore();
}

module.exports = { db: getDb() };
