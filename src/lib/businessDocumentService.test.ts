import { getRequiredDocuments, getWorkflowNextStep, nextDocumentRule, previewDocumentNumber } from './businessDocumentService';

describe('businessDocumentService', () => {
  const workflow = {
    quoteToOrder: true,
    paymentReceipt: true,
    shippingNote: true,
    installationHandover: true,
    warrantyCertificate: true,
  };

  it('previews and increments document numbers without mutating the input', () => {
    const rule = { prefix: 'SO-', next: 12, pad: 5 };
    expect(previewDocumentNumber(rule)).toBe('SO-00012');
    expect(nextDocumentRule(rule)).toEqual({ prefix: 'SO-', next: 13, pad: 5 });
    expect(rule.next).toBe(12);
  });

  it('creates receipt, delivery, installation and warranty candidates from order state', () => {
    const docs = getRequiredDocuments({
      orderId: 'SO-2026-00001',
      customerId: 'C-1',
      customerName: 'ลูกค้าทดสอบ',
      paymentStatus: 'paid',
      shippingStatus: 'delivered',
      installationStatus: 'completed',
    }, workflow);

    expect(docs.map(x => x.type)).toEqual(['order', 'receipt', 'delivery', 'installation', 'warranty']);
    expect(docs.every(x => x.orderId === 'SO-2026-00001')).toBe(true);
  });

  it('keeps the next-step decision centralized', () => {
    expect(getWorkflowNextStep({ orderId: 'SO-1', paymentStatus: 'paid' }, workflow)).toBe('ตรวจสอบ/ออกใบเสร็จ');
    expect(getWorkflowNextStep({ orderId: 'SO-1', paymentStatus: 'unpaid' }, workflow)).toBe('ดำเนินการ Order ต่อ');
  });
});
