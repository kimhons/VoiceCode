/**
 * Audit Service
 * Handles audit logging for compliance and security tracking
 */

import { supabase } from './supabase.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AuditLog {
  id: string;
  organization_id?: string;
  workspace_id?: string;
  user_id?: string;
  
  // Event Details
  event_type: 'create' | 'update' | 'delete' | 'access' | 'share' | 'export' | 'login' | 'logout';
  resource_type: string;
  resource_id?: string;
  action: string;
  
  // Context
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  
  // Timestamp
  created_at: string;
}

export interface AuditLogInput {
  organization_id?: string;
  workspace_id?: string;
  event_type: AuditLog['event_type'];
  resource_type: string;
  resource_id?: string;
  action: string;
  metadata?: Record<string, any>;
}

export interface AuditLogFilters {
  organization_id?: string;
  workspace_id?: string;
  user_id?: string;
  event_type?: AuditLog['event_type'];
  resource_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// AUDIT SERVICE
// ============================================================================

class AuditService {
  /**
   * Log an audit event
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Insert audit log
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          ...input,
          user_id: user?.id,
          metadata: input.metadata || {},
        });

      if (error) {
        console.error('Failed to log audit event:', error);
        // Don't throw - audit logging should not break the main flow
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters: AuditLogFilters = {}): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }
    if (filters.workspace_id) {
      query = query.eq('workspace_id', filters.workspace_id);
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.event_type) {
      query = query.eq('event_type', filters.event_type);
    }
    if (filters.resource_type) {
      query = query.eq('resource_type', filters.resource_type);
    }
    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    // Pagination
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get audit log statistics
   */
  async getStats(organizationId: string, days: number = 30): Promise<{
    total_events: number;
    events_by_type: Record<string, number>;
    events_by_user: Record<string, number>;
    recent_events: AuditLog[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.getLogs({
      organization_id: organizationId,
      start_date: startDate.toISOString(),
      limit: 1000,
    });

    const eventsByType: Record<string, number> = {};
    const eventsByUser: Record<string, number> = {};

    logs.forEach(log => {
      // Count by type
      eventsByType[log.event_type] = (eventsByType[log.event_type] || 0) + 1;
      
      // Count by user
      if (log.user_id) {
        eventsByUser[log.user_id] = (eventsByUser[log.user_id] || 0) + 1;
      }
    });

    return {
      total_events: logs.length,
      events_by_type: eventsByType,
      events_by_user: eventsByUser,
      recent_events: logs.slice(0, 10),
    };
  }
}

export const auditService = new AuditService();

