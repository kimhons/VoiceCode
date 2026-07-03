/**
 * Session Management Service
 * Handles user session creation, validation, and management
 */

import { getSupabaseService } from '../supabase.service';
import { getEncryptionService } from './encryption.service';
import { getAuditService } from './audit.service';
import type { Session } from './types';

class SessionService {
  async createSession(userId: string): Promise<Session> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const encryptionService = getEncryptionService();
      const auditService = getAuditService();

      const token = encryptionService.generateSessionToken();
      const ipAddress = await auditService.getClientIP();
      const userAgent = navigator.userAgent;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const { data, error } = await client
        .from('sessions')
        .insert({
          user_id: userId,
          token: encryptionService.encrypt(token),
          ip_address: ipAddress,
          user_agent: userAgent,
          expires_at: expiresAt.toISOString(),
          last_activity_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      await auditService.logAudit(userId, 'user.login', 'session', data.id);

      return data as Session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  async invalidateSession(sessionId: string): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return;

      await client
        .from('sessions')
        .update({ is_active: false })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Failed to invalidate session:', error);
    }
  }

  async invalidateAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return;

      let query = client
        .from('sessions')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (exceptSessionId) {
        query = query.neq('id', exceptSessionId);
      }

      await query;
    } catch (error) {
      console.error('Failed to invalidate all sessions:', error);
    }
  }

  async getActiveSessions(userId: string): Promise<Session[]> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return [];

      const { data, error } = await client
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      return data as Session[];
    } catch (error) {
      console.error('Failed to get active sessions:', error);
      return [];
    }
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return;

      await client
        .from('sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }
}

let sessionInstance: SessionService | null = null;

export function getSessionService(): SessionService {
  if (!sessionInstance) {
    sessionInstance = new SessionService();
  }
  return sessionInstance;
}

export default SessionService;
