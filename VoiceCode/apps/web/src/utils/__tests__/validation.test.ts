/**
 * Unit Tests for Validation Utilities
 * Tests Zod schemas and sanitization functions
 */

import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  signInSchema,
  signUpSchema,
  transcriptSearchSchema,
  createTranscriptSchema,
  paginationSchema,
  voiceSettingsSchema,
  validateInput,
  parseInput,
  getValidationErrors,
  sanitizeForDisplay,
  sanitizeForQuery,
  safeString,
} from '../validation';

describe('Validation Utilities', () => {
  describe('emailSchema', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should convert email to lowercase', () => {
      const result = emailSchema.safeParse('Test@Example.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('invalid-email');
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('should reject email over 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = emailSchema.safeParse(longEmail);
      expect(result.success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it('should accept valid password', () => {
      const result = passwordSchema.safeParse('SecurePass123');
      expect(result.success).toBe(true);
    });

    it('should reject password without uppercase', () => {
      const result = passwordSchema.safeParse('securepass123');
      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const result = passwordSchema.safeParse('SECUREPASS123');
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const result = passwordSchema.safeParse('SecurePassword');
      expect(result.success).toBe(false);
    });

    it('should reject password under 8 characters', () => {
      const result = passwordSchema.safeParse('Pass1');
      expect(result.success).toBe(false);
    });

    it('should reject password over 128 characters', () => {
      const longPassword = 'Aa1' + 'a'.repeat(130);
      const result = passwordSchema.safeParse(longPassword);
      expect(result.success).toBe(false);
    });
  });

  describe('signInSchema', () => {
    it('should accept valid sign in data', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: 'anyPassword123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const result = signInSchema.safeParse({
        password: 'anyPassword123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signUpSchema', () => {
    it('should accept valid sign up data', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'SecurePass123',
        fullName: 'John Doe',
      });
      expect(result.success).toBe(true);
    });

    it('should reject weak password', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'weak',
        fullName: 'John Doe',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty full name', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'SecurePass123',
        fullName: '',
      });
      expect(result.success).toBe(false);
    });

    it('should trim and validate full name', () => {
      const result = signUpSchema.safeParse({
        email: 'test@example.com',
        password: 'SecurePass123',
        fullName: '  John Doe  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe('John Doe');
      }
    });
  });

  describe('transcriptSearchSchema', () => {
    it('should accept valid search query', () => {
      const result = transcriptSearchSchema.safeParse({
        query: 'test search',
        limit: 20,
        offset: 0,
      });
      expect(result.success).toBe(true);
    });

    it('should use default values', () => {
      const result = transcriptSearchSchema.safeParse({
        query: 'test',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should reject empty query', () => {
      const result = transcriptSearchSchema.safeParse({
        query: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject query over 100 characters', () => {
      const result = transcriptSearchSchema.safeParse({
        query: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should reject limit over 100', () => {
      const result = transcriptSearchSchema.safeParse({
        query: 'test',
        limit: 101,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      const result = transcriptSearchSchema.safeParse({
        query: 'test',
        offset: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createTranscriptSchema', () => {
    it('should accept valid transcript', () => {
      const result = createTranscriptSchema.safeParse({
        title: 'My Transcript',
        content: 'This is the content',
      });
      expect(result.success).toBe(true);
    });

    it('should accept transcript with optional fields', () => {
      const result = createTranscriptSchema.safeParse({
        title: 'My Transcript',
        content: 'This is the content',
        language: 'en',
        tags: ['meeting', 'notes'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = createTranscriptSchema.safeParse({
        title: '',
        content: 'Content',
      });
      expect(result.success).toBe(false);
    });

    it('should reject title over 200 characters', () => {
      const result = createTranscriptSchema.safeParse({
        title: 'a'.repeat(201),
        content: 'Content',
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 20 tags', () => {
      const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
      const result = createTranscriptSchema.safeParse({
        title: 'Title',
        content: 'Content',
        tags,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid language code', () => {
      const result = createTranscriptSchema.safeParse({
        title: 'Title',
        content: 'Content',
        language: 'english', // Should be 2 chars like 'en'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('paginationSchema', () => {
    it('should use default values', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('should accept valid pagination', () => {
      const result = paginationSchema.safeParse({
        page: 5,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });
      expect(result.success).toBe(true);
    });

    it('should reject page less than 1', () => {
      const result = paginationSchema.safeParse({
        page: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid sort order', () => {
      const result = paginationSchema.safeParse({
        sortOrder: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('voiceSettingsSchema', () => {
    it('should use default values', () => {
      const result = voiceSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.language).toBe('en');
        expect(result.data.enableDiarization).toBe(false);
        expect(result.data.confidenceThreshold).toBe(0.7);
        expect(result.data.maxDuration).toBe(300);
      }
    });

    it('should reject confidence threshold over 1', () => {
      const result = voiceSettingsSchema.safeParse({
        confidenceThreshold: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it('should reject max duration over 3600', () => {
      const result = voiceSettingsSchema.safeParse({
        maxDuration: 3601,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('validateInput helper', () => {
    it('should return success result for valid input', () => {
      const result = validateInput(emailSchema, 'test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should return error result for invalid input', () => {
      const result = validateInput(emailSchema, 'invalid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
      }
    });
  });

  describe('parseInput helper', () => {
    it('should return data for valid input', () => {
      const result = parseInput(emailSchema, 'test@example.com');
      expect(result).toBe('test@example.com');
    });

    it('should throw for invalid input', () => {
      expect(() => parseInput(emailSchema, 'invalid')).toThrow();
    });
  });

  describe('getValidationErrors helper', () => {
    it('should format errors as record', () => {
      const result = signUpSchema.safeParse({
        email: 'invalid',
        password: 'weak',
        fullName: '',
      });

      if (!result.success) {
        const errors = getValidationErrors(result.error);
        expect(typeof errors).toBe('object');
        expect(Object.keys(errors).length).toBeGreaterThan(0);
      }
    });
  });

  describe('sanitizeForDisplay', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitizeForDisplay(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape quotes', () => {
      const input = 'Hello "world" & \'test\'';
      const result = sanitizeForDisplay(input);
      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
      expect(result).toContain('&amp;');
    });

    it('should handle empty string', () => {
      expect(sanitizeForDisplay('')).toBe('');
    });

    it('should preserve safe text', () => {
      const input = 'Hello World 123';
      expect(sanitizeForDisplay(input)).toBe(input);
    });
  });

  describe('sanitizeForQuery', () => {
    it('should escape SQL wildcards', () => {
      const input = '100% discount_sale';
      const result = sanitizeForQuery(input);
      expect(result).toContain('\\%');
      expect(result).toContain('\\_');
    });

    it('should remove injection characters', () => {
      const input = "'; DROP TABLE users; --";
      const result = sanitizeForQuery(input);
      expect(result).not.toContain("'");
      expect(result).not.toContain(';');
      expect(result).not.toContain('(');
      expect(result).not.toContain(')');
    });

    it('should trim whitespace', () => {
      const input = '  search term  ';
      const result = sanitizeForQuery(input);
      expect(result).toBe('search term');
    });

    it('should limit length', () => {
      const input = 'a'.repeat(200);
      const result = sanitizeForQuery(input, 50);
      expect(result.length).toBe(50);
    });

    it('should handle empty string', () => {
      expect(sanitizeForQuery('')).toBe('');
    });
  });

  describe('safeString', () => {
    it('should create schema with max length', () => {
      const schema = safeString(10);
      const result = schema.safeParse('12345678901');
      expect(result.success).toBe(false);
    });

    it('should trim string', () => {
      const schema = safeString(100);
      const result = schema.safeParse('  hello  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello');
      }
    });
  });
});
