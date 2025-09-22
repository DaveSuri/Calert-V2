// Firebase Admin initialization for server-side Firestore
// Uses Application Default Credentials by default (GOOGLE_APPLICATION_CREDENTIALS or Workload Identity)

const { initializeApp, getApps, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function getDb() {
  if (!getApps().length) {
    initializeApp({
      // With Workload Identity or GOOGLE_APPLICATION_CREDENTIALS this is enough
      credential: applicationDefault(),
    });
  }
  return getFirestore();
}

module.exports = { db: getDb() };
