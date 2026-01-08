/**
 * Audit Service
 * Handles audit logging and retrieval
 *
 * NOTE: For production, IP detection should be done server-side.
 * See src/utils/server-utils.ts for server-side implementation guide.
 */

import { getSupabaseService } from '../supabase.service';
import type { AuditLog, AuditAction, AuditSeverity } from './types';

/**
 * IP Detection Strategy
 * - In production: Server should detect IP from request headers
 * - Client-side fallback: Use external service (less reliable, adds latency)
 */
const IP_DETECTION_API = 'https://api.ipify.org?format=json';
const IP_FETCH_TIMEOUT = 5000; // 5 second timeout

class AuditService {
  private cachedIP: string | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async logAudit(
    userId: string,
    action: AuditAction,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return;

      // Get IP with caching to reduce external API calls
      const ipAddress = await this.getClientIP();
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
      const severity = this.getAuditSeverity(action);

      await client.from('audit_logs').insert({
        user_id: userId,
        action,
        resource,
        resource_id: resourceId,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata,
        severity,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }

  async getAuditLogs(
    userId: string,
    filters?: {
      action?: AuditAction;
      resource?: string;
      severity?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<AuditLog[]> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return [];

      let query = client
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (filters?.action) query = query.eq('action', filters.action);
      if (filters?.resource) query = query.eq('resource', filters.resource);
      if (filters?.severity) query = query.eq('severity', filters.severity);
      if (filters?.startDate) query = query.gte('timestamp', filters.startDate.toISOString());
      if (filters?.endDate) query = query.lte('timestamp', filters.endDate.toISOString());
      if (filters?.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;

      return data as AuditLog[];
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Get client IP address
   *
   * PRODUCTION NOTE: This is a client-side fallback.
   * For better accuracy and security, detect IP server-side:
   *
   * ```typescript
   * // In API route (Express/Node.js):
   * const ip = req.headers['x-forwarded-for']?.split(',')[0]
   *         || req.headers['x-real-ip']
   *         || req.socket.remoteAddress
   *         || 'unknown';
   * ```
   *
   * Pass server-detected IP as parameter when available.
   */
  async getClientIP(serverDetectedIP?: string): Promise<string> {
    // Prefer server-detected IP if provided
    if (serverDetectedIP) {
      return serverDetectedIP;
    }

    // Check cache
    if (this.cachedIP && Date.now() < this.cacheExpiry) {
      return this.cachedIP;
    }

    // Client-side detection fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), IP_FETCH_TIMEOUT);

      const response = await fetch(IP_DETECTION_API, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const ip = data.ip;

      // Cache the result
      this.cachedIP = ip;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return ip;
    } catch (error) {
      // Log only in development
      if (import.meta.env.DEV) {
        console.warn('[AuditService] Failed to get client IP:', error);
      }
      return 'unknown';
    }
  }

  /**
   * Clear IP cache (e.g., when user changes network)
   */
  clearIPCache(): void {
    this.cachedIP = null;
    this.cacheExpiry = 0;
  }

  private getAuditSeverity(action: AuditAction): AuditSeverity {
    const criticalActions: AuditAction[] = ['user.delete', 'workspace.delete', 'security.violation'];
    const highActions: AuditAction[] = ['user.password_change', 'user.2fa_disable', 'transcript.delete'];
    const mediumActions: AuditAction[] = ['user.2fa_enable', 'workspace.create', 'transcript.share'];

    if (criticalActions.includes(action)) return 'critical';
    if (highActions.includes(action)) return 'high';
    if (mediumActions.includes(action)) return 'medium';
    return 'low';
  }
}

let auditInstance: AuditService | null = null;

export function getAuditService(): AuditService {
  if (!auditInstance) {
    auditInstance = new AuditService();
  }
  return auditInstance;
}

export default AuditService;
