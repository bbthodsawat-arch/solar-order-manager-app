import React from 'react';
import { SOM_THEMES } from '../../lib/designSystemPresets';
import { SOMThemePreset, ThemeId } from '../../types/designSystem';
import { Check, Sparkles, Sun, Moon, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ThemeSelectorGridProps {
  currentThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemeSelectorGrid: React.FC<ThemeSelectorGridProps> = ({
  currentThemeId,
  onSelectTheme,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>🎨 10 คอลเลกชันธีมสีพรีเมียม (10 Premium Themes + Cute Modern)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            เลือกธีมสีองค์กรที่ออกแบบมาเฉพาะสำหรับร้านโซล่าเซลล์ สลับโทนสีได้ทันทีทั้งระบบ
          </p>
        </div>
        <span className="text-[11px] font-black text-brand bg-brand-soft px-3 py-1 rounded-full border border-brand-soft self-start sm:self-auto">
          {SOM_THEMES.length} ธีมพรีเมียมพร้อมใช้งาน
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {SOM_THEMES.map((themePreset) => {
          const isSelected = currentThemeId === themePreset.id;

          return (
            <motion.div
              key={themePreset.id}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              onClick={() => onSelectTheme(themePreset.id)}
              className={`relative rounded-3xl p-4 border-2 transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer overflow-hidden group ${
                isSelected
                  ? 'border-brand bg-white dark:bg-slate-900 shadow-lg ring-2 ring-brand/30 scale-[1.02]'
                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
              }`}
            >
              {/* Gradient Banner Top Strip */}
              <div
                className={`h-4 w-full rounded-2xl bg-gradient-to-r ${themePreset.colors.gradientClass} shadow-inner`}
              />

              {/* Theme Header & Swatches */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    {/* Primary Color Dot */}
                    <div
                      className="w-7 h-7 rounded-full shadow-sm border-2 border-white dark:border-slate-800 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: themePreset.colors.primary }}
                    >
                      {isSelected && <Check size={14} className="text-white font-black" />}
                    </div>
                    {/* Secondary Color Dot */}
                    <div
                      className="w-5 h-5 rounded-full shadow-sm border-2 border-white dark:border-slate-800 shrink-0 -ml-2.5"
                      style={{ backgroundColor: themePreset.colors.secondary }}
                    />
                    {/* Accent Dot */}
                    <div
                      className="w-4 h-4 rounded-full shadow-sm border-2 border-white dark:border-slate-800 shrink-0 -ml-2"
                      style={{ backgroundColor: themePreset.colors.accent }}
                    />
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-brand text-white'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {themePreset.badge}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                    {themePreset.name}
                  </h4>
                  <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                    {themePreset.tagline}
                  </p>
                </div>

                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {themePreset.description}
                </p>
              </div>

              {/* Footer Indicator */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-bold">
                <span className="font-mono text-slate-400 dark:text-slate-500">
                  {themePreset.colors.primary}
                </span>

                <span
                  className={
                    isSelected
                      ? 'text-brand font-black flex items-center gap-1'
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 flex items-center gap-1'
                  }
                >
                  {isSelected ? (
                    'กำลังใช้งาน'
                  ) : (
                    <>
                      <span>เลือกธีม</span>
                      <ArrowRight size={10} />
                    </>
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
