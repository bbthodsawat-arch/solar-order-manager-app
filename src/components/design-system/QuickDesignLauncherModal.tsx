import React, { useState } from 'react';
import { useDesignSystem } from '../../hooks/useDesignSystem';
import { SOM_THEMES, SOM_VISUAL_STYLES } from '../../lib/designSystemPresets';
import { ThemeId, VisualStyleId } from '../../types/designSystem';
import { 
  Palette, 
  Sparkles, 
  Check, 
  X, 
  ArrowRight, 
  Sliders, 
  Settings,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickDesignLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullSettings?: () => void;
}

export const QuickDesignLauncherModal: React.FC<QuickDesignLauncherModalProps> = ({
  isOpen,
  onClose,
  onOpenFullSettings,
}) => {
  const { designConfig, setThemePreset, setVisualStyle } = useDesignSystem();
  const [activeSubTab, setActiveSubTab] = useState<'themes' | 'styles'>('themes');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-brand-soft via-transparent to-transparent">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-brand text-white rounded-2xl shadow-sm">
                <Palette size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>สลับธีม & สไตล์ด่วน (Quick Theme Switcher)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  เปลี่ยนโทนสีและสไตล์การ์ดได้ทันทีใน 1 คลิก
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sub Navigation Bar */}
          <div className="px-6 pt-4 pb-1 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
              <button
                onClick={() => setActiveSubTab('themes')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'themes'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🎨 10 คอลเลกชันธีมสี
              </button>
              <button
                onClick={() => setActiveSubTab('styles')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'styles'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                💎 6 สไตล์พื้นผิวการ์ด
              </button>
            </div>

            {onOpenFullSettings && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFullSettings();
                }}
                className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sliders size={13} />
                <span className="hidden sm:inline">สตูดิโอปรับแต่งแบบละเอียด</span>
              </button>
            )}
          </div>

          {/* Modal Content Scroll Area */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {activeSubTab === 'themes' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {SOM_THEMES.map((theme) => {
                  const isSelected = designConfig.themeId === theme.id;

                  return (
                    <button
                      key={theme.id}
                      onClick={() => setThemePreset(theme.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all text-left flex items-center justify-between cursor-pointer group ${
                        isSelected
                          ? 'border-brand bg-brand-soft/20 shadow-md ring-1 ring-brand/30'
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-9 h-9 rounded-xl shadow-sm border-2 border-white dark:border-slate-800 flex items-center justify-center shrink-0"
                          style={{ backgroundColor: theme.colors.primary }}
                        >
                          {isSelected && <Check size={16} className="text-white font-black" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                              {theme.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-bold">
                              {theme.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                            {theme.tagline}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white"
                          style={{ backgroundColor: theme.colors.secondary }}
                        />
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {SOM_VISUAL_STYLES.map((style) => {
                  const isSelected = designConfig.visualStyle === style.id;

                  return (
                    <button
                      key={style.id}
                      onClick={() => setVisualStyle(style.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between space-y-2 cursor-pointer group ${
                        isSelected
                          ? 'border-brand bg-brand-soft/20 shadow-md ring-1 ring-brand/30'
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                          {style.name}
                        </span>
                        {isSelected && (
                          <span className="text-brand font-black text-[10px] flex items-center gap-1 bg-brand-soft px-2 py-0.5 rounded-md">
                            <Check size={12} /> กำลังใช้
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {style.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-[11px] text-slate-400 font-medium">
              ธีมปัจจุบัน: <strong className="text-brand uppercase">{designConfig.themeId}</strong> • สไตล์: <strong className="text-brand uppercase">{designConfig.visualStyle}</strong>
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              เสร็จสิ้น
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
