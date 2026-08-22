import { useState, useEffect } from 'react';
import { dbManager, DbProvider, DbHealthStatus, SyncStats } from '../lib/dbManager';

export interface UseDatabaseResult {
  preferredProvider: DbProvider;
  actualProvider: DbProvider;
  autoFailover: boolean;
  health: DbHealthStatus;
  isSyncing: boolean;
  setPreferredProvider: (provider: DbProvider) => void;
  setAutoFailover: (enabled: boolean) => void;
  runDiagnostics: () => Promise<DbHealthStatus>;
  syncDatabases: () => Promise<{ success: boolean; stats: SyncStats }>;
}

export function useDatabase(): UseDatabaseResult {
  const [dbState, setDbState] = useState(() => ({
    preferredProvider: dbManager.getPreferredProvider(),
    actualProvider: dbManager.getActualProvider(),
    autoFailover: dbManager.isAutoFailoverEnabled(),
    health: dbManager.getHealthStatus(),
  }));

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = dbManager.subscribe((state) => {
      setDbState({
        preferredProvider: state.preferredProvider,
        actualProvider: state.actualProvider,
        autoFailover: state.autoFailover,
        health: state.health,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const setPreferredProvider = (provider: DbProvider) => {
    dbManager.setPreferredProvider(provider);
  };

  const setAutoFailover = (enabled: boolean) => {
    dbManager.setAutoFailover(enabled);
  };

  const runDiagnostics = async () => {
    return await dbManager.runDiagnostics();
  };

  const syncDatabases = async () => {
    setIsSyncing(true);
    try {
      return await dbManager.syncDatabases();
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    ...dbState,
    isSyncing,
    setPreferredProvider,
    setAutoFailover,
    runDiagnostics,
    syncDatabases,
  };
}
