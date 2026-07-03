/**
 * useErrorHandler Hook
 * Provides error handling utilities for React components
 */

import { useCallback } from 'react';
import { parseError, logError, createErrorToast, isRetryable } from '../utils/errorHandler';

export interface UseErrorHandlerReturn {
  /**
   * Handle an error and optionally show a toast
   */
  handleError: (error: unknown, context?: Record<string, any>, showToast?: boolean) => void;

  /**
   * Get user-friendly error message
   */
  getErrorMessage: (error: unknown) => string;

  /**
   * Check if error can be retried
   */
  canRetry: (error: unknown) => boolean;

  /**
   * Create toast configuration for error
   */
  getErrorToast: (error: unknown) => {
    title: string;
    description: string;
    variant: 'destructive' | 'default';
  };
}

/**
 * Hook for centralized error handling
 */
export function useErrorHandler(
  options?: {
    /**
     * Callback when error is handled
     */
    onError?: (error: unknown) => void;

    /**
     * Show toast by default
     */
    showToastByDefault?: boolean;

    /**
     * Custom toast function (e.g., from sonner or react-toastify)
     */
    toast?: (config: { title: string; description: string; variant?: string }) => void;
  }
): UseErrorHandlerReturn {
  const handleError = useCallback(
    (error: unknown, context?: Record<string, any>, showToast: boolean = options?.showToastByDefault ?? true) => {
      // Parse and log error
      const appError = parseError(error);
      logError(error, context);

      // Call custom error handler if provided
      options?.onError?.(error);

      // Show toast if enabled
      if (showToast && options?.toast) {
        const toastConfig = createErrorToast(error);
        options.toast(toastConfig);
      }

      // Log to console in development
      if (import.meta.env.DEV) {
        console.error('[useErrorHandler]', {
          error: appError,
          context,
        });
      }
    },
    [options]
  );

  const getErrorMessage = useCallback((error: unknown): string => {
    const appError = parseError(error);
    return appError.userMessage;
  }, []);

  const canRetry = useCallback((error: unknown): boolean => {
    return isRetryable(error);
  }, []);

  const getErrorToast = useCallback((error: unknown) => {
    return createErrorToast(error);
  }, []);

  return {
    handleError,
    getErrorMessage,
    canRetry,
    getErrorToast,
  };
}

/**
 * Example usage:
 *
 * ```tsx
 * import { useErrorHandler } from '@/hooks/useErrorHandler';
 * import { toast } from 'sonner';
 *
 * function MyComponent() {
 *   const { handleError, canRetry } = useErrorHandler({
 *     toast: (config) => toast.error(config.title, {
 *       description: config.description,
 *     }),
 *     showToastByDefault: true,
 *   });
 *
 *   const handleSubmit = async () => {
 *     try {
 *       await someAsyncOperation();
 *     } catch (error) {
 *       handleError(error, { action: 'submit_form' });
 *
 *       if (canRetry(error)) {
 *         // Show retry button
 *       }
 *     }
 *   };
 *
 *   return <button onClick={handleSubmit}>Submit</button>;
 * }
 * ```
 */
