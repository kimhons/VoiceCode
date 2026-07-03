/**
 * Error Tracking Service
 * Sentry-ready error tracking and performance monitoring.
 * Replace the placeholder DSN with a real Sentry DSN to activate.
 */

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
const ENVIRONMENT = import.meta.env.MODE || 'development';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  extra?: Record<string, unknown>;
}

interface BreadcrumbEntry {
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  timestamp: number;
}

class ErrorTrackingService {
  private initialized = false;
  private breadcrumbs: BreadcrumbEntry[] = [];
  private maxBreadcrumbs = 50;

  /**
   * Initialize error tracking. Call once at app startup.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Set up global error handlers
    this.setupGlobalHandlers();

    // If Sentry DSN is configured, dynamically import and initialize
    if (SENTRY_DSN && SENTRY_DSN !== 'your_sentry_dsn_here') {
      try {
        // Dynamic import to avoid bundling Sentry when not used
        const Sentry = await import('@sentry/react');
        Sentry.init({
          dsn: SENTRY_DSN,
          environment: ENVIRONMENT,
          release: `voicecode-web@${APP_VERSION}`,
          tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: ENVIRONMENT === 'production' ? 1.0 : 0,
        });
        this.initialized = true;
      } catch {
        // Sentry package not installed - use fallback
        this.initialized = true;
      }
    } else {
      this.initialized = true;
    }
  }

  /**
   * Capture an error with optional context
   */
  captureError(error: Error, context?: ErrorContext): void {
    // Always log in development
    if (import.meta.env.DEV) {
      console.error('[ErrorTracking]', error.message, context);
    }

    this.addBreadcrumb({
      category: 'error',
      message: error.message,
      level: 'error',
      timestamp: Date.now(),
    });

    // Forward to Sentry if available
    if (typeof window !== 'undefined' && 'Sentry' in window) {
      const sentry = (window as Window & { Sentry?: { captureException: (e: Error, ctx?: Record<string, unknown>) => void } }).Sentry;
      sentry?.captureException(error, {
        tags: {
          component: context?.component,
          action: context?.action,
        },
        user: context?.userId ? { id: context.userId } : undefined,
        extra: context?.extra,
      } as Record<string, unknown>);
    }
  }

  /**
   * Capture a message (non-error event)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    this.addBreadcrumb({
      category: 'message',
      message,
      level,
      timestamp: Date.now(),
    });
  }

  /**
   * Set user context for error reports
   */
  setUser(userId: string, email?: string): void {
    if (typeof window !== 'undefined' && 'Sentry' in window) {
      const sentry = (window as Window & { Sentry?: { setUser: (u: Record<string, string>) => void } }).Sentry;
      sentry?.setUser({ id: userId, ...(email ? { email } : {}) });
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    if (typeof window !== 'undefined' && 'Sentry' in window) {
      const sentry = (window as Window & { Sentry?: { setUser: (u: null) => void } }).Sentry;
      sentry?.setUser(null);
    }
  }

  /**
   * Add a breadcrumb for debugging context
   */
  addBreadcrumb(entry: BreadcrumbEntry): void {
    this.breadcrumbs.push(entry);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Get recent breadcrumbs for debugging
   */
  getBreadcrumbs(): ReadonlyArray<BreadcrumbEntry> {
    return this.breadcrumbs;
  }

  private setupGlobalHandlers(): void {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
      this.captureError(error, { action: 'unhandledrejection' });
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      if (event.error instanceof Error) {
        this.captureError(event.error, { action: 'window.onerror' });
      }
    });
  }
}

export const errorTracking = new ErrorTrackingService();
