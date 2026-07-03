/**
 * useAnalytics Hook
 * Phase 4: Analytics & Reporting
 * 
 * React hook for analytics and reporting
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getAnalyticsService,
  UsageStats,
  PerformanceMetrics,
  CostBreakdown,
  DashboardMetrics,
  TranscriptStats,
  AudioStats,
  Report,
  ScheduledReport,
  ReportType,
  ExportFormat,
  AnalyticsEvent,
} from '../services/analytics.service';

export interface UseAnalyticsOptions {
  autoLoadDashboard?: boolean;
  refreshInterval?: number; // milliseconds
}

export interface UseAnalyticsReturn {
  // Dashboard
  dashboardMetrics: DashboardMetrics | null;
  loadDashboard: () => Promise<void>;
  isLoadingDashboard: boolean;

  // Usage Stats
  usageStats: UsageStats[];
  loadUsageStats: (startDate: Date, endDate: Date) => Promise<void>;
  isLoadingUsageStats: boolean;

  // Transcript Stats
  transcriptStats: TranscriptStats | null;
  loadTranscriptStats: (startDate: Date, endDate: Date) => Promise<void>;
  isLoadingTranscriptStats: boolean;

  // Audio Stats
  audioStats: AudioStats | null;
  loadAudioStats: (startDate: Date, endDate: Date) => Promise<void>;
  isLoadingAudioStats: boolean;

  // Performance Metrics
  performanceMetrics: PerformanceMetrics[];
  loadPerformanceMetrics: (startDate: Date, endDate: Date) => Promise<void>;
  isLoadingPerformanceMetrics: boolean;

  // Cost Breakdown
  costBreakdown: CostBreakdown[];
  loadCostBreakdown: (startDate: Date, endDate: Date) => Promise<void>;
  isLoadingCostBreakdown: boolean;

  // Storage Usage
  storageUsage: { total_gb: number; cost: number } | null;
  loadStorageUsage: () => Promise<void>;
  isLoadingStorageUsage: boolean;

  // Reports
  currentReport: Report | null;
  generateReport: (type: ReportType, startDate: Date, endDate: Date) => Promise<Report>;
  exportReport: (report: Report, format: ExportFormat) => Promise<Blob>;
  isGeneratingReport: boolean;

  // Scheduled Reports
  scheduledReports: ScheduledReport[];
  loadScheduledReports: () => Promise<void>;
  createScheduledReport: (config: Omit<ScheduledReport, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<ScheduledReport>;
  updateScheduledReport: (id: string, updates: Partial<ScheduledReport>) => Promise<ScheduledReport>;
  deleteScheduledReport: (id: string) => Promise<void>;
  isLoadingScheduledReports: boolean;

  // Event Tracking
  trackEvent: (event: AnalyticsEvent) => Promise<void>;

  // State
  error: string | null;
  clearError: () => void;
}

export function useAnalytics(
  options: UseAnalyticsOptions = {}
): UseAnalyticsReturn {
  const {
    autoLoadDashboard = true,
    refreshInterval = 60000, // 1 minute
  } = options;

  // Service
  const analyticsService = useRef(getAnalyticsService());

  // State
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [isLoadingUsageStats, setIsLoadingUsageStats] = useState(false);

  const [transcriptStats, setTranscriptStats] = useState<TranscriptStats | null>(null);
  const [isLoadingTranscriptStats, setIsLoadingTranscriptStats] = useState(false);

  const [audioStats, setAudioStats] = useState<AudioStats | null>(null);
  const [isLoadingAudioStats, setIsLoadingAudioStats] = useState(false);

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [isLoadingPerformanceMetrics, setIsLoadingPerformanceMetrics] = useState(false);

  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [isLoadingCostBreakdown, setIsLoadingCostBreakdown] = useState(false);

  const [storageUsage, setStorageUsage] = useState<{ total_gb: number; cost: number } | null>(null);
  const [isLoadingStorageUsage, setIsLoadingStorageUsage] = useState(false);

  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [isLoadingScheduledReports, setIsLoadingScheduledReports] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Dashboard
  const loadDashboard = useCallback(async () => {
    setError(null);
    setIsLoadingDashboard(true);
    try {
      const metrics = await analyticsService.current.getDashboardMetrics();
      setDashboardMetrics(metrics);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(message);
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, []);

  // Usage Stats
  const loadUsageStats = useCallback(async (startDate: Date, endDate: Date) => {
    setError(null);
    setIsLoadingUsageStats(true);
    try {
      const stats = await analyticsService.current.getUsageStats(startDate, endDate);
      setUsageStats(stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load usage stats';
      setError(message);
      console.error('Failed to load usage stats:', err);
    } finally {
      setIsLoadingUsageStats(false);
    }
  }, []);

  // Transcript Stats
  const loadTranscriptStats = useCallback(async (startDate: Date, endDate: Date) => {
    setError(null);
    setIsLoadingTranscriptStats(true);
    try {
      const stats = await analyticsService.current.getTranscriptStats(startDate, endDate);
      setTranscriptStats(stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load transcript stats';
      setError(message);
      console.error('Failed to load transcript stats:', err);
    } finally {
      setIsLoadingTranscriptStats(false);
    }
  }, []);

  // Audio Stats
  const loadAudioStats = useCallback(async (startDate: Date, endDate: Date) => {
    setError(null);
    setIsLoadingAudioStats(true);
    try {
      const stats = await analyticsService.current.getAudioStats(startDate, endDate);
      setAudioStats(stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audio stats';
      setError(message);
      console.error('Failed to load audio stats:', err);
    } finally {
      setIsLoadingAudioStats(false);
    }
  }, []);

  // Performance Metrics
  const loadPerformanceMetrics = useCallback(async (startDate: Date, endDate: Date) => {
    setError(null);
    setIsLoadingPerformanceMetrics(true);
    try {
      const metrics = await analyticsService.current.getPerformanceMetrics(startDate, endDate);
      setPerformanceMetrics(metrics);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load performance metrics';
      setError(message);
      console.error('Failed to load performance metrics:', err);
    } finally {
      setIsLoadingPerformanceMetrics(false);
    }
  }, []);

  // Cost Breakdown
  const loadCostBreakdown = useCallback(async (startDate: Date, endDate: Date) => {
    setError(null);
    setIsLoadingCostBreakdown(true);
    try {
      const breakdown = await analyticsService.current.getCostBreakdown(startDate, endDate);
      setCostBreakdown(breakdown);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load cost breakdown';
      setError(message);
      console.error('Failed to load cost breakdown:', err);
    } finally {
      setIsLoadingCostBreakdown(false);
    }
  }, []);

  // Storage Usage
  const loadStorageUsage = useCallback(async () => {
    setError(null);
    setIsLoadingStorageUsage(true);
    try {
      const usage = await analyticsService.current.getStorageUsage();
      setStorageUsage(usage);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load storage usage';
      setError(message);
      console.error('Failed to load storage usage:', err);
    } finally {
      setIsLoadingStorageUsage(false);
    }
  }, []);

  // Reports
  const generateReport = useCallback(async (type: ReportType, startDate: Date, endDate: Date) => {
    setError(null);
    setIsGeneratingReport(true);
    try {
      const report = await analyticsService.current.generateReport(type, startDate, endDate);
      setCurrentReport(report);
      return report;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      setError(message);
      throw err;
    } finally {
      setIsGeneratingReport(false);
    }
  }, []);

  const exportReport = useCallback(async (report: Report, format: ExportFormat) => {
    setError(null);
    try {
      const blob = await analyticsService.current.exportReport(report, format);
      return blob;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export report';
      setError(message);
      throw err;
    }
  }, []);

  // Scheduled Reports
  const loadScheduledReports = useCallback(async () => {
    setError(null);
    setIsLoadingScheduledReports(true);
    try {
      const reports = await analyticsService.current.getScheduledReports();
      setScheduledReports(reports);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load scheduled reports';
      setError(message);
      console.error('Failed to load scheduled reports:', err);
    } finally {
      setIsLoadingScheduledReports(false);
    }
  }, []);

  const createScheduledReport = useCallback(async (config: Omit<ScheduledReport, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setError(null);
    try {
      const report = await analyticsService.current.createScheduledReport(config);
      setScheduledReports(prev => [report, ...prev]);
      return report;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create scheduled report';
      setError(message);
      throw err;
    }
  }, []);

  const updateScheduledReport = useCallback(async (id: string, updates: Partial<ScheduledReport>) => {
    setError(null);
    try {
      const report = await analyticsService.current.updateScheduledReport(id, updates);
      setScheduledReports(prev => prev.map(r => r.id === id ? report : r));
      return report;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update scheduled report';
      setError(message);
      throw err;
    }
  }, []);

  const deleteScheduledReport = useCallback(async (id: string) => {
    setError(null);
    try {
      await analyticsService.current.deleteScheduledReport(id);
      setScheduledReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete scheduled report';
      setError(message);
      throw err;
    }
  }, []);

  // Event Tracking
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    try {
      await analyticsService.current.trackEvent(event);
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load dashboard
  useEffect(() => {
    if (autoLoadDashboard) {
      loadDashboard();
      const interval = setInterval(loadDashboard, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoLoadDashboard, refreshInterval, loadDashboard]);

  return {
    dashboardMetrics,
    loadDashboard,
    isLoadingDashboard,
    usageStats,
    loadUsageStats,
    isLoadingUsageStats,
    transcriptStats,
    loadTranscriptStats,
    isLoadingTranscriptStats,
    audioStats,
    loadAudioStats,
    isLoadingAudioStats,
    performanceMetrics,
    loadPerformanceMetrics,
    isLoadingPerformanceMetrics,
    costBreakdown,
    loadCostBreakdown,
    isLoadingCostBreakdown,
    storageUsage,
    loadStorageUsage,
    isLoadingStorageUsage,
    currentReport,
    generateReport,
    exportReport,
    isGeneratingReport,
    scheduledReports,
    loadScheduledReports,
    createScheduledReport,
    updateScheduledReport,
    deleteScheduledReport,
    isLoadingScheduledReports,
    trackEvent,
    error,
    clearError,
  };
}

