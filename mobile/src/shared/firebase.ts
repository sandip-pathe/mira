import { getApp, getApps, initializeApp } from 'firebase/app';
import SQLiteStorage from 'expo-sqlite/kv-store';
import * as FirebaseAuth from 'firebase/auth';
import type {
  Auth,
  Persistence,
} from 'firebase/auth';
const { getAuth, initializeAuth } = FirebaseAuth;
const getReactNativePersistence = (FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence: (storage: Pick<typeof SQLiteStorage, 'getItem' | 'setItem' | 'removeItem'>) => Persistence;
}).getReactNativePersistence;

// Firebase's web-app config is public client configuration, not a server credential.
const firebaseConfig = {
  apiKey: 'AIzaSyAnx_8WkcO5Rakpc5CNtUkv8L3qDv7BNOs',
  authDomain: 'mira-companion-app.firebaseapp.com',
  projectId: 'mira-companion-app',
  storageBucket: 'mira-companion-app.firebasestorage.app',
  messagingSenderId: '679667882666',
  appId: '1:679667882666:web:34b728dd828b9a2e2b4ed3',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;
try {
  authInstance = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(SQLiteStorage),
  });
} catch {
  // Fast Refresh can re-evaluate this module after Firebase Auth is initialized.
  authInstance = getAuth(firebaseApp);
}

export const firebaseAuth = authInstance;
