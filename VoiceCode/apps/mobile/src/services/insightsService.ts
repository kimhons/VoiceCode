/**
 * Insights Service
 * Analytics Enhancement: AI-Powered Insights & Recommendations
 * 
 * Provides usage pattern analysis, anomaly detection, and recommendations
 */

import { getAnalyticsService } from './analyticsService';
import { getActivityService } from './activityService';

// ============================================================================
// TYPES
// ============================================================================

export type InsightType =
  | 'usage_spike' | 'usage_decline'
  | 'cost_spike' | 'cost_optimization'
  | 'feature_underutilized' | 'feature_popular'
  | 'accuracy_improvement' | 'accuracy_decline'
  | 'engagement_high' | 'engagement_low'
  | 'anomaly_detected' | 'trend_prediction';

export type InsightSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface Insight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  recommendation?: string;
  metric_value?: number;
  metric_change?: number;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface UsagePattern {
  pattern_type: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trend_percentage: number;
  confidence: number;
  prediction_next_week?: number;
  prediction_next_month?: number;
}

export interface CostProjection {
  current_monthly_cost: number;
  projected_next_month: number;
  projected_next_quarter: number;
  savings_opportunities: Array<{
    area: string;
    potential_savings: number;
    recommendation: string;
  }>;
}

export interface FeatureRecommendation {
  feature_name: string;
  usage_percentage: number;
  recommendation_type: 'increase_usage' | 'optimize' | 'explore';
  description: string;
  potential_benefit: string;
}

export interface InsightFilter {
  userId?: string;
  organizationId?: string;
  types?: InsightType[];
  severities?: InsightSeverity[];
  startDate: string;
  endDate: string;
  limit?: number;
}

// ============================================================================
// INSIGHTS SERVICE
// ============================================================================

class InsightsService {
  private analyticsService = getAnalyticsService();
  private activityService = getActivityService();

  /**
   * Generate insights for a user/organization
   */
  async generateInsights(filter: InsightFilter): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Get analytics data
    const startDate = new Date(filter.startDate);
    const endDate = new Date(filter.endDate);

    const usageStats = await this.analyticsService.getUsageStats(startDate, endDate);

    const performanceMetrics = await this.analyticsService.getPerformanceMetrics(startDate, endDate);

    const costBreakdown = await this.analyticsService.getCostBreakdown(startDate, endDate);

    const activitySummary = await this.activityService.getActivitySummary({
      userId: filter.userId,
      organizationId: filter.organizationId,
      startDate: filter.startDate,
      endDate: filter.endDate,
    });

    // Analyze usage patterns
    insights.push(...this.analyzeUsagePatterns(usageStats));

    // Analyze cost trends
    insights.push(...this.analyzeCostTrends(costBreakdown));

    // Analyze performance
    insights.push(...this.analyzePerformance(performanceMetrics));

    // Analyze engagement
    insights.push(...this.analyzeEngagement(activitySummary));

    // Filter by types and severities if specified
    let filteredInsights = insights;
    if (filter.types && filter.types.length > 0) {
      filteredInsights = filteredInsights.filter((i) => filter.types!.includes(i.type));
    }
    if (filter.severities && filter.severities.length > 0) {
      filteredInsights = filteredInsights.filter((i) => filter.severities!.includes(i.severity));
    }

    // Sort by severity (critical > warning > info > success)
    const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
    filteredInsights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Apply limit
    if (filter.limit) {
      filteredInsights = filteredInsights.slice(0, filter.limit);
    }

    return filteredInsights;
  }

  /**
   * Analyze usage patterns
   */
  private analyzeUsagePatterns(usageStats: any[]): Insight[] {
    const insights: Insight[] = [];

    if (usageStats.length < 2) return insights;

    // Calculate trend
    const recentUsage = usageStats.slice(-7);
    const olderUsage = usageStats.slice(-14, -7);

    const recentAvg = recentUsage.reduce((sum, s) => sum + s.total_minutes, 0) / recentUsage.length;
    const olderAvg = olderUsage.reduce((sum, s) => sum + s.total_minutes, 0) / (olderUsage.length || 1);

    const changePercentage = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    // Usage spike
    if (changePercentage > 50) {
      insights.push({
        id: `usage-spike-${Date.now()}`,
        type: 'usage_spike',
        severity: 'info',
        title: 'Usage Spike Detected',
        description: `Your usage has increased by ${changePercentage.toFixed(1)}% in the last week.`,
        recommendation: 'Consider upgrading your plan if this trend continues.',
        metric_value: recentAvg,
        metric_change: changePercentage,
        created_at: new Date().toISOString(),
      });
    }

    // Usage decline
    if (changePercentage < -30) {
      insights.push({
        id: `usage-decline-${Date.now()}`,
        type: 'usage_decline',
        severity: 'warning',
        title: 'Usage Decline Detected',
        description: `Your usage has decreased by ${Math.abs(changePercentage).toFixed(1)}% in the last week.`,
        recommendation: 'Review your workflow to ensure you\'re getting the most value.',
        metric_value: recentAvg,
        metric_change: changePercentage,
        created_at: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Analyze cost trends
   */
  private analyzeCostTrends(costBreakdown: any[]): Insight[] {
    const insights: Insight[] = [];

    if (costBreakdown.length < 2) return insights;

    const recentCost = costBreakdown[costBreakdown.length - 1];
    const previousCost = costBreakdown[costBreakdown.length - 2];

    const totalCostChange = recentCost.total_cost - previousCost.total_cost;
    const changePercentage = previousCost.total_cost > 0
      ? (totalCostChange / previousCost.total_cost) * 100
      : 0;

    // Cost spike
    if (changePercentage > 30) {
      insights.push({
        id: `cost-spike-${Date.now()}`,
        type: 'cost_spike',
        severity: 'critical',
        title: 'Cost Spike Alert',
        description: `Your costs have increased by ${changePercentage.toFixed(1)}% recently.`,
        recommendation: 'Review your usage patterns and consider optimization strategies.',
        metric_value: recentCost.total_cost,
        metric_change: changePercentage,
        created_at: new Date().toISOString(),
      });
    }

    // Cost optimization opportunity
    if (recentCost.ai_features_cost > recentCost.total_cost * 0.5) {
      insights.push({
        id: `cost-optimization-${Date.now()}`,
        type: 'cost_optimization',
        severity: 'info',
        title: 'Cost Optimization Opportunity',
        description: 'AI features account for over 50% of your costs.',
        recommendation: 'Consider batching AI requests or using selective AI features.',
        metric_value: recentCost.ai_features_cost,
        created_at: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Analyze performance metrics
   */
  private analyzePerformance(performanceMetrics: any[]): Insight[] {
    const insights: Insight[] = [];

    if (performanceMetrics.length < 2) return insights;

    const recentMetrics = performanceMetrics.slice(-7);
    const avgAccuracy = recentMetrics.reduce((sum, m) => sum + m.avg_accuracy, 0) / recentMetrics.length;

    // High accuracy
    if (avgAccuracy > 95) {
      insights.push({
        id: `accuracy-high-${Date.now()}`,
        type: 'accuracy_improvement',
        severity: 'success',
        title: 'Excellent Accuracy',
        description: `Your average transcription accuracy is ${avgAccuracy.toFixed(1)}%.`,
        recommendation: 'Keep up the great work! Your audio quality is excellent.',
        metric_value: avgAccuracy,
        created_at: new Date().toISOString(),
      });
    }

    // Low accuracy
    if (avgAccuracy < 80) {
      insights.push({
        id: `accuracy-low-${Date.now()}`,
        type: 'accuracy_decline',
        severity: 'warning',
        title: 'Accuracy Below Target',
        description: `Your average transcription accuracy is ${avgAccuracy.toFixed(1)}%.`,
        recommendation: 'Try improving audio quality: reduce background noise, use better microphones.',
        metric_value: avgAccuracy,
        created_at: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Analyze engagement
   */
  private analyzeEngagement(activitySummary: any): Insight[] {
    const insights: Insight[] = [];

    const engagementScore = activitySummary.engagement_score;

    // High engagement
    if (engagementScore > 70) {
      insights.push({
        id: `engagement-high-${Date.now()}`,
        type: 'engagement_high',
        severity: 'success',
        title: 'High Engagement',
        description: `Your engagement score is ${engagementScore}/100.`,
        recommendation: 'You\'re making great use of the platform!',
        metric_value: engagementScore,
        created_at: new Date().toISOString(),
      });
    }

    // Low engagement
    if (engagementScore < 30) {
      insights.push({
        id: `engagement-low-${Date.now()}`,
        type: 'engagement_low',
        severity: 'warning',
        title: 'Low Engagement',
        description: `Your engagement score is ${engagementScore}/100.`,
        recommendation: 'Explore more features to get the most value from the platform.',
        metric_value: engagementScore,
        created_at: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Get usage pattern analysis
   */
  async getUsagePattern(filter: InsightFilter): Promise<UsagePattern> {
    const startDate = new Date(filter.startDate);
    const endDate = new Date(filter.endDate);
    const usageStats = await this.analyticsService.getUsageStats(startDate, endDate);

    if (usageStats.length < 7) {
      return {
        pattern_type: 'stable',
        trend_percentage: 0,
        confidence: 0,
      };
    }

    // Calculate trend using linear regression
    const values = usageStats.map((s) => s.total_minutes);
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgValue = sumY / n;
    const trendPercentage = avgValue > 0 ? (slope / avgValue) * 100 : 0;

    // Determine pattern type
    let patternType: UsagePattern['pattern_type'];
    if (Math.abs(trendPercentage) < 5) {
      patternType = 'stable';
    } else if (trendPercentage > 5) {
      patternType = 'increasing';
    } else {
      patternType = 'decreasing';
    }

    // Calculate confidence based on variance
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avgValue, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0, Math.min(100, 100 - (stdDev / avgValue) * 100));

    // Predict next week and month
    const predictionNextWeek = avgValue + slope * 7;
    const predictionNextMonth = avgValue + slope * 30;

    return {
      pattern_type: patternType,
      trend_percentage: trendPercentage,
      confidence,
      prediction_next_week: Math.max(0, predictionNextWeek),
      prediction_next_month: Math.max(0, predictionNextMonth),
    };
  }

  /**
   * Get cost projection
   */
  async getCostProjection(filter: InsightFilter): Promise<CostProjection> {
    const startDate = new Date(filter.startDate);
    const endDate = new Date(filter.endDate);
    const costBreakdown = await this.analyticsService.getCostBreakdown(startDate, endDate);

    if (costBreakdown.length === 0) {
      return {
        current_monthly_cost: 0,
        projected_next_month: 0,
        projected_next_quarter: 0,
        savings_opportunities: [],
      };
    }

    const recentCost = costBreakdown[costBreakdown.length - 1];
    const currentMonthlyCost = recentCost.total_cost;

    // Simple projection based on current cost
    const projectedNextMonth = currentMonthlyCost * 1.1; // Assume 10% growth
    const projectedNextQuarter = currentMonthlyCost * 3 * 1.15; // Assume 15% growth over quarter

    // Identify savings opportunities
    const savingsOpportunities: CostProjection['savings_opportunities'] = [];

    if (recentCost.ai_features_cost > currentMonthlyCost * 0.4) {
      savingsOpportunities.push({
        area: 'AI Features',
        potential_savings: recentCost.ai_features_cost * 0.2,
        recommendation: 'Optimize AI feature usage by batching requests and using selective features.',
      });
    }

    if (recentCost.storage_cost > currentMonthlyCost * 0.3) {
      savingsOpportunities.push({
        area: 'Storage',
        potential_savings: recentCost.storage_cost * 0.15,
        recommendation: 'Archive old recordings and enable automatic cleanup policies.',
      });
    }

    return {
      current_monthly_cost: currentMonthlyCost,
      projected_next_month: projectedNextMonth,
      projected_next_quarter: projectedNextQuarter,
      savings_opportunities: savingsOpportunities,
    };
  }

  /**
   * Get feature recommendations
   */
  async getFeatureRecommendations(filter: InsightFilter): Promise<FeatureRecommendation[]> {
    const activitySummary = await this.activityService.getActivitySummary({
      userId: filter.userId,
      organizationId: filter.organizationId,
      startDate: filter.startDate,
      endDate: filter.endDate,
    });

    const totalActivities = activitySummary.total_activities;
    const recommendations: FeatureRecommendation[] = [];

    // AI Features
    const aiActivities =
      (activitySummary.activities_by_type.ai_summary || 0) +
      (activitySummary.activities_by_type.ai_key_points || 0) +
      (activitySummary.activities_by_type.ai_action_items || 0);
    const aiUsagePercentage = totalActivities > 0 ? (aiActivities / totalActivities) * 100 : 0;

    if (aiUsagePercentage < 10) {
      recommendations.push({
        feature_name: 'AI Features',
        usage_percentage: aiUsagePercentage,
        recommendation_type: 'explore',
        description: 'You\'re not using AI features much.',
        potential_benefit: 'AI summaries and key points can save you hours of review time.',
      });
    }

    // Export Features
    const exportActivities =
      (activitySummary.activities_by_type.export_pdf || 0) +
      (activitySummary.activities_by_type.export_docx || 0) +
      (activitySummary.activities_by_type.export_txt || 0);
    const exportUsagePercentage = totalActivities > 0 ? (exportActivities / totalActivities) * 100 : 0;

    if (exportUsagePercentage > 30) {
      recommendations.push({
        feature_name: 'Export Features',
        usage_percentage: exportUsagePercentage,
        recommendation_type: 'optimize',
        description: 'You export frequently.',
        potential_benefit: 'Consider using batch export or automated export workflows.',
      });
    }

    // Collaboration Features
    const collabActivities =
      (activitySummary.activities_by_type.share_transcript || 0) +
      (activitySummary.activities_by_type.collaborate_invited || 0);
    const collabUsagePercentage = totalActivities > 0 ? (collabActivities / totalActivities) * 100 : 0;

    if (collabUsagePercentage < 5) {
      recommendations.push({
        feature_name: 'Collaboration',
        usage_percentage: collabUsagePercentage,
        recommendation_type: 'explore',
        description: 'You haven\'t used collaboration features much.',
        potential_benefit: 'Share transcripts with your team for better collaboration.',
      });
    }

    return recommendations;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let insightsServiceInstance: InsightsService | null = null;

export function getInsightsService(): InsightsService {
  if (!insightsServiceInstance) {
    insightsServiceInstance = new InsightsService();
  }
  return insightsServiceInstance;
}

export default InsightsService;


