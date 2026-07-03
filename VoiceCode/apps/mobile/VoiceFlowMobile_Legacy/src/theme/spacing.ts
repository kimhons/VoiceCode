// VoiceCode Pro Mobile - Spacing System

// Base unit: 4px
const BASE_UNIT = 4;

export const spacing = {
  xs: BASE_UNIT,           // 4px
  sm: BASE_UNIT * 2,       // 8px
  md: BASE_UNIT * 4,       // 16px
  lg: BASE_UNIT * 6,       // 24px
  xl: BASE_UNIT * 8,       // 32px
  '2xl': BASE_UNIT * 12,   // 48px
  '3xl': BASE_UNIT * 16,   // 64px
  '4xl': BASE_UNIT * 20,   // 80px
  '5xl': BASE_UNIT * 24,   // 96px
};

// Border Radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Shadows
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 8,
  },
};

// Icon Sizes
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Touch Target Sizes (minimum 44px for accessibility)
export const touchTargets = {
  small: 36,
  medium: 44,
  large: 56,
};

export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
export type ShadowKey = keyof typeof shadows;
export type IconSizeKey = keyof typeof iconSizes;

