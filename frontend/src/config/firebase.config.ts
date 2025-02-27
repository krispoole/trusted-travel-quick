// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Add this before the firebaseConfig initialization
if (!process.env.FIREBASE_API_KEY) {
  console.error('Firebase configuration is missing. Make sure your .env.local file is set up correctly.');
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services, but only in browser environment
let analytics = null;
let auth = null;
let db = null;

// Initialize services only in browser environment
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Log initialization in browser for debugging
  console.log('Firebase initialized with project:', process.env.FIREBASE_PROJECT_ID);
}

// Export the initialized services
export { auth, db };