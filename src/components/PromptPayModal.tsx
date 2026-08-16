import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generatePromptPayPayload } from '../utils/promptpay';
import { 
  QrCode, X, Copy, Check, Download, Building2, 
  Sparkles, CheckCircle2, DollarSign, Smartphone, ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface PromptPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  promptPayId?: string;
  accountName?: string;
  bankName?: string;
  orderNumber?: string;
  onConfirmPayment?: () => void;
}

export const PromptPayModal: React.FC<PromptPayModalProps> = ({
  isOpen,
  onClose,
  amount,
  promptPayId = '0812345678',
  accountName = 'ร้านกลางนาโซล่าเซลล์',
  bankName = 'พร้อมเพย์ (PromptPay)',
  orderNumber,
  onConfirmPayment
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [customTarget, setCustomTarget] = useState(promptPayId);
  const [customAmount, setCustomAmount] = useState(amount);

  // Sync with props
  React.useEffect(() => {
    setCustomTarget(promptPayId);
    setCustomAmount(amount);
  }, [promptPayId, amount]);

  const qrPayload = useMemo(() => {
    return generatePromptPayPayload(customTarget || promptPayId, customAmount);
  }, [customTarget, promptPayId, customAmount]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(customTarget || promptPayId);
    setCopiedId(true);
    toast.success('คัดลอกหมายเลขพร้อมเพย์แล้ว');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(customAmount.toString());
    setCopiedAmount(true);
    toast.success('คัดลอกยอดเงินแล้ว');
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 my-8 relative overflow-hidden"
        >
          {/* Header Banner with Thai QR Payment Style */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 -mx-6 -mt-6 p-5 text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-inner">
                <QrCode size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black tracking-tight">Thai QR Payment</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    PromptPay
                  </span>
                </div>
                <p className="text-[11px] text-blue-200/80 font-medium">สแกนจ่ายผ่านแอปพลิเคชันทุกธนาคาร</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Account & Shop Info */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-center">
            <div className="text-xs font-black text-slate-900 dark:text-white">
              {accountName}
            </div>
            {bankName && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
                <Building2 size={12} />
                <span>{bankName}</span>
              </div>
            )}
            {orderNumber && (
              <div className="text-[10px] text-slate-400 font-mono font-bold">
                เลขที่รายการ: {orderNumber}
              </div>
            )}
          </div>

          {/* Amount Display */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl p-4 text-center space-y-1">
            <span className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              ยอดเงินที่ต้องชำระ
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                ฿{customAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <button
                onClick={handleCopyAmount}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer"
                title="คัดลอกยอดเงิน"
              >
                {copiedAmount ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* QR Code Presentation Box */}
          <div className="flex flex-col items-center justify-center p-5 bg-white dark:bg-white rounded-3xl border-2 border-slate-200 shadow-md">
            <div className="p-2 bg-white rounded-2xl">
              {qrPayload ? (
                <QRCodeSVG
                  value={qrPayload}
                  size={210}
                  level="M"
                  includeMargin={false}
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                  กรุณาระบุหมายเลขพร้อมเพย์
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-black text-slate-700">
              <ShieldCheck size={14} className="text-blue-600" />
              <span>PromptPay Dynamic QR Code</span>
            </div>
          </div>

          {/* PromptPay Target & Copy Button */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <Smartphone size={16} className="text-purple-500" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">หมายเลขพร้อมเพย์</span>
                <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
                  {customTarget || 'ยังไม่ได้ระบุพร้อมเพย์'}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopyId}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              {copiedId ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copiedId ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black transition-all cursor-pointer text-center"
            >
              ปิดหน้าต่าง
            </button>

            {onConfirmPayment && (
              <button
                type="button"
                onClick={() => {
                  onConfirmPayment();
                  onClose();
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>ยืนยันได้รับเงินแล้ว</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PromptPayModal;
