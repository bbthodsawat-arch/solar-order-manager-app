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
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
};

export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? initializeFirestore(app, firestoreOptions, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, firestoreOptions);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

/**
 * Google sign-in.
 *
 * Start with popup even on mobile because it gives Firebase an immediate
 * response/error that can be shown to the user. If the browser blocks popup,
 * fall back to the Firebase redirect flow.
 */
export async function signInWithGoogle() {
  try {
    return await signInWithPopup(auth, provider);
  } catch (error: any) {
    const code = error?.code || 'unknown';

    const redirectFallbackCodes = new Set([
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment'
    ]);

    if (redirectFallbackCodes.has(code)) {
      await signInWithRedirect(auth, provider);
      return null;
    }

    // Keep the actual Firebase error visible in browser logs and provide a
    // native fallback message because Login is rendered before the global
    // authenticated-area Toaster component.
    console.error('[Firebase Google Auth]', {
      code,
      message: error?.message || String(error),
      hostname: typeof window !== 'undefined' ? window.location.hostname : undefined,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
    });

    if (typeof window !== 'undefined') {
      const message = code === 'auth/unauthorized-domain'
        ? `Firebase ไม่อนุญาตโดเมนนี้: ${window.location.hostname}`
        : `Google Login ไม่สำเร็จ (${code})`;
      window.alert(message);
    }

    throw error;
  }
}

export const signInWithPassword = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const sendUserPasswordResetEmail = (email: string) => sendPasswordResetEmail(auth, email);

export async function createNewUserWithPassword(email: string, pass: string) {
  const secondaryAppName = 'SecondaryAuthAppForUserCreation';
  let secondaryApp = getApps().find(a => a.name === secondaryAppName);
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  }
  const secondaryAuth = getAuth(secondaryApp);
  const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
  const newUid = userCred.user.uid;
  await firebaseSignOut(secondaryAuth);
  return newUid;
}

export const signOut = () => firebaseSignOut(auth);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

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
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}
