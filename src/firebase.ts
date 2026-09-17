import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuração padrão originada do provisionamento
import configData from '../firebase-applet-config.json';

const clientEnv = (typeof import.meta !== 'undefined' && import.meta && (import.meta as any).env) ? (import.meta as any).env : {};

const firebaseConfig = {
  apiKey: clientEnv.VITE_FIREBASE_API_KEY || (configData as any).apiKey,
  authDomain: clientEnv.VITE_FIREBASE_AUTH_DOMAIN || (configData as any).authDomain,
  projectId: clientEnv.VITE_FIREBASE_PROJECT_ID || (configData as any).projectId,
  storageBucket: clientEnv.VITE_FIREBASE_STORAGE_BUCKET || (configData as any).storageBucket,
  messagingSenderId: clientEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || (configData as any).messagingSenderId,
  appId: clientEnv.VITE_FIREBASE_APP_ID || (configData as any).appId,
};

const databaseId = clientEnv.VITE_FIREBASE_DATABASE_ID || (configData as any).firestoreDatabaseId || '(default)';

// Inicialização segura com proteção para Vercel / SSR / Multi-render
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, databaseId);

export { firebaseConfig, databaseId };
