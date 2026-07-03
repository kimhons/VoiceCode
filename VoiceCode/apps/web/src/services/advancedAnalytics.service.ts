/**
 * Advanced Analytics Service
 * Phase 5.7: Advanced Analytics
 * 
 * Comprehensive analytics with custom reports, data visualization,
 * trend analysis, predictive insights, and ROI tracking
 */

import { getSupabaseService } from './supabase.service';

// Types
export interface AnalyticsMetric {
  name: string;
  value: number;
  change: number; // percentage change
  trend: 'up' | 'down' | 'stable';
  period: 'day' | 'week' | 'month' | 'year';
}

export interface UsageAnalytics {
  totalTranscripts: number;
  totalDuration: number; // seconds
  totalWords: number;
  averageAccuracy: number;
  transcriptsPerDay: number;
  peakUsageHours: number[];
  mostUsedLanguages: Array<{ language: string; count: number }>;
  mostUsedModes: Array<{ mode: string; count: number }>;
}

export interface CostAnalytics {
  totalCost: number;
  costPerTranscript: number;
  costPerMinute: number;
  costPerWord: number;
  costBreakdown: Array<{ category: string; cost: number; percentage: number }>;
  projectedMonthlyCost: number;
  savingsOpportunities: Array<{ suggestion: string; potentialSavings: number }>;
}

export interface PerformanceAnalytics {
  averageTranscriptionTime: number;
  averageProcessingSpeed: number; // words per second
  successRate: number;
  errorRate: number;
  averageConfidence: number;
  performanceByMode: Array<{ mode: string; avgTime: number; successRate: number }>;
  performanceByLanguage: Array<{ language: string; avgTime: number; accuracy: number }>;
}

export interface TrendAnalysis {
  metric: string;
  dataPoints: Array<{ date: string; value: number }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  forecast: Array<{ date: string; value: number; confidence: number }>;
  seasonality: boolean;
  anomalies: Array<{ date: string; value: number; reason: string }>;
}

export interface CustomReport {
  id: string;
  userId: string;
  name: string;
  description: string;
  metrics: string[];
  filters: Record<string, any>;
  dateRange: { start: Date; end: Date };
  schedule?: 'daily' | 'weekly' | 'monthly';
  format: 'pdf' | 'csv' | 'json' | 'excel';
  recipients: string[];
  createdAt: Date;
  lastGenerated?: Date;
}

export interface BenchmarkData {
  metric: string;
  userValue: number;
  industryAverage: number;
  topPerformer: number;
  percentile: number;
  recommendation: string;
}

export interface ROIMetrics {
  timeSaved: number; // hours
  costSaved: number;
  productivityGain: number; // percentage
  transcriptsProcessed: number;
  manualTranscriptionCost: number;
  automatedTranscriptionCost: number;
  netSavings: number;
  roi: number; // percentage
  paybackPeriod: number; // months
}

// Advanced Analytics Service
class AdvancedAnalyticsService {
  // =====================================================
  // USAGE ANALYTICS
  // =====================================================

  async getUsageAnalytics(userId: string, startDate: Date, endDate: Date): Promise<UsageAnalytics> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      // Get transcripts in date range
      const { data: transcripts, error } = await client
        .from('transcripts')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Calculate metrics
      const totalTranscripts = transcripts?.length || 0;
      const totalDuration = transcripts?.reduce((sum, t) => sum + (t.duration || 0), 0) || 0;
      const totalWords = transcripts?.reduce((sum, t) => sum + (t.word_count || 0), 0) || 0;
      const averageAccuracy = transcripts?.reduce((sum, t) => sum + (t.accuracy || 0), 0) / totalTranscripts || 0;
      
      const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const transcriptsPerDay = totalTranscripts / daysDiff;

      // Peak usage hours
      const hourCounts = new Array(24).fill(0);
      transcripts?.forEach(t => {
        const hour = new Date(t.created_at).getHours();
        hourCounts[hour]++;
      });
      const maxCount = Math.max(...hourCounts);
      const peakUsageHours = hourCounts
        .map((count, hour) => ({ hour, count }))
        .filter(h => h.count >= maxCount * 0.8)
        .map(h => h.hour);

      // Most used languages
      const languageCounts = new Map<string, number>();
      transcripts?.forEach(t => {
        const lang = t.language || 'en';
        languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1);
      });
      const mostUsedLanguages = Array.from(languageCounts.entries())
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Most used modes
      const modeCounts = new Map<string, number>();
      transcripts?.forEach(t => {
        const mode = t.mode || 'general';
        modeCounts.set(mode, (modeCounts.get(mode) || 0) + 1);
      });
      const mostUsedModes = Array.from(modeCounts.entries())
        .map(([mode, count]) => ({ mode, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalTranscripts,
        totalDuration,
        totalWords,
        averageAccuracy,
        transcriptsPerDay,
        peakUsageHours,
        mostUsedLanguages,
        mostUsedModes,
      };
    } catch (error) {
      console.error('Failed to get usage analytics:', error);
      throw error;
    }
  }

  // =====================================================
  // COST ANALYTICS
  // =====================================================

  async getCostAnalytics(userId: string, startDate: Date, endDate: Date): Promise<CostAnalytics> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      // Get cost data
      const { data: costs, error } = await client
        .from('cost_tracking')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const totalCost = costs?.reduce((sum, c) => sum + (c.cost || 0), 0) || 0;
      const totalTranscripts = costs?.length || 1;
      const totalMinutes = costs?.reduce((sum, c) => sum + (c.duration || 0), 0) / 60 || 1;
      const totalWords = costs?.reduce((sum, c) => sum + (c.word_count || 0), 0) || 1;

      const costPerTranscript = totalCost / totalTranscripts;
      const costPerMinute = totalCost / totalMinutes;
      const costPerWord = totalCost / totalWords;

      // Cost breakdown
      const categoryTotals = new Map<string, number>();
      costs?.forEach(c => {
        const category = c.category || 'transcription';
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + c.cost);
      });
      const costBreakdown = Array.from(categoryTotals.entries())
        .map(([category, cost]) => ({
          category,
          cost,
          percentage: (cost / totalCost) * 100,
        }))
        .sort((a, b) => b.cost - a.cost);

      // Projected monthly cost
      const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyAverage = totalCost / daysDiff;
      const projectedMonthlyCost = dailyAverage * 30;

      // Savings opportunities
      const savingsOpportunities = [
        {
          suggestion: 'Use batch processing for multiple files',
          potentialSavings: projectedMonthlyCost * 0.15,
        },
        {
          suggestion: 'Optimize audio quality before upload',
          potentialSavings: projectedMonthlyCost * 0.10,
        },
        {
          suggestion: 'Use custom vocabulary for better accuracy',
          potentialSavings: projectedMonthlyCost * 0.08,
        },
      ];

      return {
        totalCost,
        costPerTranscript,
        costPerMinute,
        costPerWord,
        costBreakdown,
        projectedMonthlyCost,
        savingsOpportunities,
      };
    } catch (error) {
      console.error('Failed to get cost analytics:', error);
      throw error;
    }
  }

  // =====================================================
  // PERFORMANCE ANALYTICS
  // =====================================================

  async getPerformanceAnalytics(userId: string, startDate: Date, endDate: Date): Promise<PerformanceAnalytics> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data: transcripts, error } = await client
        .from('transcripts')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const total = transcripts?.length || 1;
      const successful = transcripts?.filter(t => t.status === 'completed').length || 0;
      const failed = transcripts?.filter(t => t.status === 'failed').length || 0;

      const averageTranscriptionTime = transcripts?.reduce((sum, t) => sum + (t.processing_time || 0), 0) / total || 0;
      const averageProcessingSpeed = transcripts?.reduce((sum, t) => {
        const speed = (t.word_count || 0) / (t.processing_time || 1);
        return sum + speed;
      }, 0) / total || 0;
      const successRate = (successful / total) * 100;
      const errorRate = (failed / total) * 100;
      const averageConfidence = transcripts?.reduce((sum, t) => sum + (t.confidence || 0), 0) / total || 0;

      // Performance by mode
      const modeStats = new Map<string, { times: number[]; successes: number; total: number }>();
      transcripts?.forEach(t => {
        const mode = t.mode || 'general';
        if (!modeStats.has(mode)) {
          modeStats.set(mode, { times: [], successes: 0, total: 0 });
        }
        const stats = modeStats.get(mode)!;
        stats.times.push(t.processing_time || 0);
        if (t.status === 'completed') stats.successes++;
        stats.total++;
      });
      const performanceByMode = Array.from(modeStats.entries()).map(([mode, stats]) => ({
        mode,
        avgTime: stats.times.reduce((a, b) => a + b, 0) / stats.times.length,
        successRate: (stats.successes / stats.total) * 100,
      }));

      // Performance by language
      const langStats = new Map<string, { times: number[]; accuracies: number[] }>();
      transcripts?.forEach(t => {
        const lang = t.language || 'en';
        if (!langStats.has(lang)) {
          langStats.set(lang, { times: [], accuracies: [] });
        }
        const stats = langStats.get(lang)!;
        stats.times.push(t.processing_time || 0);
        stats.accuracies.push(t.accuracy || 0);
      });
      const performanceByLanguage = Array.from(langStats.entries()).map(([language, stats]) => ({
        language,
        avgTime: stats.times.reduce((a, b) => a + b, 0) / stats.times.length,
        accuracy: stats.accuracies.reduce((a, b) => a + b, 0) / stats.accuracies.length,
      }));

      return {
        averageTranscriptionTime,
        averageProcessingSpeed,
        successRate,
        errorRate,
        averageConfidence,
        performanceByMode,
        performanceByLanguage,
      };
    } catch (error) {
      console.error('Failed to get performance analytics:', error);
      throw error;
    }
  }

  // =====================================================
  // TREND ANALYSIS
  // =====================================================

  async analyzeTrend(userId: string, metric: string, startDate: Date, endDate: Date): Promise<TrendAnalysis> {
    try {
      // Get historical data
      const dataPoints = await this.getHistoricalData(userId, metric, startDate, endDate);

      // Calculate trend
      const values = dataPoints.map(d => d.value);
      const trend = this.calculateTrend(values);
      const trendPercentage = this.calculateTrendPercentage(values);

      // Generate forecast
      const forecast = this.generateForecast(dataPoints, 7); // 7 days ahead

      // Detect seasonality
      const seasonality = this.detectSeasonality(values);

      // Detect anomalies
      const anomalies = this.detectAnomalies(dataPoints);

      return {
        metric,
        dataPoints,
        trend,
        trendPercentage,
        forecast,
        seasonality,
        anomalies,
      };
    } catch (error) {
      console.error('Failed to analyze trend:', error);
      throw error;
    }
  }

  private async getHistoricalData(userId: string, metric: string, startDate: Date, endDate: Date): Promise<Array<{ date: string; value: number }>> {
    // Simplified implementation - in production, query actual data
    const dataPoints: Array<{ date: string; value: number }> = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dataPoints.push({
        date: currentDate.toISOString().split('T')[0],
        value: Math.random() * 100 + 50, // Mock data
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dataPoints;
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
  }

  private calculateTrendPercentage(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    
    return ((lastValue - firstValue) / firstValue) * 100;
  }

  private generateForecast(dataPoints: Array<{ date: string; value: number }>, days: number): Array<{ date: string; value: number; confidence: number }> {
    const forecast: Array<{ date: string; value: number; confidence: number }> = [];
    const lastDate = new Date(dataPoints[dataPoints.length - 1].date);
    const avgValue = dataPoints.reduce((sum, d) => sum + d.value, 0) / dataPoints.length;
    
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        value: avgValue * (1 + (Math.random() - 0.5) * 0.1), // Simple forecast with variance
        confidence: Math.max(0.5, 1 - (i * 0.05)), // Confidence decreases over time
      });
    }
    
    return forecast;
  }

  private detectSeasonality(values: number[]): boolean {
    // Simple seasonality detection - check for repeating patterns
    if (values.length < 14) return false;
    
    const weeklyPattern = this.checkWeeklyPattern(values);
    return weeklyPattern;
  }

  private checkWeeklyPattern(values: number[]): boolean {
    // Check if there's a weekly pattern (7-day cycle)
    if (values.length < 14) return false;
    
    let correlation = 0;
    for (let i = 0; i < values.length - 7; i++) {
      correlation += Math.abs(values[i] - values[i + 7]);
    }
    
    const avgDiff = correlation / (values.length - 7);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    
    return (avgDiff / avgValue) < 0.2; // Less than 20% variation suggests pattern
  }

  private detectAnomalies(dataPoints: Array<{ date: string; value: number }>): Array<{ date: string; value: number; reason: string }> {
    const anomalies: Array<{ date: string; value: number; reason: string }> = [];
    const values = dataPoints.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    dataPoints.forEach(point => {
      const zScore = Math.abs((point.value - mean) / stdDev);
      if (zScore > 2) { // More than 2 standard deviations
        anomalies.push({
          date: point.date,
          value: point.value,
          reason: point.value > mean ? 'Unusually high activity' : 'Unusually low activity',
        });
      }
    });
    
    return anomalies;
  }

  // =====================================================
  // ROI METRICS
  // =====================================================

  async calculateROI(userId: string, startDate: Date, endDate: Date): Promise<ROIMetrics> {
    try {
      const usage = await this.getUsageAnalytics(userId, startDate, endDate);
      const costs = await this.getCostAnalytics(userId, startDate, endDate);
      
      // Assumptions
      const manualTranscriptionRate = 60; // $60 per hour of audio
      const averageTypingSpeed = 40; // words per minute
      const hoursOfAudio = usage.totalDuration / 3600;
      
      const manualTranscriptionCost = hoursOfAudio * manualTranscriptionRate;
      const automatedTranscriptionCost = costs.totalCost;
      const netSavings = manualTranscriptionCost - automatedTranscriptionCost;
      const roi = (netSavings / automatedTranscriptionCost) * 100;
      
      const timeSaved = usage.totalWords / averageTypingSpeed / 60; // hours
      const costSaved = netSavings;
      const productivityGain = (timeSaved / (hoursOfAudio * 4)) * 100; // Assuming 4x time for manual
      
      const paybackPeriod = automatedTranscriptionCost / (netSavings / 12); // months
      
      return {
        timeSaved,
        costSaved,
        productivityGain,
        transcriptsProcessed: usage.totalTranscripts,
        manualTranscriptionCost,
        automatedTranscriptionCost,
        netSavings,
        roi,
        paybackPeriod,
      };
    } catch (error) {
      console.error('Failed to calculate ROI:', error);
      throw error;
    }
  }
}

// Singleton instance
let advancedAnalyticsInstance: AdvancedAnalyticsService | null = null;

export function getAdvancedAnalyticsService(): AdvancedAnalyticsService {
  if (!advancedAnalyticsInstance) {
    advancedAnalyticsInstance = new AdvancedAnalyticsService();
  }
  return advancedAnalyticsInstance;
}

export default AdvancedAnalyticsService;

