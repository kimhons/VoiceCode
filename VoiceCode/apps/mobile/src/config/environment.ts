/**
 * Environment Configuration
 * Centralized environment management for development, staging, and production
 */

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  name: Environment;
  supabaseUrl: string;
  supabaseAnonKey: string;
  aimlApiKey: string;
  aimlBaseUrl: string;
  aimlWsUrl: string;
  stripePublishableKey: string;
  sentryDsn: string;
  apiTimeout: number;
  enableDebugMode: boolean;
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enablePushNotifications: boolean;
  enableBiometricAuth: boolean;
  enableOfflineMode: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const developmentConfig: EnvironmentConfig = {
  name: 'development',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  aimlApiKey: process.env.EXPO_PUBLIC_AIML_API_KEY || '',
  aimlBaseUrl: process.env.EXPO_PUBLIC_AIML_BASE_URL || 'https://api.aimlapi.com/v1',
  aimlWsUrl: process.env.EXPO_PUBLIC_AIML_WS_URL || 'wss://api.aimlapi.com/v1/realtime',
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  apiTimeout: 30000,
  enableDebugMode: true,
  enableAnalytics: false,
  enableCrashReporting: false,
  enablePushNotifications: false,
  enableBiometricAuth: true,
  enableOfflineMode: true,
  logLevel: 'debug',
};

const stagingConfig: EnvironmentConfig = {
  name: 'staging',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  aimlApiKey: process.env.EXPO_PUBLIC_AIML_API_KEY || '',
  aimlBaseUrl: process.env.EXPO_PUBLIC_AIML_BASE_URL || 'https://api.aimlapi.com/v1',
  aimlWsUrl: process.env.EXPO_PUBLIC_AIML_WS_URL || 'wss://api.aimlapi.com/v1/realtime',
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  apiTimeout: 30000,
  enableDebugMode: true,
  enableAnalytics: true,
  enableCrashReporting: true,
  enablePushNotifications: true,
  enableBiometricAuth: true,
  enableOfflineMode: true,
  logLevel: 'info',
};

const productionConfig: EnvironmentConfig = {
  name: 'production',
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  aimlApiKey: process.env.EXPO_PUBLIC_AIML_API_KEY || '',
  aimlBaseUrl: process.env.EXPO_PUBLIC_AIML_BASE_URL || 'https://api.aimlapi.com/v1',
  aimlWsUrl: process.env.EXPO_PUBLIC_AIML_WS_URL || 'wss://api.aimlapi.com/v1/realtime',
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  apiTimeout: 30000,
  enableDebugMode: false,
  enableAnalytics: true,
  enableCrashReporting: true,
  enablePushNotifications: true,
  enableBiometricAuth: true,
  enableOfflineMode: true,
  logLevel: 'error',
};

const configs: Record<Environment, EnvironmentConfig> = {
  development: developmentConfig,
  staging: stagingConfig,
  production: productionConfig,
};

const currentEnvironment = (process.env.EXPO_PUBLIC_APP_ENV || 'development') as Environment;

export const config: EnvironmentConfig = configs[currentEnvironment] || developmentConfig;

export const isProduction = () => config.name === 'production';
export const isStaging = () => config.name === 'staging';
export const isDevelopment = () => config.name === 'development';

export default config;
