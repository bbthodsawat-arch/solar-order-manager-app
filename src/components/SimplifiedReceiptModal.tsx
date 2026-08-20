import React from 'react';
import { Transaction, ShopInfo } from '../types';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { Printer, X, Plus, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  items?: { name: string; quantity: string }[];
  linkedSubcategoryId?: string;
  isCustom?: boolean;
}

interface SimplifiedReceiptModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  shopInfo: ShopInfo;
  onClose: () => void;
  cartItems?: CartItem[];
  discountAmount?: number;
  discountType?: 'baht' | 'percent';
  shippingFee?: number;
}

const POS_STORAGE_KEYS = [
  'klangna_pos_cart',
  'klangna_pos_discountAmount',
  'klangna_pos_discountType',
  'klangna_pos_shippingFee',
  'klangna_pos_customer',
  'klangna_pos_shipping',
  'klangna_pos_payment',
];

export default function SimplifiedReceiptModal({
  isOpen,
  transaction,
  shopInfo,
  onClose,
  cartItems,
  discountAmount = 0,
  discountType = 'baht',
  shippingFee = 0,
}: SimplifiedReceiptModalProps) {
  if (!isOpen || !transaction) return null;

  const rawDocNo = transaction.id ? transaction.id.slice(-6).toUpperCase() : '000001';
  const receiptNo = `REC-${rawDocNo}`;
  const txDate = transaction.date ? parseISO(transaction.date) : new Date();
  const formattedDate = format(txDate, 'dd MMMM yyyy เวลา HH:mm', { locale: th });
  const totalAmount = Number(transaction.amount) || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    // A receipt close is the end of the current POS session. Clear stale draft
    // state before returning to a clean sale screen.
    try {
      POS_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
      sessionStorage.removeItem('klangna_pos_receipt_open');
    } catch {
      // Storage may be unavailable in private browsing; the parent close still works.
    }
    onClose();

    // The POS screen keeps its cart in React state. A short reload guarantees
    // that the next sale starts from a clean state even when the modal is closed
    // directly from the mobile action dock.
    window.setTimeout(() => window.location.reload(), 40);
  };

  const finalDiscountAmount = discountAmount || transaction.saleOrderDetails?.discountAmount || 0;
  const finalDiscountType = discountType !== 'baht' ? discountType : (transaction.saleOrderDetails?.discountType || 'baht');
  const finalShippingFee = shippingFee || transaction.saleOrderDetails?.shippingFee || 0;

  const finalItems = React.useMemo(() => {
    if (cartItems && cartItems.length > 0) {
      return cartItems.map((item, index) => ({
        id: item.id || `cart-${index}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));
    }

    if (transaction.saleOrderDetails?.setOption) {
      return transaction.saleOrderDetails.setOption.split(',').map((opt, index) => {
        const trimmed = opt.trim();
        const qtyMatch = trimmed.match(/\(x(\d+)\)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
        const priceMatch = trimmed.match(/\[฿([\d\.]+)\]/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
        const name = trimmed.replace(/\(x\d+\)/g, '').replace(/\[฿[\d\.]+\]/g, '').trim();
        return {
          id: `setoption-${index}`,
          name,
          price,
          quantity: qty,
          total: price > 0 ? price * qty : 0,
        };
      });
    }

    const estimatedSubtotal = totalAmount - finalShippingFee + (finalDiscountAmount > 0
      ? (finalDiscountType === 'percent' ? (totalAmount * finalDiscountAmount) / 100 : finalDiscountAmount)
      : 0);

    return [{
      id: 'fallback',
      name: transaction.subcategory || transaction.category || 'รายการสั่งซื้อ',
      price: estimatedSubtotal,
      quantity: 1,
      total: estimatedSubtotal,
    }];
  }, [cartItems, transaction, totalAmount, finalShippingFee, finalDiscountAmount, finalDiscountType]);

  const calculatedSubtotal = React.useMemo(() => {
    if (cartItems && cartItems.length > 0) {
      return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
    const sumOfItems = finalItems.reduce((sum, item) => sum + item.total, 0);
    return sumOfItems > 0 ? sumOfItems : totalAmount - finalShippingFee;
  }, [cartItems, finalItems, totalAmount, finalShippingFee]);

  const discountVal = React.useMemo(() => {
    if (finalDiscountAmount <= 0) return 0;
    return finalDiscountType === 'percent'
      ? (calculatedSubtotal * finalDiscountAmount) / 100
      : finalDiscountAmount;
  }, [finalDiscountAmount, finalDiscountType, calculatedSubtotal]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 print:p-0 print:bg-white print:backdrop-blur-none">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #printable-receipt, #printable-receipt * { visibility: visible !important; }
              #printable-receipt {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                max-height: none !important;
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
            }
          `}</style>

          {/* Mobile/desktop action dock. Hidden during print. */}
          <div className="print-hidden-controls absolute top-4 right-4 flex items-center gap-2 print:hidden z-10">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer size={18} />
              <span>พิมพ์ใบเสร็จ</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="ปิดใบเสร็จและเริ่มรายการขายใหม่"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <X size={20} />
              <span>ปิด / เริ่มรายการใหม่</span>
            </button>
          </div>

          <motion.div
            id="printable-receipt"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            className="w-full max-w-lg bg-white shadow-2xl rounded-2xl overflow-y-auto max-h-[90vh] print:shadow-none print:rounded-none print:max-h-none print:h-auto print:visible"
          >
            <div className="p-6 sm:p-10 text-slate-900 bg-white print:p-0">
              <div className="text-center mb-7 border-b-2 border-slate-900 pb-5">
                <h1 className="text-2xl font-black mb-2 uppercase tracking-wide">ใบเสร็จรับเงิน</h1>
                <h2 className="text-lg font-bold text-slate-800 mb-1">{shopInfo.name || 'ร้านกลางนาโซล่าเซลล์'}</h2>
                {(shopInfo.address || shopInfo.phone) && (
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {shopInfo.address}
                    {shopInfo.phone && `\nโทร. ${shopInfo.phone}`}
                    {shopInfo.taxId && `\nเลขประจำตัวผู้เสียภาษี: ${shopInfo.taxId}`}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 text-xs bg-slate-50 rounded-xl p-3">
                <div>
                  <p className="mb-1"><span className="font-bold text-slate-500">วันที่:</span> <span className="font-bold text-slate-800">{formattedDate}</span></p>
                  <p><span className="font-bold text-slate-500">ลูกค้า:</span> <span className="font-bold text-slate-800">{transaction.saleOrderDetails?.customerName || 'ลูกค้าทั่วไป'}</span></p>
                </div>
                <div className="sm:text-right">
                  <p className="mb-1"><span className="font-bold text-slate-500">เลขที่:</span> <span className="font-bold text-slate-800">{receiptNo}</span></p>
                  <p><span className="font-bold text-slate-500">ผู้รับเงิน:</span> <span className="font-bold text-slate-800">{transaction.createdBy || 'ผู้ดูแลระบบ'}</span></p>
                </div>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full min-w-[430px] text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-400 font-bold">
                      <th className="py-2 text-left">รายการสินค้า / บริการ</th>
                      <th className="py-2 text-center w-16">จำนวน</th>
                      <th className="py-2 text-right w-24">ราคา/หน่วย</th>
                      <th className="py-2 text-right w-24">ยอดรวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {finalItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 font-bold text-slate-800">{item.name}</td>
                        <td className="py-3 text-center font-bold text-slate-600">x{item.quantity}</td>
                        <td className="py-3 text-right font-bold text-slate-600">{item.price > 0 ? `฿${item.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '—'}</td>
                        <td className="py-3 text-right font-black text-slate-900">{item.total > 0 ? `฿${item.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col items-end space-y-1.5 border-t border-slate-200 pt-3 text-xs mb-7">
                {calculatedSubtotal > 0 && (
                  <div className="flex justify-between w-60 max-w-full"><span className="text-slate-500 font-bold">ยอดรวมสินค้า:</span><span className="font-bold text-slate-800">฿{calculatedSubtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span></div>
                )}
                {discountVal > 0 && (
                  <div className="flex justify-between w-60 max-w-full text-rose-600"><span className="font-bold">ส่วนลดพิเศษ:</span><span className="font-black">-฿{discountVal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span></div>
                )}
                {finalShippingFee > 0 && (
                  <div className="flex justify-between w-60 max-w-full text-slate-600"><span className="font-bold">ค่าจัดส่ง:</span><span className="font-bold text-slate-800">฿{finalShippingFee.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span></div>
                )}
                <div className="w-60 max-w-full border-t border-slate-300 my-1" />
                <div className="flex justify-between w-60 max-w-full text-sm font-black text-slate-950"><span>ยอดสุทธิที่ชำระ:</span><span>฿{totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span></div>
              </div>

              <div className="text-center text-[10px] text-slate-400 mt-7 pt-5 border-t border-slate-200 border-dashed pb-2">
                <p className="font-bold text-slate-600">{shopInfo.receiptNote || 'ขอบคุณที่ใช้บริการและไว้วางใจเรา'}</p>
                <p className="mt-1 opacity-60">จัดพิมพ์และออกเอกสารผ่านระบบอัตโนมัติ</p>
              </div>
            </div>
          </motion.div>

          {/* Mobile action labels remain visible even if a browser clips the fixed dock. */}
          <div className="hidden print:hidden" aria-hidden="true">
            <Plus size={1} />
            <RotateCcw size={1} />
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
