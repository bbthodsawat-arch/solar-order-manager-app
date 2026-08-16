/**
 * Legacy compatibility shim.
 *
 * SOM is Firebase/Firestore-only. This module intentionally does not create a
 * Supabase client or read Supabase credentials. Legacy callers receive a
 * disabled facade so TypeScript can compile while the Supabase execution path
 * remains unavailable at runtime.
 */

export type SupabaseDisabledClient = {
  from: (...args: any[]) => any;
};

const disabledClient: SupabaseDisabledClient = {
  from: () => {
    throw new Error('Supabase is disabled. Firebase/Firestore is the only database provider.');
  },
};

export function getSupabase(): SupabaseDisabledClient {
  return disabledClient;
}
