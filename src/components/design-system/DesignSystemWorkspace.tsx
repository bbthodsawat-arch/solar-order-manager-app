import React, { useState } from 'react';
import { useDesignSystem } from '../../hooks/useDesignSystem';
import { ThemeSelectorGrid } from './ThemeSelectorGrid';
import { VisualStyleSelector } from './VisualStyleSelector';
import { TokenEngineControls } from './TokenEngineControls';
import { WidgetGallery } from './WidgetGallery';
import { DesignPresetManager } from './DesignPresetManager';
import { ThemeImportExportModal } from './ThemeImportExportModal';
import { 
  Palette, 
  Sparkles, 
  Sliders, 
  LayoutGrid, 
  FileCode, 
  RotateCcw, 
  Check, 
  Layers, 
  Eye, 
  TrendingUp, 
  ShieldCheck, 
  Package, 
  ArrowUpRight,
  Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DesignSystemWorkspace: React.FC = () => {
  const {
    designConfig,
    setThemePreset,
    setVisualStyle,
    updateTokens,
    resetToDefaults,
    themes,
    visualStyles
  } = useDesignSystem();

  const [activeTab, setActiveTab] = useState<'presets' | 'themes' | 'styles' | 'tokens' | 'widgets'>('presets');
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  const currentTheme = themes.find(t => t.id === designConfig.themeId) || themes[0];
  const currentStyle = visualStyles.find(s => s.id === designConfig.visualStyle) || visualStyles[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Master Header & Status Ribbon */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-brand-soft/50 via-white to-slate-50 dark:from-brand-soft/20 dark:via-slate-900 dark:to-slate-950 border border-brand/20 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-brand text-white rounded-2xl shadow-md shrink-0">
              <Palette size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  SOM Visual Design Customization System
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-brand text-white text-[10px] font-black uppercase tracking-wider">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ระบบปรับแต่งดีไซน์สมบูรณ์แบบ: พรีเซ็ตสำเร็จรูป + 10 ธีมพรีเมียม + 6 สไตล์การ์ด + ปรับแต่งโทเค็น & วิดเจ็ต
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center space-x-2 self-start md:self-auto">
            <button
              onClick={() => setIsImportExportOpen(true)}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <FileCode size={14} className="text-brand" />
              <span>นำเข้า / ส่งออก JSON</span>
            </button>

            <button
              onClick={() => {
                if (confirm('ต้องการคืนค่าการตั้งค่าดีไซน์และโทเค็นทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?')) {
                  resetToDefaults();
                }
              }}
              className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="คืนค่าดีไซน์เริ่มต้น"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Current Active Configuration Bar */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-extrabold text-slate-500 dark:text-slate-400">สถานะปัจจุบัน:</span>
          
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs font-bold text-slate-800 dark:text-slate-200">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: designConfig.primaryColor }}
            />
            <span>ธีม: {currentTheme?.name || designConfig.themeId}</span>
          </div>

          <div className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs font-bold text-slate-800 dark:text-slate-200">
            <Layers size={13} className="text-brand" />
            <span>สไตล์: {currentStyle?.name || designConfig.visualStyle}</span>
          </div>

          <div className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs font-bold text-slate-800 dark:text-slate-200">
            <span>มุมมน: {designConfig.radius}</span>
          </div>

          <div className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs font-bold text-slate-800 dark:text-slate-200">
            <span>ฟอนต์: {designConfig.font}</span>
          </div>

          <div className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs font-bold text-slate-800 dark:text-slate-200">
            <span>ความหนาแน่น: {designConfig.density}</span>
          </div>
        </div>
      </div>

      {/* 2. Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'presets'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bookmark size={15} className={activeTab === 'presets' ? 'text-brand' : ''} />
          <span>1. พรีเซ็ตสำเร็จรูป (Design Presets)</span>
        </button>

        <button
          onClick={() => setActiveTab('themes')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'themes'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Palette size={15} className={activeTab === 'themes' ? 'text-brand' : ''} />
          <span>2. 10 ธีมสี (Themes)</span>
        </button>

        <button
          onClick={() => setActiveTab('styles')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'styles'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles size={15} className={activeTab === 'styles' ? 'text-brand' : ''} />
          <span>3. สไตล์มิติการ์ด (Visual Styles)</span>
        </button>

        <button
          onClick={() => setActiveTab('tokens')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tokens'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders size={15} className={activeTab === 'tokens' ? 'text-brand' : ''} />
          <span>4. สตูดิโอโทเค็น & ฟอนต์ (Token Studio)</span>
        </button>

        <button
          onClick={() => setActiveTab('widgets')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'widgets'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutGrid size={15} className={activeTab === 'widgets' ? 'text-brand' : ''} />
          <span>5. แดชบอร์ด & วิดเจ็ต (Layouts & Widgets)</span>
        </button>
      </div>

      {/* 3. Active Tab Content Pane */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <AnimatePresence mode="wait">
          {activeTab === 'presets' && (
            <motion.div
              key="presets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DesignPresetManager />
            </motion.div>
          )}

          {activeTab === 'themes' && (
            <motion.div
              key="themes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ThemeSelectorGrid
                currentThemeId={designConfig.themeId}
                onSelectTheme={setThemePreset}
              />
            </motion.div>
          )}

          {activeTab === 'styles' && (
            <motion.div
              key="styles"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <VisualStyleSelector
                currentStyleId={designConfig.visualStyle}
                onSelectStyle={setVisualStyle}
              />
            </motion.div>
          )}

          {activeTab === 'tokens' && (
            <motion.div
              key="tokens"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TokenEngineControls
                config={designConfig}
                onUpdateTokens={updateTokens}
                onResetToDefaults={resetToDefaults}
              />
            </motion.div>
          )}

          {activeTab === 'widgets' && (
            <motion.div
              key="widgets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <WidgetGallery />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Live Interactive SOM Component Test Bench */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
            <Eye size={14} className="text-brand" />
            <span>ตัวอย่างองค์ประกอบจริงตามค่าดีไซน์ปัจจุบัน (Live SOM Test Bench)</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono font-bold">
            Real-time Design Tokens
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sample Card 1: Revenue KPI */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>รายรับรวมวันนี้</span>
              <div className="p-1.5 rounded-lg bg-brand-soft text-brand">
                <TrendingUp size={14} />
              </div>
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white">฿185,400</p>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight size={12} /> +18.5% จากเป้าหมาย
            </span>
          </div>

          {/* Sample Card 2: Solar Package */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>ชุดโซล่าเซลล์ขายดี</span>
              <div className="p-1.5 rounded-lg bg-brand-soft text-brand">
                <Package size={14} />
              </div>
            </div>
            <p className="text-base font-black text-slate-900 dark:text-white truncate">ชุด 5kW Hybrid On/Off</p>
            <span className="text-[10px] font-bold text-brand bg-brand-soft px-2 py-0.5 rounded-md inline-block">
              ยอดนิยมประจำเดือน
            </span>
          </div>

          {/* Sample Card 3: Interactive Buttons */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">ปุ่มคำสั่งหลัก & รอง</span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 bg-brand text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-90 transition-opacity">
                ปุ่มหลัก (Primary)
              </button>
              <button className="px-3 py-2 bg-brand-soft text-brand rounded-xl text-xs font-bold hover:bg-brand/20 transition-colors">
                ปุ่มรอง
              </button>
            </div>
          </div>

          {/* Sample Card 4: Form Input Sample */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">ช่องกรอกข้อมูล & แท็ก</span>
            <input
              type="text"
              defaultValue="ร้านกลางนาโซล่าเซลล์"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand outline-none font-bold"
            />
          </div>
        </div>
      </div>

      {/* Import/Export Modal */}
      <ThemeImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
      />
    </div>
  );
};
