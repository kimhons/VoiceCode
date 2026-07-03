/**
 * Theme Service
 * Phase 5.2: Customizable Themes
 * 
 * Manages application themes with real color schemes
 */

import { getSupabaseService } from './supabase.service';

// Theme Types
export type ThemeMode = 'light' | 'dark';
export type ColorScheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight' | 'lavender' | 'crimson' | 'amber' | 'slate' | 'rose';
export type FontFamily = 'inter' | 'roboto' | 'open-sans' | 'lato' | 'poppins' | 'montserrat';
export type Spacing = 'compact' | 'normal' | 'comfortable';

export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary colors
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Surface colors
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Accent colors
  accent: string;
  accentLight: string;
  accentDark: string;
}

export interface Theme {
  id: string;
  name: string;
  mode: ThemeMode;
  colorScheme: ColorScheme;
  colors: ThemeColors;
  fontFamily: FontFamily;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export interface UserThemePreferences {
  user_id: string;
  theme_mode: ThemeMode;
  color_scheme: ColorScheme;
  font_family: FontFamily;
  spacing: Spacing;
  custom_theme?: Theme;
  created_at: string;
  updated_at: string;
}

// Predefined Color Schemes
const COLOR_SCHEMES: Record<ColorScheme, { light: ThemeColors; dark: ThemeColors }> = {
  default: {
    light: {
      primary: '#007bff',
      primaryHover: '#0056b3',
      primaryActive: '#004085',
      primaryLight: '#cce5ff',
      primaryDark: '#004085',
      secondary: '#6c757d',
      secondaryHover: '#5a6268',
      secondaryActive: '#545b62',
      background: '#ffffff',
      backgroundSecondary: '#f8f9fa',
      backgroundTertiary: '#e9ecef',
      surface: '#ffffff',
      surfaceHover: '#f8f9fa',
      surfaceActive: '#e9ecef',
      text: '#212529',
      textSecondary: '#6c757d',
      textTertiary: '#adb5bd',
      textInverse: '#ffffff',
      border: '#dee2e6',
      borderLight: '#e9ecef',
      borderDark: '#ced4da',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8',
      accent: '#007bff',
      accentLight: '#cce5ff',
      accentDark: '#004085',
    },
    dark: {
      primary: '#0d6efd',
      primaryHover: '#0b5ed7',
      primaryActive: '#0a58ca',
      primaryLight: '#1a3a5c',
      primaryDark: '#084298',
      secondary: '#6c757d',
      secondaryHover: '#5c636a',
      secondaryActive: '#565e64',
      background: '#0d1117',
      backgroundSecondary: '#161b22',
      backgroundTertiary: '#21262d',
      surface: '#161b22',
      surfaceHover: '#21262d',
      surfaceActive: '#30363d',
      text: '#c9d1d9',
      textSecondary: '#8b949e',
      textTertiary: '#6e7681',
      textInverse: '#0d1117',
      border: '#30363d',
      borderLight: '#21262d',
      borderDark: '#484f58',
      success: '#238636',
      warning: '#d29922',
      error: '#da3633',
      info: '#1f6feb',
      accent: '#58a6ff',
      accentLight: '#1f6feb',
      accentDark: '#1158c7',
    },
  },
  ocean: {
    light: {
      primary: '#0077be',
      primaryHover: '#005a8f',
      primaryActive: '#004570',
      primaryLight: '#b3e0f2',
      primaryDark: '#003d5c',
      secondary: '#00a8cc',
      secondaryHover: '#0087a3',
      secondaryActive: '#006b82',
      background: '#f0f8ff',
      backgroundSecondary: '#e6f3f9',
      backgroundTertiary: '#d1e9f4',
      surface: '#ffffff',
      surfaceHover: '#f0f8ff',
      surfaceActive: '#e6f3f9',
      text: '#1a3a4a',
      textSecondary: '#4a6a7a',
      textTertiary: '#7a9aaa',
      textInverse: '#ffffff',
      border: '#b3d9e6',
      borderLight: '#d1e9f4',
      borderDark: '#8fc4d9',
      success: '#00a86b',
      warning: '#ffa500',
      error: '#dc143c',
      info: '#4682b4',
      accent: '#00bcd4',
      accentLight: '#b2ebf2',
      accentDark: '#00838f',
    },
    dark: {
      primary: '#00a8e8',
      primaryHover: '#0087bd',
      primaryActive: '#006b99',
      primaryLight: '#1a3a4a',
      primaryDark: '#004d70',
      secondary: '#00d4ff',
      secondaryHover: '#00b3d9',
      secondaryActive: '#0099bf',
      background: '#0a1929',
      backgroundSecondary: '#132f4c',
      backgroundTertiary: '#1e4976',
      surface: '#132f4c',
      surfaceHover: '#1e4976',
      surfaceActive: '#2a5a8f',
      text: '#b2d8f0',
      textSecondary: '#7aa8cc',
      textTertiary: '#5a88aa',
      textInverse: '#0a1929',
      border: '#2a5a8f',
      borderLight: '#1e4976',
      borderDark: '#3d6ba3',
      success: '#00c896',
      warning: '#ffb74d',
      error: '#f44336',
      info: '#29b6f6',
      accent: '#00e5ff',
      accentLight: '#18ffff',
      accentDark: '#00b8d4',
    },
  },
  forest: {
    light: {
      primary: '#2d5016',
      primaryHover: '#1f3810',
      primaryActive: '#14260a',
      primaryLight: '#c8e6c9',
      primaryDark: '#0d1a05',
      secondary: '#558b2f',
      secondaryHover: '#33691e',
      secondaryActive: '#1b5e20',
      background: '#f1f8f4',
      backgroundSecondary: '#e8f5e9',
      backgroundTertiary: '#c8e6c9',
      surface: '#ffffff',
      surfaceHover: '#f1f8f4',
      surfaceActive: '#e8f5e9',
      text: '#1b5e20',
      textSecondary: '#33691e',
      textTertiary: '#558b2f',
      textInverse: '#ffffff',
      border: '#a5d6a7',
      borderLight: '#c8e6c9',
      borderDark: '#81c784',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
      accent: '#66bb6a',
      accentLight: '#c8e6c9',
      accentDark: '#388e3c',
    },
    dark: {
      primary: '#66bb6a',
      primaryHover: '#4caf50',
      primaryActive: '#388e3c',
      primaryLight: '#1b3a1f',
      primaryDark: '#2e7d32',
      secondary: '#81c784',
      secondaryHover: '#66bb6a',
      secondaryActive: '#4caf50',
      background: '#0d1f12',
      backgroundSecondary: '#1a2f1f',
      backgroundTertiary: '#2a4f2f',
      surface: '#1a2f1f',
      surfaceHover: '#2a4f2f',
      surfaceActive: '#3a6f3f',
      text: '#c8e6c9',
      textSecondary: '#a5d6a7',
      textTertiary: '#81c784',
      textInverse: '#0d1f12',
      border: '#2a4f2f',
      borderLight: '#1a2f1f',
      borderDark: '#3a6f3f',
      success: '#66bb6a',
      warning: '#ffb74d',
      error: '#ef5350',
      info: '#42a5f5',
      accent: '#81c784',
      accentLight: '#a5d6a7',
      accentDark: '#4caf50',
    },
  },
  sunset: {
    light: {
      primary: '#ff6b35',
      primaryHover: '#e85a2a',
      primaryActive: '#d14920',
      primaryLight: '#ffe0d6',
      primaryDark: '#ba3815',
      secondary: '#f7931e',
      secondaryHover: '#e0821b',
      secondaryActive: '#c97118',
      background: '#fff8f5',
      backgroundSecondary: '#fff0e6',
      backgroundTertiary: '#ffe0d6',
      surface: '#ffffff',
      surfaceHover: '#fff8f5',
      surfaceActive: '#fff0e6',
      text: '#4a2c1f',
      textSecondary: '#7a4c3f',
      textTertiary: '#aa6c5f',
      textInverse: '#ffffff',
      border: '#ffc4a3',
      borderLight: '#ffe0d6',
      borderDark: '#ffa87a',
      success: '#4caf50',
      warning: '#ffc107',
      error: '#f44336',
      info: '#2196f3',
      accent: '#ff8c42',
      accentLight: '#ffb380',
      accentDark: '#ff6b35',
    },
    dark: {
      primary: '#ff8c42',
      primaryHover: '#ff7a2e',
      primaryActive: '#ff6b35',
      primaryLight: '#4a2c1f',
      primaryDark: '#e85a2a',
      secondary: '#ffb380',
      secondaryHover: '#ffa366',
      secondaryActive: '#ff944d',
      background: '#1f1410',
      backgroundSecondary: '#2f2420',
      backgroundTertiary: '#4f3430',
      surface: '#2f2420',
      surfaceHover: '#4f3430',
      surfaceActive: '#6f4440',
      text: '#ffe0d6',
      textSecondary: '#ffc4a3',
      textTertiary: '#ffa87a',
      textInverse: '#1f1410',
      border: '#4f3430',
      borderLight: '#2f2420',
      borderDark: '#6f4440',
      success: '#66bb6a',
      warning: '#ffb74d',
      error: '#ef5350',
      info: '#42a5f5',
      accent: '#ff8c42',
      accentLight: '#ffb380',
      accentDark: '#ff6b35',
    },
  },
  midnight: {
    light: {
      primary: '#1e3a8a',
      primaryHover: '#1e40af',
      primaryActive: '#1d4ed8',
      primaryLight: '#dbeafe',
      primaryDark: '#1e3a8a',
      secondary: '#4f46e5',
      secondaryHover: '#4338ca',
      secondaryActive: '#3730a3',
      background: '#f8fafc',
      backgroundSecondary: '#f1f5f9',
      backgroundTertiary: '#e2e8f0',
      surface: '#ffffff',
      surfaceHover: '#f8fafc',
      surfaceActive: '#f1f5f9',
      text: '#0f172a',
      textSecondary: '#475569',
      textTertiary: '#64748b',
      textInverse: '#ffffff',
      border: '#cbd5e1',
      borderLight: '#e2e8f0',
      borderDark: '#94a3b8',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      accent: '#6366f1',
      accentLight: '#c7d2fe',
      accentDark: '#4f46e5',
    },
    dark: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryActive: '#1d4ed8',
      primaryLight: '#1e293b',
      primaryDark: '#1e40af',
      secondary: '#6366f1',
      secondaryHover: '#4f46e5',
      secondaryActive: '#4338ca',
      background: '#020617',
      backgroundSecondary: '#0f172a',
      backgroundTertiary: '#1e293b',
      surface: '#0f172a',
      surfaceHover: '#1e293b',
      surfaceActive: '#334155',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textTertiary: '#94a3b8',
      textInverse: '#020617',
      border: '#334155',
      borderLight: '#1e293b',
      borderDark: '#475569',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      accent: '#818cf8',
      accentLight: '#a5b4fc',
      accentDark: '#6366f1',
    },
  },
  
  lavender: {
    light: {
      primary: '#9333ea',
      primaryHover: '#7e22ce',
      primaryActive: '#6b21a8',
      primaryLight: '#f3e8ff',
      primaryDark: '#581c87',
      secondary: '#a855f7',
      secondaryHover: '#9333ea',
      secondaryActive: '#7e22ce',
      background: '#faf5ff',
      backgroundSecondary: '#f3e8ff',
      backgroundTertiary: '#e9d5ff',
      surface: '#ffffff',
      surfaceHover: '#faf5ff',
      surfaceActive: '#f3e8ff',
      text: '#3b0764',
      textSecondary: '#6b21a8',
      textTertiary: '#7e22ce',
      textInverse: '#ffffff',
      border: '#d8b4fe',
      borderLight: '#e9d5ff',
      borderDark: '#c084fc',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      accent: '#a855f7',
      accentLight: '#e9d5ff',
      accentDark: '#7e22ce',
    },
    dark: {
      primary: '#a855f7',
      primaryHover: '#9333ea',
      primaryActive: '#7e22ce',
      primaryLight: '#3b0764',
      primaryDark: '#6b21a8',
      secondary: '#c084fc',
      secondaryHover: '#a855f7',
      secondaryActive: '#9333ea',
      background: '#1a0a2e',
      backgroundSecondary: '#2a1a3e',
      backgroundTertiary: '#3a2a4e',
      surface: '#2a1a3e',
      surfaceHover: '#3a2a4e',
      surfaceActive: '#4a3a5e',
      text: '#f3e8ff',
      textSecondary: '#e9d5ff',
      textTertiary: '#d8b4fe',
      textInverse: '#1a0a2e',
      border: '#3a2a4e',
      borderLight: '#2a1a3e',
      borderDark: '#4a3a5e',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      accent: '#c084fc',
      accentLight: '#d8b4fe',
      accentDark: '#a855f7',
    },
  },
  crimson: {
    light: {
      primary: '#dc2626',
      primaryHover: '#b91c1c',
      primaryActive: '#991b1b',
      primaryLight: '#fee2e2',
      primaryDark: '#7f1d1d',
      secondary: '#ef4444',
      secondaryHover: '#dc2626',
      secondaryActive: '#b91c1c',
      background: '#fef2f2',
      backgroundSecondary: '#fee2e2',
      backgroundTertiary: '#fecaca',
      surface: '#ffffff',
      surfaceHover: '#fef2f2',
      surfaceActive: '#fee2e2',
      text: '#450a0a',
      textSecondary: '#7f1d1d',
      textTertiary: '#991b1b',
      textInverse: '#ffffff',
      border: '#fca5a5',
      borderLight: '#fecaca',
      borderDark: '#f87171',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#dc2626',
      info: '#3b82f6',
      accent: '#f43f5e',
      accentLight: '#fecaca',
      accentDark: '#be123c',
    },
    dark: {
      primary: '#f43f5e',
      primaryHover: '#e11d48',
      primaryActive: '#be123c',
      primaryLight: '#450a0a',
      primaryDark: '#9f1239',
      secondary: '#fb7185',
      secondaryHover: '#f43f5e',
      secondaryActive: '#e11d48',
      background: '#1f0a0a',
      backgroundSecondary: '#2f1a1a',
      backgroundTertiary: '#4f2a2a',
      surface: '#2f1a1a',
      surfaceHover: '#4f2a2a',
      surfaceActive: '#6f3a3a',
      text: '#fee2e2',
      textSecondary: '#fecaca',
      textTertiary: '#fca5a5',
      textInverse: '#1f0a0a',
      border: '#4f2a2a',
      borderLight: '#2f1a1a',
      borderDark: '#6f3a3a',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#f43f5e',
      info: '#3b82f6',
      accent: '#fb7185',
      accentLight: '#fca5a5',
      accentDark: '#e11d48',
    },
  },
  amber: {
    light: {
      primary: '#d97706',
      primaryHover: '#b45309',
      primaryActive: '#92400e',
      primaryLight: '#fef3c7',
      primaryDark: '#78350f',
      secondary: '#f59e0b',
      secondaryHover: '#d97706',
      secondaryActive: '#b45309',
      background: '#fffbeb',
      backgroundSecondary: '#fef3c7',
      backgroundTertiary: '#fde68a',
      surface: '#ffffff',
      surfaceHover: '#fffbeb',
      surfaceActive: '#fef3c7',
      text: '#451a03',
      textSecondary: '#78350f',
      textTertiary: '#92400e',
      textInverse: '#ffffff',
      border: '#fcd34d',
      borderLight: '#fde68a',
      borderDark: '#fbbf24',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      accent: '#f59e0b',
      accentLight: '#fde68a',
      accentDark: '#b45309',
    },
    dark: {
      primary: '#fbbf24',
      primaryHover: '#f59e0b',
      primaryActive: '#d97706',
      primaryLight: '#451a03',
      primaryDark: '#b45309',
      secondary: '#fcd34d',
      secondaryHover: '#fbbf24',
      secondaryActive: '#f59e0b',
      background: '#1f1a0a',
      backgroundSecondary: '#2f2a1a',
      backgroundTertiary: '#4f3a2a',
      surface: '#2f2a1a',
      surfaceHover: '#4f3a2a',
      surfaceActive: '#6f4a3a',
      text: '#fef3c7',
      textSecondary: '#fde68a',
      textTertiary: '#fcd34d',
      textInverse: '#1f1a0a',
      border: '#4f3a2a',
      borderLight: '#2f2a1a',
      borderDark: '#6f4a3a',
      success: '#10b981',
      warning: '#fbbf24',
      error: '#ef4444',
      info: '#3b82f6',
      accent: '#fcd34d',
      accentLight: '#fde68a',
      accentDark: '#f59e0b',
    },
  },
  slate: {
    light: {
      primary: '#475569',
      primaryHover: '#334155',
      primaryActive: '#1e293b',
      primaryLight: '#f1f5f9',
      primaryDark: '#0f172a',
      secondary: '#64748b',
      secondaryHover: '#475569',
      secondaryActive: '#334155',
      background: '#ffffff',
      backgroundSecondary: '#f8fafc',
      backgroundTertiary: '#f1f5f9',
      surface: '#ffffff',
      surfaceHover: '#f8fafc',
      surfaceActive: '#f1f5f9',
      text: '#0f172a',
      textSecondary: '#475569',
      textTertiary: '#64748b',
      textInverse: '#ffffff',
      border: '#cbd5e1',
      borderLight: '#e2e8f0',
      borderDark: '#94a3b8',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      accent: '#64748b',
      accentLight: '#cbd5e1',
      accentDark: '#334155',
    },
    dark: {
      primary: '#94a3b8',
      primaryHover: '#64748b',
      primaryActive: '#475569',
      primaryLight: '#0f172a',
      primaryDark: '#334155',
      secondary: '#cbd5e1',
      secondaryHover: '#94a3b8',
      secondaryActive: '#64748b',
      background: '#0f172a',
      backgroundSecondary: '#1e293b',
      backgroundTertiary: '#334155',
      surface: '#1e293b',
      surfaceHover: '#334155',
      surfaceActive: '#475569',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textTertiary: '#94a3b8',
      textInverse: '#0f172a',
      border: '#334155',
      borderLight: '#1e293b',
      borderDark: '#475569',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      accent: '#94a3b8',
      accentLight: '#cbd5e1',
      accentDark: '#64748b',
    },
  },
  rose: {
    light: {
      primary: '#e11d48',
      primaryHover: '#be123c',
      primaryActive: '#9f1239',
      primaryLight: '#ffe4e6',
      primaryDark: '#881337',
      secondary: '#f43f5e',
      secondaryHover: '#e11d48',
      secondaryActive: '#be123c',
      background: '#fff1f2',
      backgroundSecondary: '#ffe4e6',
      backgroundTertiary: '#fecdd3',
      surface: '#ffffff',
      surfaceHover: '#fff1f2',
      surfaceActive: '#ffe4e6',
      text: '#4c0519',
      textSecondary: '#881337',
      textTertiary: '#9f1239',
      textInverse: '#ffffff',
      border: '#fda4af',
      borderLight: '#fecdd3',
      borderDark: '#fb7185',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#e11d48',
      info: '#3b82f6',
      accent: '#f43f5e',
      accentLight: '#fecdd3',
      accentDark: '#be123c',
    },
    dark: {
      primary: '#fb7185',
      primaryHover: '#f43f5e',
      primaryActive: '#e11d48',
      primaryLight: '#4c0519',
      primaryDark: '#be123c',
      secondary: '#fda4af',
      secondaryHover: '#fb7185',
      secondaryActive: '#f43f5e',
      background: '#1f0a0f',
      backgroundSecondary: '#2f1a1f',
      backgroundTertiary: '#4f2a2f',
      surface: '#2f1a1f',
      surfaceHover: '#4f2a2f',
      surfaceActive: '#6f3a3f',
      text: '#ffe4e6',
      textSecondary: '#fecdd3',
      textTertiary: '#fda4af',
      textInverse: '#1f0a0f',
      border: '#4f2a2f',
      borderLight: '#2f1a1f',
      borderDark: '#6f3a3f',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#fb7185',
      info: '#3b82f6',
      accent: '#fda4af',
      accentLight: '#fecdd3',
      accentDark: '#f43f5e',
    },
  },
};

// Font Families with Google Fonts imports
const FONT_FAMILIES: Record<FontFamily, { name: string; import: string; stack: string }> = {
  inter: {
    name: 'Inter',
    import: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    stack: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  roboto: {
    name: 'Roboto',
    import: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
    stack: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  'open-sans': {
    name: 'Open Sans',
    import: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap',
    stack: '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  lato: {
    name: 'Lato',
    import: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
    stack: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  poppins: {
    name: 'Poppins',
    import: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
    stack: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  montserrat: {
    name: 'Montserrat',
    import: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap',
    stack: '"Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
};

// Spacing configurations
const SPACING_CONFIGS: Record<Spacing, Theme['spacing']> = {
  compact: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    '3xl': '32px',
  },
  normal: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  comfortable: {
    xs: '6px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
};

// Font size configurations
const FONT_SIZE_CONFIG: Theme['fontSize'] = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
};

// Border radius configurations
const BORDER_RADIUS_CONFIG: Theme['borderRadius'] = {
  sm: '0.25rem',  // 4px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
  full: '9999px',
};

// Shadow configurations
const SHADOW_CONFIG: Theme['shadows'] = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// Theme Service
class ThemeService {
  private currentTheme: Theme | null = null;
  private supabaseService = getSupabaseService();

  // Build theme from preferences
  buildTheme(
    mode: ThemeMode,
    colorScheme: ColorScheme,
    fontFamily: FontFamily,
    spacing: Spacing
  ): Theme {
    const colors = COLOR_SCHEMES[colorScheme][mode];
    const spacingConfig = SPACING_CONFIGS[spacing];

    return {
      id: `${mode}-${colorScheme}-${fontFamily}-${spacing}`,
      name: `${colorScheme.charAt(0).toUpperCase() + colorScheme.slice(1)} ${mode.charAt(0).toUpperCase() + mode.slice(1)}`,
      mode,
      colorScheme,
      colors,
      fontFamily,
      fontSize: FONT_SIZE_CONFIG,
      spacing: spacingConfig,
      borderRadius: BORDER_RADIUS_CONFIG,
      shadows: SHADOW_CONFIG,
    };
  }

  // Apply theme to DOM
  applyTheme(theme: Theme): void {
    this.currentTheme = theme;

    // Apply CSS variables
    const root = document.documentElement;

    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${this.kebabCase(key)}`, value);
    });

    // Font
    root.style.setProperty('--font-family', FONT_FAMILIES[theme.fontFamily].stack);

    // Load font
    this.loadFont(theme.fontFamily);

    // Font sizes
    Object.entries(theme.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    // Spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Border radius
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value);
    });

    // Shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Store in localStorage
    localStorage.setItem('theme', JSON.stringify(theme));
  }

  // Load font from Google Fonts
  private loadFont(fontFamily: FontFamily): void {
    const fontConfig = FONT_FAMILIES[fontFamily];
    const existingLink = document.querySelector(`link[href="${fontConfig.import}"]`);

    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontConfig.import;
      document.head.appendChild(link);
    }
  }

  // Get current theme
  getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  // Load theme from localStorage
  loadThemeFromStorage(): Theme | null {
    const stored = localStorage.getItem('theme');
    if (stored) {
      try {
        const theme = JSON.parse(stored) as Theme;
        this.applyTheme(theme);
        return theme;
      } catch (err) {
        console.error('Failed to parse stored theme:', err);
      }
    }
    return null;
  }

  // Get user preferences from Supabase
  async getUserPreferences(): Promise<UserThemePreferences | null> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('user_theme_preferences')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to get user preferences:', err);
      return null;
    }
  }

  // Save user preferences to Supabase
  async saveUserPreferences(preferences: Partial<UserThemePreferences>): Promise<UserThemePreferences> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('user_theme_preferences')
        .upsert(preferences)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to save user preferences:', err);
      throw err;
    }
  }

  // Load and apply user theme
  async loadUserTheme(): Promise<Theme> {
    const preferences = await this.getUserPreferences();

    if (preferences) {
      const theme = this.buildTheme(
        preferences.theme_mode,
        preferences.color_scheme,
        preferences.font_family,
        preferences.spacing
      );
      this.applyTheme(theme);
      return theme;
    }

    // Default theme
    const defaultTheme = this.buildTheme('light', 'default', 'inter', 'normal');
    this.applyTheme(defaultTheme);
    return defaultTheme;
  }

  // Update theme
  async updateTheme(
    mode?: ThemeMode,
    colorScheme?: ColorScheme,
    fontFamily?: FontFamily,
    spacing?: Spacing
  ): Promise<Theme> {
    const current = this.currentTheme || this.buildTheme('light', 'default', 'inter', 'normal');

    const newTheme = this.buildTheme(
      mode || current.mode,
      colorScheme || current.colorScheme,
      fontFamily || current.fontFamily,
      spacing || (current.spacing.md === '12px' ? 'normal' : current.spacing.md === '8px' ? 'compact' : 'comfortable')
    );

    this.applyTheme(newTheme);

    // Save to Supabase
    await this.saveUserPreferences({
      theme_mode: newTheme.mode,
      color_scheme: newTheme.colorScheme,
      font_family: newTheme.fontFamily,
      spacing: newTheme.spacing.md === '12px' ? 'normal' : newTheme.spacing.md === '8px' ? 'compact' : 'comfortable',
    });

    return newTheme;
  }

  // Toggle theme mode
  async toggleMode(): Promise<Theme> {
    const current = this.currentTheme || this.buildTheme('light', 'default', 'inter', 'normal');
    return this.updateTheme(current.mode === 'light' ? 'dark' : 'light');
  }

  // Export theme
  exportTheme(theme: Theme): string {
    return JSON.stringify(theme, null, 2);
  }

  // Import theme
  importTheme(themeJson: string): Theme {
    try {
      const theme = JSON.parse(themeJson) as Theme;
      this.applyTheme(theme);
      return theme;
    } catch (err) {
      console.error('Failed to import theme:', err);
      throw new Error('Invalid theme JSON');
    }
  }

  // Get all available color schemes
  getAvailableColorSchemes(): ColorScheme[] {
    return Object.keys(COLOR_SCHEMES) as ColorScheme[];
  }

  // Get all available font families
  getAvailableFontFamilies(): FontFamily[] {
    return Object.keys(FONT_FAMILIES) as FontFamily[];
  }

  // Helper: Convert camelCase to kebab-case
  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }
}

// Singleton instance
let themeServiceInstance: ThemeService | null = null;

export function getThemeService(): ThemeService {
  if (!themeServiceInstance) {
    themeServiceInstance = new ThemeService();
  }
  return themeServiceInstance;
}

export default ThemeService;

