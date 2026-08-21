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
  user?: { uid?: string; displayName?: string | null; email?: string | null; role?: string } | null;
}

let isQuotaExceeded = false;
let quotaExceededUntil = 0;

/** Secondary audit logging must never block the primary order/transaction save. */
export function logAuditEvent(params: LogAuditParams): Promise<void> {
  if (isQuotaExceeded && Date.now() < quotaExceededUntil) return Promise.resolve();

  try {
    const currentUser = auth?.currentUser;
    if (!currentUser) return Promise.resolve();

    const userId = currentUser.uid;
    const userEmail = currentUser.email || 'unknown@local';
    const userDisplayName = currentUser.displayName ||
      (userEmail.includes('@') ? userEmail.split('@')[0] : 'System User');
    const userRole = params.user?.role || 'staff';

    const docData: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      userId,
      userDisplayName,
      userEmail,
      userRole,
      action: params.action,
      category: params.category,
      targetId: params.targetId || '',
      targetName: params.targetName || '',
      details: params.details,
      previousData: params.previousData != null ? JSON.parse(JSON.stringify(params.previousData)) : null,
      newData: params.newData != null ? JSON.parse(JSON.stringify(params.newData)) : null,
    };

    void addDoc(collection(db, 'audit_logs'), docData).catch((error: any) => {
      if (error?.code === 'resource-exhausted' || /quota|exhausted/i.test(error?.message || '')) {
        isQuotaExceeded = true;
        quotaExceededUntil = Date.now() + 5 * 60 * 1000;
      }
      console.warn('Audit logger notice: failed to save secondary audit log:', error);
    });
  } catch (error) {
    console.warn('Audit logger notice: could not prepare audit log:', error);
  }

  return Promise.resolve();
}
