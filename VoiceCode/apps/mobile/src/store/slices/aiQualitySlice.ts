/**
 * AI Quality Redux Slice
 * Phase 3 Week 10 Day 70: AI Quality & Safety
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getAIQualityService,
  QualityMetrics,
  BiasReport,
  HallucinationDetection,
  HumanReview,
  QualityScore,
  QualitySettings,
} from '../../services/aiQualityService';

interface AIQualityState {
  qualityMetrics: QualityMetrics | null;
  biasReports: BiasReport[];
  hallucinations: HallucinationDetection[];
  reviews: HumanReview[];
  pendingReviews: HumanReview[];
  qualityScore: QualityScore | null;
  settings: QualitySettings | null;
  loading: boolean;
  error: string | null;
}

const initialState: AIQualityState = {
  qualityMetrics: null,
  biasReports: [],
  hallucinations: [],
  reviews: [],
  pendingReviews: [],
  qualityScore: null,
  settings: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchQualityMetrics = createAsyncThunk(
  'aiQuality/fetchQualityMetrics',
  async (userId: string) => {
    const service = getAIQualityService();
    return await service.getQualityMetrics(userId);
  }
);

export const detectBias = createAsyncThunk(
  'aiQuality/detectBias',
  async ({ transcriptId, text }: { transcriptId: string; text: string }) => {
    const service = getAIQualityService();
    return await service.detectBias(transcriptId, text);
  }
);

export const detectHallucinations = createAsyncThunk(
  'aiQuality/detectHallucinations',
  async ({ transcriptId, text }: { transcriptId: string; text: string }) => {
    const service = getAIQualityService();
    return await service.detectHallucinations(transcriptId, text);
  }
);

export const submitReview = createAsyncThunk(
  'aiQuality/submitReview',
  async (review: Omit<HumanReview, 'id' | 'reviewed_at'>) => {
    const service = getAIQualityService();
    return await service.submitReview(review);
  }
);

export const fetchReviews = createAsyncThunk(
  'aiQuality/fetchReviews',
  async (transcriptId: string) => {
    const service = getAIQualityService();
    return await service.getReviews(transcriptId);
  }
);

export const fetchPendingReviews = createAsyncThunk(
  'aiQuality/fetchPendingReviews',
  async (userId: string) => {
    const service = getAIQualityService();
    return await service.getPendingReviews(userId);
  }
);

export const calculateQualityScore = createAsyncThunk(
  'aiQuality/calculateQualityScore',
  async ({ transcriptId, text }: { transcriptId: string; text: string }) => {
    const service = getAIQualityService();
    return await service.calculateQualityScore(transcriptId, text);
  }
);

export const fetchQualitySettings = createAsyncThunk(
  'aiQuality/fetchQualitySettings',
  async (userId: string) => {
    const service = getAIQualityService();
    return await service.getQualitySettings(userId);
  }
);

export const updateQualitySettings = createAsyncThunk(
  'aiQuality/updateQualitySettings',
  async ({ userId, settings }: { userId: string; settings: Partial<QualitySettings> }) => {
    const service = getAIQualityService();
    return await service.updateQualitySettings(userId, settings);
  }
);

export const fetchBiasReports = createAsyncThunk(
  'aiQuality/fetchBiasReports',
  async (userId: string) => {
    const service = getAIQualityService();
    return await service.getBiasReports(userId);
  }
);

export const fetchHallucinations = createAsyncThunk(
  'aiQuality/fetchHallucinations',
  async (userId: string) => {
    const service = getAIQualityService();
    return await service.getHallucinations(userId);
  }
);

const aiQualitySlice = createSlice({
  name: 'aiQuality',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetMetrics: (state) => {
      state.qualityMetrics = null;
      state.biasReports = [];
      state.hallucinations = [];
      state.reviews = [];
      state.qualityScore = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Quality Metrics
    builder.addCase(fetchQualityMetrics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchQualityMetrics.fulfilled, (state, action) => {
      state.loading = false;
      state.qualityMetrics = action.payload;
    });
    builder.addCase(fetchQualityMetrics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch quality metrics';
    });

    // Detect Bias
    builder.addCase(detectBias.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(detectBias.fulfilled, (state, action) => {
      state.loading = false;
      state.biasReports = action.payload;
    });
    builder.addCase(detectBias.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to detect bias';
    });

    // Detect Hallucinations
    builder.addCase(detectHallucinations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(detectHallucinations.fulfilled, (state, action) => {
      state.loading = false;
      state.hallucinations = action.payload;
    });
    builder.addCase(detectHallucinations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to detect hallucinations';
    });

    // Submit Review
    builder.addCase(submitReview.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(submitReview.fulfilled, (state, action) => {
      state.loading = false;
      state.reviews.push(action.payload);
    });
    builder.addCase(submitReview.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to submit review';
    });

    // Fetch Reviews
    builder.addCase(fetchReviews.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchReviews.fulfilled, (state, action) => {
      state.loading = false;
      state.reviews = action.payload;
    });
    builder.addCase(fetchReviews.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch reviews';
    });

    // Fetch Pending Reviews
    builder.addCase(fetchPendingReviews.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPendingReviews.fulfilled, (state, action) => {
      state.loading = false;
      state.pendingReviews = action.payload;
    });
    builder.addCase(fetchPendingReviews.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch pending reviews';
    });

    // Calculate Quality Score
    builder.addCase(calculateQualityScore.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(calculateQualityScore.fulfilled, (state, action) => {
      state.loading = false;
      state.qualityScore = action.payload;
    });
    builder.addCase(calculateQualityScore.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to calculate quality score';
    });

    // Fetch Quality Settings
    builder.addCase(fetchQualitySettings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchQualitySettings.fulfilled, (state, action) => {
      state.loading = false;
      state.settings = action.payload;
    });
    builder.addCase(fetchQualitySettings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch quality settings';
    });

    // Update Quality Settings
    builder.addCase(updateQualitySettings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateQualitySettings.fulfilled, (state, action) => {
      state.loading = false;
      state.settings = action.payload;
    });
    builder.addCase(updateQualitySettings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to update quality settings';
    });

    // Fetch Bias Reports
    builder.addCase(fetchBiasReports.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBiasReports.fulfilled, (state, action) => {
      state.loading = false;
      state.biasReports = action.payload;
    });
    builder.addCase(fetchBiasReports.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch bias reports';
    });

    // Fetch Hallucinations
    builder.addCase(fetchHallucinations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchHallucinations.fulfilled, (state, action) => {
      state.loading = false;
      state.hallucinations = action.payload;
    });
    builder.addCase(fetchHallucinations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch hallucinations';
    });
  },
});

export const { clearError, resetMetrics } = aiQualitySlice.actions;
export default aiQualitySlice.reducer;

