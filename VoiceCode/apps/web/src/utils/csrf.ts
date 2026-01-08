/**
 * CSRF Protection Utilities
 *
 * Client-side CSRF token management for API requests.
 * Works in coordination with server-side validation.
 *
 * USAGE:
 * 1. Server generates CSRF token on session creation
 * 2. Client includes token in X-CSRF-Token header
 * 3. Server validates token matches session
 */

const CSRF_TOKEN_KEY = 'csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in session storage
 * Session storage is preferred over localStorage for security:
 * - Cleared when tab/browser closes
 * - Not accessible from other tabs
 */
export function storeCSRFToken(token: string): void {
  try {
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  } catch {
    // Session storage not available (e.g., private browsing)
    console.warn('[CSRF] Session storage not available');
  }
}

/**
 * Retrieve stored CSRF token
 */
export function getCSRFToken(): string | null {
  try {
    return sessionStorage.getItem(CSRF_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear CSRF token (e.g., on logout)
 */
export function clearCSRFToken(): void {
  try {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Initialize CSRF token if not present
 * Call this on app initialization
 */
export function initializeCSRF(): string {
  let token = getCSRFToken();
  if (!token) {
    token = generateCSRFToken();
    storeCSRFToken(token);
  }
  return token;
}

/**
 * Get headers with CSRF token for API requests
 */
export function getCSRFHeaders(): Record<string, string> {
  const token = getCSRFToken();
  if (!token) {
    return {};
  }
  return { [CSRF_HEADER_NAME]: token };
}

/**
 * Create a fetch wrapper that includes CSRF token
 */
export function csrfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfHeaders = getCSRFHeaders();

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...csrfHeaders,
    },
  });
}

/**
 * Verify that a response indicates CSRF validation passed
 * Returns false if server rejected due to CSRF
 */
export function isCSRFError(response: Response): boolean {
  return response.status === 403 && response.headers.get('X-CSRF-Error') === 'true';
}

/**
 * Handle CSRF error by regenerating token
 * Call this when server rejects CSRF token
 */
export function handleCSRFError(): string {
  const newToken = generateCSRFToken();
  storeCSRFToken(newToken);
  return newToken;
}

// Export constants for server-side coordination
export const CSRF_CONSTANTS = {
  TOKEN_KEY: CSRF_TOKEN_KEY,
  HEADER_NAME: CSRF_HEADER_NAME,
  TOKEN_LENGTH: 64, // 32 bytes in hex
};
