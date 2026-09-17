import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuração padrão originada do provisionamento
import configData from '../firebase-applet-config.json';

const clientEnv = (typeof import.meta !== 'undefined' && import.meta && import.meta.env) ? import.meta.env : {};

const firebaseConfig = {
  apiKey: clientEnv.VITE_FIREBASE_API_KEY || configData.apiKey,
  authDomain: clientEnv.VITE_FIREBASE_AUTH_DOMAIN || configData.authDomain,
  projectId: clientEnv.VITE_FIREBASE_PROJECT_ID || configData.projectId,
  storageBucket: clientEnv.VITE_FIREBASE_STORAGE_BUCKET || configData.storageBucket,
  messagingSenderId: clientEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || configData.messagingSenderId,
  appId: clientEnv.VITE_FIREBASE_APP_ID || configData.appId,
};

const databaseId = clientEnv.VITE_FIREBASE_DATABASE_ID || configData.firestoreDatabaseId || '(default)';

// Inicialização segura com proteção para Vercel / SSR / Multi-render
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, databaseId);

export { firebaseConfig, databaseId };
