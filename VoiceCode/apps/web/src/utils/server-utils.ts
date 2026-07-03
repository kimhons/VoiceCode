/**
 * Server-Side Utilities
 *
 * These utilities are designed to be used in API routes or server-side code.
 * They provide secure implementations for operations that should not be done client-side.
 *
 * NOTE: This file contains placeholders and documentation for server-side implementation.
 * Actual implementation depends on your server framework (Express, Fastify, Next.js API routes, etc.)
 */

/**
 * IP Detection - Server-Side Implementation Guide
 *
 * Client-side IP detection is unreliable and insecure:
 * - External services add latency
 * - Can be spoofed
 * - Privacy concerns (GDPR)
 *
 * Server-side implementation (example for Express/Node.js):
 *
 * ```typescript
 * // In your API route
 * export function getClientIP(req: Request): string {
 *   // Check X-Forwarded-For (load balancer/proxy)
 *   const forwarded = req.headers['x-forwarded-for'];
 *   if (forwarded) {
 *     // Take the first IP (client IP)
 *     const firstIP = Array.isArray(forwarded)
 *       ? forwarded[0]
 *       : forwarded.split(',')[0];
 *     return firstIP.trim();
 *   }
 *
 *   // Check X-Real-IP (Nginx proxy)
 *   const realIP = req.headers['x-real-ip'];
 *   if (realIP) {
 *     return Array.isArray(realIP) ? realIP[0] : realIP;
 *   }
 *
 *   // Fall back to socket address
 *   return req.socket?.remoteAddress || 'unknown';
 * }
 * ```
 *
 * For Cloudflare:
 * - Use CF-Connecting-IP header
 *
 * For AWS ALB:
 * - Use X-Forwarded-For header (first IP)
 *
 * For Vercel:
 * - Use x-forwarded-for or x-real-ip
 */

/**
 * CSRF Validation - Server-Side Implementation Guide
 *
 * Server should:
 * 1. Generate token on session creation and store in session
 * 2. Validate X-CSRF-Token header matches session token
 * 3. Reject requests with invalid/missing tokens
 *
 * ```typescript
 * // Middleware example
 * export function csrfMiddleware(req: Request, res: Response, next: NextFunction) {
 *   // Skip for safe methods
 *   if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
 *     return next();
 *   }
 *
 *   const token = req.headers['x-csrf-token'];
 *   const sessionToken = req.session?.csrfToken;
 *
 *   if (!token || token !== sessionToken) {
 *     res.setHeader('X-CSRF-Error', 'true');
 *     return res.status(403).json({ error: 'CSRF validation failed' });
 *   }
 *
 *   next();
 * }
 * ```
 */

/**
 * Rate Limiting - Server-Side Implementation Guide
 *
 * Server-side rate limiting is more secure than client-side:
 *
 * ```typescript
 * // Using express-rate-limit
 * import rateLimit from 'express-rate-limit';
 *
 * const limiter = rateLimit({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   max: 100, // limit each IP to 100 requests per windowMs
 *   standardHeaders: true, // Return rate limit info in headers
 *   legacyHeaders: false,
 *   handler: (req, res) => {
 *     res.status(429).json({
 *       error: 'Too many requests',
 *       retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
 *     });
 *   },
 * });
 *
 * app.use('/api/', limiter);
 * ```
 *
 * For more sophisticated rate limiting, consider:
 * - Redis-based distributed rate limiting
 * - User-based limits (not just IP)
 * - Different limits for different endpoints
 */

/**
 * Session Management - Server-Side Guide
 *
 * Use secure session configuration:
 *
 * ```typescript
 * app.use(session({
 *   secret: process.env.SESSION_SECRET!,
 *   resave: false,
 *   saveUninitialized: false,
 *   cookie: {
 *     secure: process.env.NODE_ENV === 'production', // HTTPS only
 *     httpOnly: true, // Not accessible via JavaScript
 *     sameSite: 'strict', // Prevent CSRF
 *     maxAge: 24 * 60 * 60 * 1000, // 24 hours
 *   },
 *   store: new RedisStore({ client: redisClient }), // Use persistent store
 * }));
 * ```
 */

/**
 * API Response Types
 * Standardized response types for API routes
 */

export interface APISuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type APIResponse<T = unknown> = APISuccessResponse<T> | APIErrorResponse;

/**
 * Create a success response
 */
export function successResponse<T>(data: T): APISuccessResponse<T> {
  return { success: true, data };
}

/**
 * Create an error response
 */
export function errorResponse(
  code: string,
  message: string,
  details?: unknown
): APIErrorResponse {
  return {
    success: false,
    error: { code, message, details },
  };
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  CSRF_ERROR: 'CSRF_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
