/**
 * useSecurity Hook
 * Phase 5.5: Advanced Security
 * 
 * React hook for security features
 */

import { useState, useCallback, useRef } from 'react';
import { getSecurityService, AuditLog, Session, AuditAction } from '../services/security.service';

export interface UseSecurityOptions {
  userId?: string;
}

export interface UseSecurityReturn {
  // Two-Factor Authentication
  enable2FA: (method: '2fa_totp' | '2fa_sms' | '2fa_email') => Promise<{ secret: string; qrCode: string; backupCodes: string[] }>;
  verify2FA: (code: string) => Promise<boolean>;
  disable2FA: (code: string) => Promise<boolean>;

  // Audit Logs
  logAudit: (action: AuditAction, resource: string, resourceId?: string, metadata?: Record<string, any>) => Promise<void>;
  getAuditLogs: (filters?: {
    action?: AuditAction;
    resource?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) => Promise<AuditLog[]>;
  auditLogs: AuditLog[];

  // Session Management
  createSession: () => Promise<Session>;
  invalidateSession: (sessionId: string) => Promise<void>;
  getActiveSessions: () => Promise<Session[]>;
  activeSessions: Session[];

  // IP Whitelisting
  addIPToWhitelist: (ipAddress: string, description?: string) => Promise<void>;
  removeIPFromWhitelist: (ipAddress: string) => Promise<void>;
  isIPWhitelisted: (ipAddress: string) => Promise<boolean>;

  // Rate Limiting
  checkRateLimit: (identifier: string, endpoint: string, maxRequests: number, windowMs: number) => boolean;

  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useSecurity(options: UseSecurityOptions = {}): UseSecurityReturn {
  const { userId } = options;

  // Service
  const service = useRef(getSecurityService());

  // State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Two-Factor Authentication
  const enable2FA = useCallback(
    async (method: '2fa_totp' | '2fa_sms' | '2fa_email') => {
      if (!userId) throw new Error('User ID is required');
      
      setError(null);
      setIsLoading(true);
      try {
        const result = await service.current.enable2FA(userId, method);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to enable 2FA';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const verify2FA = useCallback(
    async (code: string): Promise<boolean> => {
      if (!userId) throw new Error('User ID is required');
      
      setError(null);
      setIsLoading(true);
      try {
        const result = await service.current.verify2FA(userId, code);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to verify 2FA';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const disable2FA = useCallback(
    async (code: string): Promise<boolean> => {
      if (!userId) throw new Error('User ID is required');
      
      setError(null);
      setIsLoading(true);
      try {
        const result = await service.current.disable2FA(userId, code);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to disable 2FA';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // Audit Logs
  const logAudit = useCallback(
    async (
      action: AuditAction,
      resource: string,
      resourceId?: string,
      metadata?: Record<string, any>
    ) => {
      if (!userId) return;
      
      setError(null);
      try {
        await service.current.logAudit(userId, action, resource, resourceId, metadata);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to log audit';
        setError(message);
      }
    },
    [userId]
  );

  const getAuditLogs = useCallback(
    async (filters?: {
      action?: AuditAction;
      resource?: string;
      severity?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }): Promise<AuditLog[]> => {
      if (!userId) return [];
      
      setError(null);
      setIsLoading(true);
      try {
        const logs = await service.current.getAuditLogs(userId, filters);
        setAuditLogs(logs);
        return logs;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get audit logs';
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // Session Management
  const createSession = useCallback(async (): Promise<Session> => {
    if (!userId) throw new Error('User ID is required');
    
    setError(null);
    setIsLoading(true);
    try {
      const session = await service.current.createSession(userId);
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const invalidateSession = useCallback(async (sessionId: string) => {
    setError(null);
    try {
      await service.current.invalidateSession(sessionId);
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to invalidate session';
      setError(message);
      throw err;
    }
  }, []);

  const getActiveSessions = useCallback(async (): Promise<Session[]> => {
    if (!userId) return [];
    
    setError(null);
    setIsLoading(true);
    try {
      const sessions = await service.current.getActiveSessions(userId);
      setActiveSessions(sessions);
      return sessions;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get active sessions';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // IP Whitelisting
  const addIPToWhitelist = useCallback(
    async (ipAddress: string, description?: string) => {
      if (!userId) throw new Error('User ID is required');
      
      setError(null);
      setIsLoading(true);
      try {
        await service.current.addIPToWhitelist(userId, ipAddress, description);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add IP to whitelist';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const removeIPFromWhitelist = useCallback(
    async (ipAddress: string) => {
      if (!userId) throw new Error('User ID is required');
      
      setError(null);
      setIsLoading(true);
      try {
        await service.current.removeIPFromWhitelist(userId, ipAddress);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove IP from whitelist';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const isIPWhitelisted = useCallback(
    async (ipAddress: string): Promise<boolean> => {
      if (!userId) return false;
      
      setError(null);
      try {
        return await service.current.isIPWhitelisted(userId, ipAddress);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check IP whitelist';
        setError(message);
        return false;
      }
    },
    [userId]
  );

  // Rate Limiting
  const checkRateLimit = useCallback(
    (identifier: string, endpoint: string, maxRequests: number, windowMs: number): boolean => {
      return service.current.checkRateLimit(identifier, {
        endpoint,
        maxRequests,
        windowMs,
      });
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    enable2FA,
    verify2FA,
    disable2FA,
    logAudit,
    getAuditLogs,
    auditLogs,
    createSession,
    invalidateSession,
    getActiveSessions,
    activeSessions,
    addIPToWhitelist,
    removeIPFromWhitelist,
    isIPWhitelisted,
    checkRateLimit,
    isLoading,
    error,
    clearError,
  };
}

