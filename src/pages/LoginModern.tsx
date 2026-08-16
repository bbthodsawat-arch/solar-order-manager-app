import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Eye, EyeOff, LogIn, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { signInWithGoogle, signInWithPassword } from '../lib/firebase';

export default function LoginModern() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try { await fn(); toast.success(success); }
    catch (e: any) {
      console.error(e);
      const code = e?.code || '';
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        'auth/user-not-found': 'ไม่พบบัญชีผู้ใช้งานนี้',
        'auth/wrong-password': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        'auth/user-disabled': 'บัญชีนี้ถูกระงับการใช้งาน',
        'auth/operation-not-allowed': 'ยังไม่ได้เปิด Email/Password ใน Firebase Authentication',
        'auth/unauthorized-domain': 'โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication',
        'auth/popup-blocked': 'เบราว์เซอร์บล็อก Google Popup',
      };
      toast.error(messages[code] || `เข้าสู่ระบบไม่สำเร็จ${code ? ` (${code})` : ''}`);
    } finally { setBusy(false); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return toast.error('กรุณากรอกอีเมลและรหัสผ่าน');
    return run(() => signInWithPassword(email.trim(), password), 'เข้าสู่ระบบสำเร็จ');
  };

  return <main className="min-h-screen bg-[#f7f8fa] dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
    <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-300/20 blur-3xl" />
    <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-300/20 blur-3xl" />
    <section className="w-full max-w-md relative z-10">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 flex items-center justify-center shadow-xl"><Sparkles size={25}/></div>
        <p className="text-[11px] font-extrabold tracking-[.2em] uppercase text-amber-600">Solar Operations Management</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">ศูนย์ควบคุมระบบ</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">เข้าสู่ระบบเพื่อจัดการงานขาย การเงิน ลูกค้า และการดำเนินงาน</p>
      </div>
      <div className="rounded-[2rem] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="text-xs font-bold">อีเมล</span><input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" placeholder="name@example.com" className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3.5 outline-none focus:ring-2 focus:ring-amber-400" /></label>
          <label className="block"><span className="text-xs font-bold">รหัสผ่าน</span><div className="relative mt-2"><input value={password} onChange={e=>setPassword(e.target.value)} type={showPassword?'text':'password'} autoComplete="current-password" placeholder="••••••••" className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3.5 pr-12 outline-none focus:ring-2 focus:ring-amber-400"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
          <button disabled={busy} className="w-full rounded-2xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 py-3.5 font-black flex items-center justify-center gap-2 disabled:opacity-60">{busy?'กำลังตรวจสอบ...':<>เข้าสู่ระบบ <ArrowRight size={18}/></>}</button>
        </form>
        <div className="flex items-center gap-3 my-5"><div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"/><span className="text-[10px] text-slate-400">หรือ</span><div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"/></div>
        <button disabled={busy} onClick={()=>run(signInWithGoogle,'เข้าสู่ระบบด้วย Google สำเร็จ')} className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 py-3.5 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"><LogIn size={18}/> เข้าสู่ระบบด้วย Google</button>
        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400"><ShieldCheck size={14} className="text-emerald-500"/> Secure Firebase Authentication</div>
      </div>
      <div className="mt-5 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1"><KeyRound size={12}/> ระบบศูนย์ควบคุม • Mobile First • Secure by Design</div>
    </section>
  </main>;
}
