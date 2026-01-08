/**
 * Activity Service
 * Analytics Enhancement: Activity Tracking & Monitoring
 * 
 * Handles user activity tracking, aggregation, and analytics
 */

import { supabase } from './supabase.service';

// ============================================================================
// TYPES
// ============================================================================

export type ActivityType =
  | 'recording_started' | 'recording_stopped' | 'recording_saved'
  | 'transcription_created' | 'transcription_edited' | 'transcription_deleted'
  | 'export_pdf' | 'export_docx' | 'export_txt' | 'export_srt' | 'export_vtt'
  | 'ai_summary' | 'ai_key_points' | 'ai_action_items' | 'ai_sentiment'
  | 'search_performed' | 'filter_applied'
  | 'share_transcript' | 'collaborate_invited'
  | 'settings_changed' | 'profile_updated';

export interface ActivityLog {
  id: string;
  user_id: string;
  organization_id?: string;
  activity_type: ActivityType;
  resource_id?: string;
  resource_type?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ActivitySummary {
  total_activities: number;
  activities_by_type: Record<ActivityType, number>;
  most_active_hours: number[];
  most_active_days: string[];
  engagement_score: number;
}

export interface ActivityHeatmap {
  hour: number;
  day: number;
  count: number;
}

export interface TopActivity {
  activity_type: ActivityType;
  count: number;
  percentage: number;
  last_performed: string;
}

export interface ActivityFilter {
  userId?: string;
  organizationId?: string;
  activityTypes?: ActivityType[];
  startDate: string;
  endDate: string;
  limit?: number;
}

// ============================================================================
// ACTIVITY SERVICE
// ============================================================================

class ActivityService {
  /**
   * Track a user activity
   */
  async trackActivity(activity: Omit<ActivityLog, 'id' | 'created_at'>): Promise<void> {
    try {
      await supabase.from('activity_logs').insert({
        user_id: activity.user_id,
        organization_id: activity.organization_id,
        activity_type: activity.activity_type,
        resource_id: activity.resource_id,
        resource_type: activity.resource_type,
        metadata: activity.metadata || {},
        ip_address: activity.ip_address,
        user_agent: activity.user_agent,
      });
    } catch (error) {
      // Non-blocking - log error but don't throw
      console.error('Failed to track activity:', error);
    }
  }

  /**
   * Get activity logs with filters
   */
  async getActivityLogs(filter: ActivityFilter): Promise<ActivityLog[]> {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .gte('created_at', filter.startDate)
      .lte('created_at', filter.endDate)
      .order('created_at', { ascending: false });

    if (filter.userId) {
      query = query.eq('user_id', filter.userId);
    }

    if (filter.organizationId) {
      query = query.eq('organization_id', filter.organizationId);
    }

    if (filter.activityTypes && filter.activityTypes.length > 0) {
      query = query.in('activity_type', filter.activityTypes);
    }

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  /**
   * Get activity summary
   */
  async getActivitySummary(filter: ActivityFilter): Promise<ActivitySummary> {
    const activities = await this.getActivityLogs(filter);

    const activitiesByType: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};
    const dayCounts: Record<string, number> = {};

    for (const activity of activities) {
      // Count by type
      activitiesByType[activity.activity_type] = 
        (activitiesByType[activity.activity_type] || 0) + 1;

      // Count by hour
      const hour = new Date(activity.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;

      // Count by day
      const day = new Date(activity.created_at).toISOString().split('T')[0];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }

    // Find most active hours (top 3)
    const mostActiveHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Find most active days (top 7)
    const mostActiveDays = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([day]) => day);

    // Calculate engagement score (0-100)
    const daysDiff = Math.max(
      1,
      Math.ceil(
        (new Date(filter.endDate).getTime() - new Date(filter.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const avgActivitiesPerDay = activities.length / daysDiff;
    const engagementScore = Math.min(100, Math.round(avgActivitiesPerDay * 10));

    return {
      total_activities: activities.length,
      activities_by_type: activitiesByType as Record<ActivityType, number>,
      most_active_hours: mostActiveHours,
      most_active_days: mostActiveDays,
      engagement_score: engagementScore,
    };
  }

  /**
   * Get activity heatmap data (hour x day)
   */
  async getActivityHeatmap(filter: ActivityFilter): Promise<ActivityHeatmap[]> {
    const activities = await this.getActivityLogs(filter);

    const heatmapData: Record<string, number> = {};

    for (const activity of activities) {
      const date = new Date(activity.created_at);
      const hour = date.getHours();
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday
      const key = `${day}-${hour}`;
      heatmapData[key] = (heatmapData[key] || 0) + 1;
    }

    const heatmap: ActivityHeatmap[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        heatmap.push({
          day,
          hour,
          count: heatmapData[key] || 0,
        });
      }
    }

    return heatmap;
  }

  /**
   * Get top activities
   */
  async getTopActivities(filter: ActivityFilter, limit: number = 10): Promise<TopActivity[]> {
    const activities = await this.getActivityLogs(filter);

    const activityCounts: Record<string, { count: number; lastPerformed: string }> = {};

    for (const activity of activities) {
      if (!activityCounts[activity.activity_type]) {
        activityCounts[activity.activity_type] = {
          count: 0,
          lastPerformed: activity.created_at,
        };
      }
      activityCounts[activity.activity_type].count++;

      // Update last performed if this is more recent
      if (new Date(activity.created_at) > new Date(activityCounts[activity.activity_type].lastPerformed)) {
        activityCounts[activity.activity_type].lastPerformed = activity.created_at;
      }
    }

    const totalActivities = activities.length;

    return Object.entries(activityCounts)
      .map(([activityType, data]) => ({
        activity_type: activityType as ActivityType,
        count: data.count,
        percentage: totalActivities > 0 ? (data.count / totalActivities) * 100 : 0,
        last_performed: data.lastPerformed,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Export activity logs
   */
  async exportActivityLogs(
    filter: ActivityFilter,
    format: 'json' | 'csv'
  ): Promise<string> {
    const activities = await this.getActivityLogs(filter);

    if (format === 'json') {
      return JSON.stringify(activities, null, 2);
    }

    // CSV format
    const headers = [
      'ID',
      'User ID',
      'Organization ID',
      'Activity Type',
      'Resource ID',
      'Resource Type',
      'Created At',
    ];

    const rows = activities.map((activity) => [
      activity.id,
      activity.user_id,
      activity.organization_id || '',
      activity.activity_type,
      activity.resource_id || '',
      activity.resource_type || '',
      activity.created_at,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    return csv;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let activityServiceInstance: ActivityService | null = null;

export function getActivityService(): ActivityService {
  if (!activityServiceInstance) {
    activityServiceInstance = new ActivityService();
  }
  return activityServiceInstance;
}

export default ActivityService;

