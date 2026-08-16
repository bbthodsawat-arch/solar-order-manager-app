import { useState, useEffect, useCallback } from 'react';
import { 
  DesignSystemConfig, 
  ThemeId, 
  VisualStyleId, 
  RadiusToken, 
  ShadowToken, 
  FontToken, 
  DensityToken, 
  BorderStyleToken, 
  AnimationSpeedToken, 
  LayoutPresetId,
  WidgetStyleConfig 
} from '../types/designSystem';
import { DEFAULT_DESIGN_CONFIG, SOM_THEMES, SOM_VISUAL_STYLES, LAYOUT_PRESETS } from '../lib/designSystemPresets';
import { useAppConfig } from './useAppConfig';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'som_design_system_config_v2';

export function useDesignSystem() {
  const { config, updateTheme, updateDisplayDensity, updateWidgetConfig } = useAppConfig();

  const [designConfig, setDesignConfig] = useState<DesignSystemConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_DESIGN_CONFIG, ...parsed };
        }
      } catch (err) {
        console.error('Error loading design system config from localStorage:', err);
      }
    }
    return DEFAULT_DESIGN_CONFIG;
  });

  // Sync to localStorage and dispatch event whenever designConfig changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(designConfig));
        window.dispatchEvent(new CustomEvent('som-design-system-change', { detail: designConfig }));
      } catch (err) {
        console.error('Error saving design system config:', err);
      }
    }
  }, [designConfig]);

  // Listen for storage events (multi-tab or cross-component sync)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setDesignConfig(prev => ({ ...prev, ...parsed }));
        } catch (err) {
          console.error(err);
        }
      }
    };

    const handleCustomEvent = (e: any) => {
      if (e.detail) {
        setDesignConfig(e.detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('som-design-system-change', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('som-design-system-change', handleCustomEvent);
    };
  }, []);

  // Action: Set Theme Preset
  const setThemePreset = useCallback((themeId: ThemeId) => {
    const preset = SOM_THEMES.find(t => t.id === themeId);
    if (!preset) return;

    const newConfig: DesignSystemConfig = {
      ...designConfig,
      themeId: preset.id,
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      accentColor: preset.colors.accent,
      visualStyle: preset.recommendedStyle || designConfig.visualStyle,
      radius: preset.recommendedRadius || designConfig.radius,
      font: preset.recommendedFont || designConfig.font
    };

    setDesignConfig(newConfig);

    // Also update legacy appConfig.theme for backwards compatibility
    updateTheme({
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
      accentName: preset.id,
      paletteName: preset.labelThai
    });

    toast.success(`เปลี่ยนธีมเป็น "${preset.name}" เรียบร้อยแล้ว`, { id: 'theme-preset-toast' });
  }, [designConfig, updateTheme]);

  // Action: Set Visual Style
  const setVisualStyle = useCallback((styleId: VisualStyleId) => {
    const stylePreset = SOM_VISUAL_STYLES.find(s => s.id === styleId);
    if (!stylePreset) return;

    setDesignConfig(prev => ({
      ...prev,
      visualStyle: styleId
    }));

    toast.success(`เปลี่ยนสไตล์เป็น "${stylePreset.name}" เรียบร้อย`, { id: 'style-toast' });
  }, []);

  // Action: Update Custom Tokens
  const updateTokens = useCallback((partial: Partial<DesignSystemConfig>) => {
    setDesignConfig(prev => {
      const updated = { ...prev, ...partial };
      
      // If primary color is modified, mark theme as custom
      if (partial.primaryColor && partial.primaryColor !== prev.primaryColor) {
        const matchingPreset = SOM_THEMES.find(t => t.colors.primary === partial.primaryColor);
        if (!matchingPreset) {
          updated.themeId = 'custom';
        }
      }

      // If density updated, sync with appConfig
      if (partial.density && (partial.density === 'compact' || partial.density === 'comfortable')) {
        updateDisplayDensity(partial.density);
      }

      return updated;
    });
  }, [updateDisplayDensity]);

  // Action: Apply Layout Preset
  const applyLayoutPreset = useCallback((presetId: LayoutPresetId) => {
    const preset = LAYOUT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    // Create partial widget config where only preset keys are true
    const currentWidgets = config.dashboardWidgets || {};
    const newWidgetConfig: Record<string, boolean> = {};

    // Keys that exist in widgets
    const allWidgetToggleKeys = [
      'showPinnedMetrics',
      'showDailyRevenueGoal',
      'showSmartBudgetAlerts',
      'showTotalIncome',
      'showTotalExpense',
      'showNetProfit',
      'showUnpaid',
      'showSolarSales',
      'showWeeklyTrend',
      'showCategorySalesSummary',
      'showQuickShortcuts',
      'showDueAlerts',
      'showTrendChart',
      'showCategoryBreakdown',
      'showMonthlyBudget',
      'showStockInventory',
      'showQuickNotes',
      'showRecentSolarTable',
      'showRecentTransactionsList'
    ];

    allWidgetToggleKeys.forEach(k => {
      newWidgetConfig[k] = preset.widgetKeys.includes(k);
    });

    updateWidgetConfig(newWidgetConfig);
    setDesignConfig(prev => ({ ...prev, layoutPreset: presetId }));
    toast.success(`ปรับเลย์เอาต์หน้าแรกเป็น "${preset.name}" สำเร็จ`, { id: 'layout-preset-toast' });
  }, [config.dashboardWidgets, updateWidgetConfig]);

  // Action: Update Widget Custom Style
  const updateWidgetStyle = useCallback((widgetKey: string, styleConfig: WidgetStyleConfig) => {
    setDesignConfig(prev => ({
      ...prev,
      widgetCustomStyles: {
        ...(prev.widgetCustomStyles || {}),
        [widgetKey]: {
          ...(prev.widgetCustomStyles?.[widgetKey] || {}),
          ...styleConfig
        }
      }
    }));
  }, []);

  // Action: Reset to Defaults
  const resetToDefaults = useCallback(() => {
    setDesignConfig(DEFAULT_DESIGN_CONFIG);
    updateDisplayDensity('comfortable');
    updateTheme({
      primaryColor: DEFAULT_DESIGN_CONFIG.primaryColor,
      secondaryColor: DEFAULT_DESIGN_CONFIG.secondaryColor,
      accentName: 'modern-solar',
      paletteName: 'Modern Solar'
    });
    toast.success('คืนค่าการตั้งค่าดีไซน์เริ่มต้นเรียบร้อยแล้ว', { id: 'reset-design-toast' });
  }, [updateDisplayDensity, updateTheme]);

  // Action: Export Config JSON
  const exportConfigJSON = useCallback(() => {
    return JSON.stringify(designConfig, null, 2);
  }, [designConfig]);

  // Action: Import Config JSON
  const importConfigJSON = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON structure');

      const merged: DesignSystemConfig = {
        ...DEFAULT_DESIGN_CONFIG,
        ...parsed,
        version: 2
      };

      setDesignConfig(merged);

      if (merged.primaryColor) {
        updateTheme({
          primaryColor: merged.primaryColor,
          secondaryColor: merged.secondaryColor,
          accentName: merged.themeId || 'custom',
          paletteName: 'Custom Imported Theme'
        });
      }

      if (merged.density === 'compact' || merged.density === 'comfortable') {
        updateDisplayDensity(merged.density);
      }

      toast.success('นำเข้าชุดการตั้งค่าดีไซน์สำเร็จ', { id: 'import-design-toast' });
      return true;
    } catch (err) {
      console.error(err);
      toast.error('ไฟล์การตั้งค่าไม่ถูกต้อง ไม่สามารถนำเข้าได้');
      return false;
    }
  }, [updateTheme, updateDisplayDensity]);

  return {
    designConfig,
    setThemePreset,
    setVisualStyle,
    updateTokens,
    applyLayoutPreset,
    updateWidgetStyle,
    resetToDefaults,
    exportConfigJSON,
    importConfigJSON,
    themes: SOM_THEMES,
    visualStyles: SOM_VISUAL_STYLES,
    layoutPresets: LAYOUT_PRESETS
  };
}
