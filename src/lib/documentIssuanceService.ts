import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { DocumentNumberRule } from './businessDocumentService';

export type IssuableDocumentType = 'quotation' | 'full_tax_invoice' | 'abbreviated_tax_invoice' | 'receipt' | 'delivery_order';

type RuleKey = 'quote' | 'invoice' | 'receipt' | 'delivery';

export type IssuedDocument = {
  id: string;
  type: IssuableDocumentType;
  ruleKey: RuleKey;
  number: string;
  transactionId: string;
  orderId?: string;
  customerId?: string;
  customerName: string;
  amount: number;
  status: 'issued';
  issuedBy?: string;
  issuedAt: string;
};

const DOCUMENT_CENTER_PATH = ['settings', 'documentCenter'] as const;
const MAX_ARCHIVE_ENTRIES = 200;

const RULE_DEFAULTS: Record<RuleKey, DocumentNumberRule> = {
  quote: { prefix: 'QT-', next: 1, pad: 5 },
  invoice: { prefix: 'INV-', next: 1, pad: 5 },
  receipt: { prefix: 'RC-', next: 1, pad: 5 },
  delivery: { prefix: 'DO-', next: 1, pad: 5 },
};

export function toRuleKey(type: IssuableDocumentType): RuleKey {
  if (type === 'quotation') return 'quote';
  if (type === 'receipt') return 'receipt';
  if (type === 'delivery_order') return 'delivery';
  return 'invoice';
}

export function formatDocumentNumber(rule: DocumentNumberRule): string {
  const next = Math.max(1, Number(rule.next) || 1);
  const pad = Math.max(1, Number(rule.pad) || 1);
  return `${rule.prefix || ''}${String(next).padStart(pad, '0')}`;
}

export async function previewIssuedDocumentNumber(type: IssuableDocumentType): Promise<string> {
  const key = toRuleKey(type);
  if (!db) return formatDocumentNumber(RULE_DEFAULTS[key]);
  const snapshot = await getDoc(doc(db, ...DOCUMENT_CENTER_PATH));
  const data = snapshot.exists() ? snapshot.data() : {};
  const rule = { ...RULE_DEFAULTS[key], ...(data.numbering?.[key] || {}) } as DocumentNumberRule;
  return formatDocumentNumber(rule);
}

export async function issueDocumentNumber(input: {
  type: IssuableDocumentType;
  transactionId: string;
  orderId?: string;
  customerId?: string;
  customerName?: string;
  amount?: number;
}): Promise<IssuedDocument> {
  if (!db) throw new Error('Firebase is not configured');
  if (!input.transactionId) throw new Error('Transaction ID is required');

  const settingsRef = doc(db, ...DOCUMENT_CENTER_PATH);
  const archiveId = `${input.transactionId}_${input.type}`;
  const archiveRef = doc(db, 'documents', 'archive', 'items', archiveId);
  const ruleKey = toRuleKey(input.type);
  const issuedBy = auth?.currentUser?.uid || undefined;

  return runTransaction(db, async (transaction) => {
    const settingsSnapshot = await transaction.get(settingsRef);
    const settings = settingsSnapshot.exists() ? settingsSnapshot.data() : {};
    const configuredRule = settings.numbering?.[ruleKey] as Partial<DocumentNumberRule> | undefined;
    const rule: DocumentNumberRule = {
      ...RULE_DEFAULTS[ruleKey],
      ...(configuredRule || {}),
      next: Math.max(1, Number(configuredRule?.next ?? RULE_DEFAULTS[ruleKey].next) || 1),
      pad: Math.max(1, Number(configuredRule?.pad ?? RULE_DEFAULTS[ruleKey].pad) || 1),
    };

    const existingArchive = settings.archive?.find((entry: any) => entry?.id === archiveId);
    if (existingArchive?.number) return existingArchive as IssuedDocument;

    const number = formatDocumentNumber(rule);
    const issuedAt = new Date().toISOString();
    const now = serverTimestamp();
    const issued: IssuedDocument = {
      id: archiveId,
      type: input.type,
      ruleKey,
      number,
      transactionId: input.transactionId,
      orderId: input.orderId,
      customerId: input.customerId,
      customerName: input.customerName || 'ลูกค้าทั่วไป',
      amount: Number(input.amount) || 0,
      status: 'issued',
      issuedBy,
      issuedAt,
    };

    const nextNumbering = {
      ...(settings.numbering || {}),
      [ruleKey]: { ...rule, next: rule.next + 1, updatedAt: now },
    };
    const archive = [issued, ...(Array.isArray(settings.archive) ? settings.archive : [])].slice(0, MAX_ARCHIVE_ENTRIES);

    transaction.set(settingsRef, { numbering: nextNumbering, archive, updatedAt: now, updatedBy: issuedBy || '' }, { merge: true });
    transaction.set(archiveRef, issued, { merge: true });
    return issued;
  });
}
