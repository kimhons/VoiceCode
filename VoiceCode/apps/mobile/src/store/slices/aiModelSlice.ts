/**
 * AI Model Slice
 * Phase 3 Week 10 Day 64-65: AI Model Management
 * 
 * Redux state management for AI model selection and configuration
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getAIModelService,
  AIModel,
  ModelComparison,
  ModelBenchmark,
  ModelUsageStats,
  ModelCostAnalysis,
  ModelConfig,
} from '../../services/aiModelService';

// ============================================================================
// STATE INTERFACE
// ============================================================================

export interface AIModelState {
  availableModels: AIModel[];
  selectedModel: AIModel | null;
  modelComparison: ModelComparison | null;
  benchmarks: ModelBenchmark[];
  usageStats: ModelUsageStats | null;
  costAnalysis: ModelCostAnalysis | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Fetch all available AI models
 */
export const fetchAvailableModels = createAsyncThunk(
  'aiModel/fetchAvailableModels',
  async () => {
    const service = getAIModelService();
    return await service.getAvailableModels();
  }
);

/**
 * Fetch detailed information about a specific model
 */
export const fetchModelDetails = createAsyncThunk(
  'aiModel/fetchModelDetails',
  async (modelId: string) => {
    const service = getAIModelService();
    return await service.getModelDetails(modelId);
  }
);

/**
 * Compare multiple AI models
 */
export const compareModels = createAsyncThunk(
  'aiModel/compareModels',
  async (modelIds: string[]) => {
    const service = getAIModelService();
    return await service.compareModels(modelIds);
  }
);

/**
 * Select and configure a model
 */
export const selectModel = createAsyncThunk(
  'aiModel/selectModel',
  async ({ modelId, config }: { modelId: string; config: ModelConfig }) => {
    const service = getAIModelService();
    await service.selectModel(modelId, config);
    return await service.getModelDetails(modelId);
  }
);

/**
 * Fetch performance benchmarks for a model
 */
export const fetchBenchmarks = createAsyncThunk(
  'aiModel/fetchBenchmarks',
  async (modelId: string) => {
    const service = getAIModelService();
    return await service.getModelBenchmarks(modelId);
  }
);

/**
 * Fetch usage statistics for a model
 */
export const fetchUsageStats = createAsyncThunk(
  'aiModel/fetchUsageStats',
  async ({ modelId, startDate, endDate }: { modelId: string; startDate: Date; endDate: Date }) => {
    const service = getAIModelService();
    return await service.getModelUsageStats(modelId, startDate, endDate);
  }
);

/**
 * Fetch cost analysis for a model
 */
export const fetchCostAnalysis = createAsyncThunk(
  'aiModel/fetchCostAnalysis',
  async (modelId: string) => {
    const service = getAIModelService();
    return await service.getModelCostAnalysis(modelId);
  }
);

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AIModelState = {
  availableModels: [],
  selectedModel: null,
  modelComparison: null,
  benchmarks: [],
  usageStats: null,
  costAnalysis: null,
  loading: false,
  error: null,
};

// ============================================================================
// SLICE
// ============================================================================

const aiModelSlice = createSlice({
  name: 'aiModel',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearComparison: (state) => {
      state.modelComparison = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Available Models
    builder.addCase(fetchAvailableModels.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAvailableModels.fulfilled, (state, action) => {
      state.loading = false;
      state.availableModels = action.payload;
    });
    builder.addCase(fetchAvailableModels.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch available models';
    });

    // Fetch Model Details
    builder.addCase(fetchModelDetails.fulfilled, (state, action) => {
      if (action.payload) {
        state.selectedModel = action.payload;
      }
    });

    // Compare Models
    builder.addCase(compareModels.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(compareModels.fulfilled, (state, action) => {
      state.loading = false;
      state.modelComparison = action.payload;
    });
    builder.addCase(compareModels.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to compare models';
    });

    // Select Model
    builder.addCase(selectModel.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(selectModel.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.selectedModel = action.payload;
      }
    });
    builder.addCase(selectModel.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to select model';
    });

    // Fetch Benchmarks
    builder.addCase(fetchBenchmarks.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBenchmarks.fulfilled, (state, action) => {
      state.loading = false;
      state.benchmarks = action.payload;
    });
    builder.addCase(fetchBenchmarks.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch benchmarks';
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

    // Fetch Cost Analysis
    builder.addCase(fetchCostAnalysis.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCostAnalysis.fulfilled, (state, action) => {
      state.loading = false;
      state.costAnalysis = action.payload;
    });
    builder.addCase(fetchCostAnalysis.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch cost analysis';
    });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const { clearError, clearComparison } = aiModelSlice.actions;
export default aiModelSlice.reducer;

