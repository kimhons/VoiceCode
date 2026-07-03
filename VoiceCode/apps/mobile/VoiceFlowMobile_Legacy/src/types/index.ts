// VoiceCode Pro Mobile - Core Types

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Recording Types
export interface Recording {
  id: string;
  userId: string;
  title: string;
  duration: number;
  language: string;
  audioUrl: string;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
  tags?: string[];
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  volume: number;
  audioData: number[];
}

// Transcription Types
export interface Transcription {
  id: string;
  recordingId: string;
  text: string;
  segments: TranscriptionSegment[];
  language: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptionSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  speaker?: string;
  isFinal: boolean;
}

// AI Processing Types
export type ToneType =
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'formal'
  | 'concise'
  | 'detailed'
  | 'creative'
  | 'technical';

export type ContextType =
  | 'email'
  | 'meeting'
  | 'note'
  | 'article'
  | 'social'
  | 'report'
  | 'presentation'
  | 'general';

export interface AIProcessingOptions {
  tone: ToneType;
  context: ContextType;
  removeFillers?: boolean;
  correctGrammar?: boolean;
  addPunctuation?: boolean;
}

export interface ProcessedText {
  original: string;
  processed: string;
  changes: TextChange[];
  confidence: number;
}

export interface TextChange {
  type: 'addition' | 'deletion' | 'modification';
  original: string;
  modified: string;
  position: number;
}

// Language Types
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  supported: boolean;
}

// Folder Types
export interface Folder {
  id: string;
  userId: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

// Settings Types
export interface AppSettings {
  // Recording Settings
  recording: {
    defaultLanguage: string;
    audioQuality: 'low' | 'medium' | 'high';
    backgroundRecording: boolean;
    autoStop: {
      enabled: boolean;
      silenceDuration: number; // seconds
      maxDuration: number; // seconds
    };
    noiseReduction: boolean;
  };
  
  // Transcription Settings
  transcription: {
    autoPunctuation: boolean;
    smartFormatting: boolean;
    languageDetection: boolean;
    confidenceThreshold: number; // 0-100
    speakerIdentification: boolean;
  };
  
  // AI Processing Settings
  ai: {
    defaultTone: ToneType;
    defaultContext: ContextType;
    autoProcess: boolean;
    removeFillers: boolean;
    correctGrammar: boolean;
  };
  
  // Appearance Settings
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reduceAnimations: boolean;
  };
  
  // Privacy Settings
  privacy: {
    saveTranscriptions: boolean;
    shareAnalytics: boolean;
    encryption: {
      enabled: boolean;
      password?: string;
    };
  };
  
  // Sync Settings
  sync: {
    enabled: boolean;
    frequency: 'realtime' | 'hourly' | 'manual';
    wifiOnly: boolean;
  };
}

// Subscription Types
export type SubscriptionPlan = 'free' | 'pro' | 'team' | 'enterprise';

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
}

// Export Types
export type ExportFormat = 'txt' | 'pdf' | 'docx' | 'md' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeTimestamps: boolean;
  includeSpeakers: boolean;
  includeConfidence: boolean;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Settings: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  RecordingScreen: { recordingId?: string };
  ReviewScreen: { recordingId: string };
};

export type LibraryStackParamList = {
  LibraryScreen: undefined;
  TranscriptionDetail: { transcriptionId: string };
};

export type SettingsStackParamList = {
  SettingsScreen: undefined;
  RecordingSettings: undefined;
  TranscriptionSettings: undefined;
  AISettings: undefined;
  AppearanceSettings: undefined;
  PrivacySettings: undefined;
  SyncSettings: undefined;
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  SubscriptionScreen: undefined;
  AccountScreen: undefined;
};

// API Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: string;
}

