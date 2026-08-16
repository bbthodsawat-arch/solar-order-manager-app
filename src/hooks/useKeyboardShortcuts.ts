import { useEffect } from 'react';

type Tab = 'dashboard' | 'add' | 'history' | 'reports' | 'settings' | 'users';

export function useKeyboardShortcuts(
  setActiveTab: (tab: Tab) => void,
  setQuickAddData: (data: null) => void,
  userPerms: { canAddTransactions: boolean; canViewDashboard: boolean }
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if the user is typing in an input, textarea, or contenteditable element
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case 'a':
          if (userPerms.canAddTransactions) {
            setQuickAddData(null);
            setActiveTab('add');
          }
          break;
        case 'd':
          if (userPerms.canViewDashboard) {
            setActiveTab('dashboard');
          }
          break;
        case 'h':
          setActiveTab('history');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, setQuickAddData, userPerms]);
}
