// VoiceCode Mobile - Firebase Configuration
// Crashlytics, Analytics, Performance, Remote Config

import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import perf from '@react-native-firebase/perf';
import remoteConfig from '@react-native-firebase/remote-config';

/**
 * Initialize Firebase services
 */
export async function initFirebase(): Promise<void> {
  // Initialize Crashlytics
  await crashlytics().setCrashlyticsCollectionEnabled(!__DEV__);
  
  // Initialize Analytics
  await analytics().setAnalyticsCollectionEnabled(!__DEV__);
  
  // Initialize Remote Config
  await remoteConfig().setDefaults({
    enable_ai_features: true,
    enable_collaboration: true,
    enable_offline_mode: true,
    max_recording_duration: 3600,
    max_file_size_mb: 100,
  });
  
  await remoteConfig().fetchAndActivate();
}

/**
 * Log crash
 */
export function logCrash(error: Error): void {
  crashlytics().recordError(error);
}

/**
 * Log custom crash
 */
export function logCustomCrash(message: string, stack?: string): void {
  crashlytics().log(message);
  if (stack) {
    crashlytics().recordError(new Error(message));
  }
}

/**
 * Set user ID for crash reports
 */
export function setCrashUserId(userId: string): void {
  crashlytics().setUserId(userId);
}

/**
 * Set custom crash attribute
 */
export function setCrashAttribute(key: string, value: string): void {
  crashlytics().setAttribute(key, value);
}

/**
 * Log analytics event
 */
export async function logEvent(
  name: string,
  params?: { [key: string]: any }
): Promise<void> {
  await analytics().logEvent(name, params);
}

/**
 * Set user properties
 */
export async function setUserProperties(properties: {
  [key: string]: string;
}): Promise<void> {
  await analytics().setUserProperties(properties);
}

/**
 * Set current screen
 */
export async function setCurrentScreen(
  screenName: string,
  screenClass?: string
): Promise<void> {
  await analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenClass || screenName,
  });
}

/**
 * Start performance trace
 */
export async function startTrace(traceName: string): Promise<any> {
  return await perf().startTrace(traceName);
}

/**
 * Get remote config value
 */
export function getRemoteConfigValue(key: string): any {
  return remoteConfig().getValue(key);
}

/**
 * Get remote config boolean
 */
export function getRemoteConfigBoolean(key: string): boolean {
  return remoteConfig().getValue(key).asBoolean();
}

/**
 * Get remote config number
 */
export function getRemoteConfigNumber(key: string): number {
  return remoteConfig().getValue(key).asNumber();
}

/**
 * Get remote config string
 */
export function getRemoteConfigString(key: string): string {
  return remoteConfig().getValue(key).asString();
}
