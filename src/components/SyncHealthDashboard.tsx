import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { dbManager } from '../lib/dbManager';

export default function SyncHealthDashboard() {
  const [health, setHealth] = useState(dbManager.getHealthStatus());
  const [loading, setLoading] = useState(false);
  const refresh = async () => { setLoading(true); try { setHealth(await dbManager.runDiagnostics()); } finally { setLoading(false); } };
  useEffect(() => { void refresh(); }, []);
  const ok = health.firebase.status === 'healthy';
  return <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
    <div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-[10px] font-black text-indigo-500"><Activity size={13}/> FIREBASE SYNC HEALTH</div><h3 className="text-lg font-black mt-2">สุขภาพการเชื่อมต่อ Firestore</h3><p className="text-xs text-slate-500 mt-1">Firebase/Firestore เป็นฐานข้อมูลคลาวด์หลักของระบบ</p></div><button onClick={refresh} disabled={loading} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-black flex items-center gap-2"><RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> ตรวจสอบ</button></div>
    <div className={`rounded-2xl border p-4 flex items-center gap-3 ${ok ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30' : 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30'}`}><span className={`p-2 rounded-xl ${ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{ok ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}</span><div className="min-w-0"><p className="text-sm font-black">{ok ? 'Firebase พร้อมใช้งาน' : 'Firebase มีปัญหา'}</p><p className="text-xs text-slate-500 truncate">{health.firebase.message} · {health.firebase.latencyMs}ms</p></div></div>
  </section>;
}
