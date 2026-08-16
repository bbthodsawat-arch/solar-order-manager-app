import React from 'react';
import { 
  DesignSystemConfig, 
  RadiusToken, 
  ShadowToken, 
  FontToken, 
  DensityToken, 
  BorderStyleToken, 
  AnimationSpeedToken 
} from '../../types/designSystem';
import { 
  RADIUS_TOKENS, 
  SHADOW_TOKENS, 
  FONT_TOKENS, 
  DENSITY_TOKENS, 
  BORDER_TOKENS 
} from '../../lib/designSystemPresets';
import { 
  Sliders, 
  Type, 
  Maximize2, 
  Sparkles, 
  Box, 
  Palette, 
  Layers, 
  CornerDownRight, 
  Check, 
  Zap,
  RotateCcw
} from 'lucide-react';

interface TokenEngineControlsProps {
  config: DesignSystemConfig;
  onUpdateTokens: (partial: Partial<DesignSystemConfig>) => void;
  onResetToDefaults: () => void;
}

export const TokenEngineControls: React.FC<TokenEngineControlsProps> = ({
  config,
  onUpdateTokens,
  onResetToDefaults,
}) => {
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders size={20} className="text-brand" />
            <span>⚙️ สตูดิโอกำหนดค่าดีไซน์โทเค็น (Design Token Studio)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ปรับแต่งสัดส่วนมุมมน (Radius) เงา (Shadows) ฟอนต์ภาษาไทย (Typography) ความหนาแน่น (Density) และสีเฉพาะตัว
          </p>
        </div>

        <button
          onClick={onResetToDefaults}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw size={13} />
          <span>คืนค่าเริ่มต้นโทเค็น</span>
        </button>
      </div>

      {/* 1. Custom Brand Colors */}
      <div className="bg-slate-50/70 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-brand-soft text-brand rounded-xl border border-brand-soft">
            <Palette size={16} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              1. โทนสีแบรนด์และสีเน้น (Custom Hex Brand Colors)
            </h4>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              กำหนดรหัสสี HEX แบบแม่นยำสำหรับการ์ด ปุ่ม กราฟ และองค์ประกอบทั้งหมด
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Primary Color Picker */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>สีหลัก (Primary)</span>
              <span className="font-mono text-[10px] text-slate-400 font-extrabold">{config.primaryColor}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative w-11 h-11 rounded-xl shadow-inner overflow-hidden border-2 border-slate-200 dark:border-slate-700 shrink-0">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => onUpdateTokens({ primaryColor: e.target.value })}
                  className="absolute -top-4 -left-4 w-20 h-20 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={config.primaryColor}
                onChange={(e) => onUpdateTokens({ primaryColor: e.target.value })}
                maxLength={7}
                className="w-full uppercase text-xs font-black px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand outline-none font-mono"
              />
            </div>
          </div>

          {/* Secondary Color Picker */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>สีรอง (Secondary)</span>
              <span className="font-mono text-[10px] text-slate-400 font-extrabold">{config.secondaryColor}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative w-11 h-11 rounded-xl shadow-inner overflow-hidden border-2 border-slate-200 dark:border-slate-700 shrink-0">
                <input
                  type="color"
                  value={config.secondaryColor}
                  onChange={(e) => onUpdateTokens({ secondaryColor: e.target.value })}
                  className="absolute -top-4 -left-4 w-20 h-20 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={config.secondaryColor}
                onChange={(e) => onUpdateTokens({ secondaryColor: e.target.value })}
                maxLength={7}
                className="w-full uppercase text-xs font-black px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand outline-none font-mono"
              />
            </div>
          </div>

          {/* Accent Color Picker */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>สีไฮไลต์ (Accent)</span>
              <span className="font-mono text-[10px] text-slate-400 font-extrabold">{config.accentColor}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative w-11 h-11 rounded-xl shadow-inner overflow-hidden border-2 border-slate-200 dark:border-slate-700 shrink-0">
                <input
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => onUpdateTokens({ accentColor: e.target.value })}
                  className="absolute -top-4 -left-4 w-20 h-20 cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={config.accentColor}
                onChange={(e) => onUpdateTokens({ accentColor: e.target.value })}
                maxLength={7}
                className="w-full uppercase text-xs font-black px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand outline-none font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Corner Radius Tokens */}
      <div className="bg-slate-50/70 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <Maximize2 size={16} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              2. ความโค้งมนของขอบมุมการ์ดและปุ่ม (Corner Radius Tokens)
            </h4>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              ควบคุมรัศมีความโค้งมนของคอนเทนเนอร์ ปุ่ม และกล่องข้อมูล
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
          {RADIUS_TOKENS.map((token) => {
            const isSelected = config.radius === token.id;

            return (
              <button
                key={token.id}
                onClick={() => onUpdateTokens({ radius: token.id })}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-between space-y-2 cursor-pointer ${
                  isSelected
                    ? 'border-brand bg-white dark:bg-slate-900 shadow-md ring-1 ring-brand/30 scale-[1.03]'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-slate-300'
                }`}
              >
                {/* Visual Box Preview */}
                <div
                  className={`w-10 h-10 border-2 border-brand bg-brand-soft flex items-center justify-center transition-all ${token.previewClass}`}
                >
                  {isSelected && <Check size={14} className="text-brand font-black" />}
                </div>

                <div className="text-center">
                  <span className="text-xs font-black block text-slate-800 dark:text-slate-200">
                    {token.px}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 block truncate">
                    {token.label.split('(')[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Thai Typography Engine */}
      <div className="bg-slate-50/70 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <Type size={16} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              3. ฟอนต์ภาษาไทยและเอกลักษณ์ตัวอักษร (Thai Typography Engine)
            </h4>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              เลือกชุดแบบอักษรภาษาไทยที่เข้ากับภาพลักษณ์องค์กรของคุณ
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {FONT_TOKENS.map((font) => {
            const isSelected = config.font === font.id;

            return (
              <button
                key={font.id}
                onClick={() => onUpdateTokens({ font: font.id })}
                className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer ${
                  isSelected
                    ? 'border-brand bg-white dark:bg-slate-900 shadow-md ring-1 ring-brand/30 scale-[1.02]'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {font.name}
                  </span>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-md bg-brand text-white text-[10px] font-black">
                      Active
                    </span>
                  )}
                </div>

                {/* Live Thai Preview Sentence */}
                <div
                  className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
                  style={{ fontFamily: font.cssFont }}
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                    ระบบบริหารโซล่าเซลล์ ฿128,500
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    ทดสอบตัวอักษรภาษาไทย 0123456789
                  </p>
                </div>

                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 line-clamp-1">
                  {font.labelThai}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Shadow & Elevation Tokens */}
      <div className="bg-slate-50/70 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-200 dark:border-purple-800">
            <Layers size={16} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              4. ระดับความลึกและเงาการ์ด (Shadow & Elevation Tokens)
            </h4>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              ควบคุมระดับความลึกของเงาตกกระทบและเอฟเฟกต์เรืองแสง (Glow)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {SHADOW_TOKENS.map((shadow) => {
            const isSelected = config.shadow === shadow.id;

            return (
              <button
                key={shadow.id}
                onClick={() => onUpdateTokens({ shadow: shadow.id })}
                className={`p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between space-y-2 cursor-pointer ${
                  isSelected
                    ? 'border-brand bg-white dark:bg-slate-900 shadow-md ring-1 ring-brand/30'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {shadow.label.split('(')[0]}
                  </span>
                  {isSelected && <Check size={14} className="text-brand font-black" />}
                </div>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                  {shadow.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Border Style Tokens & Display Density */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Border Styles */}
        <div className="bg-slate-50/70 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Box size={16} className="text-brand" />
            <span>5. รูปแบบเส้นขอบการ์ด (Card Border Styles)</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {BORDER_TOKENS.map((border) => {
              const isSelected = config.borderStyle === border.id;

              return (
                <button
                  key={border.id}
                  onClick={() => onUpdateTokens({ borderStyle: border.id })}
                  className={`p-3 rounded-2xl border-2 transition-all text-center text-xs font-black cursor-pointer ${
                    isSelected
                      ? 'border-brand bg-brand-soft text-brand shadow-xs ring-1 ring-brand/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {border.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Display Density */}
        <div className="bg-slate-50/70 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Zap size={16} className="text-brand" />
            <span>6. ความหนาแน่นของหน้าจอ (Display Density)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DENSITY_TOKENS.map((density) => {
              const isSelected = config.density === density.id;

              return (
                <button
                  key={density.id}
                  onClick={() => onUpdateTokens({ density: density.id })}
                  className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between space-y-1 cursor-pointer ${
                    isSelected
                      ? 'border-brand bg-white dark:bg-slate-900 shadow-xs ring-1 ring-brand/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {density.label.split('(')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium line-clamp-2">
                    {density.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
