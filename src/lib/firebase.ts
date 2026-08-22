import { getApp, getApps, initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, createUserWithEmailAndPassword, signOut as firebaseSignOut, type User, setPersistence, browserSessionPersistence, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

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

export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

void setPersistence(auth, browserSessionPersistence).catch((error) => {
  console.warn('[Firebase auth persistence] session persistence unavailable:', error);
});

/**
 * Firestore rules intentionally require an active user profile for application
 * permissions. Older Firebase Auth users can exist without /users/{uid}, which
 * made a valid signed-in session appear healthy while every transaction write
 * was denied. Create the restricted default profile allowed by firestore.rules
 * exactly once for such users.
 */
export async function ensureFirebaseUserProfile(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const existing = await getDoc(userRef);
  if (existing.exists()) return;

  await setDoc(userRef, {
    uid: user.uid,
    email: user.email || '',
    username: user.displayName || user.email || 'user',
    displayName: user.displayName || user.email || 'ผู้ใช้',
    photoURL: user.photoURL || null,
    role: 'staff',
    permissions: {
      canViewDashboard: true,
      canAddTransactions: true,
      canEditTransactions: true,
      canDeleteTransactions: false,
      canViewReports: true,
      canManageCustomers: true,
      canManageInventory: true,
      canManageSettings: false,
      canManageUsers: false,
      canManageSecurity: false,
      canManageDatabase: false,
      canExportData: false,
      canViewAuditLogs: false,
    },
    status: 'active',
    authProvider: user.providerData[0]?.providerId || 'firebase',
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
}

// Register before feature modules subscribe to Auth. This closes the gap where
// Auth was ready but the Firestore permission profile did not yet exist.
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  void ensureFirebaseUserProfile(user).catch((error) => {
    console.error('[Firebase user profile] unable to prepare Firestore access:', error);
  });
});

export function isFirebaseConfigured(): boolean { return true; }

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInWithPopup(auth, provider);
    await ensureFirebaseUserProfile(result.user);
    return { user: result.user, error: null };
  } catch (error: unknown) {
    return { user: null, error };
  }
}

export async function signInWithPassword(email: string, pass: string) {
  try {
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInWithEmailAndPassword(auth, email, pass);
    await ensureFirebaseUserProfile(result.user);
    return { user: result.user, error: null };
  } catch (error: unknown) {
    return { user: null, error };
  }
}

export async function sendUserPasswordResetEmail(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error: unknown) {
    return { error };
  }
}
export const sendUserPasswordResetEmailCompat = sendUserPasswordResetEmail;
export const sendUserPasswordResetEmailLegacy = sendUserPasswordResetEmail;

/**
 * Creates a password account using an isolated Firebase Auth instance.
 * The currently signed-in administrator is never replaced by the new account.
 */
export async function createNewUserWithPassword(email: string, pass: string): Promise<string> {
  const secondaryName = `som-user-admin-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryName);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const result = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    await firebaseSignOut(secondaryAuth);
    return result.user.uid;
  } finally {
    await deleteApp(secondaryApp).catch(() => undefined);
  }
}

export async function signOut() { await firebaseSignOut(auth); }
export type { User };

export enum OperationType { CREATE='create', UPDATE='update', DELETE='delete', LIST='list', GET='get', WRITE='write' }
export interface FirestoreErrorInfo { error:string; operationType:OperationType; path:string|null; authInfo:Record<string,unknown> }
export function handleFirestoreError(error:unknown, operationType:OperationType, path:string|null) {
  const errInfo:FirestoreErrorInfo={ error:error instanceof Error?error.message:String(error), authInfo:{uid:auth.currentUser?.uid??null,email:auth.currentUser?.email??null}, operationType, path };
  console.error('Firestore operation error:',JSON.stringify(errInfo)); return errInfo;
}
