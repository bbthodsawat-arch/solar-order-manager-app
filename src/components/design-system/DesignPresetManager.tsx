import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Palette, 
  Check, 
  Plus, 
  Trash2, 
  Bookmark, 
  Layers, 
  SlidersHorizontal, 
  CheckCircle2, 
  Sun, 
  Zap, 
  Type, 
  ShieldCheck, 
  RotateCcw,
  Star,
  Copy
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { soundFeedback } from '../../utils/feedback';
import { useDesignSystem } from '../../hooks/useDesignSystem';
import { BUILTIN_DESIGN_PRESETS } from '../../lib/designSystemPresets';
import { DesignPresetDefinition } from '../../types/designSystem';

const USER_PRESETS_STORAGE_KEY = 'som_user_design_presets_v1';

export const DesignPresetManager: React.FC = () => {
  const {
    designConfig,
    setThemePreset,
    setVisualStyle,
    updateTokens,
    resetToDefaults
  } = useDesignSystem();

  const [userPresets, setUserPresets] = useState<DesignPresetDefinition[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(USER_PRESETS_STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (err) {
        console.error('Error loading custom design presets:', err);
      }
    }
    return [];
  });

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [presetTaglineInput, setPresetTaglineInput] = useState('');
  const [presetDescInput, setPresetDescInput] = useState('');

  // Persist custom user presets
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(USER_PRESETS_STORAGE_KEY, JSON.stringify(userPresets));
      } catch (err) {
        console.error('Error saving custom design presets:', err);
      }
    }
  }, [userPresets]);

  // Apply a preset (1-Click Application)
  const handleApplyPreset = (preset: DesignPresetDefinition) => {
    soundFeedback.click();
    const c = preset.config;

    // Apply theme
    setThemePreset(c.themeId);
    // Apply visual style
    setVisualStyle(c.visualStyle);

    // Apply token overrides
    updateTokens({
      density: c.density,
      radius: c.radius,
      shadow: c.shadow,
      font: c.font,
      borderStyle: c.borderStyle || 'subtle',
      primaryColor: c.primaryColor || preset.colors.primary,
      secondaryColor: c.secondaryColor || preset.colors.secondary,
      accentColor: c.accentColor || preset.colors.accent
    });

    toast.success(`เปิดใช้งานพรีเซ็ตดีไซน์: "${preset.nameThai || preset.name}" เรียบร้อยแล้ว`, {
      icon: '🎨',
      id: 'apply-preset-toast'
    });
  };

  // Save current active design as a custom preset
  const handleSaveCurrentAsPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetNameInput.trim()) {
      toast.error('กรุณาระบุชื่อพรีเซ็ต');
      return;
    }

    soundFeedback.click();

    const newPreset: DesignPresetDefinition = {
      id: `custom-preset-${Date.now()}`,
      name: presetNameInput.trim(),
      nameThai: presetNameInput.trim(),
      tagline: presetTaglineInput.trim() || 'พรีเซ็ตกำหนดเองโดยผู้ใช้',
      description: presetDescInput.trim() || `บันทึกเมื่อ ${new Date().toLocaleDateString('th-TH')}`,
      badge: 'พรีเซ็ตของคุณ',
      category: 'Custom',
      gradient: 'from-brand via-indigo-600 to-purple-600',
      colors: {
        primary: designConfig.primaryColor,
        secondary: designConfig.secondaryColor,
        accent: designConfig.accentColor
      },
      config: {
        themeId: designConfig.themeId,
        visualStyle: designConfig.visualStyle,
        density: designConfig.density,
        radius: designConfig.radius,
        shadow: designConfig.shadow,
        font: designConfig.font,
        borderStyle: designConfig.borderStyle,
        primaryColor: designConfig.primaryColor,
        secondaryColor: designConfig.secondaryColor,
        accentColor: designConfig.accentColor
      }
    };

    setUserPresets(prev => [newPreset, ...prev]);
    setIsSaveModalOpen(false);
    setPresetNameInput('');
    setPresetTaglineInput('');
    setPresetDescInput('');

    toast.success(`บันทึกพรีเซ็ต "${newPreset.name}" เรียบร้อยแล้ว`, {
      icon: '⭐'
    });
  };

  // Delete a custom user preset
  const handleDeleteUserPreset = (id: string, name: string) => {
    soundFeedback.click();
    if (confirm(`ต้องการลบพรีเซ็ต "${name}" ใช่หรือไม่?`)) {
      setUserPresets(prev => prev.filter(p => p.id !== id));
      toast.success(`ลบพรีเซ็ต "${name}" เรียบร้อยแล้ว`);
    }
  };

  // Helper to check if a preset is currently active
  const isPresetActive = (preset: DesignPresetDefinition) => {
    const c = preset.config;
    return (
      designConfig.themeId === c.themeId &&
      designConfig.visualStyle === c.visualStyle &&
      designConfig.density === c.density &&
      designConfig.radius === c.radius &&
      designConfig.font === c.font
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden shadow-lg border border-indigo-900/40">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-brand/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-black bg-white/10 text-brand-soft border border-white/10 backdrop-blur-md">
              <Sparkles size={14} className="text-amber-400" />
              <span>DESIGN PRESETS ENGINE (Theme + Style + Density)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              ชุดพรีเซ็ตดีไซน์สำเร็จรูป (Design Presets System)
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              สลับธีมสี, สไตล์มิติการ์ด, ความหนาแน่นของเลย์เอาต์ (Density), ฟอนต์ และมุมมนได้ภายในคลิกเดียวตามมาตรฐาน Visual Design System หรือบันทึกพรีเซ็ตส่วนตัวเพื่อเปิดใช้งานด่วนได้ทันที
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                soundFeedback.click();
                setIsSaveModalOpen(true);
              }}
              className="px-4 py-3 rounded-2xl bg-brand hover:bg-brand/90 text-white text-xs font-black shadow-md active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>บันทึกดีไซน์ปัจจุบันเป็นพรีเซ็ต</span>
            </button>

            <button
              onClick={() => {
                soundFeedback.click();
                if (confirm('ต้องการคืนค่าดีไซน์และโทเค็นเริ่มต้นทั้งหมดใช่หรือไม่?')) {
                  resetToDefaults();
                }
              }}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black border border-white/20 shadow-md active:scale-95 transition-all cursor-pointer"
              title="คืนค่าเริ่มต้น"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* User Custom Presets Section */}
      {userPresets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark size={18} className="text-brand" />
              <span>พรีเซ็ตส่วนตัวของคุณ ({userPresets.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-bold">บันทึกโดยผู้ใช้</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPresets.map(preset => {
              const active = isPresetActive(preset);

              return (
                <div
                  key={preset.id}
                  className={`p-5 rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                    active
                      ? 'bg-white dark:bg-slate-900 border-brand shadow-md ring-2 ring-brand/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand/50'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0"
                          style={{ backgroundColor: preset.colors.primary }}
                        >
                          <Star size={16} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            {preset.badge}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                            {preset.name}
                          </h4>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteUserPreset(preset.id, preset.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
                        title="ลบพรีเซ็ตนี้"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 my-2">
                      {preset.description}
                    </p>

                    {/* Color Swatch & Configuration Badges */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl my-3 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.colors.primary }} title="Primary Color" />
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.colors.secondary }} title="Secondary Color" />
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.colors.accent }} title="Accent Color" />
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="uppercase font-mono">{preset.config.density}</span>
                        <span>•</span>
                        <span className="capitalize">{preset.config.font}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className={`w-full py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      active
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-brand text-white hover:bg-brand/90 shadow-sm active:scale-95'
                    }`}
                  >
                    {active ? (
                      <>
                        <Check size={14} />
                        <span>กำลังเปิดใช้งานอยู่</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>สลับใช้พรีเซ็ตนี้ (Apply 1-Click)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Built-in Official Presets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Palette size={18} className="text-brand" />
            <span>คอลเลกชันพรีเซ็ตทางการ (Official Curated Design Presets)</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-bold">
            {BUILTIN_DESIGN_PRESETS.length} พรีเซ็ตมาตรฐาน
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {BUILTIN_DESIGN_PRESETS.map(preset => {
            const active = isPresetActive(preset);

            return (
              <motion.div
                key={preset.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                className={`p-5 rounded-3xl border-2 flex flex-col justify-between transition-all relative overflow-hidden ${
                  active
                    ? 'bg-white dark:bg-slate-900 border-brand shadow-md ring-2 ring-brand/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                }`}
              >
                <div>
                  {/* Top Bar Accent */}
                  <div className={`h-2 -mx-5 -mt-5 mb-4 bg-gradient-to-r ${preset.gradient}`} />

                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-brand-soft text-brand">
                        {preset.badge}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                        {preset.nameThai}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold block truncate">
                        {preset.tagline}
                      </span>
                    </div>

                    {active && (
                      <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                        <CheckCircle2 size={16} />
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed my-2 line-clamp-3">
                    {preset.description}
                  </p>

                  {/* Visual Features Chips */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 my-3 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      <span>โทนสีหลัก:</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-3.5 h-3.5 rounded-full shadow-2xs" style={{ backgroundColor: preset.colors.primary }} />
                        <span className="w-3.5 h-3.5 rounded-full shadow-2xs" style={{ backgroundColor: preset.colors.secondary }} />
                        <span className="w-3.5 h-3.5 rounded-full shadow-2xs" style={{ backgroundColor: preset.colors.accent }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <div>สไตล์: <span className="text-slate-900 dark:text-white capitalize">{preset.config.visualStyle}</span></div>
                      <div>ความแน่น: <span className="text-slate-900 dark:text-white uppercase">{preset.config.density}</span></div>
                      <div>ฟอนต์: <span className="text-slate-900 dark:text-white capitalize">{preset.config.font}</span></div>
                      <div>มุมมน: <span className="text-slate-900 dark:text-white">{preset.config.radius}</span></div>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => handleApplyPreset(preset)}
                  className={`w-full py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs ${
                    active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-brand dark:hover:bg-brand dark:hover:text-white active:scale-95'
                  }`}
                >
                  {active ? (
                    <>
                      <Check size={14} />
                      <span>เปิดใช้งานอยู่ (Active)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>สลับใช้อย่างรวดเร็ว (1-Click Apply)</span>
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Save Custom Preset Modal */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-brand text-white rounded-2xl shadow-sm">
                  <Bookmark size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    บันทึกชุดดีไซน์ส่วนตัว
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    บันทึกธีม + สไตล์ + ความหนาแน่น + โทเค็นปัจจุบันไว้ใช้งานวันหลัง
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveCurrentAsPreset} className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    ชื่อพรีเซ็ต *
                  </label>
                  <input
                    type="text"
                    required
                    value={presetNameInput}
                    onChange={(e) => setPresetNameInput(e.target.value)}
                    placeholder="เช่น ธีมร้านสาขาใหญ่, โหมดทำงานกลางวัน..."
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    คำเปรียบเปรยสั้นๆ (Tagline)
                  </label>
                  <input
                    type="text"
                    value={presetTaglineInput}
                    onChange={(e) => setPresetTaglineInput(e.target.value)}
                    placeholder="เช่น ส้มสดใส อ่านง่าย สไตล์โมเดิร์น"
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    คำอธิบายรายละเอียด
                  </label>
                  <textarea
                    rows={2}
                    value={presetDescInput}
                    onChange={(e) => setPresetDescInput(e.target.value)}
                    placeholder="รายละเอียดเพิ่มเติมสำหรับการตั้งค่าพรีเซ็ตนี้..."
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand outline-none font-medium"
                  />
                </div>

                {/* Summary Preview Box */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1 text-[11px]">
                  <span className="font-extrabold text-slate-500">จะบันทึกค่าปัจจุบัน:</span>
                  <div className="grid grid-cols-2 gap-1 font-bold text-slate-800 dark:text-slate-200">
                    <div>ธีม: <span className="text-brand">{designConfig.themeId}</span></div>
                    <div>สไตล์: <span className="text-brand">{designConfig.visualStyle}</span></div>
                    <div>ความหนาแน่น: <span className="text-brand">{designConfig.density}</span></div>
                    <div>ฟอนต์: <span className="text-brand">{designConfig.font}</span></div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSaveModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-black bg-brand text-white rounded-2xl shadow-sm hover:bg-brand/90 transition-all cursor-pointer"
                  >
                    บันทึกพรีเซ็ต
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
