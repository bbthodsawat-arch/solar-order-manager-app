import assert from 'node:assert/strict';
import {
  getRequiredDocuments,
  getWorkflowNextStep,
  nextDocumentRule,
  previewDocumentNumber,
  type DocumentWorkflowConfig,
} from '../src/lib/businessDocumentService.ts';

const workflow: DocumentWorkflowConfig = {
  quoteToOrder: true,
  paymentReceipt: true,
  shippingNote: true,
  installationHandover: true,
  warrantyCertificate: true,
};

// Quote -> Order: quote contexts legitimately have no orderId yet.
assert.equal(
  getWorkflowNextStep({ customerName: 'ลูกค้าทดสอบ' }, workflow),
  'สร้าง Order จากใบเสนอราคา',
);
assert.deepEqual(getRequiredDocuments({ customerName: 'ลูกค้าทดสอบ' }, workflow), []);

// POS/Order -> Payment -> Delivery -> Installation/Warranty.
const completed = getRequiredDocuments({
  orderId: 'ORD-1001',
  customerId: 'CUST-1',
  customerName: 'ลูกค้าทดสอบ',
  paymentStatus: 'paid',
  shippingStatus: 'delivered',
  installationStatus: 'completed',
}, workflow);
assert.deepEqual(completed.map((item) => item.type), [
  'order', 'receipt', 'delivery', 'installation', 'warranty',
]);
assert.equal(getWorkflowNextStep({ orderId: 'ORD-1001', paymentStatus: 'partial' }, workflow), 'ตรวจสอบ/ออกใบเสร็จ');
assert.equal(getWorkflowNextStep({ orderId: 'ORD-1001', shippingStatus: 'shipping' }, workflow), 'ตรวจสอบใบส่งสินค้า/ส่งมอบ');
assert.equal(getWorkflowNextStep({ orderId: 'ORD-1001', installationStatus: 'done' }, workflow), 'ตรวจรับงานติดตั้ง');

// Numbering stays normalized and does not mutate the source rule.
const rule = { prefix: 'SO-', next: 7, pad: 4 };
assert.equal(previewDocumentNumber(rule), 'SO-0007');
assert.deepEqual(nextDocumentRule(rule), { prefix: 'SO-', next: 8, pad: 4 });
assert.deepEqual(rule, { prefix: 'SO-', next: 7, pad: 4 });
assert.equal(previewDocumentNumber({ prefix: 'SO-', next: 0, pad: 0 }), 'SO-1');

console.log('Business workflow checks passed');
