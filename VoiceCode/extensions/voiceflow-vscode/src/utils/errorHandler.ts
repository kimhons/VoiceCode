/**
 * Error Handler Utility
 * Provides centralized error handling with user-friendly messages
 *
 * OPTIMIZATION: Phase 3 - Error Handling Enhancement
 * Based on web app pattern (apps/web/src/utils/errorHandler.ts)
 */

import * as vscode from 'vscode';

export interface ExtensionError {
  code: string;
  message: string;
  userMessage: string;
  action?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  canRetry: boolean;
}

/**
 * Predefined error messages for common failure scenarios
 */
export const ERROR_MESSAGES: Record<string, ExtensionError> = {
  // Model Loading Errors
  WHISPER_MODEL_LOAD_FAILED: {
    code: 'WHISPER_MODEL_LOAD_FAILED',
    message: 'Failed to load Whisper model',
    userMessage: 'Could not load voice recognition model. Using cloud fallback.',
    action: 'Check your internet connection or clear extension cache',
    severity: 'warning',
    canRetry: true,
  },

  WHISPER_MODEL_DOWNLOAD_FAILED: {
    code: 'WHISPER_MODEL_DOWNLOAD_FAILED',
    message: 'Model download failed',
    userMessage: 'Unable to download voice recognition model.',
    action: 'Check your internet connection and try again',
    severity: 'error',
    canRetry: true,
  },

  WHISPER_MODEL_CACHE_FULL: {
    code: 'WHISPER_MODEL_CACHE_FULL',
    message: 'Cache storage quota exceeded',
    userMessage: 'Not enough storage space for voice model cache.',
    action: 'Clear cache using "VoiceFlow: Clear Model Cache" command',
    severity: 'warning',
    canRetry: false,
  },

  // Microphone Access Errors
  MICROPHONE_ACCESS_DENIED: {
    code: 'MICROPHONE_ACCESS_DENIED',
    message: 'Microphone access denied',
    userMessage: 'VoiceFlow needs microphone access to work.',
    action: 'Grant microphone permission in VS Code settings',
    severity: 'error',
    canRetry: false,
  },

  MICROPHONE_NOT_FOUND: {
    code: 'MICROPHONE_NOT_FOUND',
    message: 'No microphone device found',
    userMessage: 'No microphone detected on your system.',
    action: 'Connect a microphone and restart VS Code',
    severity: 'error',
    canRetry: true,
  },

  MICROPHONE_IN_USE: {
    code: 'MICROPHONE_IN_USE',
    message: 'Microphone is being used by another application',
    userMessage: 'Microphone is currently in use.',
    action: 'Close other applications using the microphone',
    severity: 'warning',
    canRetry: true,
  },

  // Voice Recognition Errors
  TRANSCRIPTION_FAILED: {
    code: 'TRANSCRIPTION_FAILED',
    message: 'Voice transcription failed',
    userMessage: 'Could not transcribe your voice input.',
    action: 'Try speaking more clearly or use text commands',
    severity: 'warning',
    canRetry: true,
  },

  TRANSCRIPTION_TIMEOUT: {
    code: 'TRANSCRIPTION_TIMEOUT',
    message: 'Transcription took too long',
    userMessage: 'Voice recognition timed out.',
    action: 'Try shorter commands or use text input',
    severity: 'warning',
    canRetry: true,
  },

  AUDIO_QUALITY_LOW: {
    code: 'AUDIO_QUALITY_LOW',
    message: 'Audio quality too low for recognition',
    userMessage: 'Audio quality is poor.',
    action: 'Check microphone connection and reduce background noise',
    severity: 'info',
    canRetry: true,
  },

  // AI Provider Errors
  AI_REQUEST_FAILED: {
    code: 'AI_REQUEST_FAILED',
    message: 'AI provider request failed',
    userMessage: 'AI service is temporarily unavailable.',
    action: 'Check AI provider status and try again',
    severity: 'error',
    canRetry: true,
  },

  AI_API_KEY_INVALID: {
    code: 'AI_API_KEY_INVALID',
    message: 'Invalid API key',
    userMessage: 'AI service authentication failed.',
    action: 'Update your API key in settings',
    severity: 'error',
    canRetry: false,
  },

  AI_RATE_LIMITED: {
    code: 'AI_RATE_LIMITED',
    message: 'AI provider rate limit exceeded',
    userMessage: 'Too many requests to AI service.',
    action: 'Wait a moment before trying again',
    severity: 'warning',
    canRetry: true,
  },

  AI_QUOTA_EXCEEDED: {
    code: 'AI_QUOTA_EXCEEDED',
    message: 'AI provider quota exceeded',
    userMessage: 'AI service usage limit reached.',
    action: 'Upgrade your plan or wait for quota reset',
    severity: 'warning',
    canRetry: false,
  },

  // Authentication Errors
  AUTH_FAILED: {
    code: 'AUTH_FAILED',
    message: 'Authentication failed',
    userMessage: 'Could not sign in to VoiceFlow Pro.',
    action: 'Check your credentials and try again',
    severity: 'error',
    canRetry: true,
  },

  AUTH_TOKEN_EXPIRED: {
    code: 'AUTH_TOKEN_EXPIRED',
    message: 'Authentication token expired',
    userMessage: 'Session expired. Please sign in again.',
    action: 'Sign in using "VoiceFlow: Sign In" command',
    severity: 'warning',
    canRetry: false,
  },

  AUTH_NETWORK_ERROR: {
    code: 'AUTH_NETWORK_ERROR',
    message: 'Network error during authentication',
    userMessage: 'Could not connect to authentication server.',
    action: 'Check internet connection and try again',
    severity: 'error',
    canRetry: true,
  },

  // Cloud Sync Errors
  SYNC_FAILED: {
    code: 'SYNC_FAILED',
    message: 'Cloud sync failed',
    userMessage: 'Could not sync your data to cloud.',
    action: 'Check internet connection and try manual sync',
    severity: 'warning',
    canRetry: true,
  },

  SYNC_CONFLICT: {
    code: 'SYNC_CONFLICT',
    message: 'Sync conflict detected',
    userMessage: 'Cloud data conflicts with local changes.',
    action: 'Choose whether to use local or cloud version',
    severity: 'warning',
    canRetry: false,
  },

  // Command Execution Errors
  COMMAND_NOT_FOUND: {
    code: 'COMMAND_NOT_FOUND',
    message: 'Command not recognized',
    userMessage: 'VoiceFlow did not understand that command.',
    action: 'Try "VoiceFlow: Show Commands" to see available options',
    severity: 'info',
    canRetry: true,
  },

  COMMAND_EXECUTION_FAILED: {
    code: 'COMMAND_EXECUTION_FAILED',
    message: 'Command execution failed',
    userMessage: 'Could not execute that command.',
    action: 'Check VS Code output panel for details',
    severity: 'error',
    canRetry: true,
  },

  COMMAND_REQUIRES_SELECTION: {
    code: 'COMMAND_REQUIRES_SELECTION',
    message: 'Command requires text selection',
    userMessage: 'Please select some code first.',
    action: 'Select code in the editor and try again',
    severity: 'info',
    canRetry: false,
  },

  COMMAND_REQUIRES_PREMIUM: {
    code: 'COMMAND_REQUIRES_PREMIUM',
    message: 'Command requires Pro or Enterprise tier',
    userMessage: 'This feature requires a premium subscription.',
    action: 'Upgrade to Pro or Enterprise to use this feature',
    severity: 'info',
    canRetry: false,
  },

  // File Operation Errors
  FILE_NOT_FOUND: {
    code: 'FILE_NOT_FOUND',
    message: 'File not found',
    userMessage: 'The specified file does not exist.',
    action: 'Check the file path and try again',
    severity: 'error',
    canRetry: false,
  },

  FILE_PERMISSION_DENIED: {
    code: 'FILE_PERMISSION_DENIED',
    message: 'Permission denied',
    userMessage: 'Cannot modify this file due to permissions.',
    action: 'Check file permissions',
    severity: 'error',
    canRetry: false,
  },

  // Network Errors
  NETWORK_OFFLINE: {
    code: 'NETWORK_OFFLINE',
    message: 'Network offline',
    userMessage: 'No internet connection detected.',
    action: 'Connect to internet to use cloud features',
    severity: 'warning',
    canRetry: true,
  },

  NETWORK_TIMEOUT: {
    code: 'NETWORK_TIMEOUT',
    message: 'Network request timeout',
    userMessage: 'Request took too long to complete.',
    action: 'Check internet connection and try again',
    severity: 'warning',
    canRetry: true,
  },

  // Generic Errors
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error occurred',
    userMessage: 'An unexpected error occurred.',
    action: 'Check VS Code output panel for details',
    severity: 'error',
    canRetry: true,
  },

  INITIALIZATION_FAILED: {
    code: 'INITIALIZATION_FAILED',
    message: 'Service initialization failed',
    userMessage: 'VoiceFlow Pro failed to initialize properly.',
    action: 'Reload VS Code window to retry',
    severity: 'critical',
    canRetry: true,
  },
};

/**
 * Parse error and return user-friendly ExtensionError
 */
export function parseError(error: unknown): ExtensionError {
  // If it's already an ExtensionError, return it
  if (isExtensionError(error)) {
    return error;
  }

  // If it's a standard Error with a code we recognize
  if (error instanceof Error) {
    const errorCode = (error as any).code;
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      return ERROR_MESSAGES[errorCode];
    }

    // Try to match error message to known patterns
    const message = error.message.toLowerCase();

    if (message.includes('microphone') || message.includes('permission')) {
      return ERROR_MESSAGES.MICROPHONE_ACCESS_DENIED;
    }
    if (message.includes('network') || message.includes('offline')) {
      return ERROR_MESSAGES.NETWORK_OFFLINE;
    }
    if (message.includes('timeout')) {
      return ERROR_MESSAGES.NETWORK_TIMEOUT;
    }
    if (message.includes('auth') || message.includes('token')) {
      return ERROR_MESSAGES.AUTH_FAILED;
    }
    if (message.includes('rate limit')) {
      return ERROR_MESSAGES.AI_RATE_LIMITED;
    }
    if (message.includes('quota')) {
      return ERROR_MESSAGES.AI_QUOTA_EXCEEDED;
    }

    // Return generic error with original message
    return {
      ...ERROR_MESSAGES.UNKNOWN_ERROR,
      message: error.message,
    };
  }

  // Fallback for non-Error objects
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Check if object is an ExtensionError
 */
function isExtensionError(obj: unknown): obj is ExtensionError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'code' in obj &&
    'userMessage' in obj &&
    'severity' in obj
  );
}

/**
 * Format error for display to user
 */
export function formatErrorMessage(error: ExtensionError): string {
  let message = error.userMessage;

  if (error.action) {
    message += `\n\n💡 ${error.action}`;
  }

  return message;
}

/**
 * Get appropriate VS Code message function based on severity
 */
export function getMessageFunction(severity: ExtensionError['severity']):
  (message: string, ...items: string[]) => Thenable<string | undefined> {
  switch (severity) {
    case 'info':
      return vscode.window.showInformationMessage;
    case 'warning':
      return vscode.window.showWarningMessage;
    case 'error':
    case 'critical':
      return vscode.window.showErrorMessage;
    default:
      return vscode.window.showInformationMessage;
  }
}

/**
 * Show error to user with appropriate severity
 */
export function showError(error: unknown): void {
  const extensionError = parseError(error);
  const message = formatErrorMessage(extensionError);
  const showMessage = getMessageFunction(extensionError.severity);

  if (extensionError.canRetry) {
    showMessage(message, 'Retry').then((selection) => {
      if (selection === 'Retry') {
        // Retry logic would be handled by caller
        console.log('User requested retry for:', extensionError.code);
      }
    });
  } else {
    showMessage(message);
  }

  // Log to console for debugging
  console.error(`[VoiceFlow Error] ${extensionError.code}:`, extensionError.message);
}

/**
 * Create a new ExtensionError
 */
export function createError(
  code: string,
  message: string,
  userMessage: string,
  options: Partial<ExtensionError> = {}
): ExtensionError {
  return {
    code,
    message,
    userMessage,
    severity: options.severity || 'error',
    canRetry: options.canRetry !== undefined ? options.canRetry : true,
    action: options.action,
  };
}
