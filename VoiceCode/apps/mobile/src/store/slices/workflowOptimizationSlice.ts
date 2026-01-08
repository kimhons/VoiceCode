/**
 * Workflow Optimization Redux Slice
 * Phase 3 Week 10 Day 68-69: Intelligent Automation
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getWorkflowOptimizationService,
  WorkflowAnalytics,
  OptimizationSuggestion,
  WorkflowMonitoring,
  PerformanceMetrics,
  ExecutionHistory,
} from '../../services/workflowOptimizationService';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface WorkflowOptimizationState {
  analytics: WorkflowAnalytics | null;
  allAnalytics: WorkflowAnalytics[];
  optimizations: OptimizationSuggestion[];
  monitoring: WorkflowMonitoring[];
  performanceMetrics: PerformanceMetrics | null;
  executionHistory: ExecutionHistory | null;
  loading: boolean;
  error: string | null;
}

const initialState: WorkflowOptimizationState = {
  analytics: null,
  allAnalytics: [],
  optimizations: [],
  monitoring: [],
  performanceMetrics: null,
  executionHistory: null,
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchAnalytics = createAsyncThunk(
  'workflowOptimization/fetchAnalytics',
  async (workflowId: string) => {
    const service = getWorkflowOptimizationService();
    return await service.getWorkflowAnalytics(workflowId);
  }
);

export const fetchAllAnalytics = createAsyncThunk(
  'workflowOptimization/fetchAllAnalytics',
  async (userId: string) => {
    const service = getWorkflowOptimizationService();
    return await service.getAllWorkflowsAnalytics(userId);
  }
);

export const fetchOptimizations = createAsyncThunk(
  'workflowOptimization/fetchOptimizations',
  async (workflowId: string) => {
    const service = getWorkflowOptimizationService();
    return await service.getOptimizationSuggestions(workflowId);
  }
);

export const applyOptimization = createAsyncThunk(
  'workflowOptimization/applyOptimization',
  async (optimizationId: string) => {
    const service = getWorkflowOptimizationService();
    await service.applyOptimization(optimizationId);
    return optimizationId;
  }
);

export const fetchMonitoring = createAsyncThunk(
  'workflowOptimization/fetchMonitoring',
  async (userId: string) => {
    const service = getWorkflowOptimizationService();
    return await service.getActiveWorkflows(userId);
  }
);

export const fetchPerformanceMetrics = createAsyncThunk(
  'workflowOptimization/fetchPerformanceMetrics',
  async (userId: string) => {
    const service = getWorkflowOptimizationService();
    return await service.getPerformanceMetrics(userId);
  }
);

export const fetchExecutionHistory = createAsyncThunk(
  'workflowOptimization/fetchExecutionHistory',
  async ({ workflowId, startDate, endDate }: { workflowId: string; startDate: string; endDate: string }) => {
    const service = getWorkflowOptimizationService();
    return await service.getExecutionHistory(workflowId, startDate, endDate);
  }
);

// ============================================================================
// SLICE
// ============================================================================

const workflowOptimizationSlice = createSlice({
  name: 'workflowOptimization',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAnalytics: (state) => {
      state.analytics = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Analytics
    builder.addCase(fetchAnalytics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAnalytics.fulfilled, (state, action) => {
      state.loading = false;
      state.analytics = action.payload;
    });
    builder.addCase(fetchAnalytics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch analytics';
    });

    // Fetch All Analytics
    builder.addCase(fetchAllAnalytics.fulfilled, (state, action) => {
      state.allAnalytics = action.payload;
    });

    // Fetch Optimizations
    builder.addCase(fetchOptimizations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOptimizations.fulfilled, (state, action) => {
      state.loading = false;
      state.optimizations = action.payload;
    });
    builder.addCase(fetchOptimizations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch optimizations';
    });

    // Apply Optimization
    builder.addCase(applyOptimization.fulfilled, (state, action) => {
      const optimization = state.optimizations.find(o => o.id === action.payload);
      if (optimization) {
        optimization.is_applied = true;
      }
    });

    // Fetch Monitoring
    builder.addCase(fetchMonitoring.fulfilled, (state, action) => {
      state.monitoring = action.payload;
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

    // Fetch Execution History
    builder.addCase(fetchExecutionHistory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchExecutionHistory.fulfilled, (state, action) => {
      state.loading = false;
      state.executionHistory = action.payload;
    });
    builder.addCase(fetchExecutionHistory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch execution history';
    });
  },
});

export const { clearError, clearAnalytics } = workflowOptimizationSlice.actions;
export default workflowOptimizationSlice.reducer;

