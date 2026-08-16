import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    window.dispatchEvent(new Event('theme-change'));
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = () => {
      const current = localStorage.getItem('theme') as Theme;
      if (current && (current === 'light' || current === 'dark')) {
        setTheme(current);
      } else {
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'dark' : 'light');
      }
    };

    window.addEventListener('theme-change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDarkMode = theme === 'dark';

  return { theme, isDarkMode, toggleTheme };
}

export function useChartTheme() {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const chartColors = {
    isDarkMode,
    textColor: isDarkMode ? '#f8fafc' : '#1e293b',
    subtextColor: isDarkMode ? '#94a3b8' : '#64748b',
    gridColor: isDarkMode ? 'rgba(148, 163, 184, 0.2)' : 'rgba(203, 213, 225, 0.6)',
    tooltipBg: isDarkMode ? '#1e293b' : '#ffffff',
    tooltipBorder: isDarkMode ? '#334155' : '#e2e8f0',
    tooltipText: isDarkMode ? '#f8fafc' : '#0f172a',
    cardBg: isDarkMode ? '#0f172a' : '#ffffff',
    incomeColor: '#22c55e',
    expenseColor: '#ef4444',
    profitColor: '#3b82f6',
    pieColors: [
      '#ef4444', '#f97316', '#f59e0b', '#eab308',
      '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'
    ]
  };

  // Synchronize Chart.js global config dynamically if Chart.js is loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Chart) {
      const Chart = (window as any).Chart;
      if (Chart.defaults) {
        Chart.defaults.color = chartColors.subtextColor;
        Chart.defaults.borderColor = chartColors.gridColor;
        if (Chart.defaults.plugins?.tooltip) {
          Chart.defaults.plugins.tooltip.backgroundColor = chartColors.tooltipBg;
          Chart.defaults.plugins.tooltip.titleColor = chartColors.tooltipText;
          Chart.defaults.plugins.tooltip.bodyColor = chartColors.tooltipText;
          Chart.defaults.plugins.tooltip.borderColor = chartColors.tooltipBorder;
          Chart.defaults.plugins.tooltip.borderWidth = 1;
        }
        // Force update all active Chart.js instances if any
        if (Chart.instances) {
          Object.values(Chart.instances).forEach((instance: any) => {
            if (instance && typeof instance.update === 'function') {
              instance.update();
            }
          });
        }
      }
    }
  }, [isDarkMode, chartColors.gridColor, chartColors.subtextColor, chartColors.tooltipBg, chartColors.tooltipBorder, chartColors.tooltipText]);

  return { isDarkMode, theme, toggleTheme, chartColors };
}


