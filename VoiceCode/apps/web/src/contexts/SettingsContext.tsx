// Settings Context for VoiceFlow Pro

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SettingsConfig, UserPreferences, VoiceCommand, LanguageInfo } from '@/types';

interface SettingsContextType {
  settings: SettingsConfig;
  preferences: UserPreferences | null;
  updateSettings: (updates: Partial<SettingsConfig>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  addCustomCommand: (command: VoiceCommand) => void;
  removeCustomCommand: (commandId: string) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (data: string) => boolean;
  supportedLanguages: LanguageInfo[];
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Default settings
const defaultSettings: SettingsConfig = {
  theme: 'auto',
  language: 'en',
  hotkey: 'Cmd+Space',
  autoStart: false,
  soundEnabled: true,
  privacy: {
    saveTranscriptions: true,
    shareAnalytics: false,
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    voiceFeedback: true,
    keyboardNavigation: true,
  },
  transcription: {
    autoPunctuation: true,
    smartFormatting: true,
    detectLanguage: true,
    confidenceThreshold: 0.8,
  },
};

// Supported languages with flags
const supportedLanguages: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', supported: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', supported: true },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', supported: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', supported: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', supported: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', supported: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', supported: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', supported: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', supported: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', supported: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', supported: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', supported: true },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', supported: true },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', supported: true },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', supported: true },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', supported: true },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', supported: true },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', supported: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', supported: true },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', supported: true },
];

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsConfig>(defaultSettings);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('voiceflow-settings');
      const savedPreferences = localStorage.getItem('voiceflow-preferences');
      
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
      
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
      } else {
        // Initialize default preferences
        setPreferences({
          id: 'default',
          settings: { ...defaultSettings },
          customCommands: [],
          recentLanguages: ['en'],
          favoriteTemplates: [],
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('voiceflow-settings', JSON.stringify(settings));
    }
  }, [settings, isLoading]);

  // Save preferences to localStorage
  useEffect(() => {
    if (preferences && !isLoading) {
      localStorage.setItem('voiceflow-preferences', JSON.stringify(preferences));
    }
  }, [preferences, isLoading]);

  const updateSettings = (updates: Partial<SettingsConfig>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => prev ? { ...prev, ...updates } : null);
  };

  const addCustomCommand = (command: VoiceCommand) => {
    if (!preferences) return;
    
    setPreferences(prev => prev ? {
      ...prev,
      customCommands: [...prev.customCommands, command],
    } : null);
  };

  const removeCustomCommand = (commandId: string) => {
    if (!preferences) return;
    
    setPreferences(prev => prev ? {
      ...prev,
      customCommands: prev.customCommands.filter(cmd => cmd.action !== commandId),
    } : null);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    setPreferences({
      id: 'default',
      settings: { ...defaultSettings },
      customCommands: [],
      recentLanguages: ['en'],
      favoriteTemplates: [],
    });
  };

  const exportSettings = (): string => {
    return JSON.stringify({
      settings,
      preferences,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    }, null, 2);
  };

  const importSettings = (data: string): boolean => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.settings) {
        setSettings({ ...defaultSettings, ...parsed.settings });
      }
      if (parsed.preferences) {
        setPreferences(parsed.preferences);
      }
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  };

  const contextValue: SettingsContextType = {
    settings,
    preferences,
    updateSettings,
    updatePreferences,
    addCustomCommand,
    removeCustomCommand,
    resetSettings,
    exportSettings,
    importSettings,
    supportedLanguages,
    isLoading,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};