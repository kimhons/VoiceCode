// VoiceFlow Pro Mobile - Elevation System
// Apple-inspired depth and shadows

import { Platform, ViewStyle } from 'react-native';

/**
 * Elevation System - Apple-style depth hierarchy
 * 
 * iOS: Uses subtle shadows with blur for depth
 * Android: Uses elevation property for Material Design compatibility
 * 
 * Levels:
 * - none: Flat, no elevation
 * - xs: Subtle lift (buttons, cards at rest)
 * - sm: Small lift (raised buttons, small cards)
 * - md: Medium lift (floating action buttons, dropdowns)
 * - lg: Large lift (modals, dialogs)
 * - xl: Maximum lift (overlays, popovers)
 */

export interface ElevationStyle extends ViewStyle {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

/**
 * Elevation levels with platform-specific shadows
 */
export const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ElevationStyle,

  xs: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    },
  }) as ElevationStyle,

  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    },
  }) as ElevationStyle,

  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
  }) as ElevationStyle,

  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
  }) as ElevationStyle,

  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
    },
    android: {
      elevation: 12,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
    },
  }) as ElevationStyle,
};

/**
 * Blur intensity levels for iOS frosted glass effect
 * Use with BlurView from expo-blur
 */
export const blurIntensity = {
  none: 0,
  subtle: 20,
  light: 40,
  regular: 60,
  strong: 80,
  prominent: 100,
};

/**
 * Blur tint options for different contexts
 */
export type BlurTint = 'light' | 'dark' | 'default' | 'prominent' | 'regular' | 'extraLight' | 'chromeMaterial';

export type ElevationKey = keyof typeof elevation;
export type BlurIntensityKey = keyof typeof blurIntensity;

