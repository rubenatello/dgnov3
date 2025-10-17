import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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
