import React, { useMemo, useState } from 'react';
import { Check, Palette, Sparkles, Zap } from 'lucide-react';
import { useDesignSystem } from '../../hooks/useDesignSystem';
import type { ThemeId, LayoutPresetId } from '../../types/designSystem';

const LAYOUT_BY_THEME: Record<ThemeId, LayoutPresetId> = {
  'modern-solar': 'operations', 'cute-modern': 'full', 'apple-minimal': 'executive',
  'cyber-neon': 'analytics', 'forest-eco': 'operations', 'royal-luxury': 'executive',
  'sunset-warmth': 'full', 'nordic-frost': 'analytics', 'slate-monochrome': 'operations',
  'midnight-deep': 'executive', custom: 'custom',
};

const TOKEN_OVERRIDES: Partial<Record<ThemeId, Record<string, any>>> = {
  'modern-solar': { shadow: 'medium', borderStyle: 'subtle', animationSpeed: 'smooth', cardBgOpacity: 96, glassBlurPx: 10, enableGlowEffects: false },
  'cute-modern': { shadow: 'soft', borderStyle: 'subtle', animationSpeed: 'smooth', cardBgOpacity: 94, glassBlurPx: 14, enableGlowEffects: true },
  'apple-minimal': { shadow: 'soft', borderStyle: 'subtle', animationSpeed: 'normal', cardBgOpacity: 100, glassBlurPx: 8, enableGlowEffects: false },
  'cyber-neon': { shadow: 'glow', borderStyle: 'glow', animationSpeed: 'smooth', cardBgOpacity: 90, glassBlurPx: 18, enableGlowEffects: true },
  'forest-eco': { shadow: 'medium', borderStyle: 'subtle', animationSpeed: 'normal', cardBgOpacity: 96, glassBlurPx: 10, enableGlowEffects: false },
  'royal-luxury': { shadow: 'deep', borderStyle: 'solid', animationSpeed: 'smooth', cardBgOpacity: 92, glassBlurPx: 16, enableGlowEffects: true },
  'sunset-warmth': { shadow: 'medium', borderStyle: 'subtle', animationSpeed: 'smooth', cardBgOpacity: 94, glassBlurPx: 12, enableGlowEffects: true },
  'nordic-frost': { shadow: 'soft', borderStyle: 'subtle', animationSpeed: 'normal', cardBgOpacity: 96, glassBlurPx: 12, enableGlowEffects: false },
  'slate-monochrome': { shadow: 'soft', borderStyle: 'solid', animationSpeed: 'normal', cardBgOpacity: 100, glassBlurPx: 6, enableGlowEffects: false },
  'midnight-deep': { shadow: 'glow', borderStyle: 'glow', animationSpeed: 'smooth', cardBgOpacity: 90, glassBlurPx: 18, enableGlowEffects: true },
};

export const OneClickDesignGallery: React.FC = () => {
  const { designConfig, themes, setThemePreset, applyLayoutPreset, updateTokens } = useDesignSystem();
  const [applying, setApplying] = useState<ThemeId | null>(null);
  const popularThemes = useMemo(() => themes.slice(0, 10), [themes]);

  const applyOneClick = async (themeId: ThemeId) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme || applying) return;
    setApplying(themeId);
    try {
      setThemePreset(themeId);
      const tokens = TOKEN_OVERRIDES[themeId];
      if (tokens) updateTokens(tokens);
      const layout = LAYOUT_BY_THEME[themeId];
      if (layout && layout !== 'custom') applyLayoutPreset(layout);
    } finally {
      window.setTimeout(() => setApplying(null), 450);
    }
  };

  return (
    <section className="rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-200/70 dark:border-slate-800 bg-gradient-to-br from-brand-soft/60 via-white to-slate-50 dark:from-brand-soft/10 dark:via-slate-900 dark:to-slate-950">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-2xl bg-brand text-white shadow-sm"><Palette size={21} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">One‑Click Design</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand text-white px-2.5 py-1 text-[9px] font-black uppercase"><Zap size={11} /> 1 CLICK</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">เลือกครั้งเดียว ระบบจะปรับธีม สี ฟอนต์ มุมมน เงา Animation และเลย์เอาต์แดชบอร์ดให้เข้าชุดกันทั้งระบบ</p>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {popularThemes.map(theme => {
          const selected = designConfig.themeId === theme.id;
          const busy = applying === theme.id;
          return (
            <button key={theme.id} type="button" disabled={Boolean(applying)} onClick={() => void applyOneClick(theme.id)}
              className={`group relative overflow-hidden text-left rounded-2xl border p-3.5 transition-all active:scale-[0.98] min-h-[142px] ${selected ? 'border-brand ring-2 ring-brand/15 bg-brand-soft/30' : 'border-slate-200 dark:border-slate-700 hover:border-brand/50 hover:shadow-md bg-white dark:bg-slate-800/70'}`}>
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.colors.gradientClass}`} />
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex -space-x-1.5">{[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((color, i) => <span key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800" style={{ backgroundColor: color }} />)}</div>
                {selected ? <span className="rounded-full bg-brand text-white p-1"><Check size={12} /></span> : <Sparkles size={15} className="text-slate-300 group-hover:text-brand transition-colors" />}
              </div>
              <div className="mt-3"><div className="text-xs font-black text-slate-900 dark:text-white truncate">{theme.name}</div><div className="mt-0.5 text-[10px] font-bold text-slate-400 line-clamp-2">{theme.labelThai}</div></div>
              <div className="mt-3 text-[9px] font-black uppercase tracking-wide text-slate-400">{busy ? 'กำลังปรับทั้งระบบ…' : selected ? 'กำลังใช้งาน' : 'แตะเพื่อใช้ทั้งระบบ'}</div>
            </button>
          );
        })}
      </div>
      <div className="px-5 pb-5 text-[10px] font-bold text-slate-400">รองรับมือถือเป็นหลัก • การเลือก 1 ครั้งจะซิงค์ดีไซน์ข้ามหน้าและแท็บภายในระบบผ่าน Design System Engine</div>
    </section>
  );
};
