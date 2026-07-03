// Core Types for VoiceFlow Pro UI Components

export type PlatformType = 'mac' | 'windows' | 'linux';
export type ThemeType = 'light' | 'dark' | 'auto';

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  volume: number;
  confidence: number;
  language: string;
  error?: string;
}

export interface TranscriptionSegment {
  id: string;
  text: string;
  confidence: number;
  startTime: number;
  endTime: number;
  speaker?: string;
  isFinal: boolean;
  language?: string;
}

export interface AudioVisualizationData {
  timestamp: number;
  amplitude: number;
  frequency: number[];
}

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  supported: boolean;
}

export interface SettingsConfig {
  theme: ThemeType;
  language: string;
  hotkey: string;
  autoStart: boolean;
  soundEnabled: boolean;
  privacy: {
    saveTranscriptions: boolean;
    shareAnalytics: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    voiceFeedback: boolean;
    keyboardNavigation: boolean;
  };
  transcription: {
    autoPunctuation: boolean;
    smartFormatting: boolean;
    detectLanguage: boolean;
    confidenceThreshold: number;
  };
}

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-disabled'?: boolean;
  role?: string;
  tabIndex?: number;
  'data-testid'?: string;
}

export interface ComponentSize {
  small: string;
  medium: string;
  large: string;
}

export interface ComponentVariants {
  primary: string;
  secondary: string;
  outline: string;
  ghost: string;
  destructive: string;
}

export interface PlatformConfig {
  platform: PlatformType;
  isElectron: boolean;
  isWeb: boolean;
  hasNativeTitleBar: boolean;
  supportsTray: boolean;
  supportsShortcuts: boolean;
}

export interface VoiceCommand {
  phrase: string;
  action: string;
  parameters?: Record<string, any>;
  description: string;
}

export interface UserPreferences {
  id: string;
  settings: SettingsConfig;
  customCommands: VoiceCommand[];
  recentLanguages: string[];
  favoriteTemplates: string[];
}