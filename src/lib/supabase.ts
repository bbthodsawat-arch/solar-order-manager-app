import { signInWithGoogle as firebaseSignInWithGoogle, signInWithPassword as firebaseSignInWithPassword, sendUserPasswordResetEmail as firebaseSendUserPasswordResetEmail, createNewUserWithPassword as firebaseCreateNewUserWithPassword, signOut as firebaseSignOut } from './firebase';

/**
 * Legacy compatibility module.
 * Supabase is intentionally disabled. New code must use ./firebase and ./firestore-compat.
 */
export type SupabaseAuthUser = import('firebase/auth').User;

export function getSupabase(): null {
  return null;
}

export async function signInWithGoogle() {
  return firebaseSignInWithGoogle();
}

export async function signInWithPassword(email: string, password: string) {
  return firebaseSignInWithPassword(email, password);
}

export async function sendUserPasswordResetEmail(email: string) {
  return firebaseSendUserPasswordResetEmail(email);
}

export async function createNewUserWithPassword(email: string, password: string) {
  return firebaseCreateNewUserWithPassword(email, password);
}

export async function signOut() {
  return firebaseSignOut();
}

export function saveSupabaseConfig(): void {
  console.warn('[SOM] Supabase configuration is retired. Configure Firebase instead.');
}

export function clearSupabaseConfig(): void {
  // Intentionally a no-op for backwards compatibility.
}

export function getSupabaseConfigStatus() {
  return {
    url: '',
    keyMasked: '',
    hasKey: false,
    source: 'Firebase migration — Supabase disabled',
  } as const;
}

export function isSupabaseConfigured(): false {
  return false;
}

export interface SupabaseHealthCheckResult {
  isConfigured: boolean;
  isConnected: boolean;
  latencyMs: number;
  message: string;
  error?: string;
}

export async function verifySupabaseConnection(): Promise<SupabaseHealthCheckResult> {
  return {
    isConfigured: false,
    isConnected: false,
    latencyMs: 0,
    message: 'Supabase ถูกปิดใช้งาน — ใช้ Firebase/Firestore เป็นฐานข้อมูลหลัก',
  };
}

export const FIREBASE_TO_SUPABASE_TABLE_MAPPING = {
  transactions: 'transactions',
  customers: 'customers',
  appointments: 'appointments',
  warranties: 'warranties',
  quick_notes: 'quick_notes',
  users: 'users',
  audit_logs: 'audit_logs',
  category_budgets: 'category_budgets',
  recurring_transactions: 'recurring_transactions',
} as const;

export async function getSupabaseSchemaDDL() {
  return '-- Supabase retired. Firebase Firestore is the primary database.';
}
