/**
 * Legacy compatibility shim.
 *
 * SOM is Firebase/Firestore-only. This module intentionally returns null so
 * legacy imports cannot activate or connect to Supabase at runtime.
 */
export function getSupabase(): null { return null; }
