import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { signInWithGoogleRedirect } from '../lib/firebase';

export default function LoginGoogle() {
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try { await signInWithGoogleRedirect(); }
    catch (error: any) { console.error('[Firebase Google Auth]', error); toast.error(error?.code ? `Google Login ไม่สำเร็จ (${error.code})` : 'Google Login ไม่สำเร็จ'); setBusy(false); }
  };
  return <main className="min-h-screen bg-[#f7f8fa] dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4 relative overflow-hidden"><div className="absolute -top-48 -right-40 w-[28rem] h-[28rem] rounded-full bg-amber-300/20 blur-3xl"/><section className="w-full max-w-md relative z-10"><header className="text-center mb-7"><div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 flex items-center justify-center shadow-xl"><Sparkles size={25}/></div><p className="text-[10px] font-extrabold tracking-[.22em] uppercase text-amber-600">Solar Operations Management</p><h1 className="mt-2 text-3xl font-black">ศูนย์ควบคุมระบบ</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">เข้าสู่ระบบด้วยบัญชี Google ของคุณ</p></header><div className="rounded-[2rem] bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8"><button disabled={busy} onClick={submit} className="w-full rounded-2xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 py-4 font-black flex items-center justify-center gap-3 disabled:opacity-60"><LogIn size={19}/>{busy?'กำลังเชื่อมต่อ Google...':'เข้าสู่ระบบด้วย Google'}</button><div className="mt-6 rounded-2xl bg-slate-50 dark:bg-slate-800 p-4 text-xs text-slate-500 dark:text-slate-400">ครั้งแรกระบบจะสร้างโปรไฟล์ SOM ให้โดยอัตโนมัติ ไม่ต้องตั้งอีเมลหรือรหัสผ่านแยก</div><div className="mt-6 flex justify-center gap-2 text-[10px] text-slate-400"><ShieldCheck size={14} className="text-emerald-500"/> Secure Firebase Authentication</div></div></section></main>;
}
