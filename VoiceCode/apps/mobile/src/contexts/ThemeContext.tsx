// VoiceCode Mobile - Theme Context

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, Theme, ColorScheme, ThemeMode } from '../theme';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@VoiceCode_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme() as ColorScheme;
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto')) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Determine the actual color scheme based on theme mode
  const getColorScheme = (): ColorScheme => {
    if (themeMode === 'auto') {
      return systemColorScheme || 'light';
    }
    return themeMode as ColorScheme;
  };

  const colorScheme = getColorScheme();
  const currentTheme = theme[colorScheme];
  const isDark = colorScheme === 'dark';

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  const value: ThemeContextType = {
    theme: currentTheme,
    colorScheme,
    themeMode,
    setThemeMode,
    isDark,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook for styled components
export const useThemedStyles = <T extends Record<string, any>>(
  stylesFn: (theme: Theme) => T
): T => {
  const { theme } = useTheme();
  return stylesFn(theme);
};

