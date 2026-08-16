import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { AuditLogEntry, AuditCategory, AuditActionType } from '../types';

export interface LogAuditParams {
  action: AuditActionType | string;
  category: AuditCategory;
  targetId?: string;
  targetName?: string;
  details: string;
  previousData?: any;
  newData?: any;
  user?: {
    uid?: string;
    displayName?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

let isQuotaExceeded = false;
let quotaExceededUntil = 0;

/**
 * Creates an immutable Audit Log record in Firestore `/audit_logs` collection.
 */
export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  // If we recently encountered quota exhaustion, skip Firestore write to avoid piling up queued writes
  if (isQuotaExceeded && Date.now() < quotaExceededUntil) {
    return;
  }

  try {
    const currentUser = auth.currentUser;
    const userId = params.user?.uid || currentUser?.uid || 'system';
    const userEmail = params.user?.email || currentUser?.email || 'system@local';
    const userDisplayName =
      params.user?.displayName ||
      currentUser?.displayName ||
      (userEmail && userEmail.includes('@') ? userEmail.split('@')[0] : 'System User');
    const userRole = params.user?.role || 'staff';

    const timestamp = new Date().toISOString();

    const docData: AuditLogEntry = {
      timestamp,
      userId,
      userDisplayName,
      userEmail,
      userRole,
      action: params.action,
      category: params.category,
      targetId: params.targetId || '',
      targetName: params.targetName || '',
      details: params.details,
      previousData: params.previousData !== undefined && params.previousData !== null
        ? JSON.parse(JSON.stringify(params.previousData))
        : null,
      newData: params.newData !== undefined && params.newData !== null
        ? JSON.parse(JSON.stringify(params.newData))
        : null,
    };

    await addDoc(collection(db, 'audit_logs'), docData);
  } catch (error: any) {
    if (error?.code === 'resource-exhausted' || error?.message?.includes('quota') || error?.message?.includes('Quota') || error?.message?.includes('exhausted')) {
      isQuotaExceeded = true;
      quotaExceededUntil = Date.now() + 5 * 60 * 1000; // 5 minute backoff before retrying audit log writes
    }
    console.warn('Audit logger notice: Failed to save audit log to Firestore:', error);
  }
}
