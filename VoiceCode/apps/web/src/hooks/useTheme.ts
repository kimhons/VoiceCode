/**
 * useTheme Hook
 * Phase 5.2: Customizable Themes
 * 
 * React hook for theme management
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getThemeService,
  Theme,
  ThemeMode,
  ColorScheme,
  FontFamily,
  Spacing,
  UserThemePreferences,
} from '../services/theme.service';

export interface UseThemeOptions {
  autoLoad?: boolean;
}

export interface UseThemeReturn {
  // Current theme
  theme: Theme | null;
  isLoading: boolean;

  // Theme actions
  loadTheme: () => Promise<void>;
  updateTheme: (mode?: ThemeMode, colorScheme?: ColorScheme, fontFamily?: FontFamily, spacing?: Spacing) => Promise<void>;
  toggleMode: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  setColorScheme: (colorScheme: ColorScheme) => Promise<void>;
  setFontFamily: (fontFamily: FontFamily) => Promise<void>;
  setSpacing: (spacing: Spacing) => Promise<void>;

  // Theme import/export
  exportTheme: () => string | null;
  importTheme: (themeJson: string) => void;

  // Available options
  availableColorSchemes: ColorScheme[];
  availableFontFamilies: FontFamily[];
  availableSpacings: Spacing[];

  // Preferences
  preferences: UserThemePreferences | null;
  loadPreferences: () => Promise<void>;

  // State
  error: string | null;
  clearError: () => void;
}

export function useTheme(options: UseThemeOptions = {}): UseThemeReturn {
  const { autoLoad = true } = options;

  // Service
  const themeService = useRef(getThemeService());

  // State
  const [theme, setTheme] = useState<Theme | null>(null);
  const [preferences, setPreferences] = useState<UserThemePreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available options
  const [availableColorSchemes] = useState<ColorScheme[]>(
    themeService.current.getAvailableColorSchemes()
  );
  const [availableFontFamilies] = useState<FontFamily[]>(
    themeService.current.getAvailableFontFamilies()
  );
  const [availableSpacings] = useState<Spacing[]>(['compact', 'normal', 'comfortable']);

  // Load theme
  const loadTheme = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      // Try to load from storage first
      const storedTheme = themeService.current.loadThemeFromStorage();
      if (storedTheme) {
        setTheme(storedTheme);
      }

      // Then load from Supabase
      const userTheme = await themeService.current.loadUserTheme();
      setTheme(userTheme);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load theme';
      setError(message);
      console.error('Failed to load theme:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update theme
  const updateTheme = useCallback(
    async (
      mode?: ThemeMode,
      colorScheme?: ColorScheme,
      fontFamily?: FontFamily,
      spacing?: Spacing
    ) => {
      setError(null);
      try {
        const newTheme = await themeService.current.updateTheme(mode, colorScheme, fontFamily, spacing);
        setTheme(newTheme);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update theme';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Toggle mode
  const toggleMode = useCallback(async () => {
    setError(null);
    try {
      const newTheme = await themeService.current.toggleMode();
      setTheme(newTheme);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle mode';
      setError(message);
      throw err;
    }
  }, []);

  // Set mode
  const setMode = useCallback(
    async (mode: ThemeMode) => {
      await updateTheme(mode);
    },
    [updateTheme]
  );

  // Set color scheme
  const setColorScheme = useCallback(
    async (colorScheme: ColorScheme) => {
      await updateTheme(undefined, colorScheme);
    },
    [updateTheme]
  );

  // Set font family
  const setFontFamily = useCallback(
    async (fontFamily: FontFamily) => {
      await updateTheme(undefined, undefined, fontFamily);
    },
    [updateTheme]
  );

  // Set spacing
  const setSpacing = useCallback(
    async (spacing: Spacing) => {
      await updateTheme(undefined, undefined, undefined, spacing);
    },
    [updateTheme]
  );

  // Export theme
  const exportTheme = useCallback(() => {
    if (!theme) return null;
    return themeService.current.exportTheme(theme);
  }, [theme]);

  // Import theme
  const importTheme = useCallback((themeJson: string) => {
    setError(null);
    try {
      const importedTheme = themeService.current.importTheme(themeJson);
      setTheme(importedTheme);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import theme';
      setError(message);
      throw err;
    }
  }, []);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    setError(null);
    try {
      const prefs = await themeService.current.getUserPreferences();
      setPreferences(prefs);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load preferences';
      setError(message);
      console.error('Failed to load preferences:', err);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load
  useEffect(() => {
    if (autoLoad) {
      loadTheme();
      loadPreferences();
    }
  }, [autoLoad, loadTheme, loadPreferences]);

  return {
    theme,
    isLoading,
    loadTheme,
    updateTheme,
    toggleMode,
    setMode,
    setColorScheme,
    setFontFamily,
    setSpacing,
    exportTheme,
    importTheme,
    availableColorSchemes,
    availableFontFamilies,
    availableSpacings,
    preferences,
    loadPreferences,
    error,
    clearError,
  };
}

