import React from 'react';
import type { ThemeId } from '../../types/designSystem';
import { OneClickDesignGallery } from './OneClickDesignGallery';

interface ThemeSelectorGridProps {
  currentThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemeSelectorGrid: React.FC<ThemeSelectorGridProps> = () => {
  return <OneClickDesignGallery />;
};
