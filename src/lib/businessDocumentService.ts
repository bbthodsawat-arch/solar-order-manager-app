export type DocumentType = 'quote' | 'order' | 'invoice' | 'receipt' | 'delivery' | 'installation' | 'warranty';

export type DocumentNumberRule = {
  prefix: string;
  next: number;
  pad: number;
};

export type DocumentWorkflowConfig = {
  quoteToOrder: boolean;
  paymentReceipt: boolean;
  shippingNote: boolean;
  installationHandover: boolean;
  warrantyCertificate: boolean;
};

export type BusinessDocumentSettings = {
  numbering: Record<string, DocumentNumberRule>;
  workflow: DocumentWorkflowConfig;
};

export type DocumentContext = {
  orderId: string;
  customerId?: string;
  customerName?: string;
  paymentStatus?: string;
  shippingStatus?: string;
  installationStatus?: string;
};

export type DocumentCandidate = {
  type: DocumentType;
  orderId: string;
  customerId?: string;
  customerName: string;
  reason: string;
};

export const DOCUMENT_TYPES: readonly DocumentType[] = [
  'quote', 'order', 'invoice', 'receipt', 'delivery', 'installation', 'warranty',
];

/**
 * Pure document-number generator. It does not write to Firestore; callers should
 * reserve numbers transactionally when issuing a real document.
 */
export function previewDocumentNumber(rule: DocumentNumberRule): string {
  const safeNext = Math.max(1, Number(rule.next) || 1);
  const safePad = Math.max(1, Number(rule.pad) || 1);
  return `${rule.prefix || ''}${String(safeNext).padStart(safePad, '0')}`;
}

export function nextDocumentRule(rule: DocumentNumberRule): DocumentNumberRule {
  return { ...rule, next: Math.max(1, Number(rule.next) || 1) + 1 };
}

/**
 * Calculates which downstream documents should exist for an order.
 * This keeps workflow decisions in one place so POS, Order and Command Center
 * do not each implement their own copy of the business rules.
 */
export function getRequiredDocuments(
  context: DocumentContext,
  workflow: DocumentWorkflowConfig,
): DocumentCandidate[] {
  const result: DocumentCandidate[] = [];
  const customerName = context.customerName?.trim() || 'ลูกค้าทั่วไป';

  result.push({ type: 'order', orderId: context.orderId, customerId: context.customerId, customerName, reason: 'ทุก Order ต้องมีเอกสารคำสั่งซื้อ' });

  if (workflow.paymentReceipt && ['paid', 'partial'].includes(String(context.paymentStatus).toLowerCase())) {
    result.push({ type: 'receipt', orderId: context.orderId, customerId: context.customerId, customerName, reason: 'มีการรับชำระเงิน' });
  }

  if (workflow.shippingNote && ['shipping', 'delivered', 'completed'].includes(String(context.shippingStatus).toLowerCase())) {
    result.push({ type: 'delivery', orderId: context.orderId, customerId: context.customerId, customerName, reason: 'Order เข้ากระบวนการจัดส่ง' });
  }

  if (workflow.installationHandover && ['completed', 'done'].includes(String(context.installationStatus).toLowerCase())) {
    result.push({ type: 'installation', orderId: context.orderId, customerId: context.customerId, customerName, reason: 'งานติดตั้งเสร็จและพร้อมตรวจรับ' });
  }

  if (workflow.warrantyCertificate && ['completed', 'done'].includes(String(context.installationStatus).toLowerCase())) {
    result.push({ type: 'warranty', orderId: context.orderId, customerId: context.customerId, customerName, reason: 'งานติดตั้งเสร็จและควรออกใบรับประกัน' });
  }

  return result;
}

export function getWorkflowNextStep(context: DocumentContext, workflow: DocumentWorkflowConfig): string {
  if (workflow.quoteToOrder && !context.orderId) return 'สร้าง Order จากใบเสนอราคา';
  if (workflow.paymentReceipt && ['paid', 'partial'].includes(String(context.paymentStatus).toLowerCase())) return 'ตรวจสอบ/ออกใบเสร็จ';
  if (workflow.shippingNote && ['shipping', 'delivered', 'completed'].includes(String(context.shippingStatus).toLowerCase())) return 'ตรวจสอบใบส่งสินค้า/ส่งมอบ';
  if (workflow.installationHandover && ['completed', 'done'].includes(String(context.installationStatus).toLowerCase())) return 'ตรวจรับงานติดตั้ง';
  return 'ดำเนินการ Order ต่อ';
}
