import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, signOut as firebaseSignOut, type User, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;

if (auth) {
  void setPersistence(auth, browserSessionPersistence).catch((error) => {
    console.warn('[Firebase auth persistence] session persistence unavailable:', error);
  });
}

export function isFirebaseConfigured(): boolean { return Boolean(firebaseApp && auth && db); }

export async function signInWithGoogle() {
  if (!auth) return { user: null, error: new Error('Firebase is not configured') };
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInWithPopup(auth, provider);
    return { user: result.user, error: null };
  } catch (error: any) {
    return { user: null, error };
  }
}

export async function signInWithPassword(email: string, pass: string) {
  if (!auth) return { user: null, error: new Error('Firebase is not configured') };
  try { await setPersistence(auth, browserSessionPersistence); const result = await signInWithEmailAndPassword(auth, email, pass); return { user: result.user, error: null }; }
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
  await setPersistence(auth, browserSessionPersistence);
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
