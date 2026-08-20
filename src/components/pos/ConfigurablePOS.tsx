import { useEffect, useMemo, useState } from 'react';
import AddTransaction from '../../pages/AddTransaction';
import { getFirebaseStore } from '../../lib/firebaseStore';
import { DEFAULT_POS_CONTROL, normalizePosControl, PosControlConfig } from './posControl';

const CONTROL_KEY = 'posControl';

export default function ConfigurablePOS(props: React.ComponentProps<typeof AddTransaction>) {
  const [control, setControl] = useState<PosControlConfig>(DEFAULT_POS_CONTROL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const store = getFirebaseStore();
        const { data } = await store?.from('app_config').select('config').eq('id', 'app').maybeSingle();
        const next = normalizePosControl(data?.config?.[CONTROL_KEY]);
        if (!alive) return;
        setControl(next);
        if (typeof window !== 'undefined') {
          const currentPayment = JSON.parse(localStorage.getItem('klangna_pos_payment') || '{}');
          const currentShipping = JSON.parse(localStorage.getItem('klangna_pos_shipping') || '{}');
          localStorage.setItem('klangna_pos_payment', JSON.stringify({ ...currentPayment, method: next.defaultPaymentMethod, status: next.defaultPaymentStatus }));
          localStorage.setItem('klangna_pos_shipping', JSON.stringify({ ...currentShipping, status: next.defaultShippingStatus }));
          localStorage.setItem('klangna_pos_autoSaveSession', String(next.autoSaveSession));
        }
      } catch (error) {
        console.error('POS control load failed:', error);
      } finally {
        if (alive) setReady(true);
      }
    };
    void load();
    return () => { alive = false; };
  }, []);

  const style = useMemo(() => {
    const accent = control.accent === 'emerald' ? '#10b981' : control.accent === 'blue' ? '#3b82f6' : control.accent === 'amber' ? '#f59e0b' : control.accent === 'violet' ? '#8b5cf6' : 'var(--brand-color, #f59e0b)';
    const gap = control.density === 'compact' ? '0.55rem' : control.density === 'spacious' ? '1rem' : '0.75rem';
    return { '--pos-accent': accent, '--pos-gap': gap } as React.CSSProperties;
  }, [control]);

  if (!ready) return <div className="min-h-[50vh] flex items-center justify-center text-xs font-bold text-slate-400">กำลังเตรียม POS ตามการตั้งค่าศูนย์ควบคุม...</div>;

  return (
    <section style={style} className={`pos-command-shell pos-layout-${control.layout} pos-density-${control.density}`} data-pos-control="active">
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
    </section>
  );
}
