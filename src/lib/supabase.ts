import { signInWithGoogle as firebaseSignInWithGoogle, signInWithPassword as firebaseSignInWithPassword, sendUserPasswordResetEmail as firebaseSendUserPasswordResetEmail, createNewUserWithPassword as firebaseCreateNewUserWithPassword, signOut as firebaseSignOut, auth, db } from './firebase';
import { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from './firestore-compat';

/** Legacy module kept only as a migration facade. No Supabase network client or credentials remain. */
export type SupabaseAuthUser = import('firebase/auth').User;

class FirestoreQueryFacade {
  private filters: Array<{ field: string; value: unknown }> = [];
  private ordering: { field: string; direction: 'asc' | 'desc' } | null = null;
  private maxRows: number | null = null;
  private mode: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;

  constructor(private readonly table: string) {}
  select(_columns = '*') { this.mode = 'select'; return this; }
  eq(field: string, value: unknown) { this.filters.push({ field, value }); return this; }
  order(field: string, options?: { ascending?: boolean }) { this.ordering = { field, direction: options?.ascending === false ? 'desc' : 'asc' }; return this; }
  limit(value: number) { this.maxRows = value; return this; }
  maybeSingle() { return this.execute(true); }
  single() { return this.execute(true); }
  insert(rows: any[] | any) { this.mode = 'insert'; this.payload = rows; return this.execute(false); }
  upsert(row: any[] | any, _options?: any) { this.mode = 'insert'; this.payload = row; return this.execute(false); }
  update(payload: any) { this.mode = 'update'; this.payload = payload; return this; }
  delete() { this.mode = 'delete'; return this; }
  then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) { return this.execute(false).then(onfulfilled, onrejected); }

  private async execute(single: boolean) {
    try {
      if (!db) throw new Error('Firebase is not configured');
      const ref = collection(db, this.table);
      if (this.mode === 'insert') {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        for (const row of rows) {
          const id = row?.id ? String(row.id) : undefined;
          if (id) await setDoc(doc(db, this.table, id), row, { merge: true });
          else await addDoc(ref, row);
        }
        return { data: rows.length === 1 ? rows[0] : rows, error: null };
      }

      let result = query(ref);
      for (const filter of this.filters) result = query(result, where(filter.field, '==', filter.value));
      if (this.ordering) result = query(result, orderBy(this.ordering.field, this.ordering.direction));
      if (this.maxRows != null) result = query(result, limit(this.maxRows));
      const snapshot = await getDocs(result);
      const rows = snapshot.docs.map((item: any) => ({ id: item.id, ...item.data() }));

      if (this.mode === 'update' || this.mode === 'delete') {
        for (const row of rows) {
          const target = doc(db, this.table, row.id);
          if (this.mode === 'update') await updateDoc(target, this.payload);
          else await deleteDoc(target);
        }
        return { data: null, error: null };
      }

      return { data: single ? (rows[0] || null) : rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

const authFacade = {
  async getUser() { return { data: { user: auth?.currentUser ?? null }, error: null }; },
};

export function getSupabase(): any {
  return { from: (table: string) => new FirestoreQueryFacade(table), auth: authFacade };
}

export async function signInWithGoogle() { return firebaseSignInWithGoogle(); }
export async function signInWithPassword(email: string, password: string) { return firebaseSignInWithPassword(email, password); }
export async function sendUserPasswordResetEmail(email: string) { return firebaseSendUserPasswordResetEmail(email); }
export async function createNewUserWithPassword(email: string, password: string) { return firebaseCreateNewUserWithPassword(email, password); }
export async function signOut() { return firebaseSignOut(); }

export function saveSupabaseConfig(): void { console.warn('[SOM] Supabase configuration is retired. Configure Firebase instead.'); }
export function clearSupabaseConfig(): void {}
export function getSupabaseConfigStatus() { return { url: '', keyMasked: '', hasKey: false, source: 'Firebase migration — Supabase disabled' } as const; }
export function isSupabaseConfigured(): false { return false; }

export interface SupabaseHealthCheckResult { isConfigured: boolean; isConnected: boolean; latencyMs: number; message: string; error?: string; }
export async function verifySupabaseConnection(): Promise<SupabaseHealthCheckResult> { return { isConfigured: false, isConnected: false, latencyMs: 0, message: 'Supabase ถูกปิดใช้งาน — ใช้ Firebase/Firestore เป็นฐานข้อมูลหลัก' }; }

export const FIREBASE_TO_SUPABASE_TABLE_MAPPING = { transactions:'transactions', customers:'customers', appointments:'appointments', warranties:'warranties', quick_notes:'quick_notes', users:'users', audit_logs:'audit_logs', category_budgets:'category_budgets', recurring_transactions:'recurring_transactions' } as const;
export async function getSupabaseSchemaDDL() { return '-- Supabase retired. Firebase Firestore is the primary database.'; }
