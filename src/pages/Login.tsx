import React, { useEffect, useState } from 'react';
import { getRedirectResult } from 'firebase/auth';
import { ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { auth, signInWithGoogle } from '../lib/firebase';

function firebaseAuthMessage(error: any) {
  const code = error?.code || '';
  const messages: Record<string, string> = {
    'auth/unauthorized-domain': 'โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication',
    'auth/operation-not-allowed': 'Google Sign-In ยังไม่ได้เปิดใน Firebase Authentication',
    'auth/network-request-failed': 'เชื่อมต่อ Firebase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต',
    'auth/popup-closed-by-user': 'หน้าต่าง Google ถูกปิดก่อนเข้าสู่ระบบ',
    'auth/popup-blocked': 'เบราว์เซอร์บล็อก Google Login',
    'auth/cancelled-popup-request': 'คำขอ Google Login ถูกยกเลิก',
  };
  return messages[code] || `Google Login ไม่สำเร็จ${code ? ` (${code})` : ''}`;
}

export default function Login() {
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    getRedirectResult(auth)
      .then(result => {
        if (!active) return;
        if (result?.user) {
          setBusy(true);
          toast.success('ยืนยัน Google สำเร็จ กำลังเข้าสู่ศูนย์ควบคุม...');
        }
      })
      .catch(error => {
        if (!active) return;
        console.error('[Firebase redirect result]', error);
        const message = firebaseAuthMessage(error);
        setErrorMessage(message);
        toast.error(message);
      });
    return () => { active = false; };
  }, []);

  const handleGoogleLogin = async () => {
    if (busy) return;
    setBusy(true);
    setErrorMessage('');
    try {
      const result = await signInWithGoogle();
      if (result?.user) toast.success('เข้าสู่ระบบสำเร็จ กำลังเข้าสู่ศูนย์ควบคุม...');
    } catch (error: any) {
      console.error('[Firebase Google Login]', error);
      const message = firebaseAuthMessage(error);
      setErrorMessage(message);
      toast.error(message);
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-5 relative overflow-hidden">
      <Toaster position="top-center" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
      <section className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shadow-2xl"><Sparkles size={28} className="text-amber-400" /></div>
          <p className="text-[10px] font-black tracking-[0.28em] uppercase text-amber-400">Solar Operations Management</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">ศูนย์ควบคุมระบบ</h1>
          <p className="mt-2 text-sm text-slate-400">เข้าสู่ระบบด้วยบัญชี Google ของคุณ</p>
        </div>
        <div className="rounded-[2rem] bg-white/[0.06] border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <button type="button" onClick={handleGoogleLogin} disabled={busy} className="w-full rounded-2xl bg-white text-slate-950 py-4 px-5 font-black flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait">
            {busy ? <><span className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-950 animate-spin" /><span>กำลังเชื่อมต่อ Google...</span></> : <><span className="text-xl font-black">G</span><span>เข้าสู่ระบบด้วย Google</span><ArrowRight size={18} /></>}
          </button>
          {errorMessage && <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200 flex gap-3"><AlertCircle size={18} className="shrink-0 mt-0.5" /><div><p className="font-bold">เข้าสู่ระบบไม่สำเร็จ</p><p className="mt-1 text-xs leading-relaxed">{errorMessage}</p></div></div>}
          <div className="mt-6 rounded-2xl bg-white/[0.04] border border-white/5 p-4 text-center text-xs text-slate-400">การเข้าสู่ระบบครั้งแรกจะสร้างบัญชี Firebase ให้โดยอัตโนมัติ ไม่ต้องตั้งรหัสผ่าน</div>
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-500"><ShieldCheck size={14} className="text-emerald-400" /> Firebase Authentication • Firestore</div>
        </div>
      </section>
    </main>
  );
}
