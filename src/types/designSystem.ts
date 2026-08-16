export type ThemeId = 
  | 'modern-solar'
  | 'cute-modern'
  | 'apple-minimal'
  | 'cyber-neon'
  | 'forest-eco'
  | 'royal-luxury'
  | 'sunset-warmth'
  | 'nordic-frost'
  | 'slate-monochrome'
  | 'midnight-deep'
  | 'custom';

export type VisualStyleId = 
  | 'flat-clean'
  | 'soft-neumorphic'
  | 'glassmorphism'
  | 'dimensional'
  | 'cute-pastel'
  | 'high-contrast';

export type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'pill';
export type ShadowToken = 'none' | 'soft' | 'medium' | 'deep' | 'glow';
export type FontToken = 'prompt' | 'sarabun' | 'chakra' | 'kanit';
export type DensityToken = 'compact' | 'comfortable' | 'spacious';
export type BorderStyleToken = 'subtle' | 'solid' | 'dashed' | 'glow' | 'none';
export type AnimationSpeedToken = 'instant' | 'normal' | 'smooth';
export type LayoutPresetId = 'executive' | 'operations' | 'analytics' | 'full' | 'custom';

export interface ColorPaletteDefinition {
  primary: string;
  secondary: string;
  accent: string;
  backgroundLight: string;
  surfaceLight: string;
  cardLight: string;
  borderLight: string;
  textPrimaryLight: string;
  textSecondaryLight: string;
  backgroundDark: string;
  surfaceDark: string;
  cardDark: string;
  borderDark: string;
  textPrimaryDark: string;
  textSecondaryDark: string;
  gradientClass: string;
}

export interface SOMThemePreset {
  id: ThemeId;
  name: string;
  labelThai: string;
  description: string;
  tagline: string;
  badge: string;
  category: 'Modern' | 'Playful' | 'Luxury' | 'Nature' | 'Tech' | 'Minimal';
  colors: ColorPaletteDefinition;
  recommendedStyle: VisualStyleId;
  recommendedRadius: RadiusToken;
  recommendedFont: FontToken;
}

export interface SOMVisualStylePreset {
  id: VisualStyleId;
  name: string;
  labelThai: string;
  description: string;
  iconName: string;
  badge: string;
  cardClass: string;
  cardDarkClass: string;
  previewBorderColor: string;
  previewBg: string;
}

export interface WidgetStyleConfig {
  cardStyle?: 'default' | 'elevated' | 'glass' | 'tinted' | 'bordered';
  headerColor?: string;
  showIconBadge?: boolean;
  compactMode?: boolean;
}

export interface DesignPresetDefinition {
  id: string;
  name: string;
  nameThai: string;
  tagline: string;
  description: string;
  badge: string;
  category: 'Official' | 'Custom';
  gradient: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  config: {
    themeId: ThemeId;
    visualStyle: VisualStyleId;
    density: DensityToken;
    radius: RadiusToken;
    shadow: ShadowToken;
    font: FontToken;
    borderStyle?: BorderStyleToken;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
}

export interface DesignSystemConfig {
  version: number;
  themeId: ThemeId;
  visualStyle: VisualStyleId;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  radius: RadiusToken;
  shadow: ShadowToken;
  font: FontToken;
  density: DensityToken;
  borderStyle: BorderStyleToken;
  animationSpeed: AnimationSpeedToken;
  cardBgOpacity: number; // 70 to 100
  glassBlurPx: number; // 4 to 24
  enableGlowEffects: boolean;
  enablePageTransitions: boolean;
  layoutPreset: LayoutPresetId;
  widgetCustomStyles?: Record<string, WidgetStyleConfig>;
}
