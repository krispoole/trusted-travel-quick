import * as admin from "firebase-admin";

// Initialize Firebase Admin once
export const firebaseApp = admin.initializeApp();
export const db = admin.firestore();
