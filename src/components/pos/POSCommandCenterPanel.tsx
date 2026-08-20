import { useEffect, useMemo, useState } from 'react';
import { Check, LayoutGrid, List, Palette, Save, SlidersHorizontal, Sparkles, Zap } from 'lucide-react';
import { getFirebaseStore } from '../../lib/firebaseStore';
import { DEFAULT_POS_CONTROL, normalizePosControl, PosControlConfig } from './posControl';

const saveConfig = async (next: PosControlConfig) => {
  const store = getFirebaseStore();
  if (!store) throw new Error('Database connection is unavailable');
  const { data } = await store.from('app_config').select('config').eq('id', 'app').maybeSingle();
  const current = data?.config && typeof data.config === 'object' ? data.config : {};
  const config = { ...current, posControl: next };
  const { error } = await store.from('app_config').upsert({ id: 'app', config, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw error;
  if (typeof window !== 'undefined') {
    localStorage.setItem('klangna_pos_payment', JSON.stringify({ method: next.defaultPaymentMethod, status: next.defaultPaymentStatus }));
    localStorage.setItem('klangna_pos_shipping', JSON.stringify({ status: next.defaultShippingStatus }));
    localStorage.setItem('klangna_pos_autoSaveSession', String(next.autoSaveSession));
  }
};

export default function POSCommandCenterPanel() {
  const [value, setValue] = useState<PosControlConfig>(DEFAULT_POS_CONTROL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const store = getFirebaseStore();
        if (!store) return;
        const { data } = await store.from('app_config').select('config').eq('id', 'app').maybeSingle();
        if (alive) setValue(normalizePosControl(data?.config?.posControl));
      } catch (error) {
        console.error('POS command center load failed:', error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const patch = (next: Partial<PosControlConfig>) => setValue(v => ({ ...v, ...next }));
  const accents = useMemo(() => [
    ['brand', 'Brand'], ['emerald', 'Emerald'], ['blue', 'Blue'], ['amber', 'Solar'], ['violet', 'Violet']
  ] as const, []);

  const save = async () => {
    setSaving(true); setSaved(false);
    try { await saveConfig(value); setSaved(true); window.setTimeout(() => setSaved(false), 2200); }
    catch (error) { console.error(error); alert('บันทึกการตั้งค่า POS ไม่สำเร็จ กรุณาลองใหม่'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="rounded-[26px] border border-slate-200 bg-white p-6 text-xs font-bold text-slate-400 dark:border-slate-800 dark:bg-slate-900">กำลังโหลดการตั้งค่า POS...</div>;

  return <div className="space-y-4">
    <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
      <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-black"><SlidersHorizontal size={16}/> POS Control</div><p className="mt-1 text-[11px] font-medium text-slate-400">ควบคุมหน้าขายจาก Command Center จุดเดียว โดยไม่เพิ่มเมนูซ้ำใน POS</p></div><button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"><Save size={14}/>{saved ? 'บันทึกแล้ว' : saving ? 'กำลังบันทึก' : 'บันทึก'}</button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Control label="รูปแบบการจัดวาง">
            <div className="grid grid-cols-2 gap-2">{([['clean-grid','Clean Grid',LayoutGrid],['compact-grid','Compact',LayoutGrid],['list-first','List First',List],['bento','Bento',Sparkles]] as const).map(([id,label,Icon]) => <button key={id} onClick={()=>patch({layout:id})} className={`rounded-2xl border p-3 text-left ${value.layout===id?'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900':'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}><Icon size={16}/><div className="mt-2 text-[10px] font-black">{label}</div></button>)}</div>
          </Control>
          <Control label="ความหนาแน่นของ UI">
            <select value={value.density} onChange={e=>patch({density:e.target.value as PosControlConfig['density']})} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-800"><option value="compact">Compact — เร็ว/ประหยัดพื้นที่</option><option value="comfortable">Comfortable — แนะนำ</option><option value="spacious">Spacious — แตะง่าย</option></select>
          </Control>
          <Control label="สี Accent ของ POS">
            <div className="grid grid-cols-5 gap-2">{accents.map(([id,label])=><button key={id} title={label} onClick={()=>patch({accent:id})} className={`h-10 rounded-xl border text-[9px] font-black ${value.accent===id?'border-slate-900 ring-2 ring-slate-200':'border-slate-200 dark:border-slate-700'} ${id==='emerald'?'bg-emerald-500':id==='blue'?'bg-blue-500':id==='amber'?'bg-amber-500':id==='violet'?'bg-violet-500':'bg-slate-900'}`}><span className="sr-only">{label}</span></button>)}</div>
          </Control>
          <Control label="ตัวเลือกการใช้งาน">
            <div className="space-y-2">{([['showTodaySummary','สรุปยอดวันนี้'],['showRecentCustomers','ลูกค้าล่าสุด'],['showQuickActions','Quick Actions'],['autoSaveSession','จำเซสชัน POS'],['confirmBeforeSubmit','ยืนยันก่อนบันทึก']] as const).map(([key,label])=><Toggle key={key} label={label} checked={Boolean(value[key])} onChange={v=>patch({[key]:v} as Partial<PosControlConfig>)}/>)}</div>
          </Control>
        </div>
      </section>

      <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs font-black"><Zap size={16}/> Workflow Defaults</div>
        <p className="mt-1 text-[11px] font-medium text-slate-400">กำหนดค่าเริ่มต้นให้ POS ใช้ตรงกันทั้งระบบ</p>
        <div className="mt-5 space-y-4">
          <Select label="วิธีชำระเงินเริ่มต้น" value={value.defaultPaymentMethod} options={['เงินสด','โอนผ่านธนาคาร','เก็บเงินปลายทาง (COD)']} onChange={v=>patch({defaultPaymentMethod:v})}/>
          <Select label="สถานะชำระเงินเริ่มต้น" value={value.defaultPaymentStatus} options={['paid','unpaid','partial','refunded']} onChange={v=>patch({defaultPaymentStatus:v})}/>
          <Select label="สถานะจัดส่งเริ่มต้น" value={value.defaultShippingStatus} options={['สั่งซื้อแล้ว','กำลังประกอบ','กำลังขนส่ง','จัดส่งสำเร็จ']} onChange={v=>patch({defaultShippingStatus:v})}/>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70"><div className="flex items-center gap-2 text-[10px] font-black"><Palette size={14}/> หลักการออกแบบ</div><p className="mt-1 text-[10px] leading-5 text-slate-500 dark:text-slate-400">POS ใช้ Command Center เป็นแหล่งควบคุมเดียว: layout, density, accent และ workflow defaults ถูกบันทึกไว้ที่ app configuration เดียวกัน</p></div>
        </div>
      </section>
    </div>
    {saved && <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] font-black text-emerald-700"><Check size={15}/> POS อัปเดตการตั้งค่าจาก Command Center แล้ว</div>}
  </div>;
}

function Control({label, children}:{label:string;children:React.ReactNode}){return <div><div className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</div>{children}</div>}
function Select({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(v:string)=>void}){return <label className="block"><span className="mb-2 block text-[10px] font-black text-slate-400">{label}</span><select value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-800">{options.map(x=><option key={x}>{x}</option>)}</select></label>}
function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){return <button type="button" onClick={()=>onChange(!checked)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left dark:border-slate-700"><span className="text-[10px] font-bold">{label}</span><span className={`h-5 w-9 rounded-full p-0.5 transition ${checked?'bg-emerald-500':'bg-slate-300 dark:bg-slate-600'}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${checked?'translate-x-4':''}`}/></span></button>}
