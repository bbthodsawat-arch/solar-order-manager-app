import React from 'react';
import { SOM_VISUAL_STYLES } from '../../lib/designSystemPresets';
import { VisualStyleId } from '../../types/designSystem';
import { Check, Sparkles, Layers, Box, Square, Heart, Shield, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface VisualStyleSelectorProps {
  currentStyleId: VisualStyleId;
  onSelectStyle: (styleId: VisualStyleId) => void;
}

const STYLE_ICONS: Record<string, any> = {
  'flat-clean': Square,
  'soft-neumorphic': Layers,
  'glassmorphism': Sparkles,
  'dimensional': Box,
  'cute-pastel': Heart,
  'high-contrast': Shield,
};

export const VisualStyleSelector: React.FC<VisualStyleSelectorProps> = ({
  currentStyleId,
  onSelectStyle,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>💎 เครื่องยนต์สไตล์การ์ด & พื้นผิว (Visual Style Engine)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ปรับเปลี่ยนมิติ ความนูน เงา และเอฟเฟกต์กระจกฝ้าของการ์ดข้อมูลทั่วทั้งระบบ
          </p>
        </div>
        <span className="text-[11px] font-black text-brand bg-brand-soft px-3 py-1 rounded-full border border-brand-soft self-start sm:self-auto">
          6 สไตล์พื้นผิวระดับ Pro
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SOM_VISUAL_STYLES.map((style) => {
          const isSelected = currentStyleId === style.id;
          const Icon = STYLE_ICONS[style.id] || Box;

          return (
            <motion.div
              key={style.id}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              onClick={() => onSelectStyle(style.id)}
              className={`relative rounded-3xl p-5 border-2 transition-all text-left flex flex-col justify-between space-y-4 cursor-pointer overflow-hidden ${
                isSelected
                  ? 'border-brand bg-white dark:bg-slate-900 shadow-lg ring-2 ring-brand/30 scale-[1.02]'
                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Header with Icon & Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2.5 rounded-2xl border transition-colors ${
                      isSelected
                        ? 'bg-brand text-white border-brand'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {style.name}
                    </h4>
                    <p className="text-[10px] font-extrabold text-slate-400">
                      {style.labelThai.split('(')[0]}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-brand text-white'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {style.badge}
                </span>
              </div>

              {/* Live Miniature Mockup Card of this visual style */}
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Eye size={11} /> ตัวอย่างการ์ด
                  </span>
                  <span>฿58,900</span>
                </div>

                {/* Simulated Nested Mini Card */}
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                    style.id === 'soft-neumorphic'
                      ? 'soft-neumorphic'
                      : style.id === 'glassmorphism'
                      ? 'glass-panel'
                      : style.id === 'dimensional'
                      ? 'dimensional-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                      : style.id === 'cute-pastel'
                      ? 'bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800 text-pink-900 dark:text-pink-200 rounded-2xl'
                      : style.id === 'high-contrast'
                      ? 'bg-white dark:bg-black border-2 border-slate-900 dark:border-white font-black'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200">
                    ชุดโซล่าเซลล์ 5kW
                  </span>
                  <span className="text-[10px] font-bold text-brand bg-brand-soft px-2 py-0.5 rounded-md">
                    พร้อมติดตั้ง
                  </span>
                </div>
              </div>

              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {style.description}
              </p>

              {/* Status Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-400 font-mono text-[10px]">
                  style: {style.id}
                </span>

                <span
                  className={
                    isSelected
                      ? 'text-brand font-black flex items-center gap-1'
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }
                >
                  {isSelected ? (
                    <>
                      <Check size={13} className="font-black" />
                      <span>ใช้งานสไตล์นี้</span>
                    </>
                  ) : (
                    'คลิกเพื่อเลือกใช้'
                  )}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
