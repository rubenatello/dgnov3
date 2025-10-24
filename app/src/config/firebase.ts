import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

// Firebase project configuration
// These values are safe to expose in client-side code
const firebaseConfig = {
  apiKey: "AIzaSyBn5GWdFHfWsdC8utmhZcXX9hMMnQG3xgU",
  authDomain: "dgno-675a8.firebaseapp.com",
  projectId: "dgno-675a8",
  storageBucket: "dgno-675a8.firebasestorage.app", // Updated to new Firebase Storage domain
  messagingSenderId: "626313501573",
  appId: "1:626313501573:web:AIzaSyBn5GWdFHfWsdC8utmhZcXX9hMMnQG3xgU"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;

// Persist auth to local storage so users remain signed in across reloads.
// This is a best-practice for sites that want persistent sessions. If this
// call fails (e.g. running in a non-browser environment), we safely ignore
// the error and continue with default behavior.
try {
  // setPersistence returns a promise; call and ignore resolution here
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    // Not fatal; just log for diagnostics
    // eslint-disable-next-line no-console
    console.warn('Failed to set auth persistence:', err);
  });
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('Error while configuring auth persistence (non-browser environment?):', e);
}
