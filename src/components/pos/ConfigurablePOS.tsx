import { useEffect, useMemo, useState, type ComponentProps, type CSSProperties } from 'react';
import AddTransaction from '../../pages/AddTransaction';
import { getFirebaseStore } from '../../lib/firebaseStore';
import { DEFAULT_POS_CONTROL, normalizePosControl, PosControlConfig } from './posControl';

const POS_CACHE_KEY = 'som:pos-control:v1';
function readCached(): PosControlConfig { try { return normalizePosControl(JSON.parse(localStorage.getItem(POS_CACHE_KEY) || 'null')); } catch { return DEFAULT_POS_CONTROL; } }
function cache(value: PosControlConfig) { try { localStorage.setItem(POS_CACHE_KEY, JSON.stringify(value)); } catch { /* optional cache */ } }

export default function ConfigurablePOS(props: ComponentProps<typeof AddTransaction>) {
  const [control, setControl] = useState<PosControlConfig>(() => readCached());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const store = getFirebaseStore();
        if (!store) return;
        const { data, error } = await store.from('app_config').select('config').eq('id', 'app').maybeSingle();
        if (error) throw error;
        const next = normalizePosControl(data?.config?.posControl);
        if (alive) { setControl(next); cache(next); }
      } catch (error) { console.error('POS control background load failed:', error); }
    })();
    return () => { alive = false; };
  }, []);

  const style = useMemo(() => {
    const accent = control.accent === 'emerald' ? '#10b981' : control.accent === 'blue' ? '#3b82f6' : control.accent === 'amber' ? '#f59e0b' : control.accent === 'violet' ? '#8b5cf6' : 'var(--brand-color, #f59e0b)';
    const gap = control.density === 'compact' ? '0.55rem' : control.density === 'spacious' ? '1rem' : '0.75rem';
    return { '--pos-accent': accent, '--pos-gap': gap } as CSSProperties;
  }, [control]);

  return <section style={style} className={`pos-command-shell pos-layout-${control.layout} pos-density-${control.density}`} data-pos-control="active">
    <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-widest text-[var(--pos-accent)]">POS • Command Center</div><div className="truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">ตั้งค่าและดีไซน์จากศูนย์ควบคุมระบบ</div></div>
      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-500 dark:bg-slate-800">{control.layout}</span>
    </div>
    <AddTransaction {...props} />
    <style>{`
      .pos-command-shell { --pos-radius: 1.15rem; }
      .pos-command-shell [class*="rounded-[28px]"], .pos-command-shell [class*="rounded-3xl"] { border-radius: var(--pos-radius); }
      .pos-command-shell .grid { gap: var(--pos-gap); }
      .pos-command-shell button:focus-visible, .pos-command-shell input:focus-visible, .pos-command-shell select:focus-visible, .pos-command-shell textarea:focus-visible { outline: 2px solid color-mix(in srgb, var(--pos-accent) 55%, transparent); outline-offset: 2px; }
      .pos-layout-compact-grid { font-size: 0.96em; }
      .pos-layout-bento { --pos-radius: 1.45rem; }
      .pos-layout-list-first .grid { grid-template-columns: 1fr !important; }
      .pos-density-compact .p-4, .pos-density-compact .p-5 { padding: .8rem !important; }
      .pos-density-spacious .p-4 { padding: 1.25rem !important; }
    `}</style>
  </section>;
}
