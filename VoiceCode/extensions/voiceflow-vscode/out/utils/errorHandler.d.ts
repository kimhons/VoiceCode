/**
 * Error Handler Utility
 * Provides centralized error handling with user-friendly messages
 *
 * OPTIMIZATION: Phase 3 - Error Handling Enhancement
 * Based on web app pattern (apps/web/src/utils/errorHandler.ts)
 */
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
export declare const ERROR_MESSAGES: Record<string, ExtensionError>;
/**
 * Parse error and return user-friendly ExtensionError
 */
export declare function parseError(error: unknown): ExtensionError;
/**
 * Format error for display to user
 */
export declare function formatErrorMessage(error: ExtensionError): string;
/**
 * Get appropriate VS Code message function based on severity
 */
export declare function getMessageFunction(severity: ExtensionError['severity']): (message: string, ...items: string[]) => Thenable<string | undefined>;
/**
 * Show error to user with appropriate severity
 */
export declare function showError(error: unknown): void;
/**
 * Create a new ExtensionError
 */
export declare function createError(code: string, message: string, userMessage: string, options?: Partial<ExtensionError>): ExtensionError;
//# sourceMappingURL=errorHandler.d.ts.map