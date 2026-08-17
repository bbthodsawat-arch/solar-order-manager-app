import { getSupabase, signInWithGoogle as supabaseSignInWithGoogle, signInWithPassword as supabaseSignInWithPassword, sendUserPasswordResetEmail, createNewUserWithPassword as supabaseCreateNewUserWithPassword, signOut as supabaseSignOut } from './supabase';

/**
 * Compatibility exports kept temporarily so legacy UI modules do not break while
 * all persistence is routed through Supabase. No Firebase SDK or Firebase service
 * is initialized here.
 */
export const auth = {
  get currentUser() {
    return null;
  },
};

export const db = null as unknown as never;

export async function signInWithGoogle() { return supabaseSignInWithGoogle(); }
export async function signInWithPassword(email: string, pass: string) { return supabaseSignInWithPassword(email, pass); }
export async function sendUserPasswordResetEmailCompat(email: string) { return sendUserPasswordResetEmail(email); }
export const sendUserPasswordResetEmailLegacy = sendUserPasswordResetEmailCompat;
export async function createNewUserWithPassword(email: string, pass: string) { return supabaseCreateNewUserWithPassword(email, pass); }
export async function signOut() { return supabaseSignOut(); }

export enum OperationType { CREATE='create', UPDATE='update', DELETE='delete', LIST='list', GET='get', WRITE='write' }
export interface FirestoreErrorInfo { error: string; operationType: OperationType; path: string | null; authInfo: Record<string, unknown>; }

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const client = getSupabase();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path,
  };
  console.error('Legacy database operation error (now Supabase):', JSON.stringify(errInfo));
  return errInfo;
}
