// VoiceFlow Pro Mobile - Theme System

export { colors, type ColorScheme, type ThemeColors } from './colors';
export { typography, fontFamilies, fontSizes, lineHeights, fontWeights, type TypographyVariant } from './typography';
export { spacing, borderRadius, shadows, iconSizes, touchTargets, type SpacingKey, type BorderRadiusKey, type ShadowKey, type IconSizeKey } from './spacing';

import { colors, ColorScheme } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows, iconSizes, touchTargets } from './spacing';

export const theme = {
  light: {
    colors: colors.light,
    typography,
    spacing,
    borderRadius,
    shadows,
    iconSizes,
    touchTargets,
  },
  dark: {
    colors: colors.dark,
    typography,
    spacing,
    borderRadius,
    shadows,
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

