import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const required = ['apiKey', 'authDomain', 'projectId'] as const;
export const missingFirebaseConfig = required.filter((key) => !firebaseConfig[key]);

const app = missingFirebaseConfig.length
  ? null
  : (getApps().length ? getApps()[0] : initializeApp(firebaseConfig));

export const firebaseAuth = app ? getAuth(app) : null;
