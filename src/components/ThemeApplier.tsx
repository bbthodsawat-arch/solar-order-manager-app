import React, { useEffect } from 'react';
import { useDesignSystem } from '../hooks/useDesignSystem';
import { useAppConfig } from '../hooks/useAppConfig';
import { FONT_TOKENS, RADIUS_TOKENS } from '../lib/designSystemPresets';

export const ThemeApplier: React.FC = () => {
  const { designConfig } = useDesignSystem();
  const { displayDensity } = useAppConfig();

  useEffect(() => {
    const root = document.documentElement;
    
    // 1. Primary Colors
    let hex = designConfig.primaryColor || '#d97706';
    if (!/^#[0-9A-Fa-f]{6}$/i.test(hex)) hex = '#d97706';
    
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    root.style.setProperty('--brand-primary', hex);
    root.style.setProperty('--brand-primary-soft', `rgba(${r}, ${g}, ${b}, 0.12)`);
    root.style.setProperty('--brand-primary-border', `rgba(${r}, ${g}, ${b}, 0.25)`);
    root.style.setProperty('--brand-primary-text', hex);

    // 2. Secondary Colors
    let secHex = designConfig.secondaryColor || '#0284c7';
    if (!/^#[0-9A-Fa-f]{6}$/i.test(secHex)) secHex = hex;

    const sr = parseInt(secHex.slice(1, 3), 16);
    const sg = parseInt(secHex.slice(3, 5), 16);
    const sb = parseInt(secHex.slice(5, 7), 16);

    root.style.setProperty('--brand-secondary', secHex);
    root.style.setProperty('--brand-secondary-soft', `rgba(${sr}, ${sg}, ${sb}, 0.12)`);
    root.style.setProperty('--brand-secondary-border', `rgba(${sr}, ${sg}, ${sb}, 0.25)`);

    // 3. Accent Color
    let accHex = designConfig.accentColor || '#f59e0b';
    if (/^#[0-9A-Fa-f]{6}$/i.test(accHex)) {
      root.style.setProperty('--brand-accent', accHex);
    }

    // 4. Data Attributes for Visual Style & Tokens
    root.setAttribute('data-theme', designConfig.themeId);
    root.setAttribute('data-style', designConfig.visualStyle);
    root.setAttribute('data-radius', designConfig.radius);
    root.setAttribute('data-shadow', designConfig.shadow);
    root.setAttribute('data-font', designConfig.font);
    root.setAttribute('data-density', designConfig.density || displayDensity || 'comfortable');
    root.setAttribute('data-border', designConfig.borderStyle || 'subtle');

    // 5. Dynamic Radius Pixel Variable
    const radiusDef = RADIUS_TOKENS.find(r => r.id === designConfig.radius);
    if (radiusDef) {
      root.style.setProperty('--sys-radius-card', radiusDef.px);
    }

    // 6. Dynamic Font Family Variable
    const fontDef = FONT_TOKENS.find(f => f.id === designConfig.font);
    if (fontDef) {
      root.style.setProperty('--sys-font-family', fontDef.cssFont);
    }

    // 7. Density Compact class compatibility
    if (designConfig.density === 'compact' || displayDensity === 'compact') {
      root.classList.add('density-compact');
    } else {
      root.classList.remove('density-compact');
    }

  }, [designConfig, displayDensity]);

  return null;
};
