import { useState, useEffect, useCallback } from 'react';
import { useTransactions } from './useTransactions';
import { format, parseISO, isToday } from 'date-fns';
import { toast } from 'react-hot-toast';

export interface DailyReminderConfig {
  enabled: boolean;
  reminderTime: string; // HH:mm format, e.g. "20:00"
  soundEnabled: boolean;
  lastDismissedDate: string; // YYYY-MM-DD
}

const STORAGE_KEY = 'daily_reminder_config';

const DEFAULT_CONFIG: DailyReminderConfig = {
  enabled: true,
  reminderTime: '20:00',
  soundEnabled: true,
  lastDismissedDate: ''
};

export function useDailyReminder() {
  const { transactions } = useTransactions();
  
  const [config, setConfig] = useState<DailyReminderConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse daily reminder config', e);
    }
    return DEFAULT_CONFIG;
  });

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });

  // Save config changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save daily reminder config', e);
    }
  }, [config]);

  // Count transactions recorded today
  const recordedTodayCount = transactions.filter(t => {
    try {
      return isToday(parseISO(t.date));
    } catch {
      return false;
    }
  }).length;

  const hasRecordedToday = recordedTodayCount > 0;

  // Function to request Web Notification permission
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('เบราว์เซอร์ของคุณไม่รองรับการแจ้งเตือนแบบ System Notification');
      return 'denied';
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        toast.success('อนุญาตการแจ้งเตือนเรียบร้อยแล้ว!');
      } else if (res === 'denied') {
        toast.error('การแจ้งเตือนถูกปฏิเสธในเบราว์เซอร์ กรุณาเปิดสิทธิ์ในตั้งค่าเบราว์เซอร์');
      }
      return res;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }, []);

  // Helper to play subtle audio chime
  const playChime = useCallback(() => {
    if (!config.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio chime playback failed:', e);
    }
  }, [config.soundEnabled]);

  // Dispatch System Notification + In-App Toast
  const sendNotification = useCallback((title: string, body: string, isTest = false) => {
    playChime();

    // 1. In-App Toast
    toast(body, {
      icon: '☀️',
      duration: 6000,
      style: {
        background: '#0f172a',
        color: '#ffffff',
        borderRadius: '16px',
        fontSize: '13px',
        border: '1px solid #334155'
      }
    });

    // 2. System Browser Notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'daily-reminder',
          requireInteraction: !isTest
        });

        notif.onclick = () => {
          window.focus();
          // Navigate to add transaction tab if available
          if (window.location.hash !== '#add') {
            window.location.hash = '#add';
          }
          notif.close();
        };
      } catch (e) {
        console.warn('System notification error:', e);
      }
    }
  }, [playChime]);

  // Test Notification Trigger
  const triggerTestNotification = useCallback(() => {
    if (Notification.permission !== 'granted') {
      requestPermission().then((res) => {
        if (res === 'granted') {
          sendNotification(
            'ทดสอบการแจ้งเตือน • ร้านกลางนาโซล่าเซลล์ ☀️',
            'ระบบแจ้งเตือนทำงานเรียบร้อย! คุณจะได้รับข้อความเตือนให้ลงบัญชีทุกวันเวลา ' + config.reminderTime + ' น.',
            true
          );
        }
      });
    } else {
      sendNotification(
        'ทดสอบการแจ้งเตือน • ร้านกลางนาโซล่าเซลล์ ☀️',
        'ระบบแจ้งเตือนทำงานเรียบร้อย! คุณจะได้รับข้อความเตือนให้ลงบัญชีทุกวันเวลา ' + config.reminderTime + ' น.',
        true
      );
    }
  }, [config.reminderTime, requestPermission, sendNotification]);

  // Dismiss reminder for today
  const dismissForToday = useCallback(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setConfig(prev => ({ ...prev, lastDismissedDate: todayStr }));
    toast.success('รับทราบการเตือนวันนี้แล้ว');
  }, []);

  // Periodic interval check (runs every 30 seconds)
  useEffect(() => {
    if (!config.enabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      const currentTimeStr = format(now, 'HH:mm');

      // Do not trigger if already dismissed today or already recorded transactions today
      if (config.lastDismissedDate === todayStr || hasRecordedToday) {
        return;
      }

      // Compare current time with configured reminder time
      if (currentTimeStr >= config.reminderTime) {
        // Send notification & update lastDismissedDate so it triggers only once per day
        sendNotification(
          'เตือนบันทึกรายรับ-รายจ่ายประจำวัน ☀️',
          `ถึงเวลา ${config.reminderTime} น. แล้ว! กรุณาบันทึกรายการขาย โซล่าเซลล์ หรือค่าใช้จ่ายประจำวันนี้เพื่อบัญชีที่ถูกต้อง`
        );
        setConfig(prev => ({ ...prev, lastDismissedDate: todayStr }));
      }
    }, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [config, hasRecordedToday, sendNotification]);

  // Check if evening reminder should show in UI right now
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentTimeStr = format(new Date(), 'HH:mm');
  const isPastReminderTime = currentTimeStr >= config.reminderTime;
  const shouldShowBanner = config.enabled && !hasRecordedToday && config.lastDismissedDate !== todayStr && isPastReminderTime;

  return {
    config,
    setConfig,
    permission,
    requestPermission,
    recordedTodayCount,
    hasRecordedToday,
    shouldShowBanner,
    triggerTestNotification,
    dismissForToday
  };
}
