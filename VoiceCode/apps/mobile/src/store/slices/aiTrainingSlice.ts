/**
 * AI Training Slice
 * Phase 3 Week 10 Day 64-65: AI Model Management
 * 
 * Redux state management for AI model training and fine-tuning
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getAITrainingService,
  TrainingData,
  TrainingJob,
  ModelEvaluation,
  DeployedModel,
  TrainingConfig,
  DeploymentStatus,
} from '../../services/aiTrainingService';

// ============================================================================
// STATE INTERFACE
// ============================================================================

export interface AITrainingState {
  trainingData: TrainingData[];
  trainingJobs: TrainingJob[];
  currentJob: TrainingJob | null;
  evaluationResults: ModelEvaluation | null;
  deployedModels: DeployedModel[];
  loading: boolean;
  error: string | null;
}

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Upload training data
 */
export const uploadTrainingData = createAsyncThunk(
  'aiTraining/uploadTrainingData',
  async (data: Omit<TrainingData, 'id' | 'created_at' | 'updated_at'>) => {
    const service = getAITrainingService();
    return await service.uploadTrainingData(data);
  }
);

/**
 * Validate training data
 */
export const validateTrainingData = createAsyncThunk(
  'aiTraining/validateTrainingData',
  async (dataId: string) => {
    const service = getAITrainingService();
    return await service.validateTrainingData(dataId);
  }
);

/**
 * Start fine-tuning job
 */
export const startTraining = createAsyncThunk(
  'aiTraining/startTraining',
  async (config: {
    name: string;
    base_model_id: string;
    training_data_id: string;
    training_config: TrainingConfig;
  }) => {
    const service = getAITrainingService();
    return await service.startFineTuning(config);
  }
);

/**
 * Fetch training job status
 */
export const fetchTrainingStatus = createAsyncThunk(
  'aiTraining/fetchTrainingStatus',
  async (jobId: string) => {
    const service = getAITrainingService();
    return await service.getTrainingStatus(jobId);
  }
);

/**
 * Evaluate trained model
 */
export const evaluateModel = createAsyncThunk(
  'aiTraining/evaluateModel',
  async ({ modelId, testDataId }: { modelId: string; testDataId: string }) => {
    const service = getAITrainingService();
    return await service.evaluateModel(modelId, testDataId);
  }
);

/**
 * Deploy model
 */
export const deployModel = createAsyncThunk(
  'aiTraining/deployModel',
  async (config: {
    name: string;
    version: string;
    base_model_id: string;
    training_job_id: string;
    deployment_status: DeploymentStatus;
  }) => {
    const service = getAITrainingService();
    return await service.deployModel(config);
  }
);

/**
 * Rollback model
 */
export const rollbackModel = createAsyncThunk(
  'aiTraining/rollbackModel',
  async ({ modelId, targetVersion }: { modelId: string; targetVersion: string }) => {
    const service = getAITrainingService();
    await service.rollbackModel(modelId, targetVersion);
    return modelId;
  }
);

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AITrainingState = {
  trainingData: [],
  trainingJobs: [],
  currentJob: null,
  evaluationResults: null,
  deployedModels: [],
  loading: false,
  error: null,
};

// ============================================================================
// SLICE
// ============================================================================

const aiTrainingSlice = createSlice({
  name: 'aiTraining',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearEvaluation: (state) => {
      state.evaluationResults = null;
    },
  },
  extraReducers: (builder) => {
    // Upload Training Data
    builder.addCase(uploadTrainingData.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(uploadTrainingData.fulfilled, (state, action) => {
      state.loading = false;
      state.trainingData.push(action.payload);
    });
    builder.addCase(uploadTrainingData.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to upload training data';
    });

    // Validate Training Data
    builder.addCase(validateTrainingData.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(validateTrainingData.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.trainingData.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.trainingData[index] = action.payload;
      }
    });
    builder.addCase(validateTrainingData.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to validate training data';
    });

    // Start Training
    builder.addCase(startTraining.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(startTraining.fulfilled, (state, action) => {
      state.loading = false;
      state.trainingJobs.push(action.payload);
      state.currentJob = action.payload;
    });
    builder.addCase(startTraining.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to start training';
    });

    // Fetch Training Status
    builder.addCase(fetchTrainingStatus.fulfilled, (state, action) => {
      const index = state.trainingJobs.findIndex(j => j.id === action.payload.id);
      if (index !== -1) {
        state.trainingJobs[index] = action.payload;
      }
      if (state.currentJob?.id === action.payload.id) {
        state.currentJob = action.payload;
      }
    });

    // Evaluate Model
    builder.addCase(evaluateModel.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(evaluateModel.fulfilled, (state, action) => {
      state.loading = false;
      state.evaluationResults = action.payload;
    });
    builder.addCase(evaluateModel.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to evaluate model';
    });

    // Deploy Model
    builder.addCase(deployModel.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deployModel.fulfilled, (state, action) => {
      state.loading = false;
      state.deployedModels.push(action.payload);
    });
    builder.addCase(deployModel.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to deploy model';
    });

    // Rollback Model
    builder.addCase(rollbackModel.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(rollbackModel.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.deployedModels.findIndex(m => m.id === action.payload);
      if (index !== -1) {
        state.deployedModels[index].deployment_status = 'archived';
      }
    });
    builder.addCase(rollbackModel.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to rollback model';
    });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const { clearError, clearEvaluation } = aiTrainingSlice.actions;
export default aiTrainingSlice.reducer;

