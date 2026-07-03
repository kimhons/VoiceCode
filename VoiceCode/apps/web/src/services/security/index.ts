/**
 * Security Services - Unified Export
 *
 * This module provides a clean API for security-related services.
 * Each service is focused on a specific security concern.
 */

// Types
export * from './types';

// Services
export { getEncryptionService, default as EncryptionService } from './encryption.service';
export { getAuditService, default as AuditService } from './audit.service';
export { getTwoFactorService, default as TwoFactorService } from './two-factor.service';
export { getSessionService, default as SessionService } from './session.service';
export { getIPWhitelistService, default as IPWhitelistService } from './ip-whitelist.service';
export { getRateLimiterService, default as RateLimiterService } from './rate-limiter.service';

// Convenience facade that provides backward compatibility
import { getEncryptionService } from './encryption.service';
import { getAuditService } from './audit.service';
import { getTwoFactorService } from './two-factor.service';
import { getSessionService } from './session.service';
import { getIPWhitelistService } from './ip-whitelist.service';
import { getRateLimiterService } from './rate-limiter.service';
import type { RateLimitConfig } from './types';

/**
 * SecurityService facade - provides backward compatibility
 * with the original monolithic security.service.ts
 */
class SecurityServiceFacade {
  // 2FA
  async enable2FA(userId: string, method: '2fa_totp' | '2fa_sms' | '2fa_email') {
    return getTwoFactorService().enable2FA(userId, method);
  }

  async verify2FA(userId: string, code: string) {
    return getTwoFactorService().verify2FA(userId, code);
  }

  async disable2FA(userId: string, code: string) {
    return getTwoFactorService().disable2FA(userId, code);
  }

  // Audit
  async logAudit(
    userId: string,
    action: Parameters<ReturnType<typeof getAuditService>['logAudit']>[1],
    resource: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ) {
    return getAuditService().logAudit(userId, action, resource, resourceId, metadata);
  }

  async getAuditLogs(userId: string, filters?: Parameters<ReturnType<typeof getAuditService>['getAuditLogs']>[1]) {
    return getAuditService().getAuditLogs(userId, filters);
  }

  // Sessions
  async createSession(userId: string) {
    return getSessionService().createSession(userId);
  }

  async invalidateSession(sessionId: string) {
    return getSessionService().invalidateSession(sessionId);
  }

  async getActiveSessions(userId: string) {
    return getSessionService().getActiveSessions(userId);
  }

  // IP Whitelist
  async addIPToWhitelist(userId: string, ipAddress: string, description?: string) {
    return getIPWhitelistService().addIP(userId, ipAddress, description);
  }

  async removeIPFromWhitelist(userId: string, ipAddress: string) {
    return getIPWhitelistService().removeIP(userId, ipAddress);
  }

  async isIPWhitelisted(userId: string, ipAddress: string) {
    return getIPWhitelistService().isWhitelisted(userId, ipAddress);
  }

  // Rate Limiting
  checkRateLimit(identifier: string, config: RateLimitConfig) {
    return getRateLimiterService().checkLimit(identifier, config);
  }
}

let securityFacadeInstance: SecurityServiceFacade | null = null;

export function getSecurityService(): SecurityServiceFacade {
  if (!securityFacadeInstance) {
    securityFacadeInstance = new SecurityServiceFacade();
  }
  return securityFacadeInstance;
}
