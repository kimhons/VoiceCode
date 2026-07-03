// VoiceCode Mobile - Sentry Configuration
// Error tracking and performance monitoring

import * as Sentry from '@sentry/react-native';

/**
 * Initialize Sentry error tracking
 */
export function initSentry(): void {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    environment: __DEV__ ? 'development' : 'production',
    enabled: !__DEV__,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 10000,
    tracesSampleRate: 1.0,
    beforeSend(event, hint) {
      // Filter sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      // Filter sensitive breadcrumbs
      if (breadcrumb.category === 'console') {
        return null;
      }
      return breadcrumb;
    },
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string): void {
  Sentry.setUser({
    id: userId,
    email,
  });
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Log error to Sentry
 */
export function logError(error: Error, context?: Record<string, any>): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Log message to Sentry
 */
export function logMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Start performance transaction
 */
export function startTransaction(name: string, op: string): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op,
  });
}
