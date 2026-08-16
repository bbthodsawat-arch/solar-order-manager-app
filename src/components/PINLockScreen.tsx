import React, { useState, useEffect } from 'react';
import { Shield, Lock, ChevronRight, X, Delete, SunMedium, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

interface PINLockScreenProps {
  onUnlock: () => void;
}

export default function PINLockScreen({ onUnlock }: PINLockScreenProps) {
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  
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

  useEffect(() => {
    // Physical keyboard listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  // Handle auto-submit when exactly 4 digits are completed
  useEffect(() => {
    if (pin.length === 4) {
      const savedPin = localStorage.getItem('app_pin');
      if (pin === savedPin) {
        toast.success('ปลดล็อกสิทธิ์เข้าใช้งานสำเร็จ');
        onUnlock();
      } else {
        // Trigger shake effect and clear input
        setShake(true);
        toast.error('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
        const timer = setTimeout(() => {
          setShake(false);
          setPin('');
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [pin, onUnlock]);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-950 transition-colors flex flex-col items-center justify-center p-4 font-sans select-none">
      
      {/* Absolute brand header */}
      <div className="absolute top-8 flex flex-col items-center space-y-1.5">
        <img
          src={cachedLogo}
          alt="Logo"
          className="w-12 h-12 object-contain rounded-full border-2 border-amber-400 shadow-md bg-white p-0.5"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.jpg';
          }}
        />
        <h1 className="text-sm font-black text-slate-800 dark:text-white tracking-tight">
          {cachedName}
        </h1>
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
          Solar Secure Access
        </p>
      </div>

      {/* Main Lock Area */}
      <div className="w-full max-w-sm flex flex-col items-center justify-center space-y-8 mt-16">
        
        {/* Static Keyhole/Shield Icon */}
        <div className="flex flex-col items-center space-y-3">
          <div
            className="w-20 h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center shadow-md p-1 relative"
          >
            <img
              src={cachedLogo}
              alt="Logo"
              className="w-full h-full object-contain rounded-full"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.jpg';
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full border border-white dark:border-slate-900 shadow-2xs">
              <Lock size={12} />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white">กรุณาใส่รหัส PIN 4 หลัก</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">ระบุรหัสเข้าใช้งานส่วนบุคคลเพื่อเปิดเผยข้อมูลธุรกรรมการเงิน</p>
          </div>
        </div>

        {/* Input PIN Progress Dots with shake animation support */}
        <motion.div 
          animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center space-x-5"
        >
          {[0, 1, 2, 3].map((index) => {
            const isActive = pin.length > index;
            return (
              <div key={index} className="relative">
                <motion.div
                  animate={{
                    scale: isActive ? 1.25 : 1,
                    backgroundColor: isActive ? '#f59e0b' : 'rgba(148, 163, 184, 0.3)'
                  }}
                  className="w-4 h-4 rounded-full transition-all duration-150 shadow-2xs border border-transparent"
                />
                {isActive && showPin && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">
                    {pin[index]}
                  </span>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* Show/Hide PIN code button */}
        {pin.length > 0 && (
          <button
            onClick={() => setShowPin(!showPin)}
            className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-amber-500 transition-colors flex items-center space-x-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 p-1.5 px-3 rounded-full"
          >
            {showPin ? <EyeOff size={12} /> : <Eye size={12} />}
            <span>{showPin ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}</span>
          </button>
        )}

        {/* Grid Numpad Button Console */}
        <div className="grid grid-cols-3 gap-x-5 gap-y-4 w-full px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <motion.button
              key={num}
              onClick={() => handleDigit(num.toString())}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 1.15, y: -4, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)" }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="h-15 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-extrabold text-xl shadow-3xs border border-slate-200/60 dark:border-slate-800/80 transition-colors cursor-pointer flex items-center justify-center"
            >
              {num}
            </motion.button>
          ))}
          
          <motion.button
            onClick={handleClear}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="h-15 rounded-2xl bg-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-xs cursor-pointer flex items-center justify-center"
          >
            ล้างทั้งหมด
          </motion.button>

          <motion.button
            onClick={() => handleDigit('0')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 1.15, y: -4, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)" }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="h-15 rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-extrabold text-xl shadow-3xs border border-slate-200/60 dark:border-slate-800/80 transition-colors cursor-pointer flex items-center justify-center"
          >
            0
          </motion.button>

          <motion.button
            onClick={handleBackspace}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="h-15 rounded-2xl bg-transparent text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-bold transition-colors cursor-pointer flex items-center justify-center"
            title="ลบตัวสุดท้าย"
          >
            <Delete size={20} />
          </motion.button>
        </div>

      </div>

      {/* Footer lock note */}
      <div className="absolute bottom-6 flex items-center space-x-1.5 text-[10px] font-bold text-slate-400">
        <Shield size={12} className="text-slate-400" />
        <span>ระบบความปลอดภัย PIN ส่วนบุคคล • สิทธิ์ข้อมูลได้รับการปกป้องสูงสุด</span>
      </div>

    </div>
  );
}
