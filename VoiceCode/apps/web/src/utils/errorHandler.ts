/**
 * Error Handling Utilities
 * Provides user-friendly error messages and centralized error handling
 */

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action?: string; // Suggested user action
  retryable: boolean;
}

/**
 * Error code mappings to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, AppError> = {
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_INVALID_CREDENTIALS',
    message: 'Invalid email or password',
    userMessage: 'The email or password you entered is incorrect. Please try again.',
    severity: 'low',
    action: 'Double-check your email and password, or use "Forgot Password" to reset.',
    retryable: true,
  },
  AUTH_USER_NOT_FOUND: {
    code: 'AUTH_USER_NOT_FOUND',
    message: 'User not found',
    userMessage: 'We couldn\'t find an account with that email address.',
    severity: 'low',
    action: 'Please check your email or create a new account.',
    retryable: false,
  },
  AUTH_EMAIL_EXISTS: {
    code: 'AUTH_EMAIL_EXISTS',
    message: 'Email already registered',
    userMessage: 'An account with this email already exists.',
    severity: 'low',
    action: 'Try signing in instead, or use a different email address.',
    retryable: false,
  },
  AUTH_WEAK_PASSWORD: {
    code: 'AUTH_WEAK_PASSWORD',
    message: 'Password too weak',
    userMessage: 'Your password must be at least 8 characters with uppercase, lowercase, and numbers.',
    severity: 'low',
    action: 'Create a stronger password with mixed characters.',
    retryable: true,
  },
  AUTH_SESSION_EXPIRED: {
    code: 'AUTH_SESSION_EXPIRED',
    message: 'Session expired',
    userMessage: 'Your session has expired. Please sign in again.',
    severity: 'medium',
    action: 'Sign in to continue using the app.',
    retryable: false,
  },
  AUTH_OAUTH_FAILED: {
    code: 'AUTH_OAUTH_FAILED',
    message: 'OAuth authentication failed',
    userMessage: 'We couldn\'t sign you in with this provider.',
    severity: 'medium',
    action: 'Try again or use email/password to sign in.',
    retryable: true,
  },

  // Upload Errors
  UPLOAD_FILE_TOO_LARGE: {
    code: 'UPLOAD_FILE_TOO_LARGE',
    message: 'File exceeds size limit',
    userMessage: 'This file is too large. Maximum size is 50 MB.',
    severity: 'low',
    action: 'Compress your audio file or split it into smaller parts.',
    retryable: false,
  },
  UPLOAD_UNSUPPORTED_FORMAT: {
    code: 'UPLOAD_UNSUPPORTED_FORMAT',
    message: 'Unsupported file format',
    userMessage: 'This file format is not supported.',
    severity: 'low',
    action: 'Please upload MP3, WAV, M4A, OGG, FLAC, or WebM files.',
    retryable: false,
  },
  UPLOAD_NETWORK_ERROR: {
    code: 'UPLOAD_NETWORK_ERROR',
    message: 'Network error during upload',
    userMessage: 'Upload failed due to a network issue.',
    severity: 'medium',
    action: 'Check your internet connection and try again.',
    retryable: true,
  },
  UPLOAD_STORAGE_FULL: {
    code: 'UPLOAD_STORAGE_FULL',
    message: 'Storage quota exceeded',
    userMessage: 'You\'ve reached your storage limit.',
    severity: 'high',
    action: 'Delete old files or upgrade your plan for more storage.',
    retryable: false,
  },

  // Transcription Errors
  TRANS_POOR_AUDIO_QUALITY: {
    code: 'TRANS_POOR_AUDIO_QUALITY',
    message: 'Audio quality too low',
    userMessage: 'The audio quality is too low to transcribe accurately.',
    severity: 'medium',
    action: 'Try recording in a quieter environment with a better microphone.',
    retryable: true,
  },
  TRANS_LANGUAGE_NOT_SUPPORTED: {
    code: 'TRANS_LANGUAGE_NOT_SUPPORTED',
    message: 'Language not supported',
    userMessage: 'This language is not currently supported for transcription.',
    severity: 'low',
    action: 'Check our list of supported languages or request support for this language.',
    retryable: false,
  },
  TRANS_API_ERROR: {
    code: 'TRANS_API_ERROR',
    message: 'Transcription service error',
    userMessage: 'We couldn\'t transcribe your audio right now.',
    severity: 'high',
    action: 'Please try again in a few minutes.',
    retryable: true,
  },
  TRANS_TIMEOUT: {
    code: 'TRANS_TIMEOUT',
    message: 'Transcription timeout',
    userMessage: 'Transcription is taking longer than expected.',
    severity: 'medium',
    action: 'For long audio files, try splitting them into shorter segments.',
    retryable: true,
  },

  // API Errors
  API_RATE_LIMIT: {
    code: 'API_RATE_LIMIT',
    message: 'Rate limit exceeded',
    userMessage: 'You\'ve made too many requests. Please slow down.',
    severity: 'medium',
    action: 'Wait a minute before trying again.',
    retryable: true,
  },
  API_SERVICE_UNAVAILABLE: {
    code: 'API_SERVICE_UNAVAILABLE',
    message: 'Service temporarily unavailable',
    userMessage: 'Our service is temporarily unavailable.',
    severity: 'high',
    action: 'Please try again in a few minutes.',
    retryable: true,
  },
  API_INVALID_KEY: {
    code: 'API_INVALID_KEY',
    message: 'Invalid API key',
    userMessage: 'There\'s a configuration issue with the app.',
    severity: 'critical',
    action: 'Please contact support.',
    retryable: false,
  },

  // Database Errors
  DB_CONNECTION_FAILED: {
    code: 'DB_CONNECTION_FAILED',
    message: 'Database connection failed',
    userMessage: 'We couldn\'t connect to the database.',
    severity: 'high',
    action: 'Check your internet connection and try again.',
    retryable: true,
  },
  DB_SAVE_FAILED: {
    code: 'DB_SAVE_FAILED',
    message: 'Failed to save data',
    userMessage: 'We couldn\'t save your changes.',
    severity: 'high',
    action: 'Please try again or contact support if the problem persists.',
    retryable: true,
  },
  DB_NOT_FOUND: {
    code: 'DB_NOT_FOUND',
    message: 'Record not found',
    userMessage: 'We couldn\'t find what you\'re looking for.',
    severity: 'medium',
    action: 'This item may have been deleted. Try refreshing the page.',
    retryable: false,
  },

  // Export Errors
  EXPORT_GENERATION_FAILED: {
    code: 'EXPORT_GENERATION_FAILED',
    message: 'Export generation failed',
    userMessage: 'We couldn\'t generate your export file.',
    severity: 'medium',
    action: 'Try again or choose a different export format.',
    retryable: true,
  },
  EXPORT_TOO_LARGE: {
    code: 'EXPORT_TOO_LARGE',
    message: 'Export file too large',
    userMessage: 'The export file is too large to generate.',
    severity: 'low',
    action: 'Try exporting fewer transcripts at once.',
    retryable: false,
  },

  // Network Errors
  NETWORK_OFFLINE: {
    code: 'NETWORK_OFFLINE',
    message: 'No internet connection',
    userMessage: 'You\'re offline. Some features may not work.',
    severity: 'high',
    action: 'Check your internet connection.',
    retryable: true,
  },
  NETWORK_TIMEOUT: {
    code: 'NETWORK_TIMEOUT',
    message: 'Request timeout',
    userMessage: 'The request took too long to complete.',
    severity: 'medium',
    action: 'Check your connection and try again.',
    retryable: true,
  },

  // Unknown Error
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error',
    userMessage: 'Something went wrong. We\'re not sure what happened.',
    severity: 'medium',
    action: 'Please try again or contact support if the problem continues.',
    retryable: true,
  },
};

/**
 * Parse error and return user-friendly error object
 */
export function parseError(error: unknown): AppError {
  // If it's already an AppError, return it
  if (isAppError(error)) {
    return error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Check for known error patterns
    const message = error.message.toLowerCase();

    // Authentication errors
    if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
      return ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;
    }
    if (message.includes('user not found') || message.includes('user does not exist')) {
      return ERROR_MESSAGES.AUTH_USER_NOT_FOUND;
    }
    if (message.includes('user already registered') || message.includes('email already exists')) {
      return ERROR_MESSAGES.AUTH_EMAIL_EXISTS;
    }
    if (message.includes('password') && (message.includes('weak') || message.includes('short'))) {
      return ERROR_MESSAGES.AUTH_WEAK_PASSWORD;
    }
    if (message.includes('session expired') || message.includes('token expired')) {
      return ERROR_MESSAGES.AUTH_SESSION_EXPIRED;
    }
    if (message.includes('oauth') && message.includes('failed')) {
      return ERROR_MESSAGES.AUTH_OAUTH_FAILED;
    }

    // Upload errors
    if (message.includes('file too large') || message.includes('exceeds') || message.includes('50')) {
      return ERROR_MESSAGES.UPLOAD_FILE_TOO_LARGE;
    }
    if (message.includes('unsupported format') || message.includes('invalid file type')) {
      return ERROR_MESSAGES.UPLOAD_UNSUPPORTED_FORMAT;
    }
    if (message.includes('storage') && message.includes('full')) {
      return ERROR_MESSAGES.UPLOAD_STORAGE_FULL;
    }

    // API errors
    if (message.includes('rate limit')) {
      return ERROR_MESSAGES.API_RATE_LIMIT;
    }
    if (message.includes('503') || message.includes('service unavailable')) {
      return ERROR_MESSAGES.API_SERVICE_UNAVAILABLE;
    }
    if (message.includes('401') || message.includes('unauthorized') || message.includes('invalid api key')) {
      return ERROR_MESSAGES.API_INVALID_KEY;
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch failed')) {
      return ERROR_MESSAGES.NETWORK_OFFLINE;
    }
    if (message.includes('timeout')) {
      return ERROR_MESSAGES.NETWORK_TIMEOUT;
    }

    // Database errors
    if (message.includes('database') || message.includes('connection failed')) {
      return ERROR_MESSAGES.DB_CONNECTION_FAILED;
    }
    if (message.includes('not found') && !message.includes('user')) {
      return ERROR_MESSAGES.DB_NOT_FOUND;
    }
  }

  // Fallback to unknown error
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Check if error is an AppError
 */
function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'userMessage' in error &&
    'severity' in error
  );
}

/**
 * Format error for display
 */
export function formatErrorMessage(error: unknown): string {
  const appError = parseError(error);
  return appError.userMessage;
}

/**
 * Get error severity
 */
export function getErrorSeverity(error: unknown): 'low' | 'medium' | 'high' | 'critical' {
  const appError = parseError(error);
  return appError.severity;
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: unknown): boolean {
  const appError = parseError(error);
  return appError.retryable;
}

/**
 * Get suggested action for error
 */
export function getErrorAction(error: unknown): string | undefined {
  const appError = parseError(error);
  return appError.action;
}

/**
 * Log error for monitoring
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  const appError = parseError(error);

  const errorLog = {
    timestamp: new Date().toISOString(),
    code: appError.code,
    message: appError.message,
    severity: appError.severity,
    context,
    stack: error instanceof Error ? error.stack : undefined,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[Error]', errorLog);
  }

  // Send to error tracking service in production
  if (import.meta.env.PROD && import.meta.env.VITE_ERROR_LOG_URL) {
    fetch(import.meta.env.VITE_ERROR_LOG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorLog),
    }).catch(() => {
      // Silently fail if error logging fails
    });
  }
}

/**
 * Create a user-friendly error toast message
 */
export function createErrorToast(error: unknown): {
  title: string;
  description: string;
  variant: 'destructive' | 'default';
} {
  const appError = parseError(error);

  return {
    title: getSeverityTitle(appError.severity),
    description: `${appError.userMessage}${appError.action ? `\n\n${appError.action}` : ''}`,
    variant: appError.severity === 'critical' || appError.severity === 'high' ? 'destructive' : 'default',
  };
}

/**
 * Get title based on severity
 */
function getSeverityTitle(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (severity) {
    case 'low':
      return 'Heads up';
    case 'medium':
      return 'Error';
    case 'high':
      return 'Error';
    case 'critical':
      return 'Critical Error';
    default:
      return 'Error';
  }
}
