import { useDailyReminder } from '../hooks/useDailyReminder';
import { Bell, Clock, Volume2, VolumeX, CheckCircle2, AlertTriangle, Send, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

export default function DailyReminderSettings() {
  const {
    config,
    setConfig,
    permission,
    requestPermission,
    recordedTodayCount,
    hasRecordedToday,
    triggerTestNotification
  } = useDailyReminder();

  const handleTimeChange = (newTime: string) => {
    setConfig(prev => ({ ...prev, reminderTime: newTime }));
  };

  const handleToggleEnabled = () => {
    const nextVal = !config.enabled;
    setConfig(prev => ({ ...prev, enabled: nextVal }));
    if (nextVal && permission !== 'granted') {
      requestPermission();
    }
  };

  const timePresets = ['18:00', '19:00', '20:00', '21:00'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Bell size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                ระบบเตือนบันทึกรายรับ-รายจ่ายประจำวัน
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold border border-amber-200 dark:border-amber-800">
                Daily Reminder
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              แจ้งเตือนอัตโนมัติในตอนเย็นเพื่อให้คุณบันทึกบัญชีร้านค้าและยอดขายโซล่าเซลล์ได้ครบถ้วนสม่ำเสมอ
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <button
          onClick={handleToggleEnabled}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 border ${
            config.enabled
              ? 'bg-amber-500 text-white border-amber-400 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
          <span>{config.enabled ? 'เปิดการแจ้งเตือน' : 'ปิดการแจ้งเตือน'}</span>
        </button>
      </div>

      {/* Today's Data Entry Status Badge */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${
        hasRecordedToday
          ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
          : 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300'
      }`}>
        <div className="flex items-center space-x-3">
          {hasRecordedToday ? (
            <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={22} className="text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <div>
            <p className="font-bold text-xs">
              {hasRecordedToday
                ? `บันทึกรายการประจำวันนี้เรียบร้อยแล้ว (${recordedTodayCount} รายการ)`
                : 'วันนี้ยังไม่ได้บันทึกรายการบัญชีประจำวัน'}
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {hasRecordedToday
                ? 'ข้อมูลบัญชีวันนี้อัปเดตเป็นปัจจุบันแล้ว ระบบจะไม่ส่งเสียงรบกวนในเย็นนี้'
                : `ระบบจะแจ้งเตือนเมื่อถึงเวลา ${config.reminderTime} น. หากยังไม่มีการลงบัญชี`}
            </p>
          </div>
        </div>
      </div>

      {config.enabled && (
        <div className="space-y-5 animate-fade-in pt-1">
          {/* Time Picker & Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Clock size={15} className="text-amber-500" />
              <span>เวลาแจ้งเตือนประจำวันช่วงเย็น:</span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {/* Custom Time Input */}
              <input
                type="time"
                value={config.reminderTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />

              {/* Time Presets */}
              <div className="flex items-center space-x-1.5">
                {timePresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleTimeChange(preset)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      config.reminderTime === preset
                        ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-white border-transparent shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {preset} น.
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settings Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Sound Chime Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center space-x-2.5">
                {config.soundEnabled ? (
                  <Volume2 size={18} className="text-amber-500" />
                ) : (
                  <VolumeX size={18} className="text-slate-400" />
                )}
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">เสียงแจ้งเตือน (Chime)</p>
                  <p className="text-[10px] text-slate-400">ส่งเสียงแจ้งเตือนสั้นๆ เมื่อถึงเวลา</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.soundEnabled}
                onChange={(e) => setConfig(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
              />
            </div>

            {/* Permission Status */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center space-x-2.5">
                {permission === 'granted' ? (
                  <ShieldCheck size={18} className="text-emerald-500" />
                ) : (
                  <ShieldAlert size={18} className="text-amber-500" />
                )}
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">สิทธิ์สเปกตรัมแจ้งเตือนเบราว์เซอร์</p>
                  <p className="text-[10px] text-slate-400">
                    {permission === 'granted' ? 'ได้รับอนุญาตแล้ว (Active)' : 'ยังไม่ได้เปิดสิทธิ์เบราว์เซอร์'}
                  </p>
                </div>
              </div>

              {permission !== 'granted' && (
                <button
                  onClick={requestPermission}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold"
                >
                  เปิดสิทธิ์
                </button>
              )}
            </div>
          </div>

          {/* Test Notification Action */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={triggerTestNotification}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center space-x-2 border border-slate-200 dark:border-slate-700"
            >
              <Send size={14} className="text-amber-500" />
              <span>ทดสอบส่งการแจ้งเตือนทันที</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
