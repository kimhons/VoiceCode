/**
 * useAdvancedAnalytics Hook
 * Phase 5.7: Advanced Analytics
 * 
 * React hook for advanced analytics features
 */

import { useState, useCallback, useRef } from 'react';
import {
  getAdvancedAnalyticsService,
  UsageAnalytics,
  CostAnalytics,
  PerformanceAnalytics,
  TrendAnalysis,
  ROIMetrics,
} from '../services/advancedAnalytics.service';

export interface UseAdvancedAnalyticsOptions {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UseAdvancedAnalyticsReturn {
  // Usage Analytics
  getUsageAnalytics: (startDate: Date, endDate: Date) => Promise<UsageAnalytics>;
  usageAnalytics: UsageAnalytics | null;

  // Cost Analytics
  getCostAnalytics: (startDate: Date, endDate: Date) => Promise<CostAnalytics>;
  costAnalytics: CostAnalytics | null;

  // Performance Analytics
  getPerformanceAnalytics: (startDate: Date, endDate: Date) => Promise<PerformanceAnalytics>;
  performanceAnalytics: PerformanceAnalytics | null;

  // Trend Analysis
  analyzeTrend: (metric: string, startDate: Date, endDate: Date) => Promise<TrendAnalysis>;
  trendAnalysis: TrendAnalysis | null;

  // ROI Metrics
  calculateROI: (startDate: Date, endDate: Date) => Promise<ROIMetrics>;
  roiMetrics: ROIMetrics | null;

  // Combined Analytics
  getAllAnalytics: (startDate: Date, endDate: Date) => Promise<void>;

  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useAdvancedAnalytics(options: UseAdvancedAnalyticsOptions = {}): UseAdvancedAnalyticsReturn {
  const { userId } = options;

  // Service
  const service = useRef(getAdvancedAnalyticsService());

  // State
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics | null>(null);
  const [costAnalytics, setCostAnalytics] = useState<CostAnalytics | null>(null);
  const [performanceAnalytics, setPerformanceAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [roiMetrics, setROIMetrics] = useState<ROIMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usage Analytics
  const getUsageAnalytics = useCallback(
    async (startDate: Date, endDate: Date): Promise<UsageAnalytics> => {
      if (!userId) throw new Error('User ID is required');

      setError(null);
      setIsLoading(true);
      try {
        const analytics = await service.current.getUsageAnalytics(userId, startDate, endDate);
        setUsageAnalytics(analytics);
        return analytics;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get usage analytics';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // Cost Analytics
  const getCostAnalytics = useCallback(
    async (startDate: Date, endDate: Date): Promise<CostAnalytics> => {
      if (!userId) throw new Error('User ID is required');

      setError(null);
      setIsLoading(true);
      try {
        const analytics = await service.current.getCostAnalytics(userId, startDate, endDate);
        setCostAnalytics(analytics);
        return analytics;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get cost analytics';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // Performance Analytics
  const getPerformanceAnalytics = useCallback(
    async (startDate: Date, endDate: Date): Promise<PerformanceAnalytics> => {
      if (!userId) throw new Error('User ID is required');

      setError(null);
      setIsLoading(true);
      try {
        const analytics = await service.current.getPerformanceAnalytics(userId, startDate, endDate);
        setPerformanceAnalytics(analytics);
        return analytics;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get performance analytics';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // Trend Analysis
  const analyzeTrend = useCallback(
    async (metric: string, startDate: Date, endDate: Date): Promise<TrendAnalysis> => {
      if (!userId) throw new Error('User ID is required');

      setError(null);
      setIsLoading(true);
      try {
        const analysis = await service.current.analyzeTrend(userId, metric, startDate, endDate);
        setTrendAnalysis(analysis);
        return analysis;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to analyze trend';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // ROI Metrics
  const calculateROI = useCallback(
    async (startDate: Date, endDate: Date): Promise<ROIMetrics> => {
      if (!userId) throw new Error('User ID is required');

      setError(null);
      setIsLoading(true);
      try {
        const metrics = await service.current.calculateROI(userId, startDate, endDate);
        setROIMetrics(metrics);
        return metrics;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to calculate ROI';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // Get All Analytics
  const getAllAnalytics = useCallback(
    async (startDate: Date, endDate: Date): Promise<void> => {
      if (!userId) throw new Error('User ID is required');

      setError(null);
      setIsLoading(true);
      try {
        await Promise.all([
          getUsageAnalytics(startDate, endDate),
          getCostAnalytics(startDate, endDate),
          getPerformanceAnalytics(startDate, endDate),
          calculateROI(startDate, endDate),
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get analytics';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, getUsageAnalytics, getCostAnalytics, getPerformanceAnalytics, calculateROI]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    getUsageAnalytics,
    usageAnalytics,
    getCostAnalytics,
    costAnalytics,
    getPerformanceAnalytics,
    performanceAnalytics,
    analyzeTrend,
    trendAnalysis,
    calculateROI,
    roiMetrics,
    getAllAnalytics,
    isLoading,
    error,
    clearError,
  };
}

