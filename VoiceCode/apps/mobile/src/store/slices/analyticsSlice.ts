/**
 * Analytics Redux Slice
 * Phase 3 Week 9 Day 61-63: Advanced Analytics & Reporting
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAnalyticsService, DashboardMetrics, UsageStats, PerformanceMetrics, CostBreakdown } from '../../services/analyticsService';
import { getActivityService, ActivityLog, ActivitySummary, ActivityHeatmap, TopActivity } from '../../services/activityService';
import { getInsightsService, Insight, UsagePattern } from '../../services/insightsService';

// ============================================================================
// TYPES
// ============================================================================

export interface AnalyticsState {
  dashboardMetrics: DashboardMetrics | null;
  usageStats: UsageStats[];
  performanceMetrics: PerformanceMetrics[];
  costBreakdown: CostBreakdown[];
  activityLogs: ActivityLog[];
  activitySummary: ActivitySummary | null;
  activityHeatmap: ActivityHeatmap[];
  topActivities: TopActivity[];
  insights: Insight[];
  usagePattern: UsagePattern | null;
  timeRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  customStartDate: string | null;
  customEndDate: string | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchDashboardMetrics = createAsyncThunk(
  'analytics/fetchDashboardMetrics',
  async () => {
    const analyticsService = getAnalyticsService();
    return await analyticsService.getDashboardMetrics();
  }
);

export const fetchUsageStats = createAsyncThunk(
  'analytics/fetchUsageStats',
  async ({ startDate, endDate }: { startDate: Date; endDate: Date }) => {
    const analyticsService = getAnalyticsService();
    return await analyticsService.getUsageStats(startDate, endDate);
  }
);

export const fetchPerformanceMetrics = createAsyncThunk(
  'analytics/fetchPerformanceMetrics',
  async ({ startDate, endDate }: { startDate: Date; endDate: Date }) => {
    const analyticsService = getAnalyticsService();
    return await analyticsService.getPerformanceMetrics(startDate, endDate);
  }
);

export const fetchCostBreakdown = createAsyncThunk(
  'analytics/fetchCostBreakdown',
  async ({ startDate, endDate }: { startDate: Date; endDate: Date }) => {
    const analyticsService = getAnalyticsService();
    return await analyticsService.getCostBreakdown(startDate, endDate);
  }
);

export const fetchActivityLogs = createAsyncThunk(
  'analytics/fetchActivityLogs',
  async ({ startDate, endDate, limit }: { startDate: string; endDate: string; limit?: number }) => {
    const activityService = getActivityService();
    return await activityService.getActivityLogs({ startDate, endDate, limit });
  }
);

export const fetchActivitySummary = createAsyncThunk(
  'analytics/fetchActivitySummary',
  async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    const activityService = getActivityService();
    return await activityService.getActivitySummary({ startDate, endDate });
  }
);

export const fetchActivityHeatmap = createAsyncThunk(
  'analytics/fetchActivityHeatmap',
  async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    const activityService = getActivityService();
    return await activityService.getActivityHeatmap({ startDate, endDate });
  }
);

export const fetchTopActivities = createAsyncThunk(
  'analytics/fetchTopActivities',
  async ({ startDate, endDate, limit }: { startDate: string; endDate: string; limit?: number }) => {
    const activityService = getActivityService();
    return await activityService.getTopActivities({ startDate, endDate }, limit);
  }
);

export const fetchInsights = createAsyncThunk(
  'analytics/fetchInsights',
  async ({ startDate, endDate, limit }: { startDate: string; endDate: string; limit?: number }) => {
    const insightsService = getInsightsService();
    return await insightsService.generateInsights({ startDate, endDate, limit });
  }
);

export const fetchUsagePattern = createAsyncThunk(
  'analytics/fetchUsagePattern',
  async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    const insightsService = getInsightsService();
    return await insightsService.getUsagePattern({ startDate, endDate });
  }
);

// ============================================================================
// SLICE
// ============================================================================

const initialState: AnalyticsState = {
  dashboardMetrics: null,
  usageStats: [],
  performanceMetrics: [],
  costBreakdown: [],
  activityLogs: [],
  activitySummary: null,
  activityHeatmap: [],
  topActivities: [],
  insights: [],
  usagePattern: null,
  timeRange: 'month',
  customStartDate: null,
  customEndDate: null,
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setTimeRange: (state, action: PayloadAction<AnalyticsState['timeRange']>) => {
      state.timeRange = action.payload;
    },
    setCustomDateRange: (state, action: PayloadAction<{ startDate: string; endDate: string }>) => {
      state.customStartDate = action.payload.startDate;
      state.customEndDate = action.payload.endDate;
      state.timeRange = 'custom';
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Dashboard Metrics
    builder.addCase(fetchDashboardMetrics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
      state.loading = false;
      state.dashboardMetrics = action.payload;
    });
    builder.addCase(fetchDashboardMetrics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch dashboard metrics';
    });

    // Fetch Usage Stats
    builder.addCase(fetchUsageStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUsageStats.fulfilled, (state, action) => {
      state.loading = false;
      state.usageStats = action.payload;
    });
    builder.addCase(fetchUsageStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch usage stats';
    });

    // Fetch Performance Metrics
    builder.addCase(fetchPerformanceMetrics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPerformanceMetrics.fulfilled, (state, action) => {
      state.loading = false;
      state.performanceMetrics = action.payload;
    });
    builder.addCase(fetchPerformanceMetrics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch performance metrics';
    });

    // Fetch Cost Breakdown
    builder.addCase(fetchCostBreakdown.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCostBreakdown.fulfilled, (state, action) => {
      state.loading = false;
      state.costBreakdown = action.payload;
    });
    builder.addCase(fetchCostBreakdown.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch cost breakdown';
    });

    // Fetch Activity Logs
    builder.addCase(fetchActivityLogs.fulfilled, (state, action) => {
      state.activityLogs = action.payload;
    });

    // Fetch Activity Summary
    builder.addCase(fetchActivitySummary.fulfilled, (state, action) => {
      state.activitySummary = action.payload;
    });

    // Fetch Activity Heatmap
    builder.addCase(fetchActivityHeatmap.fulfilled, (state, action) => {
      state.activityHeatmap = action.payload;
    });

    // Fetch Top Activities
    builder.addCase(fetchTopActivities.fulfilled, (state, action) => {
      state.topActivities = action.payload;
    });

    // Fetch Insights
    builder.addCase(fetchInsights.fulfilled, (state, action) => {
      state.insights = action.payload;
    });

    // Fetch Usage Pattern
    builder.addCase(fetchUsagePattern.fulfilled, (state, action) => {
      state.usagePattern = action.payload;
    });
  },
});

export const { setTimeRange, setCustomDateRange, clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;

