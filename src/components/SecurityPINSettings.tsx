import React, { useState } from 'react';
import { Shield, KeyRound, Check, RefreshCw, X, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SecurityPINSettingsProps {
  onLockApp?: () => void;
}

export default function SecurityPINSettings({ onLockApp }: SecurityPINSettingsProps) {
  const [pinEnabled, setPinEnabled] = useState<boolean>(!!localStorage.getItem('app_pin'));
  const [isChanging, setIsChanging] = useState<boolean>(false);
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleToggle = () => {
    const hasPin = !!localStorage.getItem('app_pin');
    if (hasPin) {
      // Need to authenticate old PIN first to turn off
      setIsChanging(true);
      setErrorMsg('กรุณากรอกรหัส PIN ปัจจุบันเพื่อปิดการใช้งาน');
    } else {
      // Start setting up new PIN
      setIsChanging(true);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setErrorMsg('');
    }
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const hasPin = !!localStorage.getItem('app_pin');

    // 1. If disabling or changing, validate old PIN first
    if (hasPin) {
      const savedPin = localStorage.getItem('app_pin');
      if (oldPin !== savedPin) {
        setErrorMsg('รหัส PIN ปัจจุบันไม่ถูกต้อง');
        toast.error('รหัส PIN ปัจจุบันไม่ถูกต้อง');
        return;
      }

      // If they just wanted to turn it off (newPin is empty)
      if (!newPin && !confirmPin) {
        localStorage.removeItem('app_pin');
        setPinEnabled(false);
        setIsChanging(false);
        setOldPin('');
        toast.success('ปิดการใช้งานรหัส PIN สำเร็จเรียบร้อยแล้ว');
        return;
      }
    }

    // 2. Validate new PIN
    if (!/^\d{4}$/.test(newPin)) {
      setErrorMsg('รหัส PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น');
      toast.error('รหัส PIN ต้องเป็นตัวเลข 4 หลัก');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('รหัส PIN ใหม่ไม่ตรงกัน');
      toast.error('รหัส PIN ยืนยันไม่ตรงกัน');
      return;
    }

    // 3. Save new PIN
    localStorage.setItem('app_pin', newPin);
    setPinEnabled(true);
    setIsChanging(false);
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    toast.success('ตั้งค่ารหัส PIN ใหม่สำเร็จเรียบร้อยแล้ว!');
  };

  const handleCancel = () => {
    setIsChanging(false);
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setErrorMsg('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-white font-black text-sm flex items-center gap-1.5">
              ระบบล็อกความปลอดภัย (Security PIN)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              ล็อกสิทธิ์การเข้าถึงแอปพลิเคชันด้วยรหัสผ่าน PIN 4 หลัก เพื่อความเป็นส่วนตัวบนมือถือส่วนตัวหรือเครื่องใช้ร่วมกัน
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        {!isChanging && (
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
              pinEnabled ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                pinEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        )}
      </div>

      {pinEnabled && !isChanging && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/60">
          <div className="flex items-center space-x-2.5 text-xs text-slate-700 dark:text-slate-300">
            <Check size={16} className="text-amber-500 font-bold" />
            <span className="font-bold">ระบบความปลอดภัย PIN ล็อกเครื่องเปิดใช้งานอยู่</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsChanging(true)}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center space-x-1"
            >
              <RefreshCw size={13} className="text-slate-400" />
              <span>เปลี่ยนรหัส PIN</span>
            </button>

            {onLockApp && (
              <button
                onClick={onLockApp}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs"
              >
                <Lock size={13} />
                <span>ล็อกหน้าจอทันที</span>
              </button>
            )}
          </div>
        </div>
      )}

      {isChanging && (
        <form onSubmit={handleSavePin} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-4">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <KeyRound size={14} className="text-amber-500" />
            <span>{localStorage.getItem('app_pin') ? 'เปลี่ยนรหัสผ่านความปลอดภัย' : 'ตั้งค่ารหัส PIN ใหม่'}</span>
          </h4>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold text-center">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* If a pin is already configured, we require old pin */}
            {localStorage.getItem('app_pin') && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">รหัส PIN เดิม</label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d*"
                  inputMode="numeric"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="รหัสเดิม 4 หลัก"
                  className="w-full text-center tracking-widest font-black text-sm p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>
            )}

            {/* If they want to disable, they leave these blank but if enabling/changing we require them */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                {localStorage.getItem('app_pin') ? 'รหัส PIN ใหม่ (เว้นว่างหากต้องการปิดใช้งาน)' : 'รหัส PIN 4 หลักใหม่'}
              </label>
              <input
                type="password"
                maxLength={4}
                pattern="\d*"
                inputMode="numeric"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="ใหม่ 4 หลัก"
                className="w-full text-center tracking-widest font-black text-sm p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                required={!localStorage.getItem('app_pin')}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">ยืนยันรหัส PIN ใหม่</label>
              <input
                type="password"
                maxLength={4}
                pattern="\d*"
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="ยืนยันใหม่ 4 หลัก"
                className="w-full text-center tracking-widest font-black text-sm p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                required={!!newPin || !localStorage.getItem('app_pin')}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/60">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
            >
              ยืนยันการบันทึก
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
