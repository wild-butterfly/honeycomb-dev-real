// firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyBzCyZj58fS2U0_CGPEk6p1dNmXLJwkF9o",
  authDomain: "honeycomb-au.firebaseapp.com",
  projectId: "honeycomb-au",
  storageBucket: "honeycomb-au.appspot.com",
  messagingSenderId: "758798273736",
  appId: "1:758798273736:web:1bc38f393aef1ff3a6351d",
  measurementId: "G-VXJ5074GK3",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
