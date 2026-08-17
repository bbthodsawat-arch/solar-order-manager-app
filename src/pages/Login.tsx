import React, { useState, useEffect } from 'react';
import { signInWithGoogle, signInWithPassword, db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  SunMedium, LogIn, Shield, Users, Lock, Sparkles, 
  CheckCircle2, FileText, Database, ShieldCheck, KeyRound, User, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [loginMethod, setLoginMethod] = useState<'password' | 'google'>('password');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [accountInput, setAccountInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cachedLogo, setCachedLogo] = useState('/logo.jpg');
  const [cachedName, setCachedName] = useState('ร้านกลางนาโซล่าเซลล์');

  useEffect(() => {
    try {
      const cached = localStorage.getItem('cachedShopInfo');
      if (cached) {
        const info = JSON.parse(cached);
        if (info.logoUrl) setCachedLogo(info.logoUrl);
        if (info.name) setCachedName(info.name);
      }
    } catch (e) {}
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await signInWithGoogle();
      toast.success('เข้าสู่ระบบด้วย Google สำเร็จแล้ว');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountInput.trim() || !passwordInput) {
      toast.error('กรุณากรอกชื่อผู้ใช้งาน/อีเมล และรหัสผ่าน');
      return;
    }

    try {
      setIsLoggingIn(true);
      let targetEmail = accountInput.trim();

      // If input is not an email (no '@'), query Firestore users collection to find corresponding email by username
      if (!targetEmail.includes('@')) {
        const q = query(collection(db, 'users'), where('username', '==', targetEmail.toLowerCase()));
        const snap = await getDocs(q);
        if (snap.empty) {
          // Fallback search in all users for matching username or prefix
          const allUsersSnap = await getDocs(collection(db, 'users'));
          const matched = allUsersSnap.docs.find(d => {
            const u = d.data();
            return u.username?.toLowerCase() === targetEmail.toLowerCase() || 
                   u.email?.split('@')[0].toLowerCase() === targetEmail.toLowerCase();
          });

          if (matched) {
            targetEmail = matched.data().email;
          } else {
            toast.error('ไม่พบบัญชีชื่อผู้ใช้งานนี้ในระบบ');
            setIsLoggingIn(false);
            return;
          }
        } else {
          targetEmail = snap.docs[0].data().email;
        }
      }

      if (!targetEmail) {
        toast.error('ไม่พบอีเมลที่ผูกกับชื่อผู้ใช้งานนี้');
        setIsLoggingIn(false);
        return;
      }

      await signInWithPassword(targetEmail, passwordInput);
      toast.success('เข้าสู่ระบบสำเร็จแล้ว');
    } catch (error: any) {
      console.error('Password Login error:', error);
      const code = error?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      } else if (code === 'auth/user-not-found') {
        toast.error('ไม่พบบัญชีผู้ใช้งานนี้ในระบบ');
      } else if (code === 'auth/user-disabled') {
        toast.error('บัญชีผู้ใช้งานนี้ถูกระงับสิทธิ์การใช้งาน');
      } else if (code === 'auth/too-many-requests') {
        toast.error('ลองรหัสผ่านผิดหลายครั้งเกินไป กรุณารอชั่วคราวแล้วลองใหม่');
      } else {
        toast.error('เข้าสู่ระบบไม่สำเร็จ: ' + (error.message || 'โปรดตรวจสอบรหัสผ่าน'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 transition-colors relative overflow-hidden font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Background Decorative Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-300/20 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-lg w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-slate-200/60 dark:shadow-none border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6 relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto">
            <img
              src={cachedLogo}
              alt="Logo"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-full border-4 border-amber-400 shadow-xl bg-white p-0.5"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.jpg';
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-slate-900 dark:bg-slate-800 p-1.5 rounded-2xl text-amber-400 border border-amber-400/30">
              <ShieldCheck size={18} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Sparkles size={12} className="mr-1 text-amber-500 animate-pulse" />
              <span>ระบบเข้าใช้งานความปลอดภัยสูง • โดย boy thodsawat</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {cachedName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              ระบบบริหารจัดการบัญชีรายรับ-รายจ่าย ยอดขาย และกำหนดสิทธิ์การใช้งานพนักงานประจำร้าน
            </p>
          </div>
        </div>

        {/* Login Method Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setLoginMethod('password')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              loginMethod === 'password'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound size={15} className={loginMethod === 'password' ? 'text-amber-500' : ''} />
            <span>Username / Password</span>
          </button>

          <button
            type="button"
            onClick={() => setLoginMethod('google')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              loginMethod === 'google'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LogIn size={15} className={loginMethod === 'google' ? 'text-amber-500' : ''} />
            <span>Google OAuth</span>
          </button>
        </div>

        {/* Login Action Area */}
        {loginMethod === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
                <User size={13} className="mr-1 text-amber-500" />
                ชื่อผู้ใช้งาน หรือ อีเมล (Username / Email)
              </label>
              <input
                type="text"
                placeholder="เช่น admin, somchai หรือ email@example.com"
                value={accountInput}
                onChange={(e) => setAccountInput(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
                <Lock size={13} className="mr-1 text-amber-500" />
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="ป้อนรหัสผ่านผู้ใช้งาน..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-md text-sm cursor-pointer disabled:opacity-60"
            >
              {isLoggingIn ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังตรวจสอบรหัสผ่าน...</span>
                </div>
              ) : (
                <>
                  <KeyRound size={18} />
                  <span>เข้าสู่ระบบด้วย Username & Password</span>
                </>
              )}
            </motion.button>
            <p className="text-[11px] text-center text-slate-400">
              🔑 รองรับการเข้าใช้งานด้วยบัญชีผู้ใช้ที่ผู้ดูแลระบบออกให้
            </p>
          </form>
        ) : (
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center space-x-3 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-md text-sm cursor-pointer disabled:opacity-60"
            >
              {isLoggingIn ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังยืนยันตัวตน...</span>
                </div>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>เข้าสู่ระบบด้วย Google Account</span>
                </>
              )}
            </motion.button>
            <p className="text-[11px] text-center text-slate-400">
              🔒 เข้าสู่ระบบได้อย่างปลอดภัยด้วยบัญชี Google ของท่าน
            </p>
          </div>
        )}

        {/* System Permission Levels Explanation Box */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Lock size={15} className="text-amber-500" />
            <span>ระดับสิทธิ์การเข้าใช้งานในระบบ (Role Permissions)</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-0.5">
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center">
                <Shield size={12} className="mr-1" /> Admin (ผู้ดูแลระบบ)
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[10px]">สิทธิ์สูงสุด เข้าถึงทุกเมนูและกำหนดสิทธิ์ผู้ใช้อื่นได้</p>
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-0.5">
              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center">
                <Users size={12} className="mr-1" /> Manager (ผู้จัดการ)
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[10px]">บันทึก แก้ไข ลบ ดูรายงาน และตั้งค่าระบบได้</p>
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-0.5">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                <FileText size={12} className="mr-1" /> Staff (พนักงานหน้าร้าน)
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[10px]">บันทึกรายการขาย/รายจ่าย ดูประวัติ และดูภาพรวมได้</p>
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 space-y-0.5">
              <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center">
                <Database size={12} className="mr-1" /> Viewer (ผู้ดูข้อมูล)
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[10px]">ดูข้อมูลภาพรวมและรายงานเท่านั้น ไม่สามารถแก้ไขได้</p>
            </div>
          </div>
        </div>

        {/* Security Assurance */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 size={13} className="mr-1" /> Firebase Authentication Secured
          </span>
          <span>v2.6 • OAuth & Password Authentication</span>
        </div>
      </motion.div>
    </div>
  );
}

