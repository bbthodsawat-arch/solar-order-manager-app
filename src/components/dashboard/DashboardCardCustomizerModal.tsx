import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { 
  DashboardCardDesignConfig, 
  DashboardCardId, 
  DashboardCardColorDefinition 
} from '../../types';
import DashboardCardCustomizerTab from './DashboardCardCustomizerTab';

interface DashboardCardCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  designConfig?: DashboardCardDesignConfig;
  onUpdateDesign: (updates: Partial<DashboardCardDesignConfig>) => Promise<void> | void;
  onResetDesign: () => Promise<void> | void;
  onToggleVisibility: (cardId: DashboardCardId) => Promise<void> | void;
  onReorderCards: (newOrders: DashboardCardId[]) => Promise<void> | void;
  onSetCustomColor: (cardId: DashboardCardId, colors: Partial<DashboardCardColorDefinition>) => Promise<void> | void;
}

export const DashboardCardCustomizerModal: React.FC<DashboardCardCustomizerModalProps> = ({
  isOpen,
  onClose,
  designConfig,
  onUpdateDesign,
  onResetDesign,
  onToggleVisibility,
  onReorderCards,
  onSetCustomColor
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-brand flex items-center justify-center font-bold shadow-2xs">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                ปรับแต่งสไตล์การ์ดสรุป & ชุดสีพาสเทล
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dashboard Executive KPI Cards Customizer Studio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          <DashboardCardCustomizerTab
            designConfig={designConfig}
            onUpdateDesign={onUpdateDesign}
            onResetDesign={onResetDesign}
            onToggleVisibility={onToggleVisibility}
            onReorderCards={onReorderCards}
            onSetCustomColor={onSetCustomColor}
          />
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            * การเปลี่ยนแปลงจะถูกบันทึกและแสดงผลทันทีแบบเรียลไทม์
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
          >
            เสร็จสิ้น & ปิดหน้าต่าง
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardCardCustomizerModal;
