import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Check, LayoutGrid, List, Palette, Save, SlidersHorizontal, Sparkles, Zap, CloudOff } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { DEFAULT_POS_CONTROL, normalizePosControl, PosControlConfig } from './posControl';

const POS_CACHE_KEY = 'som:pos-control:v1';
function readCached(): PosControlConfig { try { return normalizePosControl(JSON.parse(localStorage.getItem(POS_CACHE_KEY) || 'null')); } catch { return DEFAULT_POS_CONTROL; } }
function cache(value: PosControlConfig) { try { localStorage.setItem(POS_CACHE_KEY, JSON.stringify(value)); } catch {} }

const writeConfig = (next: PosControlConfig, userId?: string) => {
  if (!db) return Promise.reject(new Error('Database connection is unavailable'));
  const payload: Record<string, unknown> = { 'config.posControl': next, updated_at: new Date().toISOString() };
  if (userId) payload.updated_by = userId;
  return setDoc(doc(db, 'app_config', 'app'), payload, { merge: true });
};

export default function POSCommandCenterPanel() {
  const { user } = useAuth();
  const [value, setValue] = useState<PosControlConfig>(() => readCached());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!db) return;
        const snapshot = await getDoc(doc(db, 'app_config', 'app'));
        const next = normalizePosControl(snapshot.data()?.config?.posControl);
        if (alive) { setValue(next); cache(next); }
      } catch (error) { console.error('POS command center load failed:', error); }
    })();
    return () => { alive = false; };
  }, []);

  const patch = (next: Partial<PosControlConfig>) => { setValue(v => { const n = { ...v, ...next }; cache(n); return n; }); setErrorMessage(''); setSaved(false); };
  const accents = useMemo(() => [['brand','Brand'],['emerald','Emerald'],['blue','Blue'],['amber','Solar'],['violet','Violet']] as const, []);

  const save = () => {
    setSaving(true); setSaved(false); setSyncing(true); setErrorMessage('');
    cache(value);
    // Never make the Command Center wait for Firestore. The local value is immediately
    // usable by POS; Firestore sync runs independently and reports failures separately.
    void writeConfig(value, user?.id)
      .then(() => { setSyncing(false); setSaved(true); window.setTimeout(() => setSaved(false), 2600); })
      .catch((error) => { console.error('POS settings sync failed:', error); setSyncing(false); setErrorMessage('บันทึกในเครื่องแล้ว แต่ซิงก์ฐานข้อมูลไม่สำเร็จ — POS จะใช้ค่าล่าสุด'); });
    setSaving(false);
  };

  return <div className="space-y-4">
    <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
      <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-black"><SlidersHorizontal size={16}/> POS Control</div><p className="mt-1 text-[11px] font-medium text-slate-400">ตั้งค่าจากศูนย์กลางเดียว และใช้ทันทีใน POS</p></div><button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"><Save size={14}/>{saving ? 'กำลังเตรียม' : syncing ? 'กำลังซิงก์' : saved ? 'บันทึกแล้ว' : 'บันทึก'}</button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Control label="รูปแบบการจัดวาง"><div className="grid grid-cols-2 gap-2">{([['clean-grid','Clean Grid',LayoutGrid],['compact-grid','Compact',LayoutGrid],['list-first','List First',List],['bento','Bento',Sparkles]] as const).map(([id,label,Icon])=><button key={id} onClick={()=>patch({layout:id})} className={`rounded-2xl border p-3 text-left ${value.layout===id?'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900':'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}><Icon size={16}/><div className="mt-2 text-[10px] font-black">{label}</div></button>)}</div></Control>
          <Control label="ความหนาแน่นของ UI"><select value={value.density} onChange={e=>patch({density:e.target.value as PosControlConfig['density']})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"><option value="compact">Compact — ประหยัดพื้นที่</option><option value="comfortable">Comfortable — แนะนำ</option><option value="spacious">Spacious — แตะง่าย</option></select></Control>
          <Control label="สี Accent ของ POS"><div className="grid grid-cols-5 gap-2">{accents.map(([id,label])=><button key={id} title={label} onClick={()=>patch({accent:id})} className={`h-10 rounded-xl border ${value.accent===id?'border-slate-900 ring-2 ring-slate-200':'border-slate-200 dark:border-slate-700'} ${id==='emerald'?'bg-emerald-500':id==='blue'?'bg-blue-500':id==='amber'?'bg-amber-500':id==='violet'?'bg-violet-500':'bg-slate-900'}`}><span className="sr-only">{label}</span></button>)}</div></Control>
          <Control label="ตัวเลือกการใช้งาน"><div className="space-y-2">{([['showTodaySummary','สรุปยอดวันนี้'],['showRecentCustomers','ลูกค้าล่าสุด'],['showQuickActions','Quick Actions'],['autoSaveSession','จำเซสชัน POS'],['confirmBeforeSubmit','ยืนยันก่อนบันทึก']] as const).map(([key,label])=><Toggle key={key} label={label} checked={Boolean(value[key])} onChange={v=>patch({[key]:v} as Partial<PosControlConfig>)}/>)}</div></Control>
        </div>
      </section>
      <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-xs font-black"><Zap size={16}/> Workflow Defaults</div><p className="mt-1 text-[11px] font-medium text-slate-400">ค่าเริ่มต้นของ POS ให้ตรงกันทั้งระบบ</p><div className="mt-5 space-y-4"><Select label="วิธีชำระเงินเริ่มต้น" value={value.defaultPaymentMethod} options={['เงินสด','โอนผ่านธนาคาร','เก็บเงินปลายทาง (COD)']} onChange={v=>patch({defaultPaymentMethod:v})}/><Select label="สถานะชำระเงินเริ่มต้น" value={value.defaultPaymentStatus} options={['paid','unpaid','partial','refunded']} onChange={v=>patch({defaultPaymentStatus:v})}/><Select label="สถานะจัดส่งเริ่มต้น" value={value.defaultShippingStatus} options={['สั่งซื้อแล้ว','กำลังประกอบ','กำลังขนส่ง','จัดส่งสำเร็จ']} onChange={v=>patch({defaultShippingStatus:v})}/><div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70"><div className="flex items-center gap-2 text-[10px] font-black"><Palette size={14}/> Single Source of Truth</div><p className="mt-1 text-[10px] leading-5 text-slate-500 dark:text-slate-400">ค่าที่บันทึกที่นี่จะถูกใช้โดย POS โดยไม่ต้องตั้งค่าซ้ำในหน้า POS</p></div></div></section>
    </div>
    {syncing && <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><Save size={14} className="animate-pulse"/> บันทึกในเครื่องแล้ว กำลังซิงก์ฐานข้อมูล…</div>}
    {errorMessage && <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] font-black text-amber-700"><CloudOff size={14}/>{errorMessage}</div>}
    {saved && <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] font-black text-emerald-700"><Check size={15}/> บันทึกและซิงก์ POS สำเร็จ</div>}
  </div>;
}
function Control({label,children}:{label:string;children:ReactNode}){return <div><div className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>{children}</div>}
function Select({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(v:string)=>void}){return <label className="block"><span className="mb-2 block text-[10px] font-black text-slate-400">{label}</span><select value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-800">{options.map(x=><option key={x}>{x}</option>)}</select></label>}
function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){return <button type="button" onClick={()=>onChange(!checked)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left dark:border-slate-700"><span className="text-[10px] font-bold">{label}</span><span className={`h-5 w-9 rounded-full p-0.5 transition ${checked?'bg-emerald-500':'bg-slate-300 dark:bg-slate-600'}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${checked?'translate-x-4':''}`}/></span></button>}
