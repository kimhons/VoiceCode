/**
 * Context Engine Redux Slice
 * Phase 3 Week 10 Day 66-67: Real-Time AI Processing
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getContextEngineService,
  ContextAnalysis,
  Topic,
  SentimentAnalysis,
  Entity,
  Relationship,
  Intent,
  ContextSummary,
} from '../../services/contextEngineService';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface ContextEngineState {
  currentContext: ContextAnalysis | null;
  detectedTopics: Topic[];
  sentimentAnalysis: SentimentAnalysis | null;
  extractedEntities: Entity[];
  relationships: Relationship[];
  intents: Intent[];
  contextSummary: ContextSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: ContextEngineState = {
  currentContext: null,
  detectedTopics: [],
  sentimentAnalysis: null,
  extractedEntities: [],
  relationships: [],
  intents: [],
  contextSummary: null,
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Analyze context from text
 */
export const analyzeContext = createAsyncThunk(
  'contextEngine/analyzeContext',
  async ({ text, sessionId }: { text: string; sessionId?: string }) => {
    const service = getContextEngineService();
    return await service.analyzeContext(text, sessionId);
  }
);

/**
 * Detect topics in text
 */
export const detectTopics = createAsyncThunk(
  'contextEngine/detectTopics',
  async (text: string) => {
    const service = getContextEngineService();
    return await service.detectTopics(text);
  }
);

/**
 * Analyze sentiment
 */
export const analyzeSentiment = createAsyncThunk(
  'contextEngine/analyzeSentiment',
  async (text: string) => {
    const service = getContextEngineService();
    return await service.analyzeSentiment(text);
  }
);

/**
 * Extract entities
 */
export const extractEntities = createAsyncThunk(
  'contextEngine/extractEntities',
  async (text: string) => {
    const service = getContextEngineService();
    return await service.extractEntities(text);
  }
);

/**
 * Map relationships
 */
export const mapRelationships = createAsyncThunk(
  'contextEngine/mapRelationships',
  async (entities: Entity[]) => {
    const service = getContextEngineService();
    return await service.mapRelationships(entities);
  }
);

/**
 * Detect intent
 */
export const detectIntent = createAsyncThunk(
  'contextEngine/detectIntent',
  async (text: string) => {
    const service = getContextEngineService();
    return await service.detectIntent(text);
  }
);

/**
 * Get context summary
 */
export const getContextSummary = createAsyncThunk(
  'contextEngine/getContextSummary',
  async (sessionId: string) => {
    const service = getContextEngineService();
    return await service.getContextSummary(sessionId);
  }
);

// ============================================================================
// SLICE
// ============================================================================

const contextEngineSlice = createSlice({
  name: 'contextEngine',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearContext: (state) => {
      state.currentContext = null;
      state.detectedTopics = [];
      state.sentimentAnalysis = null;
      state.extractedEntities = [];
      state.relationships = [];
      state.intents = [];
      state.contextSummary = null;
    },
  },
  extraReducers: (builder) => {
    // Analyze Context
    builder.addCase(analyzeContext.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(analyzeContext.fulfilled, (state, action) => {
      state.loading = false;
      state.currentContext = action.payload;
      state.detectedTopics = action.payload.topics;
      state.sentimentAnalysis = action.payload.sentiment;
      state.extractedEntities = action.payload.entities;
      state.relationships = action.payload.relationships;
      state.intents = action.payload.intents;
    });
    builder.addCase(analyzeContext.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to analyze context';
    });

    // Detect Topics
    builder.addCase(detectTopics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(detectTopics.fulfilled, (state, action) => {
      state.loading = false;
      state.detectedTopics = action.payload;
    });
    builder.addCase(detectTopics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to detect topics';
    });

    // Analyze Sentiment
    builder.addCase(analyzeSentiment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(analyzeSentiment.fulfilled, (state, action) => {
      state.loading = false;
      state.sentimentAnalysis = action.payload;
    });
    builder.addCase(analyzeSentiment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to analyze sentiment';
    });

    // Extract Entities
    builder.addCase(extractEntities.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(extractEntities.fulfilled, (state, action) => {
      state.loading = false;
      state.extractedEntities = action.payload;
    });
    builder.addCase(extractEntities.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to extract entities';
    });

    // Map Relationships
    builder.addCase(mapRelationships.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(mapRelationships.fulfilled, (state, action) => {
      state.loading = false;
      state.relationships = action.payload;
    });
    builder.addCase(mapRelationships.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to map relationships';
    });

    // Detect Intent
    builder.addCase(detectIntent.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(detectIntent.fulfilled, (state, action) => {
      state.loading = false;
      state.intents = action.payload;
    });
    builder.addCase(detectIntent.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to detect intent';
    });

    // Get Context Summary
    builder.addCase(getContextSummary.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getContextSummary.fulfilled, (state, action) => {
      state.loading = false;
      state.contextSummary = action.payload;
    });
    builder.addCase(getContextSummary.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to get context summary';
    });
  },
});

export const { clearError, clearContext } = contextEngineSlice.actions;
export default contextEngineSlice.reducer;

