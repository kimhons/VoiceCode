/**
 * Security Types
 * Shared type definitions for security-related services
 */

export interface TwoFactorAuth {
  userId: string;
  enabled: boolean;
  method: '2fa_totp' | '2fa_sms' | '2fa_email';
  secret?: string;
  backupCodes?: string[];
  verifiedAt?: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  severity: AuditSeverity;
}

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.register'
  | 'user.password_change'
  | 'user.2fa_enable'
  | 'user.2fa_disable'
  | 'user.delete'
  | 'transcript.create'
  | 'transcript.update'
  | 'transcript.delete'
  | 'transcript.share'
  | 'workspace.create'
  | 'workspace.update'
  | 'workspace.delete'
  | 'workspace.invite'
  | 'settings.update'
  | 'export.create'
  | 'api.access'
  | 'security.violation';

export interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}

export interface IPWhitelist {
  userId: string;
  ipAddress: string;
  description?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowMs: number;
}

export interface SecuritySettings {
  userId: string;
  twoFactorEnabled: boolean;
  ipWhitelistEnabled: boolean;
  sessionTimeout: number; // minutes
  maxActiveSessions: number;
  requireStrongPassword: boolean;
  passwordExpiryDays: number;
  loginNotifications: boolean;
}
