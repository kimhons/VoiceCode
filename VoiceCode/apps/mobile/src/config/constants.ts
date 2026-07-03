/**
 * Application Constants
 */

// Supabase Configuration
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// AIML API Configuration
export const AIML_API_KEY = process.env.EXPO_PUBLIC_AIML_API_KEY || '';
export const AIML_BASE_URL = process.env.EXPO_PUBLIC_AIML_BASE_URL || 'https://api.aimlapi.com/v1';
export const AIML_WS_URL = process.env.EXPO_PUBLIC_AIML_WS_URL || 'wss://api.aimlapi.com/v1/realtime';

// Stripe Configuration
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
export const STRIPE_PRICE_IDS = {
  proMonthly: process.env.EXPO_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || '',
  proYearly: process.env.EXPO_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || '',
  enterpriseMonthly: process.env.EXPO_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
  enterpriseYearly: process.env.EXPO_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
};

// App Configuration
export const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'development';
export const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10);

// Feature Flags
export const ENABLE_BIOMETRIC_AUTH = process.env.EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH === 'true';
export const ENABLE_PUSH_NOTIFICATIONS = process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true';
export const ENABLE_OFFLINE_MODE = process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MODE === 'true';
export const ENABLE_ANALYTICS = process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true';

// Audio Recording Settings
export const AUDIO_RECORDING_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioQuality: 'high',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  RECORDINGS: 'recordings',
  TRANSCRIPTIONS: 'transcriptions',
  SETTINGS: 'settings',
  BIOMETRIC_ENABLED: 'biometric_enabled',
};

// API Endpoints
export const API_ENDPOINTS = {
  createCheckoutSession: '/functions/v1/create-checkout-session',
  createPaymentIntent: '/functions/v1/create-payment-intent',
  createPortalSession: '/functions/v1/create-portal-session',
};

// Subscription Tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

// Subscription Limits
export const SUBSCRIPTION_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    monthlyMinutes: 60,
    maxRecordingLength: 5 * 60, // 5 minutes in seconds
    maxStorageGB: 1,
  },
  [SUBSCRIPTION_TIERS.PRO]: {
    monthlyMinutes: 600,
    maxRecordingLength: 30 * 60, // 30 minutes
    maxStorageGB: 10,
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    monthlyMinutes: -1, // unlimited
    maxRecordingLength: 120 * 60, // 2 hours
    maxStorageGB: 100,
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  PERMISSION_DENIED: 'Permission denied. Please enable in settings.',
  RECORDING_ERROR: 'Failed to record audio. Please try again.',
  TRANSCRIPTION_ERROR: 'Failed to transcribe audio. Please try again.',
  PAYMENT_ERROR: 'Payment failed. Please try again.',
  STORAGE_ERROR: 'Failed to save data. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  SIGNUP_SUCCESS: 'Account created successfully!',
  RECORDING_SAVED: 'Recording saved successfully!',
  TRANSCRIPTION_COMPLETE: 'Transcription completed!',
  PAYMENT_SUCCESS: 'Payment successful!',
  SETTINGS_SAVED: 'Settings saved successfully!',
};

// App Info
export const APP_INFO = {
  name: 'VoiceCode',
  version: '1.0.0',
  supportEmail: 'support@voicecode.com',
  privacyPolicyUrl: 'https://voicecode.com/privacy',
  termsOfServiceUrl: 'https://voicecode.com/terms',
};

