/**
 * Type declarations for optional native dependencies.
 * These packages are installed per-platform and may not ship their own types.
 * This file MUST be a standalone .d.ts (no imports/exports at top level)
 * so that `declare module` creates ambient declarations, not augmentations.
 */

declare module 'expo-device' {
  export const brand: string | null;
  export const manufacturer: string | null;
  export const modelName: string | null;
  export const osName: string | null;
  export const osVersion: string | null;
  export const isDevice: boolean;
  export const deviceName: string | null;
}

declare module '@react-native-firebase/crashlytics' {
  interface Crashlytics {
    setCrashlyticsCollectionEnabled(enabled: boolean): Promise<null>;
    recordError(error: Error): void;
    log(message: string): void;
    setUserId(userId: string): void;
    setAttribute(key: string, value: string): Promise<null>;
  }
  const crashlytics: () => Crashlytics;
  export default crashlytics;
}

declare module '@react-native-firebase/analytics' {
  interface Analytics {
    setAnalyticsCollectionEnabled(enabled: boolean): Promise<void>;
    logEvent(name: string, params?: Record<string, unknown>): Promise<void>;
    setUserProperties(properties: Record<string, string>): Promise<void>;
    logScreenView(params: { screen_name: string; screen_class?: string }): Promise<void>;
  }
  const analytics: () => Analytics;
  export default analytics;
}

declare module '@react-native-firebase/perf' {
  interface Trace {
    start(): Promise<null>;
    stop(): Promise<null>;
    putMetric(name: string, value: number): void;
    putAttribute(name: string, value: string): void;
  }
  interface Perf {
    startTrace(traceName: string): Promise<Trace>;
  }
  const perf: () => Perf;
  export default perf;
}

declare module '@react-native-firebase/remote-config' {
  interface ConfigValue {
    asBoolean(): boolean;
    asNumber(): number;
    asString(): string;
  }
  interface RemoteConfig {
    setDefaults(defaults: Record<string, unknown>): Promise<null>;
    fetchAndActivate(): Promise<boolean>;
    getValue(key: string): ConfigValue;
  }
  const remoteConfig: () => RemoteConfig;
  export default remoteConfig;
}

declare module '@sentry/react-native' {
  export interface Transaction {
    finish(): void;
    setTag(key: string, value: string): void;
    setData(key: string, value: unknown): void;
  }
  export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
  export interface SentryEvent {
    request?: {
      cookies?: string;
      headers?: Record<string, string>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }
  export interface Breadcrumb {
    message?: string;
    category?: string;
    data?: Record<string, unknown>;
    level?: SeverityLevel;
    [key: string]: unknown;
  }
  export interface Hint {
    originalException?: unknown;
    [key: string]: unknown;
  }
  export function init(options: {
    dsn: string;
    environment?: string;
    enabled?: boolean;
    enableAutoSessionTracking?: boolean;
    sessionTrackingIntervalMillis?: number;
    tracesSampleRate?: number;
    beforeSend?: (event: SentryEvent, hint: Hint) => SentryEvent | null;
    beforeBreadcrumb?: (breadcrumb: Breadcrumb) => Breadcrumb | null;
    [key: string]: unknown;
  }): void;
  export function setUser(user: { id?: string; email?: string; [key: string]: unknown } | null): void;
  export function captureException(error: unknown, context?: { extra?: Record<string, unknown> }): void;
  export function captureMessage(message: string, level?: SeverityLevel): void;
  export function addBreadcrumb(breadcrumb: Breadcrumb): void;
  export function startTransaction(context: { name: string; op: string }): Transaction;
}

declare module '@react-native-community/slider' {
  import { Component } from 'react';
  import { ViewStyle, StyleProp } from 'react-native';
  interface SliderProps {
    style?: StyleProp<ViewStyle>;
    minimumValue?: number;
    maximumValue?: number;
    value?: number;
    step?: number;
    onValueChange?: (value: number) => void;
    onSlidingStart?: (value: number) => void;
    onSlidingComplete?: (value: number) => void;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
    disabled?: boolean;
  }
  export default class Slider extends Component<SliderProps> {}
}

