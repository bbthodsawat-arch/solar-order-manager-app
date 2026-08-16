import React from 'react';
import { useDailyReminder } from '../hooks/useDailyReminder';
import { Bell, Plus, X, Clock, Sparkles } from 'lucide-react';

interface DailyReminderBannerProps {
  onAddTransaction: () => void;
}

export default function DailyReminderBanner({ onAddTransaction }: DailyReminderBannerProps) {
  const { shouldShowBanner, config, dismissForToday } = useDailyReminder();

  if (!shouldShowBanner) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden transition-all animate-fade-in border border-amber-400/30">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
            <Bell size={22} className="text-white animate-bounce" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs border border-white/20">
                แจ้งเตือนประจำวัน {config.reminderTime} น.
              </span>
              <span className="text-amber-100 text-xs font-semibold flex items-center">
                <Clock size={12} className="mr-1" />
                ยังไม่ได้ลงบัญชีวันนี้
              </span>
            </div>
            <h3 className="text-base font-black text-white">
              อย่าลืมลงบันทึกรายรับ-รายจ่ายประจำวันนี้!
            </h3>
            <p className="text-amber-100 text-xs max-w-xl font-medium leading-relaxed">
              ช่วยให้การสรุปบัญชีร้านกลางนาโซล่าเซลล์ ยอดขายติดตั้ง และรายงานผลกำไรของคุณถูกต้องและแม่นยำทุกวัน
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          <button
            onClick={onAddTransaction}
            className="px-4 py-2 bg-white hover:bg-amber-50 text-amber-900 rounded-2xl text-xs font-black shadow-md transition-all transform hover:scale-[1.02] flex items-center space-x-1.5"
          >
            <Plus size={15} className="text-amber-600 font-bold" />
            <span>บันทึกรายการทันที</span>
          </button>

          <button
            onClick={dismissForToday}
            className="p-2 bg-black/20 hover:bg-black/30 text-white/90 rounded-2xl text-xs transition-colors border border-white/10"
            title="ปิดการเตือนวันนี้"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
