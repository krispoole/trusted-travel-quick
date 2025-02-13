// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBDhVQhaZC6HDk78H9RJ0t1nCtVQx1eeNE",
  authDomain: "trusted-travel-quick.firebaseapp.com",
  projectId: "trusted-travel-quick",
  storageBucket: "trusted-travel-quick.firebasestorage.app",
  messagingSenderId: "695317800790",
  appId: "1:695317800790:web:da564f5794272db74f18f7",
  measurementId: "G-J2B0581L0S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics and Auth
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);