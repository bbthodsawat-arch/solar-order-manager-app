import React, { useState } from 'react';
import { Trash2, Edit2, TrendingDown, TrendingUp, Receipt, X, Clock, CheckCircle2, Truck, Wrench, User, MapPin, FileText, Printer, Zap, StickyNote } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Transaction, DisplayDensity } from '../types';
import TransactionQuickNoteModal from './TransactionQuickNoteModal';
import { getCategoryConfig } from '../utils/categoryIcons';

interface SwipeableTransactionItemProps {
  transaction: Transaction;
  density?: DisplayDensity;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void | Promise<void>;
  onViewReceipt?: (tx: Transaction) => void;
  onQuickPrint?: (tx: Transaction) => void;
  onPrintSimplified?: (tx: Transaction) => void;
  onTogglePaymentStatus?: (tx: Transaction) => void;
  onOpenNotes?: (tx: Transaction) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const SwipeableTransactionItem: React.FC<SwipeableTransactionItemProps> = ({ 
  transaction, 
  density = 'comfortable',
  onEdit, 
  onDelete,
  onViewReceipt,
  onQuickPrint,
  onPrintSimplified,
  onTogglePaymentStatus,
  onOpenNotes,
  canEdit = true,
  canDelete = true,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect
}) => {
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const isCompact = density === 'compact';
  const categoryConfig = getCategoryConfig(transaction.category, transaction.type);

  const typeStyles = isSelected
    ? 'bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/50 dark:border-amber-500/50 ring-2 ring-amber-500/20'
    : transaction.type === 'income' 
      ? 'bg-emerald-50/15 dark:bg-emerald-950/5 border-emerald-100/70 dark:border-emerald-950/30 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10' 
      : 'bg-rose-50/15 dark:bg-rose-950/5 border-rose-100/70 dark:border-rose-950/30 hover:bg-rose-50/30 dark:hover:bg-rose-950/10';

  const isSale = transaction.type === 'income' && transaction.saleOrderDetails;

  return (
    <>
      <div 
        onClick={() => isSelectionMode && onToggleSelect?.(transaction.id!)}
        className={`relative z-10 border flex items-center justify-between group transition-all duration-200 cursor-pointer ${
          isCompact 
            ? 'p-2 sm:py-2.5 sm:px-3 rounded-xl shadow-3xs' 
            : 'p-4 rounded-2xl shadow-3xs'
        } ${typeStyles}`}
      >
        <div className={`flex items-center flex-1 min-w-0 ${isCompact ? 'space-x-2.5' : 'space-x-3.5'}`}>
          {isSelectionMode ? (
            <div className={`${isCompact ? 'w-5 h-5 rounded-md' : 'w-6 h-6 rounded-lg'} border-2 flex items-center justify-center transition-all shrink-0 ${
              isSelected 
                ? 'bg-amber-500 border-amber-500 text-white' 
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
            }`}>
              {isSelected && <CheckCircle2 size={isCompact ? 13 : 16} />}
            </div>
          ) : (
            <div className={`${isCompact ? 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg' : 'w-10 h-10 rounded-full'} flex items-center justify-center shrink-0 border transition-all ${
              categoryConfig.bgClass
            } ${categoryConfig.textClass} ${categoryConfig.borderClass}`}>
              <categoryConfig.icon size={isCompact ? 15 : 20} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
              <p className={`font-bold text-gray-900 dark:text-white leading-tight truncate ${isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
                {isSale ? transaction.saleOrderDetails?.customerName : transaction.category}
              </p>
              {transaction.hasPendingWrites && (
                <span
                  className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[9px] font-bold animate-pulse shrink-0"
                  title="รอซิงค์ข้อมูลกับ Firebase เมื่อออนไลน์"
                >
                  <Clock size={10} className="text-amber-500" />
                  <span>รอซิงค์</span>
                </span>
              )}
              {transaction.receiptUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReceiptModal(true);
                  }}
                  className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9px] font-bold hover:bg-emerald-100 transition-colors shrink-0"
                  title="ดูสลิป/ใบเสร็จ"
                >
                  <Receipt size={10} />
                  <span>สลิป</span>
                </button>
              )}
            </div>
            
            {/* Sale Order Details */}
            {isSale ? (
              <div className={`${isCompact ? 'mt-0.5 space-y-0.5' : 'mt-1 space-y-1'}`}>
                <div className={`flex items-center text-[10px] font-medium text-slate-500 dark:text-slate-400 space-x-1.5 flex-wrap gap-y-0.5`}>
                   {transaction.saleOrderDetails?.province && (
                     <span className="flex items-center space-x-0.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[9px]">
                       <MapPin size={9} />
                       <span>{transaction.saleOrderDetails?.province}</span>
                     </span>
                   )}
                   <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[9px] truncate max-w-[140px] sm:max-w-xs">{transaction.subcategory || transaction.category}</span>
                </div>
                
                <div className="flex items-center flex-wrap gap-1 pt-0.5">
                  {/* Shipping Status Badge */}
                  {transaction.saleOrderDetails?.shippingStatus && (
                    <span className={`inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded-[5px] text-[9px] font-black border ${
                      transaction.saleOrderDetails.shippingStatus === 'จัดส่งสำเร็จ'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
                        : transaction.saleOrderDetails.shippingStatus === 'กำลังขนส่ง'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60'
                        : transaction.saleOrderDetails.shippingStatus === 'กำลังประกอบ'
                        ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60'
                        : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60'
                    }`}>
                      {transaction.saleOrderDetails.shippingStatus === 'สั่งซื้อแล้ว' && <Clock size={9} />}
                      {transaction.saleOrderDetails.shippingStatus === 'กำลังประกอบ' && <Wrench size={9} />}
                      {transaction.saleOrderDetails.shippingStatus === 'กำลังขนส่ง' && <Truck size={9} />}
                      {transaction.saleOrderDetails.shippingStatus === 'จัดส่งสำเร็จ' && <CheckCircle2 size={9} />}
                      <span>{transaction.saleOrderDetails.shippingStatus}</span>
                    </span>
                  )}

                  {/* Payment Status Badge */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTogglePaymentStatus) {
                        onTogglePaymentStatus(transaction);
                      }
                    }}
                    disabled={!onTogglePaymentStatus}
                    className={`inline-block px-1.5 py-0.2 rounded-[5px] text-[9px] font-black border transition-all ${
                      onTogglePaymentStatus ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
                    } ${
                      transaction.saleOrderDetails?.paymentStatus === 'paid' 
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/60' 
                      : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/60 animate-pulse'
                    }`}
                  >
                    {transaction.saleOrderDetails?.paymentStatus === 'paid' ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}
                  </button>

                  {(transaction.saleOrderDetails?.paymentMethod) && (
                    <span className="inline-block px-1.5 py-0.2 rounded-[5px] text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                      {transaction.saleOrderDetails.paymentMethod}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              transaction.detail && (
                <p className={`${isCompact ? 'text-[11px]' : 'text-xs'} text-gray-500 dark:text-gray-400 mt-0.5 font-medium truncate`}>
                  {transaction.detail}
                </p>
              )
            )}

            {transaction.notes && (
              <div className="mt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenNotes) {
                      onOpenNotes(transaction);
                    } else {
                      setShowNoteModal(true);
                    }
                  }}
                  className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold hover:bg-amber-500/25 transition-all text-left max-w-full cursor-pointer shadow-3xs"
                  title="คลิกเพื่อดูหรือแก้ไขบันทึกช่วยจำ (Quick Note)"
                >
                  <StickyNote size={11} className="text-amber-500 shrink-0" />
                  <span className="truncate">{transaction.notes}</span>
                </button>
              </div>
            )}

            {transaction.tags && transaction.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {transaction.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center text-[9px] font-semibold px-1 py-0.2 rounded bg-brand-soft text-brand border border-brand-soft"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{format(parseISO(transaction.date), 'HH:mm')}</p>
          </div>
        </div>
        <div className={`flex flex-col items-end justify-center h-full shrink-0 ${isCompact ? 'space-y-1' : 'space-y-2'}`}>
          <p className={`font-black tracking-tight ${isCompact ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} ${transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {transaction.type === 'income' ? '+' : '-'}฿{Number(transaction.amount).toLocaleString()}
          </p>
          <div className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenNotes) {
                  onOpenNotes(transaction);
                } else {
                  setShowNoteModal(true);
                }
              }}
              className={`${isCompact ? 'p-1.5 rounded-lg' : 'p-2 rounded-xl'} ${
                transaction.notes
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-500 hover:text-white'
              } transition-all cursor-pointer flex items-center space-x-1`}
              title={transaction.notes ? "ดู/แก้ไขบันทึกช่วยจำ (Quick Note)" : "แนบบันทึกช่วยจำ (Quick Note)"}
            >
              <StickyNote size={isCompact ? 13 : 16} />
            </button>
            {onQuickPrint && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickPrint(transaction);
                }}
                className={`${isCompact ? 'p-1.5 rounded-lg' : 'p-2 rounded-xl'} bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-all cursor-pointer flex items-center space-x-1`}
                title="พิมพ์สลิปด่วน (Quick Print 80mm/58mm)"
              >
                <Printer size={isCompact ? 13 : 16} />
              </button>
            )}
            {onViewReceipt && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewReceipt(transaction);
                }}
                className={`${isCompact ? 'p-1.5 rounded-lg' : 'p-2 rounded-xl'} bg-slate-100 dark:bg-slate-800 text-brand dark:text-brand hover:bg-brand hover:text-white transition-all cursor-pointer`}
                title="ออกใบเสร็จ / ใบเสนอราคา"
              >
                <FileText size={isCompact ? 13 : 16} />
              </button>
            )}
            {onPrintSimplified && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrintSimplified(transaction);
                }}
                className={`${isCompact ? 'p-1.5 rounded-lg' : 'p-2 rounded-xl'} bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer`}
                title="ใบเสร็จแบบย่อ (A4 Printable)"
              >
                <Receipt size={isCompact ? 13 : 16} />
              </button>
            )}
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(transaction);
                }}
                className={`${isCompact ? 'p-1.5 rounded-lg' : 'p-2 rounded-xl'} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-brand hover:text-white transition-all cursor-pointer`}
                title="แก้ไขรายการ"
              >
                <Edit2 size={isCompact ? 13 : 16} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (transaction.id) {
                    onDelete(transaction.id);
                  }
                }}
                className={`${isCompact ? 'p-1.5 rounded-lg' : 'p-2 rounded-xl'} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer`}
                title="ลบรายการ"
              >
                <Trash2 size={isCompact ? 13 : 16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Quick Note Modal */}
      {showNoteModal && (
        <TransactionQuickNoteModal
          isOpen={showNoteModal}
          onClose={() => setShowNoteModal(false)}
          transaction={transaction}
        />
      )}

      {/* Fullscreen Receipt Modal */}
      {showReceiptModal && transaction.receiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-xl w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col max-h-[90vh]">
            <div className="p-3 bg-gray-950 flex justify-between items-center border-b border-gray-800">
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Receipt size={16} className="text-emerald-400" />
                <span>สลิป / ใบเสร็จรายการ: {transaction.category}</span>
              </span>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center bg-black/90 min-h-[300px]">
              <img
                src={transaction.receiptUrl}
                alt="Receipt Full"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-gray-950 flex justify-between items-center border-t border-gray-800 text-xs text-gray-300">
              <div>
                ยอดเงิน: <span className="font-bold text-emerald-400">฿{Number(transaction.amount).toLocaleString()}</span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SwipeableTransactionItem;
