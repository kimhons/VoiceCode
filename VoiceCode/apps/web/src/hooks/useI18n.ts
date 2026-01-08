/**
 * useI18n Hook
 * Phase 5.3: Multi-Language UI
 * 
 * React hook for internationalization
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getI18nService,
  Language,
  LanguageMetadata,
  TranslationKey,
  UserLanguagePreferences,
} from '../services/i18n.service';

export interface UseI18nOptions {
  autoLoad?: boolean;
}

export interface UseI18nReturn {
  // Current language
  language: Language;
  isRTL: boolean;
  languageMetadata: LanguageMetadata;

  // Translation function
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;

  // Language actions
  setLanguage: (language: Language) => Promise<void>;
  getAvailableLanguages: () => LanguageMetadata[];

  // Formatting functions
  formatDate: (date: Date, format?: 'short' | 'medium' | 'long' | 'full') => string;
  formatTime: (date: Date) => string;
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatRelativeTime: (date: Date) => string;

  // Preferences
  preferences: UserLanguagePreferences | null;
  loadPreferences: () => Promise<void>;
  savePreferences: (prefs: Partial<UserLanguagePreferences>) => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useI18n(options: UseI18nOptions = {}): UseI18nReturn {
  const { autoLoad = true } = options;

  // Service
  const i18nService = useRef(getI18nService());

  // State
  const [language, setLanguageState] = useState<Language>(i18nService.current.getCurrentLanguage());
  const [preferences, setPreferences] = useState<UserLanguagePreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const languageMetadata = i18nService.current.getLanguageMetadata(language);
  const isRTL = i18nService.current.isRTL(language);

  // Translation function
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      return i18nService.current.t(key, params);
    },
    [language] // Re-create when language changes
  );

  // Set language
  const setLanguage = useCallback(async (newLanguage: Language) => {
    setError(null);
    setIsLoading(true);
    try {
      await i18nService.current.setLanguage(newLanguage);
      setLanguageState(newLanguage);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set language';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get available languages
  const getAvailableLanguages = useCallback(() => {
    return i18nService.current.getAvailableLanguages();
  }, []);

  // Format date
  const formatDate = useCallback(
    (date: Date, format: 'short' | 'medium' | 'long' | 'full' = 'medium') => {
      const optionsMap: Record<'short' | 'medium' | 'long' | 'full', Intl.DateTimeFormatOptions> = {
        short: { year: 'numeric', month: 'numeric', day: 'numeric' },
        medium: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { year: 'numeric', month: 'long', day: 'numeric' },
        full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      };
      const options = optionsMap[format];

      return new Intl.DateTimeFormat(language, options).format(date);
    },
    [language]
  );

  // Format time
  const formatTime = useCallback(
    (date: Date) => {
      const timeFormat = preferences?.timeFormat || '24h';
      const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: 'numeric',
        hour12: timeFormat === '12h',
      };

      return new Intl.DateTimeFormat(language, options).format(date);
    },
    [language, preferences]
  );

  // Format number
  const formatNumber = useCallback(
    (num: number) => {
      return new Intl.NumberFormat(language).format(num);
    },
    [language]
  );

  // Format currency
  const formatCurrency = useCallback(
    (amount: number, currency: string = 'USD') => {
      const curr = preferences?.currency || currency;
      return new Intl.NumberFormat(language, {
        style: 'currency',
        currency: curr,
      }).format(amount);
    },
    [language, preferences]
  );

  // Format relative time
  const formatRelativeTime = useCallback(
    (date: Date) => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      const diffWeek = Math.floor(diffDay / 7);
      const diffMonth = Math.floor(diffDay / 30);
      const diffYear = Math.floor(diffDay / 365);

      const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });

      if (diffYear > 0) return rtf.format(-diffYear, 'year');
      if (diffMonth > 0) return rtf.format(-diffMonth, 'month');
      if (diffWeek > 0) return rtf.format(-diffWeek, 'week');
      if (diffDay > 0) return rtf.format(-diffDay, 'day');
      if (diffHour > 0) return rtf.format(-diffHour, 'hour');
      if (diffMin > 0) return rtf.format(-diffMin, 'minute');
      return rtf.format(-diffSec, 'second');
    },
    [language]
  );

  // Load preferences
  const loadPreferences = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const prefs = await i18nService.current.getUserPreferences();
      setPreferences(prefs);
      
      // Apply language from preferences
      if (prefs?.language && prefs.language !== language) {
        await setLanguage(prefs.language);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load preferences';
      setError(message);
      console.error('Failed to load preferences:', err);
    } finally {
      setIsLoading(false);
    }
  }, [language, setLanguage]);

  // Save preferences
  const savePreferences = useCallback(
    async (prefs: Partial<UserLanguagePreferences>) => {
      setError(null);
      setIsLoading(true);
      try {
        await i18nService.current.saveUserPreferences(prefs);
        setPreferences(prev => (prev ? { ...prev, ...prefs } : null));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save preferences';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Subscribe to language changes
  useEffect(() => {
    const unsubscribe = i18nService.current.subscribe((newLanguage) => {
      setLanguageState(newLanguage);
    });

    return unsubscribe;
  }, []);

  // Auto-load preferences
  useEffect(() => {
    if (autoLoad) {
      loadPreferences();
    }
  }, [autoLoad, loadPreferences]);

  return {
    language,
    isRTL,
    languageMetadata,
    t,
    setLanguage,
    getAvailableLanguages,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
    preferences,
    loadPreferences,
    savePreferences,
    isLoading,
    error,
    clearError,
  };
}

