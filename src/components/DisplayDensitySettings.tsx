import React from 'react';
import { ListCollapse, Rows3, Check, Smartphone, Monitor, Sparkles } from 'lucide-react';
import { DisplayDensity } from '../types';

interface DisplayDensitySettingsProps {
  currentDensity: DisplayDensity;
  onUpdateDensity: (density: DisplayDensity) => Promise<void>;
}

export const DisplayDensitySettings: React.FC<DisplayDensitySettingsProps> = ({
  currentDensity,
  onUpdateDensity,
}) => {
  const isCompact = currentDensity === 'compact';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-brand dark:text-brand rounded-2xl border border-amber-200 dark:border-amber-800">
            <ListCollapse size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              ความหนาแน่นการแสดงผล (Display Density)
            </h3>
            <p className="text-xs text-slate-400 font-bold">
              ปรับแต่งระยะห่างและความกะทัดรัดของรายการธุรกรรม ให้เหมาะกับขนาดหน้าจอของคุณ
            </p>
          </div>
        </div>

        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black self-start sm:self-center">
          <span>สถานะปัจจุบัน:</span>
          <span className="text-brand dark:text-brand">
            {isCompact ? 'กระชับ (Compact)' : 'สบายตา (Comfortable)'}
          </span>
        </span>
      </div>

      {/* Density Selector Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Compact Mode Card */}
        <div
          onClick={() => onUpdateDensity('compact')}
          className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
            isCompact
              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-brand shadow-md shadow-brand/10 ring-2 ring-brand/20'
              : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    isCompact
                      ? 'bg-brand text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <ListCollapse size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    โหมดกระชับ (Compact)
                  </h4>
                  <div className="flex items-center space-x-1 text-[11px] text-brand font-extrabold">
                    <Smartphone size={12} />
                    <span>เหมาะสำหรับจอมือถือ & หน้าจอขนาดเล็ก</span>
                  </div>
                </div>
              </div>

              {isCompact ? (
                <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center shadow-xs">
                  <Check size={14} className="stroke-[3]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600" />
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              ลด Padding ขอบ และย่อขนาดไอคอน เพื่อแสดงรายการประวัติธุรกรรมได้มากขึ้นถึง 40-70% ต่อ 1 หน้าจอ โดยไม่ต้องเลื่อนหน้าจอบ่อย
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>ระยะห่าง: แน่นกระชับ</span>
            <span>ความจุข้อมูล: สูงสุด</span>
          </div>
        </div>

        {/* Comfortable Mode Card */}
        <div
          onClick={() => onUpdateDensity('comfortable')}
          className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
            !isCompact
              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-brand shadow-md shadow-brand/10 ring-2 ring-brand/20'
              : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    !isCompact
                      ? 'bg-brand text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Rows3 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    โหมดสบายตา (Comfortable)
                  </h4>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400 font-extrabold">
                    <Monitor size={12} />
                    <span>ขนาดมาตรฐาน สบายตา อ่านง่าย</span>
                  </div>
                </div>
              </div>

              {!isCompact ? (
                <div className="w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center shadow-xs">
                  <Check size={14} className="stroke-[3]" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600" />
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              ระยะห่างปานกลาง ขนาดตัวหนังสือและปุ่มกดขนาดมาตรฐาน อ่านง่าย สบายตา เหมาะสำหรับหน้าจอ iPad แท็บเล็ต หรือคอมพิวเตอร์
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>ระยะห่าง: โปร่งสบายตา</span>
            <span>ความจุข้อมูล: ปกติ</span>
          </div>
        </div>
      </div>

      {/* Live Visual Comparison Box */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles size={15} className="text-brand" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              ตัวอย่างจำลองความสูงของแถวธุรกรรม ({isCompact ? 'โหมดกระชับ' : 'โหมดสบายตา'})
            </span>
          </div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Live Preview
          </span>
        </div>

        <div className={isCompact ? 'space-y-1.5' : 'space-y-3'}>
          {/* Sample Row 1 */}
          <div
            className={`border rounded-xl flex items-center justify-between bg-white dark:bg-slate-900 shadow-3xs transition-all ${
              isCompact ? 'p-2 sm:px-3 text-xs' : 'p-4 text-sm'
            } border-emerald-100 dark:border-emerald-950/40`}
          >
            <div className={`flex items-center ${isCompact ? 'space-x-2.5' : 'space-x-3.5'}`}>
              <div
                className={`${
                  isCompact ? 'w-7 h-7' : 'w-10 h-10'
                } rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center font-black shrink-0`}
              >
                +
              </div>
              <div>
                <p className={`font-bold text-slate-900 dark:text-white ${isCompact ? 'text-xs' : 'text-sm'}`}>
                  นายสมชาย ใจดี (ชุดปั๊มน้ำโซล่าเซลล์ 3HP)
                </p>
                <p className="text-[10px] text-slate-400">เพชรบูรณ์ • 14:30 น.</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`font-black text-emerald-600 dark:text-emerald-400 ${isCompact ? 'text-xs' : 'text-base'}`}>
                +฿38,500
              </span>
            </div>
          </div>

          {/* Sample Row 2 */}
          <div
            className={`border rounded-xl flex items-center justify-between bg-white dark:bg-slate-900 shadow-3xs transition-all ${
              isCompact ? 'p-2 sm:px-3 text-xs' : 'p-4 text-sm'
            } border-rose-100 dark:border-rose-950/40`}
          >
            <div className={`flex items-center ${isCompact ? 'space-x-2.5' : 'space-x-3.5'}`}>
              <div
                className={`${
                  isCompact ? 'w-7 h-7' : 'w-10 h-10'
                } rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center font-black shrink-0`}
              >
                -
              </div>
              <div>
                <p className={`font-bold text-slate-900 dark:text-white ${isCompact ? 'text-xs' : 'text-sm'}`}>
                  ค่าสายไฟโซล่าเซลล์ Solar Cable 4mm
                </p>
                <p className="text-[10px] text-slate-400">ค่าใช้จ่ายร้าน • 11:15 น.</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`font-black text-rose-600 dark:text-rose-400 ${isCompact ? 'text-xs' : 'text-base'}`}>
                -฿4,200
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
