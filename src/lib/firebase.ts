import { getSupabase, signInWithGoogle as supabaseSignInWithGoogle, signInWithPassword as supabaseSignInWithPassword, sendUserPasswordResetEmail as supabaseSendUserPasswordResetEmail, createNewUserWithPassword as supabaseCreateNewUserWithPassword, signOut as supabaseSignOut } from './supabase';
export const auth={get currentUser(){return null;}};
export const db={} as unknown as never;
export async function signInWithGoogle(){return supabaseSignInWithGoogle();}
export async function signInWithPassword(email:string,pass:string){return supabaseSignInWithPassword(email,pass);}
export async function sendUserPasswordResetEmail(email:string){return supabaseSendUserPasswordResetEmail(email);}
export async function sendUserPasswordResetEmailCompat(email:string){return supabaseSendUserPasswordResetEmail(email);}
export const sendUserPasswordResetEmailLegacy=sendUserPasswordResetEmailCompat;
export async function createNewUserWithPassword(email:string,pass:string){return supabaseCreateNewUserWithPassword(email,pass);}
export async function signOut(){return supabaseSignOut();}
export enum OperationType{CREATE='create',UPDATE='update',DELETE='delete',LIST='list',GET='get',WRITE='write'}
export interface FirestoreErrorInfo{error:string;operationType:OperationType;path:string|null;authInfo:Record<string,unknown>}
export function handleFirestoreError(error:unknown,operationType:OperationType,path:string|null){const client=getSupabase();void client;const errInfo:FirestoreErrorInfo={error:error instanceof Error?error.message:String(error),authInfo:{},operationType,path};console.error('Legacy database operation error (now Supabase):',JSON.stringify(errInfo));return errInfo;}
