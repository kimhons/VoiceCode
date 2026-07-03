// VoiceCode Mobile - API Error Handler
// Comprehensive error handling and retry logic for API calls

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries: number;
  backoff: 'exponential' | 'linear';
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  backoff: 'exponential',
  initialDelay: 1000,
  maxDelay: 10000,
  shouldRetry: (error) => {
    if (error instanceof APIError) {
      // Retry on server errors and rate limits
      return error.statusCode >= 500 || error.statusCode === 429;
    }
    return true;
  },
};

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (attempt === opts.maxRetries || !opts.shouldRetry?.(lastError)) {
        throw lastError;
      }

      // Calculate delay
      const delay = calculateDelay(attempt, opts);

      // Call retry callback
      opts.onRetry?.(attempt + 1, lastError);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Calculate delay for retry attempt
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const { backoff, initialDelay = 1000, maxDelay = 10000 } = options;

  let delay: number;

  if (backoff === 'exponential') {
    delay = initialDelay * Math.pow(2, attempt);
  } else {
    delay = initialDelay * (attempt + 1);
  }

  // Add jitter to prevent thundering herd
  delay = delay * (0.5 + Math.random() * 0.5);

  return Math.min(delay, maxDelay);
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse and standardize API errors
 */
export function handleAPIError(error: any): APIError {
  // Already an APIError
  if (error instanceof APIError) {
    return error;
  }

  // Network error
  if (error.message === 'Network request failed') {
    return new APIError(
      'Network connection failed. Please check your internet connection.',
      0,
      'NETWORK_ERROR'
    );
  }

  // Timeout error
  if (error.message?.includes('timeout')) {
    return new APIError(
      'Request timed out. Please try again.',
      0,
      'TIMEOUT_ERROR'
    );
  }

  // HTTP error with response
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.message || data?.error || 'An error occurred';
    const code = data?.code || `HTTP_${status}`;

    return new APIError(message, status, code, data);
  }

  // Generic error
  return new APIError(
    error.message || 'An unexpected error occurred',
    500,
    'UNKNOWN_ERROR'
  );
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof APIError) {
    // Retry on server errors, rate limits, and timeouts
    return (
      error.statusCode >= 500 ||
      error.statusCode === 429 ||
      error.statusCode === 0
    );
  }
  return true;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof APIError) {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'No internet connection. Please check your network.';
      case 'TIMEOUT_ERROR':
        return 'Request timed out. Please try again.';
      case 'AUTH_ERROR':
        return 'Authentication failed. Please sign in again.';
      case 'VALIDATION_ERROR':
        return 'Invalid input. Please check your data.';
      case 'NOT_FOUND':
        return 'Resource not found.';
      case 'RATE_LIMIT':
        return 'Too many requests. Please wait a moment.';
      default:
        if (error.statusCode >= 500) {
          return 'Server error. Please try again later.';
        }
        return error.message;
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Log error for monitoring
 */
export function logError(error: Error, context?: Record<string, any>): void {
  if (__DEV__) {
    console.error('[API Error]', error, context);
  }

  // In production, send to error tracking service (Sentry)
  // Sentry.captureException(error, { extra: context });
}
