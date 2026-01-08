/**
 * Security Service
 * Phase 3 Week 9 Day 59-60: Advanced Security & Compliance
 * 
 * Handles security event monitoring, threat detection, and access control
 */

import { supabase } from './supabase.service';

// ============================================================================
// TYPES
// ============================================================================

export interface SecurityEvent {
  id: string;
  organization_id: string;
  event_type: 'login' | 'logout' | 'failed_login' | 'permission_change' | 'data_access' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  ip_address?: string;
  device_info?: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ThreatAlert {
  id: string;
  organization_id: string;
  threat_type: 'brute_force' | 'unauthorized_access' | 'data_exfiltration' | 'anomalous_behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  description: string;
  affected_users?: string[];
  recommended_actions?: string[];
  created_at: string;
  resolved_at?: string;
}

export interface SecurityPolicy {
  id: string;
  organization_id: string;
  policy_type: 'password' | 'mfa' | 'session' | 'ip_whitelist' | 'device_trust';
  enabled: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AccessControl {
  id: string;
  organization_id: string;
  user_id: string;
  allowed_ips?: string[];
  trusted_devices?: string[];
  mfa_enabled: boolean;
  session_timeout_minutes: number;
  last_login_at?: string;
  last_login_ip?: string;
}

// ============================================================================
// SECURITY SERVICE
// ============================================================================

class SecurityService {
  /**
   * Log a security event
   */
  async logSecurityEvent(input: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<void> {
    try {
      await supabase.from('security_events').insert(input);
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw - security logging should not break the main flow
    }
  }

  /**
   * Get security events for an organization
   */
  async getSecurityEvents(
    organizationId: string,
    filters?: {
      event_type?: string;
      severity?: string;
      start_date?: string;
      end_date?: string;
      limit?: number;
    }
  ): Promise<SecurityEvent[]> {
    let query = supabase
      .from('security_events')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (filters?.event_type) {
      query = query.eq('event_type', filters.event_type);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get threat alerts for an organization
   */
  async getThreatAlerts(organizationId: string, status?: string): Promise<ThreatAlert[]> {
    let query = supabase
      .from('threat_alerts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Create a threat alert
   */
  async createThreatAlert(input: Omit<ThreatAlert, 'id' | 'created_at'>): Promise<ThreatAlert> {
    const { data, error } = await supabase
      .from('threat_alerts')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update threat alert status
   */
  async updateThreatAlert(
    id: string,
    updates: { status?: string; resolved_at?: string }
  ): Promise<ThreatAlert> {
    const { data, error } = await supabase
      .from('threat_alerts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get security policies for an organization
   */
  async getSecurityPolicies(organizationId: string): Promise<SecurityPolicy[]> {
    const { data, error } = await supabase
      .from('security_policies')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update security policy
   */
  async updateSecurityPolicy(
    id: string,
    updates: { enabled?: boolean; settings?: Record<string, any> }
  ): Promise<SecurityPolicy> {
    const { data, error } = await supabase
      .from('security_policies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get access control settings for a user
   */
  async getAccessControl(organizationId: string, userId: string): Promise<AccessControl | null> {
    const { data, error } = await supabase
      .from('access_controls')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  }

  /**
   * Update access control settings
   */
  async updateAccessControl(
    organizationId: string,
    userId: string,
    updates: Partial<Omit<AccessControl, 'id' | 'organization_id' | 'user_id'>>
  ): Promise<AccessControl> {
    const existing = await this.getAccessControl(organizationId, userId);

    if (existing) {
      const { data, error } = await supabase
        .from('access_controls')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('access_controls')
        .insert({ organization_id: organizationId, user_id: userId, ...updates })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(organizationId: string, days: number = 30): Promise<{
    total_events: number;
    critical_events: number;
    active_threats: number;
    failed_logins: number;
    events_by_type: Record<string, number>;
    events_by_severity: Record<string, number>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.getSecurityEvents(organizationId, {
      start_date: startDate.toISOString(),
      limit: 10000,
    });

    const threats = await this.getThreatAlerts(organizationId, 'active');

    const events_by_type: Record<string, number> = {};
    const events_by_severity: Record<string, number> = {};
    let critical_events = 0;
    let failed_logins = 0;

    events.forEach((event) => {
      events_by_type[event.event_type] = (events_by_type[event.event_type] || 0) + 1;
      events_by_severity[event.severity] = (events_by_severity[event.severity] || 0) + 1;

      if (event.severity === 'critical') critical_events++;
      if (event.event_type === 'failed_login') failed_logins++;
    });

    return {
      total_events: events.length,
      critical_events,
      active_threats: threats.length,
      failed_logins,
      events_by_type,
      events_by_severity,
    };
  }
}

export const securityService = new SecurityService();

