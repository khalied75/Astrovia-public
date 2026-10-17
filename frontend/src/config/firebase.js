import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

const missingKey = Object.entries(firebaseConfig).find(
  ([, value]) => !value,
)?.[0];
if (missingKey)
  throw new Error(`Missing Firebase configuration: ${missingKey}`);

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
