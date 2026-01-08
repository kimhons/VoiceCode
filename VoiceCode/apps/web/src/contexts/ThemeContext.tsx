// Theme Configuration and Context for VoiceFlow Pro

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeType, PlatformType, SettingsConfig } from '@/types';

interface TypographyType {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

interface ThemeContextType {
  theme: ThemeType;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeType) => void;
  platform: PlatformType;
  platformConfig: {
    isMac: boolean;
    isWindows: boolean;
    isLinux: boolean;
    hasNativeTitleBar: boolean;
  };
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: TypographyType;
  borderRadius: {
    small: string;
    medium: string;
    large: string;
    full: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Platform Detection
const detectPlatform = (): PlatformType => {
  if (typeof window === 'undefined') return 'linux';
  
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  if (userAgent.includes('mac') || platform.includes('mac')) return 'mac';
  if (userAgent.includes('win')) return 'windows';
  return 'linux';
};

// Theme Colors
const lightColors = {
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryActive: '#1d4ed8',
  secondary: '#64748b',
  secondaryHover: '#475569',
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  backgroundTertiary: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  border: '#e2e8f0',
  borderHover: '#cbd5e1',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

const darkColors = {
  primary: '#60a5fa',
  primaryHover: '#3b82f6',
  primaryActive: '#2563eb',
  secondary: '#64748b',
  secondaryHover: '#475569',
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  backgroundTertiary: '#334155',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  border: '#334155',
  borderHover: '#475569',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
};

// Platform-specific border radius
const getBorderRadius = (platform: PlatformType) => {
  switch (platform) {
    case 'mac':
      return {
        small: '6px',
        medium: '8px',
        large: '12px',
        full: '9999px',
      };
    case 'windows':
      return {
        small: '2px',
        medium: '4px',
        large: '6px',
        full: '9999px',
      };
    case 'linux':
      return {
        small: '4px',
        medium: '6px',
        large: '8px',
        full: '9999px',
      };
    default:
      return {
        small: '4px',
        medium: '6px',
        large: '8px',
        full: '9999px',
      };
  }
};

// Platform spacing adjustments
const getSpacing = (platform: PlatformType) => {
  const base = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  };

  if (platform === 'mac') {
    // macOS tends to have more generous spacing
    return {
      xs: '6px',
      sm: '10px',
      md: '16px',
      lg: '20px',
      xl: '28px',
      '2xl': '36px',
      '3xl': '54px',
    };
  }

  if (platform === 'windows') {
    // Windows tends to have more compact spacing
    return {
      xs: '3px',
      sm: '6px',
      md: '10px',
      lg: '14px',
      xl: '20px',
      '2xl': '28px',
      '3xl': '42px',
    };
  }

  return base;
};

// Platform typography
const getTypography = (platform: PlatformType) => {
  const baseFont = platform === 'mac' ? '-apple-system' : 
                   platform === 'windows' ? 'Segoe UI' : 'system-ui';
  
  return {
    fontFamily: `${baseFont}, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  };
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeType;
  onThemeChange?: (theme: ThemeType) => void;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'auto',
  onThemeChange,
}) => {
  const [theme, setThemeState] = useState<ThemeType>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [platform] = useState<PlatformType>(detectPlatform);

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'auto') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    handleChange(); // Initial check

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Update resolved theme when theme changes
  useEffect(() => {
    if (theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(isDark ? 'dark' : 'light');
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    onThemeChange?.(newTheme);
    
    // Save to localStorage
    localStorage.setItem('voiceflow-theme', newTheme);
    
    // Add theme class to document
    document.documentElement.className = `theme-${newTheme}`;
  };

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('voiceflow-theme') as ThemeType;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  const colors = resolvedTheme === 'dark' ? darkColors : lightColors;
  const spacing = getSpacing(platform);
  const typography = getTypography(platform);
  const borderRadius = getBorderRadius(platform);

  const platformConfig = {
    isMac: platform === 'mac',
    isWindows: platform === 'windows',
    isLinux: platform === 'linux',
    // In the web app, there is no native title bar
    hasNativeTitleBar: false,
  };

  const contextValue: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
    platform,
    platformConfig,
    colors,
    spacing,
    typography,
    borderRadius,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};