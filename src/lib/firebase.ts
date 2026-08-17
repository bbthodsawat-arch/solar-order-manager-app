import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const firestoreOptions = {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
};

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? initializeFirestore(app, firestoreOptions, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, firestoreOptions);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

function isMobileBrowser() {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/**
 * Google authentication strategy:
 * - Mobile browsers: use Firebase redirect directly. This avoids Android Chrome
 *   popup lifecycle/storage issues that can look like a silent login failure.
 * - Desktop: use popup, with redirect fallback for blocked/unsupported popups.
 */
export async function signInWithGoogle() {
  if (isMobileBrowser()) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  try {
    return await signInWithPopup(auth, provider);
  } catch (error: any) {
    const code = error?.code || '';
    const noFallbackCodes = new Set([
      'auth/unauthorized-domain',
      'auth/operation-not-allowed',
      'auth/invalid-api-key',
      'auth/invalid-app-credential',
      'auth/app-not-authorized'
    ]);

    if (!noFallbackCodes.has(code)) {
      await signInWithRedirect(auth, provider);
      return null;
    }

    console.error('[Firebase Google Auth]', {
      code: code || 'unknown',
      message: error?.message || String(error),
      hostname: typeof window !== 'undefined' ? window.location.hostname : undefined,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
    });
    throw error;
  }
}

export const signInWithPassword = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const sendUserPasswordResetEmail = (email: string) => sendPasswordResetEmail(auth, email);

export async function createNewUserWithPassword(email: string, pass: string) {
  const secondaryAppName = 'SecondaryAuthAppForUserCreation';
  let secondaryApp = getApps().find(a => a.name === secondaryAppName);
  if (!secondaryApp) secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);
  const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
  const newUid = userCred.user.uid;
  await firebaseSignOut(secondaryAuth);
  return newUid;
}

export const signOut = () => firebaseSignOut(auth);

export enum OperationType { CREATE='create', UPDATE='update', DELETE='delete', LIST='list', GET='get', WRITE='write' }
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: { providerId?: string | null; email?: string | null }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({ providerId: provider.providerId, email: provider.email })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}
