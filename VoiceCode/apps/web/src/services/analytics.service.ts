/**
 * Analytics Service
 * Phase 4: Analytics & Reporting
 * 
 * Handles usage analytics, performance metrics, cost tracking, and reporting
 */

import { getSupabaseService, Transcript } from './supabase.service';

// =====================================================
// TYPES
// =====================================================

export type EventType =
  | 'transcript_created' | 'transcript_updated' | 'transcript_deleted'
  | 'audio_uploaded' | 'audio_processed'
  | 'export_pdf' | 'export_docx' | 'export_txt' | 'export_srt' | 'export_vtt' | 'export_json'
  | 'ai_summary' | 'ai_key_points' | 'ai_action_items' | 'ai_sentiment' | 'ai_topics' | 'ai_search'
  | 'comment_added' | 'annotation_added'
  | 'workspace_created' | 'member_invited' | 'transcript_shared';

export interface AnalyticsEvent {
  event_type: EventType;
  event_data?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UsageStats {
  date: string;
  transcripts_count: number;
  audio_uploads_count: number;
  exports_count: number;
  ai_features_count: number;
  total_minutes: number;
  total_words: number;
}

export interface PerformanceMetrics {
  date: string;
  avg_accuracy: number;
  avg_latency: number;
  error_count: number;
  success_count: number;
}

export interface CostBreakdown {
  date: string;
  api_calls: number;
  api_cost: number;
  storage_gb: number;
  storage_cost: number;
  ai_features_cost: number;
  total_cost: number;
}

export interface DashboardMetrics {
  today: {
    transcripts: number;
    minutes: number;
    exports: number;
    cost: number;
  };
  thisWeek: {
    transcripts: number;
    minutes: number;
    exports: number;
    cost: number;
  };
  thisMonth: {
    transcripts: number;
    minutes: number;
    exports: number;
    cost: number;
  };
  total: {
    transcripts: number;
    minutes: number;
    words: number;
    cost: number;
  };
}

export interface TranscriptStats {
  total: number;
  by_language: Record<string, number>;
  by_professional_mode: Record<string, number>;
  avg_duration: number;
  avg_word_count: number;
  avg_confidence: number;
}

export interface AudioStats {
  total: number;
  by_format: Record<string, number>;
  total_size_mb: number;
  avg_size_mb: number;
  processing_time_avg: number;
}

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';
export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface Report {
  id: string;
  type: ReportType;
  start_date: string;
  end_date: string;
  usage_stats: UsageStats[];
  performance_metrics: PerformanceMetrics[];
  cost_breakdown: CostBreakdown[];
  transcript_stats: TranscriptStats;
  audio_stats: AudioStats;
  generated_at: string;
}

export interface ScheduledReport {
  id: string;
  user_id: string;
  name: string;
  type: ReportType;
  format: ExportFormat;
  recipients: string[];
  schedule: string;
  last_run?: string;
  next_run?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// ANALYTICS SERVICE
// =====================================================

export class AnalyticsService {
  private supabase = getSupabaseService();

  // =====================================================
  // EVENT TRACKING
  // =====================================================

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (!user) return;

    await this.supabase.client
      .from('analytics_events')
      .insert({
        user_id: user.id,
        event_type: event.event_type,
        event_data: event.event_data || {},
        metadata: event.metadata || {},
      });
  }

  async trackTranscript(transcript: Transcript): Promise<void> {
    await this.trackEvent({
      event_type: 'transcript_created',
      event_data: {
        transcript_id: transcript.id,
        language: transcript.language,
        professional_mode: transcript.professional_mode,
        duration: transcript.duration,
        word_count: transcript.word_count,
        confidence: transcript.confidence,
      },
    });
  }

  async trackAudioUpload(audioFile: { id: string; format: string; size: number }): Promise<void> {
    await this.trackEvent({
      event_type: 'audio_uploaded',
      event_data: {
        audio_id: audioFile.id,
        format: audioFile.format,
        size: audioFile.size,
      },
    });
  }

  async trackExport(exportType: string): Promise<void> {
    await this.trackEvent({
      event_type: `export_${exportType}` as EventType,
    });
  }

  async trackAIFeature(feature: string): Promise<void> {
    await this.trackEvent({
      event_type: `ai_${feature}` as EventType,
    });
  }

  // =====================================================
  // USAGE ANALYTICS
  // =====================================================

  async getUsageStats(startDate: Date, endDate: Date): Promise<UsageStats[]> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.client
      .from('usage_stats')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getTranscriptStats(startDate: Date, endDate: Date): Promise<TranscriptStats> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.client
      .from('transcripts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const transcripts = data || [];
    const byLanguage: Record<string, number> = {};
    const byProfessionalMode: Record<string, number> = {};
    let totalDuration = 0;
    let totalWords = 0;
    let totalConfidence = 0;

    for (const transcript of transcripts) {
      byLanguage[transcript.language] = (byLanguage[transcript.language] || 0) + 1;
      byProfessionalMode[transcript.professional_mode] = (byProfessionalMode[transcript.professional_mode] || 0) + 1;
      totalDuration += transcript.duration || 0;
      totalWords += transcript.word_count || 0;
      totalConfidence += transcript.confidence || 0;
    }

    return {
      total: transcripts.length,
      by_language: byLanguage,
      by_professional_mode: byProfessionalMode,
      avg_duration: transcripts.length > 0 ? totalDuration / transcripts.length : 0,
      avg_word_count: transcripts.length > 0 ? totalWords / transcripts.length : 0,
      avg_confidence: transcripts.length > 0 ? totalConfidence / transcripts.length : 0,
    };
  }

  async getAudioStats(startDate: Date, endDate: Date): Promise<AudioStats> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.client
      .from('analytics_events')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_type', 'audio_uploaded')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const events = data || [];
    const byFormat: Record<string, number> = {};
    let totalSize = 0;
    let totalProcessingTime = 0;

    for (const event of events) {
      const format = event.event_data?.format || 'unknown';
      byFormat[format] = (byFormat[format] || 0) + 1;
      totalSize += event.event_data?.size || 0;
      totalProcessingTime += event.event_data?.processing_time || 0;
    }

    return {
      total: events.length,
      by_format: byFormat,
      total_size_mb: totalSize / 1024 / 1024,
      avg_size_mb: events.length > 0 ? totalSize / events.length / 1024 / 1024 : 0,
      processing_time_avg: events.length > 0 ? totalProcessingTime / events.length : 0,
    };
  }

  // =====================================================
  // PERFORMANCE METRICS
  // =====================================================

  async getPerformanceMetrics(startDate: Date, endDate: Date): Promise<PerformanceMetrics[]> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.client
      .from('performance_metrics')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // =====================================================
  // COST TRACKING
  // =====================================================

  async getCostBreakdown(startDate: Date, endDate: Date): Promise<CostBreakdown[]> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.client
      .from('cost_tracking')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getStorageUsage(): Promise<{ total_gb: number; cost: number }> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.client
      .from('transcripts')
      .select('content')
      .eq('user_id', user.id)
      .eq('is_deleted', false);

    if (error) throw error;

    const transcripts = data || [];
    let totalBytes = 0;

    for (const transcript of transcripts) {
      totalBytes += new Blob([transcript.content]).size;
    }

    const totalGb = totalBytes / 1024 / 1024 / 1024;
    const cost = totalGb * 0.10; // $0.10 per GB per month

    return { total_gb: totalGb, cost };
  }

  // =====================================================
  // DASHBOARD METRICS
  // =====================================================

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get usage stats
    const todayStats = await this.getUsageStats(today, now);
    const weekStats = await this.getUsageStats(weekAgo, now);
    const monthStats = await this.getUsageStats(monthAgo, now);

    // Get cost breakdown
    const todayCosts = await this.getCostBreakdown(today, now);
    const weekCosts = await this.getCostBreakdown(weekAgo, now);
    const monthCosts = await this.getCostBreakdown(monthAgo, now);

    // Get total stats
    const { data: allTranscripts } = await this.supabase.client
      .from('transcripts')
      .select('duration, word_count')
      .eq('user_id', user.id)
      .eq('is_deleted', false);

    const totalMinutes = (allTranscripts || []).reduce((sum, t) => sum + (t.duration || 0), 0) / 60;
    const totalWords = (allTranscripts || []).reduce((sum, t) => sum + (t.word_count || 0), 0);

    return {
      today: {
        transcripts: todayStats.reduce((sum, s) => sum + s.transcripts_count, 0),
        minutes: todayStats.reduce((sum, s) => sum + s.total_minutes, 0),
        exports: todayStats.reduce((sum, s) => sum + s.exports_count, 0),
        cost: todayCosts.reduce((sum, c) => sum + c.total_cost, 0),
      },
      thisWeek: {
        transcripts: weekStats.reduce((sum, s) => sum + s.transcripts_count, 0),
        minutes: weekStats.reduce((sum, s) => sum + s.total_minutes, 0),
        exports: weekStats.reduce((sum, s) => sum + s.exports_count, 0),
        cost: weekCosts.reduce((sum, c) => sum + c.total_cost, 0),
      },
      thisMonth: {
        transcripts: monthStats.reduce((sum, s) => sum + s.transcripts_count, 0),
        minutes: monthStats.reduce((sum, s) => sum + s.total_minutes, 0),
        exports: monthStats.reduce((sum, s) => sum + s.exports_count, 0),
        cost: monthCosts.reduce((sum, c) => sum + c.total_cost, 0),
      },
      total: {
        transcripts: (allTranscripts || []).length,
        minutes: totalMinutes,
        words: totalWords,
        cost: monthCosts.reduce((sum, c) => sum + c.total_cost, 0), // Last month's cost
      },
    };
  }

  // =====================================================
  // REPORTS
  // =====================================================

  async generateReport(type: ReportType, startDate: Date, endDate: Date): Promise<Report> {
    const usageStats = await this.getUsageStats(startDate, endDate);
    const performanceMetrics = await this.getPerformanceMetrics(startDate, endDate);
    const costBreakdown = await this.getCostBreakdown(startDate, endDate);
    const transcriptStats = await this.getTranscriptStats(startDate, endDate);
    const audioStats = await this.getAudioStats(startDate, endDate);

    return {
      id: crypto.randomUUID(),
      type,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      usage_stats: usageStats,
      performance_metrics: performanceMetrics,
      cost_breakdown: costBreakdown,
      transcript_stats: transcriptStats,
      audio_stats: audioStats,
      generated_at: new Date().toISOString(),
    };
  }

  async exportReport(report: Report, format: ExportFormat): Promise<Blob> {
    if (format === 'json') {
      return new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    }

    if (format === 'csv') {
      const csv = this.reportToCSV(report);
      return new Blob([csv], { type: 'text/csv' });
    }

    // PDF export would require a library like jsPDF
    throw new Error('PDF export not yet implemented');
  }

  private reportToCSV(report: Report): string {
    const lines: string[] = [];
    
    // Header
    lines.push(`Report Type,${report.type}`);
    lines.push(`Start Date,${report.start_date}`);
    lines.push(`End Date,${report.end_date}`);
    lines.push(`Generated At,${report.generated_at}`);
    lines.push('');

    // Usage Stats
    lines.push('Usage Statistics');
    lines.push('Date,Transcripts,Audio Uploads,Exports,AI Features,Minutes,Words');
    for (const stat of report.usage_stats) {
      lines.push(`${stat.date},${stat.transcripts_count},${stat.audio_uploads_count},${stat.exports_count},${stat.ai_features_count},${stat.total_minutes},${stat.total_words}`);
    }
    lines.push('');

    // Cost Breakdown
    lines.push('Cost Breakdown');
    lines.push('Date,API Calls,API Cost,Storage GB,Storage Cost,AI Features Cost,Total Cost');
    for (const cost of report.cost_breakdown) {
      lines.push(`${cost.date},${cost.api_calls},${cost.api_cost},${cost.storage_gb},${cost.storage_cost},${cost.ai_features_cost},${cost.total_cost}`);
    }

    return lines.join('\n');
  }

  // =====================================================
  // SCHEDULED REPORTS
  // =====================================================

  async getScheduledReports(): Promise<ScheduledReport[]> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.client
      .from('scheduled_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createScheduledReport(config: Omit<ScheduledReport, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ScheduledReport> {
    const user = await this.supabase.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.client
      .from('scheduled_reports')
      .insert({
        user_id: user.id,
        ...config,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateScheduledReport(id: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport> {
    const { data, error } = await this.supabase.client
      .from('scheduled_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteScheduledReport(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('scheduled_reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

// Singleton instance
let analyticsServiceInstance: AnalyticsService | null = null;

export function getAnalyticsService(): AnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AnalyticsService();
  }
  return analyticsServiceInstance;
}

