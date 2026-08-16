import React, { useState } from 'react';
import { Palette, Check, Sparkles, Sliders, Layers, Sun, Moon, Wand2, RefreshCw, Eye } from 'lucide-react';
import { AppThemeConfig } from '../types';
import { useTheme } from '../hooks/useTheme';
import toast from 'react-hot-toast';

interface ThemeSettingsProps {
  currentTheme?: AppThemeConfig;
  onUpdateTheme: (theme: AppThemeConfig) => void;
}

export interface ColorPalettePreset {
  id: string;
  name: string;
  label: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  gradientClass: string;
  badge: string;
  tagline: string;
}

export const COLOR_PALETTES: ColorPalettePreset[] = [
  {
    id: 'ocean',
    name: 'ocean',
    label: 'Ocean Blue (ฟ้ามหาสมุทร)',
    description: 'โทนสีน้ำเงินครามผสมฟ้าไซแอน เยือกเย็น มั่นคง และน่าเชื่อถือ',
    primaryColor: '#2563eb',
    secondaryColor: '#06b6d4',
    gradientClass: 'from-blue-600 via-blue-500 to-cyan-500',
    badge: 'ยอดนิยม',
    tagline: 'Deep Ocean & Clean Cyan'
  },
  {
    id: 'sunset',
    name: 'sunset',
    label: 'Sunset Glow (สายัณห์อุ่น)',
    description: 'โทนสีส้มแสดอบอุ่นผสมสีทองอมชมพู สดใส และเต็มไปด้วยพลังงาน',
    primaryColor: '#f43f5e',
    secondaryColor: '#f59e0b',
    gradientClass: 'from-rose-500 via-amber-500 to-orange-500',
    badge: 'อบอุ่นสดใส',
    tagline: 'Warm Sunset & Coral'
  },
  {
    id: 'forest',
    name: 'forest',
    label: 'Forest Solar (ป่ามรกตโซล่า)',
    description: 'โทนสีเขียวมรกตผสมมิ้นต์ธรรมชาติ สะท้อนถึงพลังงานสะอาด รักษ์โลก',
    primaryColor: '#10b981',
    secondaryColor: '#14b8a6',
    gradientClass: 'from-emerald-600 via-emerald-500 to-teal-500',
    badge: 'พลังงานสะอาด',
    tagline: 'Emerald & Clean Mint'
  },
  {
    id: 'solargold',
    name: 'solargold',
    label: 'Solar Spark (พลังงานแสงอาทิตย์)',
    description: 'โทนสีทองสว่างผสานส้มสดใส โดดเด่น เปล่งประกายดุจแสงอาทิตย์',
    primaryColor: '#d97706',
    secondaryColor: '#eab308',
    gradientClass: 'from-amber-600 via-amber-500 to-yellow-500',
    badge: 'โซล่าเซลล์',
    tagline: 'Golden Rays & Solar'
  },
  {
    id: 'royalviolet',
    name: 'royalviolet',
    label: 'Royal Violet (ลาเวนเดอร์พรีเมียม)',
    description: 'โทนสีม่วงเข้มสไตล์ลักชัวรี่ผสมชมพูฟูเชีย หรูหรา ทันสมัย',
    primaryColor: '#8b5cf6',
    secondaryColor: '#d946ef',
    gradientClass: 'from-violet-600 via-purple-500 to-fuchsia-500',
    badge: 'หรูหรา',
    tagline: 'Luxury Violet & Fuchsia'
  },
  {
    id: 'midnight',
    name: 'midnight',
    label: 'Midnight Cyber (ไนท์ไซเบอร์)',
    description: 'โทนสีอินดิโก้ผสมม่วงไฮเทค คอนทราสต์คมชัด ล้ำสมัยสไตล์ดิจิทัล',
    primaryColor: '#6366f1',
    secondaryColor: '#a855f7',
    gradientClass: 'from-indigo-600 via-indigo-500 to-purple-600',
    badge: 'ล้ำสมัย',
    tagline: 'Electric Indigo & Purple'
  },
  {
    id: 'modernslate',
    name: 'modernslate',
    label: 'Modern Slate (เทาสุขุมมินิมอล)',
    description: 'โทนสีเทาเข้มมินิมอล เรียบง่าย สบายตา เหมาะสำหรับใช้งานต่อเนื่อง',
    primaryColor: '#475569',
    secondaryColor: '#64748b',
    gradientClass: 'from-slate-700 via-slate-600 to-zinc-500',
    badge: 'มินิมอล',
    tagline: 'Cool Slate & Minimalist'
  },
  {
    id: 'nordiccyan',
    name: 'nordiccyan',
    label: 'Nordic Cyan (ไซแอนนอร์ดิค)',
    description: 'โทนสีฟ้าไซแอนใสผสมเขียวน้ำทะเล ปลอดโปร่ง บรรยากาศธรรมชาติ',
    primaryColor: '#0ea5e9',
    secondaryColor: '#0d9488',
    gradientClass: 'from-sky-500 via-cyan-500 to-teal-600',
    badge: 'สบายตา',
    tagline: 'Nordic Sky & Teal'
  }
];

const SINGLE_ACCENTS = [
  { name: 'blue', color: '#3b82f6', label: 'ฟ้าคราม (Sky Blue)' },
  { name: 'emerald', color: '#10b981', label: 'เขียวมรกต (Emerald)' },
  { name: 'rose', color: '#f43f5e', label: 'กุหลาบหวาน (Rose)' },
  { name: 'amber', color: '#f59e0b', label: 'ทองอำพัน (Amber)' },
  { name: 'violet', color: '#8b5cf6', label: 'ม่วงลาเวนเดอร์ (Violet)' },
  { name: 'sky', color: '#0ea5e9', label: 'ฟ้าสดใส (Cyan Sky)' },
  { name: 'orange', color: '#f97316', label: 'ส้มพีช (Peach Orange)' },
  { name: 'slate', color: '#475569', label: 'เทาสุขุม (Modern Slate)' },
];

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ currentTheme, onUpdateTheme }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'palettes' | 'accents' | 'custom'>('palettes');

  const activePrimary = currentTheme?.primaryColor || '#3b82f6';
  const activeSecondary = currentTheme?.secondaryColor || activePrimary;
  const activeAccentName = currentTheme?.accentName || 'blue';

  const handleApplyPalette = (palette: ColorPalettePreset) => {
    onUpdateTheme({
      primaryColor: palette.primaryColor,
      secondaryColor: palette.secondaryColor,
      accentName: palette.id,
      paletteName: palette.label
    });
    toast.success(`เปลี่ยนธีมสีเป็น "${palette.label}" เรียบร้อยแล้ว`, { id: 'theme-change-toast' });
  };

  const handleApplySingleAccent = (accent: typeof SINGLE_ACCENTS[0]) => {
    onUpdateTheme({
      primaryColor: accent.color,
      secondaryColor: accent.color,
      accentName: accent.name,
      paletteName: accent.label
    });
    toast.success(`เปลี่ยนธีมสีเน้นเป็น "${accent.label}" เรียบร้อยแล้ว`, { id: 'theme-change-toast' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in transition-all">
      {/* Top Banner Header & Light/Dark Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="p-3 bg-brand-soft text-brand rounded-2xl border border-brand-soft shrink-0">
            <Palette size={22} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                สวิทช์ธีมสีระบบและจานสีองค์กร (Color Palette & Theme Switcher)
              </h3>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              เลือกธีมสีพาเลตสำเร็จรูป (Color Palette) สีเน้นเดี่ยว หรือกำหนดสีแบรนด์ด้วยตนเอง
            </p>
          </div>
        </div>

        {/* Light / Dark Mode Toggle */}
        <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 self-start lg:self-auto">
          <button
            onClick={toggleTheme}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              !isDarkMode 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun size={15} className="text-amber-500" />
            <span>โหมดสว่าง (Light)</span>
          </button>

          <button
            onClick={toggleTheme}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              isDarkMode 
                ? 'bg-slate-900 text-white shadow-sm border border-slate-700' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Moon size={15} className="text-purple-400" />
            <span>โหมดมืด (Dark)</span>
          </button>
        </div>
      </div>

      {/* Mode Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('palettes')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'palettes'
              ? 'bg-brand text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles size={15} />
          <span>🎨 ธีมพาเลตสีสำเร็จรูป (Color Palettes)</span>
        </button>

        <button
          onClick={() => setActiveTab('accents')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'accents'
              ? 'bg-brand text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Wand2 size={15} />
          <span>🖌️ โทนสีเน้นเดี่ยว (Single Accents)</span>
        </button>

        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'custom'
              ? 'bg-brand text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders size={15} />
          <span>⚙️ กำหนดรหัสสีด้วยตนเอง (Custom Hex)</span>
        </button>
      </div>

      {/* Tab 1: Predefined Color Palettes Switcher */}
      {activeTab === 'palettes' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              จานสีผสมหลักและสีรอง (Primary & Secondary Palettes) ออกแบบเพื่อความสวยงามและการอ่านข้อมูลที่ชัดเจน:
            </p>
            <span className="text-[10px] font-black uppercase text-brand bg-brand-soft px-2.5 py-1 rounded-full border border-brand-soft">
              {COLOR_PALETTES.length} จานสีพร้อมใช้
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLOR_PALETTES.map((palette) => {
              const isSelected = activeAccentName === palette.id;

              return (
                <button
                  key={palette.id}
                  onClick={() => handleApplyPalette(palette)}
                  className={`group relative rounded-3xl p-4 border-2 transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer overflow-hidden ${
                    isSelected
                      ? 'border-brand bg-white dark:bg-slate-900 shadow-md ring-2 ring-brand/30 scale-[1.02]'
                      : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  {/* Top Gradient Header Preview Strip */}
                  <div className={`h-3.5 w-full rounded-2xl bg-gradient-to-r ${palette.gradientClass} shadow-inner`} />

                  {/* Swatches & Name */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {/* Primary Circle */}
                        <div 
                          className="w-7 h-7 rounded-full shadow-inner border-2 border-white dark:border-slate-800 flex items-center justify-center shrink-0"
                          style={{ backgroundColor: palette.primaryColor }}
                        >
                          {isSelected && <Check size={14} className="text-white font-bold" />}
                        </div>

                        {/* Secondary Overlapping Circle */}
                        <div 
                          className="w-5 h-5 rounded-full shadow-inner border-2 border-white dark:border-slate-800 shrink-0 -ml-3"
                          style={{ backgroundColor: palette.secondaryColor }}
                        />
                      </div>

                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        isSelected 
                          ? 'bg-brand text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {palette.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                        {palette.label}
                      </h4>
                      <p className="text-[10px] font-extrabold text-slate-400 mt-0.5">
                        {palette.tagline}
                      </p>
                    </div>

                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {palette.description}
                    </p>
                  </div>

                  {/* Active Indicator Footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400 font-mono text-[10px]">
                      {palette.primaryColor} • {palette.secondaryColor}
                    </span>

                    <span className={isSelected ? 'text-brand font-black flex items-center' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}>
                      {isSelected ? 'ใช้งานอยู่' : 'เลือกใช้'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Single Accent Swatches */}
      {activeTab === 'accents' && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            เลือกโทนสีเน้นหลักแบบสีเดียวสำหรับการตกแต่งปุ่มและไอคอนในระบบ:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {SINGLE_ACCENTS.map((item) => {
              const isSelected = activeAccentName === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => handleApplySingleAccent(item)}
                  className={`group relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center space-y-2.5 cursor-pointer ${
                    isSelected
                      ? 'border-brand bg-brand-soft/20 dark:bg-slate-800 shadow-md scale-[1.02]'
                      : 'border-slate-200/70 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div 
                    className="w-11 h-11 rounded-2xl shadow-inner flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: item.color }}
                  >
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-md">
                        <Check size={14} className="text-slate-900 dark:text-white font-bold" />
                      </div>
                    )}
                  </div>
                  <span className={`text-[11px] font-black tracking-tight text-center ${
                    isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Custom Hex Color Builder */}
      {activeTab === 'custom' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-slate-200/80 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300">
                <Sliders size={18} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">กำหนดสีแบรนด์องค์กรด้วยตนเอง (Custom Brand Hex)</h4>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  ป้อนรหัสสี HEX แบบเจาะจงเพื่อให้ตรงกับ CI, โลโก้ หรือเอกลักษณ์ของร้านโซล่าเซลล์ของคุณ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Primary Color Picker */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>สีหลัก (Primary Brand Color)</span>
                  <span className="text-[10px] font-mono font-extrabold text-slate-400">{activePrimary}</span>
                </label>
                <div className="flex items-center space-x-3">
                  <div className="relative w-12 h-12 rounded-xl shadow-inner overflow-hidden border-2 border-slate-200 dark:border-slate-700 shrink-0">
                    <input 
                      type="color" 
                      value={activePrimary}
                      onChange={(e) => onUpdateTheme({ primaryColor: e.target.value, secondaryColor: activeSecondary, accentName: 'custom' })}
                      className="absolute -top-4 -left-4 w-20 h-20 cursor-pointer"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={activePrimary}
                    onChange={(e) => onUpdateTheme({ primaryColor: e.target.value, secondaryColor: activeSecondary, accentName: 'custom' })}
                    placeholder="#HEX"
                    maxLength={7}
                    className="flex-1 uppercase text-xs font-black px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
              </div>

              {/* Secondary Color Picker */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>สีรองเน้นความเด่น (Secondary Accent Color)</span>
                  <span className="text-[10px] font-mono font-extrabold text-slate-400">{activeSecondary}</span>
                </label>
                <div className="flex items-center space-x-3">
                  <div className="relative w-12 h-12 rounded-xl shadow-inner overflow-hidden border-2 border-slate-200 dark:border-slate-700 shrink-0">
                    <input 
                      type="color" 
                      value={activeSecondary}
                      onChange={(e) => onUpdateTheme({ primaryColor: activePrimary, secondaryColor: e.target.value, accentName: 'custom' })}
                      className="absolute -top-4 -left-4 w-20 h-20 cursor-pointer"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={activeSecondary}
                    onChange={(e) => onUpdateTheme({ primaryColor: activePrimary, secondaryColor: e.target.value, accentName: 'custom' })}
                    placeholder="#HEX"
                    maxLength={7}
                    className="flex-1 uppercase text-xs font-black px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Interactive UI Preview Box */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-xs" style={{ backgroundColor: activePrimary }} />
              <div className="w-3 h-3 rounded-full border border-white dark:border-slate-800 shadow-xs" style={{ backgroundColor: activeSecondary }} />
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              ตัวอย่างองค์ประกอบ UI เมื่อใช้ธีมสีปัจจุบัน ({currentTheme?.paletteName || currentTheme?.accentName || 'Default'})
            </span>
          </div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center">
            <Eye size={12} className="mr-1" />
            Live Preview
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Sample Button */}
          <button 
            className="w-full py-2.5 px-4 rounded-xl text-white text-xs font-black shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
            style={{ backgroundColor: activePrimary }}
          >
            <Sliders size={14} />
            <span>ปุ่มหลัก (Primary Button)</span>
          </button>

          {/* Sample Badge & Progress */}
          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-center space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-black">
              <span className="text-slate-500">เป้าหมายยอดขายประจำวัน</span>
              <span style={{ color: activePrimary }}>85% Complete</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ 
                  background: activeSecondary && activeSecondary !== activePrimary 
                    ? `linear-gradient(to right, ${activePrimary}, ${activeSecondary})` 
                    : activePrimary 
                }} 
              />
            </div>
          </div>

          {/* Sample Active Card */}
          <div 
            className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold bg-white dark:bg-slate-900"
            style={{ borderColor: activePrimary }}
          >
            <span className="text-slate-700 dark:text-slate-300 font-extrabold">แท็บที่เลือกใช้งาน</span>
            <span 
              className="px-2 py-0.5 rounded-md text-[10px] font-black text-white" 
              style={{ backgroundColor: activeSecondary || activePrimary }}
            >
              Active Badge
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
