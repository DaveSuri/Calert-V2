// Firebase initialization for the Calert SPA
// This uses the publicly shareable web config provided by the user.

import { initializeApp, type FirebaseOptions } from 'firebase/app';

// If you enable Google Analytics for Firebase, add measurementId here.
// It is optional and safe to leave undefined.

const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyDGoMZQia334izw8JedslMTUD0fNpmFca0',
  authDomain: 'calert-h175v.firebaseapp.com',
  projectId: 'calert-h175v',
  storageBucket: 'calert-h175v.appspot.com',
  messagingSenderId: '318294354261',
  appId: '1:318294354261:web:a81c7fdbc9679a3996e7dc',
  // measurementId: 'G-XXXXXXXXXX',
};

export const firebaseApp = initializeApp(firebaseConfig);

// If you later enable analytics, you can initialize like this:
// import { getAnalytics, isSupported } from 'firebase/analytics';
// export async function initAnalytics() {
//   if (await isSupported()) return getAnalytics(firebaseApp);
//   return null;
// }
