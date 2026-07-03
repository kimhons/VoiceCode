/**
 * AI Audit Logging Service
 * Comprehensive audit logging for all AI operations
 * 
 * Features:
 * - Operation logging with full context
 * - Token usage tracking
 * - Cost calculation
 * - Performance metrics
 * - Security event logging
 * - Compliance reporting
 * - Anomaly detection
 */

import { getSupabaseService } from './supabase.service';

export interface AIAuditLog {
  id: string;
  userId: string;
  operation: AIOperation;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  latency: number;
  success: boolean;
  errorMessage?: string;
  securityFlags: SecurityFlag[];
  metadata: Record<string, any>;
  timestamp: Date;
}

export type AIOperation =
  | 'transcription'
  | 'text_enhancement'
  | 'summarization'
  | 'custom_prompt'
  | 'meeting_insights'
  | 'emotion_detection'
  | 'categorization'
  | 'semantic_search'
  | 'speaker_analysis';

export interface SecurityFlag {
  type: 'prompt_injection' | 'pii_detected' | 'policy_violation' | 'hallucination' | 'rate_limit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
}

export interface UsageStatistics {
  totalOperations: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  successRate: number;
  operationBreakdown: Record<AIOperation, number>;
  securityIncidents: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  byModel: Record<string, number>;
  byOperation: Record<AIOperation, number>;
  projectedMonthlyCost: number;
}

export class AIAuditLoggingService {
  private static instance: AIAuditLoggingService;

  // Pricing per 1M tokens (as of 2025)
  private readonly MODEL_PRICING: Record<string, { input: number; output: number }> = {
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4': { input: 30.00, output: 60.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
    'gpt-5-pro': { input: 5.00, output: 15.00 },
    'deepgram-nova-2': { input: 0.0043, output: 0 }, // Per minute
  };

  public static getInstance(): AIAuditLoggingService {
    if (!AIAuditLoggingService.instance) {
      AIAuditLoggingService.instance = new AIAuditLoggingService();
    }
    return AIAuditLoggingService.instance;
  }

  /**
   * Log AI operation
   */
  public async logOperation(
    userId: string,
    operation: AIOperation,
    model: string,
    inputTokens: number,
    outputTokens: number,
    latency: number,
    success: boolean,
    securityFlags: SecurityFlag[] = [],
    metadata: Record<string, any> = {},
    errorMessage?: string
  ): Promise<void> {
    try {
      const totalTokens = inputTokens + outputTokens;
      const cost = this.calculateCost(model, inputTokens, outputTokens);

      const log: Omit<AIAuditLog, 'id'> = {
        userId,
        operation,
        model,
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        latency,
        success,
        errorMessage,
        securityFlags,
        metadata,
        timestamp: new Date(),
      };

      // Save to database
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) {
        console.error('Supabase client not available for audit logging');
        return;
      }

      await client.from('ai_audit_logs').insert({
        user_id: log.userId,
        operation: log.operation,
        model: log.model,
        input_tokens: log.inputTokens,
        output_tokens: log.outputTokens,
        total_tokens: log.totalTokens,
        cost: log.cost,
        latency: log.latency,
        success: log.success,
        error_message: log.errorMessage,
        security_flags: log.securityFlags,
        metadata: log.metadata,
        timestamp: log.timestamp.toISOString(),
      });

      // Check for anomalies
      await this.detectAnomalies(userId, log);
    } catch (error) {
      console.error('Failed to log AI operation:', error);
    }
  }

  /**
   * Calculate cost for operation
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = this.MODEL_PRICING[model];
    if (!pricing) return 0;

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * Get usage statistics for a user
   */
  public async getUsageStatistics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageStatistics> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data: logs, error } = await client
        .from('ai_audit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error) throw error;

      const totalOperations = logs.length;
      const totalTokens = logs.reduce((sum, log) => sum + log.total_tokens, 0);
      const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
      const averageLatency = logs.reduce((sum, log) => sum + log.latency, 0) / totalOperations;
      const successRate = logs.filter(log => log.success).length / totalOperations;

      const operationBreakdown: Record<AIOperation, number> = {} as any;
      for (const log of logs) {
        operationBreakdown[log.operation as AIOperation] = 
          (operationBreakdown[log.operation as AIOperation] || 0) + 1;
      }

      const securityIncidents = logs.filter(
        log => log.security_flags && log.security_flags.length > 0
      ).length;

      return {
        totalOperations,
        totalTokens,
        totalCost,
        averageLatency,
        successRate,
        operationBreakdown,
        securityIncidents,
        period: { start: startDate, end: endDate },
      };
    } catch (error) {
      console.error('Failed to get usage statistics:', error);
      throw error;
    }
  }

  /**
   * Get cost breakdown
   */
  public async getCostBreakdown(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CostBreakdown> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data: logs, error } = await client
        .from('ai_audit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error) throw error;

      let inputCost = 0;
      let outputCost = 0;
      const byModel: Record<string, number> = {};
      const byOperation: Record<AIOperation, number> = {} as any;

      for (const log of logs) {
        const pricing = this.MODEL_PRICING[log.model];
        if (pricing) {
          const logInputCost = (log.input_tokens / 1_000_000) * pricing.input;
          const logOutputCost = (log.output_tokens / 1_000_000) * pricing.output;
          
          inputCost += logInputCost;
          outputCost += logOutputCost;
          
          byModel[log.model] = (byModel[log.model] || 0) + log.cost;
          byOperation[log.operation as AIOperation] = 
            (byOperation[log.operation as AIOperation] || 0) + log.cost;
        }
      }

      const totalCost = inputCost + outputCost;

      // Project monthly cost based on current usage
      const daysInPeriod = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const projectedMonthlyCost = (totalCost / daysInPeriod) * 30;

      return {
        inputCost,
        outputCost,
        totalCost,
        byModel,
        byOperation,
        projectedMonthlyCost,
      };
    } catch (error) {
      console.error('Failed to get cost breakdown:', error);
      throw error;
    }
  }

  /**
   * Get security incidents
   */
  public async getSecurityIncidents(
    userId: string,
    startDate: Date,
    endDate: Date,
    minSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<Array<{ log: AIAuditLog; flags: SecurityFlag[] }>> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data: logs, error } = await client
        .from('ai_audit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .not('security_flags', 'is', null);

      if (error) throw error;

      const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      const minSeverityLevel = severityOrder[minSeverity];

      return logs
        .filter(log => {
          const flags = log.security_flags as SecurityFlag[];
          return flags.some(flag => severityOrder[flag.severity] >= minSeverityLevel);
        })
        .map(log => ({
          log: log as any,
          flags: log.security_flags as SecurityFlag[],
        }));
    } catch (error) {
      console.error('Failed to get security incidents:', error);
      return [];
    }
  }

  /**
   * Detect anomalies in usage patterns
   */
  private async detectAnomalies(userId: string, currentLog: Omit<AIAuditLog, 'id'>): Promise<void> {
    try {
      // Get recent logs for comparison
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return;

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { data: recentLogs, error } = await client
        .from('ai_audit_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', oneDayAgo.toISOString())
        .limit(100);

      if (error || !recentLogs || recentLogs.length === 0) return;

      // Calculate averages
      const avgTokens = recentLogs.reduce((sum, log) => sum + log.total_tokens, 0) / recentLogs.length;
      const avgLatency = recentLogs.reduce((sum, log) => sum + log.latency, 0) / recentLogs.length;
      const avgCost = recentLogs.reduce((sum, log) => sum + log.cost, 0) / recentLogs.length;

      // Detect anomalies
      const anomalies: string[] = [];

      // Unusual token usage (3x average)
      if (currentLog.totalTokens > avgTokens * 3) {
        anomalies.push(`Unusual token usage: ${currentLog.totalTokens} (avg: ${avgTokens.toFixed(0)})`);
      }

      // Unusual latency (5x average)
      if (currentLog.latency > avgLatency * 5) {
        anomalies.push(`Unusual latency: ${currentLog.latency}ms (avg: ${avgLatency.toFixed(0)}ms)`);
      }

      // Unusual cost (3x average)
      if (currentLog.cost > avgCost * 3) {
        anomalies.push(`Unusual cost: $${currentLog.cost.toFixed(4)} (avg: $${avgCost.toFixed(4)})`);
      }

      // Log anomalies
      if (anomalies.length > 0) {
        console.warn('AI Usage Anomalies Detected:', {
          userId,
          operation: currentLog.operation,
          anomalies,
        });

        // Could send alert to admin or user
      }
    } catch (error) {
      console.error('Failed to detect anomalies:', error);
    }
  }

  /**
   * Generate compliance report
   */
  public async generateComplianceReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalOperations: number;
    securityIncidents: number;
    piiDetections: number;
    policyViolations: number;
    averageResponseTime: number;
    dataRetentionCompliance: boolean;
    recommendations: string[];
  }> {
    try {
      const stats = await this.getUsageStatistics(userId, startDate, endDate);
      const incidents = await this.getSecurityIncidents(userId, startDate, endDate, 'low');

      const piiDetections = incidents.filter(i => 
        i.flags.some(f => f.type === 'pii_detected')
      ).length;

      const policyViolations = incidents.filter(i =>
        i.flags.some(f => f.type === 'policy_violation')
      ).length;

      const recommendations: string[] = [];

      if (stats.securityIncidents > 10) {
        recommendations.push('High number of security incidents detected. Review security policies.');
      }

      if (piiDetections > 5) {
        recommendations.push('Multiple PII detections. Ensure users are aware of data handling policies.');
      }

      if (stats.successRate < 0.95) {
        recommendations.push('Success rate below 95%. Investigate error patterns.');
      }

      return {
        totalOperations: stats.totalOperations,
        securityIncidents: stats.securityIncidents,
        piiDetections,
        policyViolations,
        averageResponseTime: stats.averageLatency,
        dataRetentionCompliance: true, // Implement actual check
        recommendations,
      };
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw error;
    }
  }
}

// Export singleton
export const aiAuditLoggingService = AIAuditLoggingService.getInstance();

