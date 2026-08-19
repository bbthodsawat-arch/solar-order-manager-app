import { useEffect } from 'react';

/**
 * SOM is intentionally Light Mode only.
 * Theme selection is handled by the global design-system presets; this hook
 * must never follow the device color scheme or expose a Dark Mode switch.
 */
export type Theme = 'light';

export function useTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    localStorage.setItem('theme', 'light');
  }, []);

  const toggleTheme = () => {
    // Kept as a compatibility no-op for existing callers.
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    localStorage.setItem('theme', 'light');
  };

  return {
    theme: 'light' as const,
    isDarkMode: false,
    toggleTheme,
  };
}

export function useChartTheme() {
  useTheme();

  const chartColors = {
    isDarkMode: false,
    textColor: '#1e293b',
    subtextColor: '#64748b',
    gridColor: 'rgba(203, 213, 225, 0.6)',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e2e8f0',
    tooltipText: '#0f172a',
    cardBg: '#ffffff',
    incomeColor: '#22c55e',
    expenseColor: '#ef4444',
    profitColor: '#3b82f6',
    pieColors: [
      '#ef4444', '#f97316', '#f59e0b', '#eab308',
      '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'
    ]
  };

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
        if (Chart.instances) {
          Object.values(Chart.instances).forEach((instance: any) => {
            if (instance && typeof instance.update === 'function') instance.update();
          });
        }
      }
    }
  }, []);

  return {
    isDarkMode: false,
    theme: 'light' as const,
    toggleTheme: () => undefined,
    chartColors,
  };
}
