// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

/**
 * ⚠️ ENV CHECK
 * Eğer herhangi biri undefined ise Firestore write'lar SESSİZCE FAIL eder.
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// 🔍 DEBUG LOG (GEÇİCİ)
console.log("🔥 FIREBASE CONFIG CHECK", firebaseConfig);

// ❌ HARD FAIL – eksik env varsa burada patlasın
const missingKeys = Object.entries(firebaseConfig)
  .filter(([_, v]) => !v)
  .map(([k]) => k);

if (missingKeys.length > 0) {
  console.error("❌ FIREBASE ENV MISSING:", missingKeys);
  throw new Error(
    `Firebase env variables missing: ${missingKeys.join(", ")}`
  );
}

// ✅ INIT
const app = initializeApp(firebaseConfig as Required<typeof firebaseConfig>);

// 🔌 SERVICES
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
