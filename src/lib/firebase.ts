import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Web configuration is public client configuration. Environment variables
// remain the preferred deployment override; the known production Firebase project
// is kept as a fallback so a missing Vercel VITE_* configuration cannot disable login.
const productionFirebaseConfig = {
  apiKey: 'AIzaSyCug9CdKSMg3ki-wufXLv3oyThImjyc9fg',
  authDomain: 'gen-lang-client-0307844434.firebaseapp.com',
  projectId: 'gen-lang-client-0307844434',
  storageBucket: 'gen-lang-client-0307844434.firebasestorage.app',
  messagingSenderId: '774155423443',
  appId: '1:774155423443:web:7359c69b2e16b7ebe14e26',
  measurementId: 'G-58Y2CSCG48',
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || productionFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || productionFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || productionFirebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || productionFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || productionFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || productionFirebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || productionFirebaseConfig.measurementId,
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
export const firebaseApp: FirebaseApp | null = isConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;

// Keep auth persistence in localStorage. On mobile, use redirect-based Google
// sign-in instead of relying on a popup that can lose its browser context when
// the tab is backgrounded/hidden. Desktop browsers continue to use popup first.
export const auth = firebaseApp ? initializeAuth(firebaseApp, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
}) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export function isFirebaseConfigured(): boolean { return Boolean(firebaseApp && auth && db); }

function isMobileBrowser() {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export async function signInWithGoogle() {
  if (!auth) return { user: null, error: new Error('Firebase is not configured') };
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    // Mobile browsers are much more reliable with a full-page redirect.
    if (isMobileBrowser()) {
      await signInWithRedirect(auth, provider);
      return { user: null, error: null };
    }

    const result = await signInWithPopup(auth, provider);
    return { user: result.user, error: null };
  } catch (error: any) {
    const code = String(error?.code || '');
    const message = String(error?.message || '').toLowerCase();
    const unstablePopup = code === 'auth/popup-blocked'
      || code === 'auth/popup-closed-by-user'
      || code === 'auth/internal-error'
      || message.includes('database is closing')
      || message.includes('database is closing/hidden')
      || message.includes('indexeddb');

    // If popup auth loses its browser context, retry with redirect. This is
    // especially important on Android Chrome when the tab becomes hidden.
    if (!isMobileBrowser() && unstablePopup) {
      try {
        await signInWithRedirect(auth, provider);
        return { user: null, error: null };
      } catch (redirectError) {
        return { user: null, error: redirectError };
      }
    }

    return { user: null, error };
  }
}

export async function signInWithPassword(email: string, pass: string) {
  if (!auth) return { user: null, error: new Error('Firebase is not configured') };
  try { const result = await signInWithEmailAndPassword(auth, email, pass); return { user: result.user, error: null }; }
  catch (error) { return { user: null, error }; }
}
export async function sendUserPasswordResetEmail(email: string) {
  if (!auth) return { error: new Error('Firebase is not configured') };
  try { await sendPasswordResetEmail(auth, email); return { error: null }; }
  catch (error) { return { error }; }
}
export const sendUserPasswordResetEmailCompat = sendUserPasswordResetEmail;
export const sendUserPasswordResetEmailLegacy = sendUserPasswordResetEmail;
export async function createNewUserWithPassword(email: string, pass: string): Promise<string> {
  if (!auth) throw new Error('Firebase is not configured');
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  return result.user.uid;
}
export async function signOut() { if (auth) await firebaseSignOut(auth); }
export type { User };

export enum OperationType { CREATE='create', UPDATE='update', DELETE='delete', LIST='list', GET='get', WRITE='write' }
export interface FirestoreErrorInfo { error:string; operationType:OperationType; path:string|null; authInfo:Record<string,unknown> }
export function handleFirestoreError(error:unknown, operationType:OperationType, path:string|null) {
  const errInfo:FirestoreErrorInfo={ error:error instanceof Error?error.message:String(error), authInfo:{uid:auth?.currentUser?.uid??null,email:auth?.currentUser?.email??null}, operationType, path };
  console.error('Firestore operation error:',JSON.stringify(errInfo)); return errInfo;
}
