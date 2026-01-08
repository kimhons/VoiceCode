/**
 * Input Validation Schemas
 *
 * SECURITY: Centralized validation using Zod for type-safe input validation.
 * All user inputs should be validated before processing.
 */

import { z } from 'zod';

// ============================================
// Common Validators
// ============================================

/** Safe string that's trimmed and limited in length */
export const safeString = (maxLength: number = 1000) =>
  z.string().trim().max(maxLength);

/** Email validation */
export const emailSchema = z.string().email().max(255).toLowerCase();

/** Password validation - minimum security requirements */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/** UUID validation */
export const uuidSchema = z.string().uuid();

/** URL validation */
export const urlSchema = z.string().url().max(2048);

// ============================================
// Authentication Schemas
// ============================================

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: safeString(100).min(1, 'Name is required'),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ============================================
// Transcript Schemas
// ============================================

export const transcriptSearchSchema = z.object({
  query: safeString(100).min(1, 'Search query is required'),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const createTranscriptSchema = z.object({
  title: safeString(200).min(1, 'Title is required'),
  content: safeString(100000), // 100KB max
  language: z.string().length(2).optional(), // ISO 639-1
  tags: z.array(safeString(50)).max(20).optional(),
});

export const updateTranscriptSchema = z.object({
  id: uuidSchema,
  title: safeString(200).optional(),
  content: safeString(100000).optional(),
  tags: z.array(safeString(50)).max(20).optional(),
});

// ============================================
// Settings Schemas
// ============================================

export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().min(2).max(10).optional(),
  notifications: z.boolean().optional(),
  autoSave: z.boolean().optional(),
  fontSize: z.number().int().min(10).max(32).optional(),
});

export const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean().optional(),
  sessionTimeout: z.number().int().min(5).max(1440).optional(), // 5 min to 24 hours
  maxActiveSessions: z.number().int().min(1).max(10).optional(),
});

// ============================================
// API Request Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: safeString(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Start date must be before end date',
});

// ============================================
// Voice Recognition Schemas
// ============================================

export const voiceSettingsSchema = z.object({
  language: z.string().min(2).max(10).default('en'),
  enableDiarization: z.boolean().default(false),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
  maxDuration: z.number().int().min(1).max(3600).default(300), // 1 sec to 1 hour
});

export const customVocabularySchema = z.object({
  terms: z.array(safeString(100)).max(500),
  boostFactor: z.number().min(1).max(10).default(2),
});

// ============================================
// Utility Functions
// ============================================

/**
 * Validate input and return result
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate input and throw on error
 */
export function parseInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Get user-friendly error messages from Zod errors
 */
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  }
  return errors;
}

/**
 * Sanitize a string for safe display (prevent XSS)
 */
export function sanitizeForDisplay(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize input for database queries
 */
export function sanitizeForQuery(input: string, maxLength: number = 100): string {
  return input
    .replace(/[%_\\]/g, '\\$&')  // Escape SQL wildcards
    .replace(/['"`;()]/g, '')    // Remove injection characters
    .trim()
    .substring(0, maxLength);
}

// ============================================
// Type Exports
// ============================================

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type TranscriptSearchInput = z.infer<typeof transcriptSearchSchema>;
export type CreateTranscriptInput = z.infer<typeof createTranscriptSchema>;
export type UpdateTranscriptInput = z.infer<typeof updateTranscriptSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
export type VoiceSettingsInput = z.infer<typeof voiceSettingsSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
