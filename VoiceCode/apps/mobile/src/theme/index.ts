// VoiceCode Mobile - Theme System
// Apple-inspired design system with SF Pro typography and elevation

export { colors, type ColorScheme, type ThemeColors } from './colors';
export { typography, fontFamilies, fontSizes, lineHeights, fontWeights, type TypographyVariant } from './typography';
export { spacing, borderRadius, shadows, iconSizes, touchTargets, type SpacingKey, type BorderRadiusKey, type ShadowKey, type IconSizeKey } from './spacing';
export { elevation, blurIntensity, type ElevationKey, type BlurIntensityKey, type BlurTint, type ElevationStyle } from './elevation';

import { colors, ColorScheme } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows, iconSizes, touchTargets } from './spacing';
import { elevation, blurIntensity } from './elevation';

export const theme = {
  light: {
    colors: colors.light,
    typography,
    spacing,
    borderRadius,
    shadows,
    elevation,
    blurIntensity,
    iconSizes,
    touchTargets,
  },
  dark: {
    colors: colors.dark,
    typography,
    spacing,
    borderRadius,
    shadows,
    elevation,
    blurIntensity,
    iconSizes,
    touchTargets,
  },
};

export type Theme = typeof theme.light;
export type ThemeMode = 'light' | 'dark' | 'auto';

// Helper function to get theme based on mode
export const getTheme = (mode: ColorScheme): Theme => {
  return theme[mode];
};

