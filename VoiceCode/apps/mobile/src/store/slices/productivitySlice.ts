/**
 * Productivity Slice
 * Phase 3 Week 11 Day 71-72: Productivity Analytics
 * 
 * Redux state management for productivity analytics.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getProductivityService,
  ProductivityMetrics,
  TimeBreakdown,
  FocusSession,
  ProductivityTrend,
  ProductivityGoal,
  ProductivityInsight,
} from '../../services/productivityService';

interface ProductivityState {
  metrics: ProductivityMetrics | null;
  timeBreakdown: TimeBreakdown[];
  focusSessions: FocusSession[];
  trend: ProductivityTrend[];
  goals: ProductivityGoal[];
  insights: ProductivityInsight[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductivityState = {
  metrics: null,
  timeBreakdown: [],
  focusSessions: [],
  trend: [],
  goals: [],
  insights: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchProductivityMetrics = createAsyncThunk(
  'productivity/fetchMetrics',
  async ({ userId, period }: { userId: string; period: 'day' | 'week' | 'month' }) => {
    const service = getProductivityService();
    return await service.getProductivityMetrics(userId, period);
  }
);

export const fetchTimeBreakdown = createAsyncThunk(
  'productivity/fetchTimeBreakdown',
  async ({ userId, date }: { userId: string; date: string }) => {
    const service = getProductivityService();
    return await service.getTimeBreakdown(userId, date);
  }
);

export const fetchFocusSessions = createAsyncThunk(
  'productivity/fetchFocusSessions',
  async ({ userId, startDate, endDate }: { userId: string; startDate: string; endDate: string }) => {
    const service = getProductivityService();
    return await service.getFocusSessions(userId, startDate, endDate);
  }
);

export const fetchProductivityTrend = createAsyncThunk(
  'productivity/fetchTrend',
  async ({ userId, days }: { userId: string; days: number }) => {
    const service = getProductivityService();
    return await service.getProductivityTrend(userId, days);
  }
);

export const fetchProductivityGoals = createAsyncThunk(
  'productivity/fetchGoals',
  async (userId: string) => {
    const service = getProductivityService();
    return await service.getProductivityGoals(userId);
  }
);

export const createGoal = createAsyncThunk(
  'productivity/createGoal',
  async (goal: Omit<ProductivityGoal, 'id' | 'current_value' | 'progress'>) => {
    const service = getProductivityService();
    return await service.createProductivityGoal(goal);
  }
);

export const updateGoal = createAsyncThunk(
  'productivity/updateGoal',
  async ({ goalId, updates }: { goalId: string; updates: Partial<ProductivityGoal> }) => {
    const service = getProductivityService();
    return await service.updateProductivityGoal(goalId, updates);
  }
);

export const fetchInsights = createAsyncThunk(
  'productivity/fetchInsights',
  async (userId: string) => {
    const service = getProductivityService();
    return await service.getProductivityInsights(userId);
  }
);

// Slice
const productivitySlice = createSlice({
  name: 'productivity',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetProductivity: (state) => {
      state.metrics = null;
      state.timeBreakdown = [];
      state.focusSessions = [];
      state.trend = [];
      state.goals = [];
      state.insights = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Productivity Metrics
    builder.addCase(fetchProductivityMetrics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProductivityMetrics.fulfilled, (state, action) => {
      state.loading = false;
      state.metrics = action.payload;
    });
    builder.addCase(fetchProductivityMetrics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch productivity metrics';
    });

    // Fetch Time Breakdown
    builder.addCase(fetchTimeBreakdown.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTimeBreakdown.fulfilled, (state, action) => {
      state.loading = false;
      state.timeBreakdown = action.payload;
    });
    builder.addCase(fetchTimeBreakdown.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch time breakdown';
    });

    // Fetch Focus Sessions
    builder.addCase(fetchFocusSessions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFocusSessions.fulfilled, (state, action) => {
      state.loading = false;
      state.focusSessions = action.payload;
    });
    builder.addCase(fetchFocusSessions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch focus sessions';
    });

    // Fetch Productivity Trend
    builder.addCase(fetchProductivityTrend.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProductivityTrend.fulfilled, (state, action) => {
      state.loading = false;
      state.trend = action.payload;
    });
    builder.addCase(fetchProductivityTrend.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch productivity trend';
    });

    // Fetch Productivity Goals
    builder.addCase(fetchProductivityGoals.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProductivityGoals.fulfilled, (state, action) => {
      state.loading = false;
      state.goals = action.payload;
    });
    builder.addCase(fetchProductivityGoals.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch productivity goals';
    });

    // Create Goal
    builder.addCase(createGoal.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createGoal.fulfilled, (state, action) => {
      state.loading = false;
      state.goals.push(action.payload);
    });
    builder.addCase(createGoal.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to create goal';
    });

    // Update Goal
    builder.addCase(updateGoal.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateGoal.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.goals.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.goals[index] = action.payload;
      }
    });
    builder.addCase(updateGoal.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to update goal';
    });

    // Fetch Insights
    builder.addCase(fetchInsights.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchInsights.fulfilled, (state, action) => {
      state.loading = false;
      state.insights = action.payload;
    });
    builder.addCase(fetchInsights.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch insights';
    });
  },
});

export const { clearError, resetProductivity } = productivitySlice.actions;
export default productivitySlice.reducer;

