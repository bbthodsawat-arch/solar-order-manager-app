import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { getRedirectResult } from 'firebase/auth';
import { auth, signInWithGoogle, signInWithGoogleRedirect } from '../lib/firebase';

function authMessage(error: any) {
  const code = error?.code || '';
  const messages: Record<string, string> = {
    'auth/unauthorized-domain': 'โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication',
    'auth/operation-not-allowed': 'ยังไม่ได้เปิด Google Sign-In ใน Firebase Authentication',
    'auth/popup-blocked': 'เบราว์เซอร์บล็อกหน้าต่าง Google — กำลังใช้ Redirect',
    'auth/popup-closed-by-user': 'หน้าต่าง Google ถูกปิดก่อนเข้าสู่ระบบ',
    'auth/cancelled-popup-request': 'คำขอ Google Login ถูกยกเลิก',
    'auth/network-request-failed': 'เชื่อมต่อ Firebase ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต',
    'auth/internal-error': 'Firebase เกิดข้อผิดพลาดภายในระหว่าง Google Login',
  };
  return messages[code] || `Google Login ไม่สำเร็จ${code ? ` (${code})` : ''}`;
}

export default function Login() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('พร้อมเข้าสู่ระบบ');
  const [error, setError] = useState('');

  useEffect(() => {
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) {
          setStatus(`เข้าสู่ระบบสำเร็จ: ${result.user.email || 'Google account'}`);
          setBusy(false);
        }
      })
      .catch(err => {
        console.error('Google redirect authentication error', err);
        setError(authMessage(err));
        setStatus('Google Login ไม่สำเร็จ');
        setBusy(false);
      });
  }, []);

  const loginWithGoogle = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setStatus('กำลังเปิด Google Login...');

    const timeout = window.setTimeout(() => {
      setBusy(false);
      setStatus('Google Login ไม่ตอบสนอง');
      setError('ไม่ได้รับการตอบกลับจาก Google/Firebase ภายใน 15 วินาที กรุณาตรวจสอบ Firebase Authentication และ Authorized Domains');
    }, 15000);

    try {
      const result = await signInWithGoogle();
      window.clearTimeout(timeout);
      setStatus(`เข้าสู่ระบบสำเร็จ: ${result.user.email || 'Google account'}`);
      setBusy(false);
    } catch (err: any) {
      window.clearTimeout(timeout);
      console.error('Google popup authentication error', err);
      if (err?.code === 'auth/popup-blocked') {
        try {
          setStatus('กำลังเปลี่ยนไปใช้ Google Redirect...');
          await signInWithGoogleRedirect();
          return;
        } catch (redirectError: any) {
          console.error('Google redirect fallback error', redirectError);
          setError(authMessage(redirectError));
          setStatus('Google Login ไม่สำเร็จ');
        }
      } else {
        setError(authMessage(err));
        setStatus('Google Login ไม่สำเร็จ');
      }
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
          <button type="button" disabled={busy} onClick={loginWithGoogle} className="w-full rounded-2xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 py-4 font-black flex items-center justify-center gap-2 disabled:opacity-60">
            {busy ? 'กำลังเชื่อมต่อ Google...' : <>เข้าสู่ระบบด้วย Google <ArrowRight size={18}/></>}
          </button>
          <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-center text-xs font-semibold" role="status">{status}</div>
          {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-300" role="alert">{error}</div>}
          <div className="mt-6 rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-4 text-center text-xs text-slate-500 dark:text-slate-400">การเข้าสู่ระบบครั้งแรกจะสร้างบัญชี Firebase ของคุณโดยอัตโนมัติ ไม่ต้องตั้งรหัสผ่าน</div>
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400"><ShieldCheck size={14} className="text-emerald-500"/> Secure Firebase Authentication</div>
        </div>
        <div className="mt-5 text-center text-[10px] text-slate-400">Mobile First • Secure by Design</div>
      </section>
    </main>
  );
}
