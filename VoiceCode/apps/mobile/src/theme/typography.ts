// VoiceCode Mobile - Typography System
// Apple-inspired typography with SF Pro font family

import { Platform } from 'react-native';

/**
 * Font Families - Apple SF Pro System
 *
 * iOS: Uses SF Pro Display for large text (>20pt) and SF Pro Text for body (<20pt)
 * Android: Uses Roboto as fallback
 *
 * SF Pro provides:
 * - Optimized readability at all sizes
 * - Dynamic Type support
 * - Consistent with iOS system fonts
 */
export const fontFamilies = {
  // SF Pro Display - For large text (headings, titles)
  display: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System',
  }),
  // SF Pro Text - For body text and UI elements
  text: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: 'System',
  }),
  // SF Pro Rounded - For friendly, approachable UI
  rounded: Platform.select({
    ios: 'SF Pro Rounded',
    android: 'Roboto',
    default: 'System',
  }),
  // SF Mono - For code and monospaced text
  mono: Platform.select({
    ios: 'SF Mono',
    android: 'monospace',
    default: 'monospace',
  }),
  // Legacy aliases for backward compatibility
  regular: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto-Bold',
    default: 'System',
  }),
};

// Font Sizes
export const fontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Line Heights
export const lineHeights = {
  xs: 14,
  sm: 16,
  base: 20,
  md: 22,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
  '5xl': 56,
};

// Font Weights
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Typography Variants - Apple-inspired text styles
 *
 * Uses SF Pro Display for large text (>20pt) and SF Pro Text for body text
 * Follows Apple's typography guidelines for optimal readability
 */
export const typography = {
  // Headings - Use SF Pro Display for large text
  h1: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['4xl'], // 36px
    lineHeight: lineHeights['4xl'], // 40px
    fontWeight: fontWeights.bold,
    letterSpacing: -0.5, // Tighter tracking for large text
  },
  h2: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['3xl'], // 30px
    lineHeight: lineHeights['3xl'], // 36px
    fontWeight: fontWeights.bold,
    letterSpacing: -0.4,
  },
  h3: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes['2xl'], // 24px
    lineHeight: lineHeights['2xl'], // 32px
    fontWeight: fontWeights.semibold,
    letterSpacing: -0.3,
  },
  h4: {
    fontFamily: fontFamilies.display,
    fontSize: fontSizes.xl, // 20px
    lineHeight: lineHeights.xl, // 28px
    fontWeight: fontWeights.semibold,
    letterSpacing: -0.2,
  },
  h5: {
    fontFamily: fontFamilies.text, // Switch to SF Pro Text at 18px
    fontSize: fontSizes.lg, // 18px
    lineHeight: lineHeights.lg, // 24px
    fontWeight: fontWeights.semibold,
    letterSpacing: 0,
  },
  h6: {
    fontFamily: fontFamilies.text,
    fontSize: fontSizes.md, // 16px
    lineHeight: lineHeights.md, // 22px
    fontWeight: fontWeights.semibold,
    letterSpacing: 0,
  },

  // Body Text - Use SF Pro Text for optimal readability
  bodyLarge: {
    fontFamily: fontFamilies.text,
    fontSize: fontSizes.lg, // 18px
    lineHeight: lineHeights.lg, // 24px
    fontWeight: fontWeights.regular,
    letterSpacing: 0,
  },
  body: {
    fontFamily: fontFamilies.text,
    fontSize: fontSizes.md, // 16px
    lineHeight: lineHeights.md, // 22px
    fontWeight: fontWeights.regular,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: fontFamilies.text,
    fontSize: fontSizes.base, // 14px
    lineHeight: lineHeights.base, // 20px
    fontWeight: fontWeights.regular,
    letterSpacing: 0,
  },

  // Caption & Labels
  caption: {
    fontFamily: fontFamilies.text,
    fontSize: fontSizes.sm, // 12px
    lineHeight: lineHeights.sm, // 16px
    fontWeight: fontWeights.regular,
    letterSpacing: 0,
  },
  captionBold: {
    fontFamily: fontFamilies.text,
    fontSize: fontSizes.sm, // 12px
    lineHeight: lineHeights.sm, // 16px
    fontWeight: fontWeights.semibold,
    letterSpacing: 0,
  },
  label: {
    fontFamily: fontFamilies.text,
    fontSize: fontSizes.base, // 14px
    lineHeight: lineHeights.base, // 20px
    fontWeight: fontWeights.medium,
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontFamily: fontFamilies.text,
    fontSize: fontSizes.sm, // 12px
    lineHeight: lineHeights.sm, // 16px
    fontWeight: fontWeights.medium,
    letterSpacing: 0.1,
  },

  // Button Text - Slightly heavier weight for emphasis
  button: {
    fontFamily: fontFamilies.text,
    fontSize: fontSizes.md, // 16px
    lineHeight: lineHeights.md, // 22px
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.2, // Slightly wider for buttons
  },
  buttonSmall: {
    fontFamily: fontFamilies.text,
    fontSize: fontSizes.base, // 14px
    lineHeight: lineHeights.base, // 20px
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.2,
  },

  // Monospace - For code and technical content
  code: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.base, // 14px
    lineHeight: lineHeights.base, // 20px
    fontWeight: fontWeights.regular,
    letterSpacing: 0,
  },
};

export type TypographyVariant = keyof typeof typography;

