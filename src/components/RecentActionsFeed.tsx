import React from 'react';
import { ActionRecord } from '../types';
import { RotateCcw, Trash, CheckCircle2, Plus, Edit2, X, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

interface RecentActionsFeedProps {
  history: ActionRecord[];
  onUndo: (id: string) => Promise<void>;
  onClear: () => void;
}

const RecentActionsFeed: React.FC<RecentActionsFeedProps> = ({ history, onUndo, onClear }) => {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'CREATE': return <Plus size={14} className="text-emerald-500" />;
      case 'UPDATE': return <Edit2 size={14} className="text-blue-500" />;
      case 'DELETE': return <Trash size={14} className="text-rose-500" />;
      case 'BATCH_DELETE': return <Trash size={14} className="text-rose-600" />;
      case 'BATCH_UPDATE': return <CheckCircle2 size={14} className="text-emerald-500" />;
      default: return <AlertCircle size={14} />;
    }
  };

  const getActionLabel = (action: ActionRecord) => {
    switch (action.type) {
      case 'CREATE': return 'สร้างรายการใหม่';
      case 'UPDATE': return 'แก้ไขข้อมูลรายการ';
      case 'DELETE': return 'ลบรายการ';
      case 'BATCH_DELETE': return `ลบกลุ่มรายการ (${action.transactions?.length || 0} รายการ)`;
      case 'BATCH_UPDATE': return `อัปเดตสถานะกลุ่ม (${action.transactions?.length || 0} รายการ)`;
      default: return action.type;
    }
  };

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <RotateCcw size={20} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-bold text-slate-400 dark:text-slate-500">ไม่มีกิจกรรมล่าสุดที่สามารถย้อนกลับได้</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden animate-slide-down">
      <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center space-x-2">
          <RotateCcw size={16} className="text-amber-500" />
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">กิจกรรมล่าสุด (Undo Feed)</h3>
        </div>
        <button 
          onClick={onClear}
          className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase"
        >
          ล้างประวัติ
        </button>
      </div>
      
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {history.map((action) => (
          <div key={action.id} className="p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 shadow-3xs">
                  {getActionIcon(action.type)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {getActionLabel(action)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {format(parseISO(action.timestamp), 'HH:mm:ss', { locale: th })} • {action.transactionId ? `ID: ${action.transactionId.slice(-6)}` : 'Batch Action'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => onUndo(action.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-lg transition-all shadow-sm shadow-amber-500/20 active:scale-95"
              >
                <RotateCcw size={12} />
                <span>UNDO</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 bg-slate-50/30 dark:bg-slate-800/20 text-center">
        <p className="text-[10px] text-slate-400 font-medium italic">
          * คุณสามารถย้อนกลับกิจกรรมล่าสุดได้สูงสุด 5 รายการ
        </p>
      </div>
    </div>
  );
};

export default RecentActionsFeed;
