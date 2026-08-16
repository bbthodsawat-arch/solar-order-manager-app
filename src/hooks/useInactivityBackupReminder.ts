import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { parseISO, differenceInDays, format, isValid } from 'date-fns';
import { exportDatabaseBackupJSON } from '../utils/backupExporter';
import toast from 'react-hot-toast';

export interface InactivityBackupConfig {
  enabled: boolean;
  inactivityDaysThreshold: number; // default 7
  lastDismissedDate: string; // YYYY-MM-DD
}

const STORAGE_KEY = 'inactivity_backup_reminder_config';

const DEFAULT_CONFIG: InactivityBackupConfig = {
  enabled: true,
  inactivityDaysThreshold: 7,
  lastDismissedDate: ''
};

export function useInactivityBackupReminder() {
  const { transactions } = useTransactions();

  const [config, setConfig] = useState<InactivityBackupConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse inactivity backup config', e);
    }
    return DEFAULT_CONFIG;
  });

  const [lastBackupIso, setLastBackupIso] = useState<string | null>(() => {
    return localStorage.getItem('solar_app_last_backup_date');
  });

  const [isExporting, setIsExporting] = useState(false);

  // Sync config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save inactivity backup config', e);
    }
  }, [config]);

  // Find latest transaction date
  const latestTransactionDate = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;

    let latest: Date | null = null;
    transactions.forEach(t => {
      try {
        const d = parseISO(t.date);
        if (isValid(d)) {
          if (!latest || d > latest) {
            latest = d;
          }
        }
      } catch (e) {}
    });

    return latest;
  }, [transactions]);

  // Calculate days since last transaction
  const daysSinceLastTransaction = useMemo(() => {
    if (!latestTransactionDate) return 999; // no transactions logged yet
    return Math.max(0, differenceInDays(new Date(), latestTransactionDate));
  }, [latestTransactionDate]);

  // Calculate days since last backup
  const daysSinceLastBackup = useMemo(() => {
    if (!lastBackupIso) return null; // never backed up
    try {
      const d = parseISO(lastBackupIso);
      if (!isValid(d)) return null;
      return Math.max(0, differenceInDays(new Date(), d));
    } catch (e) {
      return null;
    }
  }, [lastBackupIso]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Logic: Should show reminder if no transactions for N (e.g. 7) days AND last backup was >= N days ago (or never) AND not dismissed today
  const shouldShowReminder = useMemo(() => {
    if (!config.enabled) return false;
    if (config.lastDismissedDate === todayStr) return false;

    // Check transaction inactivity
    const isInactive = daysSinceLastTransaction >= config.inactivityDaysThreshold;

    // Check backup staleness
    const isBackupStale = daysSinceLastBackup === null || daysSinceLastBackup >= config.inactivityDaysThreshold;

    return isInactive && isBackupStale;
  }, [config.enabled, config.lastDismissedDate, config.inactivityDaysThreshold, daysSinceLastTransaction, daysSinceLastBackup, todayStr]);

  const dismissForToday = useCallback(() => {
    setConfig(prev => ({ ...prev, lastDismissedDate: todayStr }));
    toast.success('ปิดการแจ้งเตือนสำรองข้อมูลสำหรับวันนี้แล้ว');
  }, [todayStr]);

  const triggerInstantBackup = useCallback(async () => {
    setIsExporting(true);
    const success = await exportDatabaseBackupJSON();
    setIsExporting(false);

    if (success) {
      const nowIso = new Date().toISOString();
      setLastBackupIso(nowIso);
      setConfig(prev => ({ ...prev, lastDismissedDate: todayStr }));
    }
    return success;
  }, [todayStr]);

  const updateConfig = useCallback((newPartial: Partial<InactivityBackupConfig>) => {
    setConfig(prev => ({ ...prev, ...newPartial }));
    toast.success('อัปเดตการตั้งค่าแจ้งเตือนสำรองข้อมูลเรียบร้อย');
  }, []);

  return {
    shouldShowReminder,
    daysSinceLastTransaction,
    latestTransactionDate,
    daysSinceLastBackup,
    lastBackupIso,
    isExporting,
    config,
    dismissForToday,
    triggerInstantBackup,
    updateConfig
  };
}
