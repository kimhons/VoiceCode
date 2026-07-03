/**
 * Unit Tests for Logger Utility
 * Tests production-safe logging and sensitive data sanitization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

describe('Logger Utility', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      logger.debug('test message');
      // In test environment, import.meta.env.DEV is true
      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should include [DEBUG] prefix', () => {
      logger.debug('test message');
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG]', 'test message');
    });

    it('should handle multiple arguments', () => {
      logger.debug('message', 123, { key: 'value' });
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG]', 'message', 123, { key: 'value' });
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('info message');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO]', 'info message');
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('warning message');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN]', 'warning message');
    });
  });

  describe('error', () => {
    it('should always log errors', () => {
      logger.error('error message');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should include [ERROR] prefix', () => {
      logger.error('error message');
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', 'error message');
    });

    it('should sanitize sensitive data in objects', () => {
      const sensitiveData = {
        user: 'john',
        password: 'secret123',
        token: 'abc123',
        apiKey: 'key-xyz',
      };

      logger.error('Error with data:', sensitiveData);

      const lastCall = consoleSpy.error.mock.calls[0];
      const loggedData = lastCall[2] as Record<string, unknown>;

      expect(loggedData.user).toBe('john');
      expect(loggedData.password).toBe('[REDACTED]');
      expect(loggedData.token).toBe('[REDACTED]');
      expect(loggedData.apiKey).toBe('[REDACTED]');
    });

    it('should sanitize nested sensitive data', () => {
      const nestedData = {
        user: {
          name: 'John',
          credentials: {
            password: 'secret',
            accessToken: 'token123',
          },
        },
      };

      logger.error('Nested error:', nestedData);

      const lastCall = consoleSpy.error.mock.calls[0];
      const loggedData = lastCall[2] as { user: { name: string; credentials: { password: string; accessToken: string } } };

      expect(loggedData.user.name).toBe('John');
      expect(loggedData.user.credentials.password).toBe('[REDACTED]');
      expect(loggedData.user.credentials.accessToken).toBe('[REDACTED]');
    });

    it('should sanitize arrays with sensitive data', () => {
      const arrayData = [
        { email: 'test@example.com', secret: 'hidden' },
        { email: 'user@example.com', secret: 'also-hidden' },
      ];

      logger.error('Array error:', arrayData);

      const lastCall = consoleSpy.error.mock.calls[0];
      const loggedData = lastCall[2] as Array<{ email: string; secret: string }>;

      expect(loggedData[0].email).toBe('[REDACTED]');
      expect(loggedData[0].secret).toBe('[REDACTED]');
    });

    it('should handle null and undefined', () => {
      logger.error('Null value:', null);
      logger.error('Undefined value:', undefined);

      expect(consoleSpy.error).toHaveBeenCalledTimes(2);
    });

    it('should handle primitive values', () => {
      logger.error('Number:', 42);
      logger.error('Boolean:', true);
      logger.error('String:', 'test');

      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', 'Number:', 42);
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', 'Boolean:', true);
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', 'String:', 'test');
    });
  });

  describe('log with options', () => {
    it('should log with specified level', () => {
      logger.log('info', {}, 'Custom log');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO]', 'Custom log');
    });

    it('should sanitize when option is set', () => {
      const data = { password: 'secret', name: 'John' };
      logger.log('warn', { sanitize: true }, 'Data:', data);

      const lastCall = consoleSpy.warn.mock.calls[0];
      const loggedData = lastCall[2] as { password: string; name: string };

      expect(loggedData.password).toBe('[REDACTED]');
      expect(loggedData.name).toBe('John');
    });

    it('should not sanitize when option is false', () => {
      const data = { password: 'secret', name: 'John' };
      logger.log('warn', { sanitize: false }, 'Data:', data);

      const lastCall = consoleSpy.warn.mock.calls[0];
      const loggedData = lastCall[2] as { password: string; name: string };

      expect(loggedData.password).toBe('secret');
    });
  });

  describe('group', () => {
    it('should call console.group in development', () => {
      const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      logger.group('Test Group', () => {
        console.log('Inside group');
      });

      expect(groupSpy).toHaveBeenCalledWith('Test Group');
      expect(groupEndSpy).toHaveBeenCalled();
    });
  });

  describe('time', () => {
    it('should return a function to end timing', () => {
      const timeSpy = vi.spyOn(console, 'time').mockImplementation(() => {});
      const timeEndSpy = vi.spyOn(console, 'timeEnd').mockImplementation(() => {});

      const endTiming = logger.time('Operation');
      expect(timeSpy).toHaveBeenCalledWith('Operation');

      endTiming();
      expect(timeEndSpy).toHaveBeenCalledWith('Operation');
    });
  });

  describe('sensitive key detection', () => {
    it('should redact case-insensitive keys', () => {
      const data = {
        PASSWORD: 'secret',
        Token: 'abc',
        API_KEY: 'xyz',
      };

      logger.error('Case test:', data);

      const lastCall = consoleSpy.error.mock.calls[0];
      const loggedData = lastCall[2] as Record<string, unknown>;

      expect(loggedData.PASSWORD).toBe('[REDACTED]');
      expect(loggedData.Token).toBe('[REDACTED]');
      expect(loggedData.API_KEY).toBe('[REDACTED]');
    });

    it('should redact all known sensitive keys', () => {
      const sensitiveKeys = {
        password: 'a',
        token: 'b',
        secret: 'c',
        apiKey: 'd',
        api_key: 'e',
        accessToken: 'f',
        access_token: 'g',
        refreshToken: 'h',
        refresh_token: 'i',
        authorization: 'j',
        cookie: 'k',
        session: 'l',
        creditCard: 'm',
        credit_card: 'n',
        ssn: 'o',
        email: 'p',
      };

      logger.error('All sensitive:', sensitiveKeys);

      const lastCall = consoleSpy.error.mock.calls[0];
      const loggedData = lastCall[2] as Record<string, unknown>;

      Object.keys(sensitiveKeys).forEach(key => {
        expect(loggedData[key]).toBe('[REDACTED]');
      });
    });
  });
});
