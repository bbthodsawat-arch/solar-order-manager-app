import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LogIn, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { getRedirectResult } from 'firebase/auth';
import { auth, signInWithGoogleRedirect } from '../lib/firebase';

export default function Login() {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getRedirectResult(auth)
      .then(result => { if (result?.user) toast.success('เข้าสู่ระบบด้วย Google สำเร็จ'); })
      .catch(error => {
        console.error('Google redirect authentication error', error);
        const code = error?.code || '';
        const messages: Record<string,string> = {
          'auth/unauthorized-domain': 'โดเมน Production ยังไม่ได้รับอนุญาตใน Firebase Authentication',
          'auth/operation-not-allowed': 'ยังไม่ได้เปิด Google ใน Firebase Authentication',
          'auth/account-exists-with-different-credential': 'อีเมลนี้มีบัญชีอยู่แล้วด้วยวิธีเข้าสู่ระบบอื่น',
          'auth/popup-blocked': 'เบราว์เซอร์บล็อก Google Login',
        };
        toast.error(messages[code] || `Google Login ไม่สำเร็จ${code ? ` (${code})` : ''}`);
      });
  }, []);

  const loginWithGoogle = async () => {
    setBusy(true);
    try {
      await signInWithGoogleRedirect();
    } catch (error: any) {
      console.error('Google sign-in redirect error', error);
      const code = error?.code || '';
      toast.error(code === 'auth/operation-not-allowed'
        ? 'ยังไม่ได้เปิด Google ใน Firebase Authentication'
        : code === 'auth/unauthorized-domain'
          ? 'โดเมน Production ยังไม่ได้รับอนุญาตใน Firebase Authentication'
          : `Google Login ไม่สำเร็จ${code ? ` (${code})` : ''}`);
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute -top-48 -right-40 w-[28rem] h-[28rem] rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-48 -left-40 w-[28rem] h-[28rem] rounded-full bg-blue-300/20 blur-3xl pointer-events-none" />
      <section className="w-full max-w-md relative z-10">
        <header className="text-center mb-7">
          <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 flex items-center justify-center shadow-xl"><Sparkles size={25}/></div>
          <p className="text-[10px] font-extrabold tracking-[.22em] uppercase text-amber-600">Solar Operations Management</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">ศูนย์ควบคุมระบบ</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">จัดการงานขาย การเงิน ลูกค้า และการดำเนินงานจากที่เดียว</p>
        </header>
        <div className="rounded-[2rem] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
          <button disabled={busy} onClick={loginWithGoogle} className="w-full rounded-2xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 py-4 font-black flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? 'กำลังเชื่อมต่อ Google...' : <>เข้าสู่ระบบด้วย Google <ArrowRight size={18}/></>}
          </button>
          <div className="mt-6 rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-4 text-center text-xs text-slate-500 dark:text-slate-400">การเข้าสู่ระบบครั้งแรกจะสร้างบัญชี Firebase ของคุณโดยอัตโนมัติ ไม่ต้องตั้งรหัสผ่าน</div>
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400"><ShieldCheck size={14} className="text-emerald-500"/> Secure Firebase Authentication</div>
        </div>
        <div className="mt-5 text-center text-[10px] text-slate-400">Mobile First • Secure by Design</div>
      </section>
    </main>
  );
}
