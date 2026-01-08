/**
 * Real-Time AI Redux Slice
 * Phase 3 Week 10 Day 66-67: Real-Time AI Processing
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getRealTimeAIService,
  RealTimeSession,
  SessionConfig,
  StreamingTranscript,
  LiveSuggestion,
  ActionItemDetection,
  ContextualInsight,
  RealTimeMetrics,
} from '../../services/realTimeAIService';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface RealTimeAIState {
  activeSession: RealTimeSession | null;
  streamingTranscript: StreamingTranscript[];
  liveSuggestions: LiveSuggestion[];
  detectedActionItems: ActionItemDetection[];
  contextualInsights: ContextualInsight[];
  metrics: RealTimeMetrics | null;
  recentSessions: RealTimeSession[];
  isStreaming: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: RealTimeAIState = {
  activeSession: null,
  streamingTranscript: [],
  liveSuggestions: [],
  detectedActionItems: [],
  contextualInsights: [],
  metrics: null,
  recentSessions: [],
  isStreaming: false,
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Start a new real-time AI session
 */
export const startRealTimeSession = createAsyncThunk(
  'realTimeAI/startSession',
  async (config: SessionConfig) => {
    const service = getRealTimeAIService();
    return await service.startRealTimeSession(config);
  }
);

/**
 * Send audio chunk for processing
 */
export const sendAudioChunk = createAsyncThunk(
  'realTimeAI/sendAudioChunk',
  async (audioData: ArrayBuffer) => {
    const service = getRealTimeAIService();
    await service.sendAudioChunk(audioData);
    
    // Return updated data
    return {
      transcript: service.getStreamingTranscription(),
      suggestions: service.getLiveSuggestions(),
      actionItems: service.detectActionItems(),
      insights: service.getContextualInsights(),
    };
  }
);

/**
 * Stop real-time session
 */
export const stopRealTimeSession = createAsyncThunk(
  'realTimeAI/stopSession',
  async () => {
    const service = getRealTimeAIService();
    await service.stopRealTimeSession();
  }
);

/**
 * Fetch live suggestions
 */
export const fetchLiveSuggestions = createAsyncThunk(
  'realTimeAI/fetchSuggestions',
  async () => {
    const service = getRealTimeAIService();
    return service.getLiveSuggestions();
  }
);

/**
 * Fetch contextual insights
 */
export const fetchContextualInsights = createAsyncThunk(
  'realTimeAI/fetchInsights',
  async () => {
    const service = getRealTimeAIService();
    return service.getContextualInsights();
  }
);

/**
 * Fetch real-time metrics
 */
export const fetchRealTimeMetrics = createAsyncThunk(
  'realTimeAI/fetchMetrics',
  async (sessionId: string) => {
    const service = getRealTimeAIService();
    return await service.getRealTimeMetrics(sessionId);
  }
);

/**
 * Apply a suggestion
 */
export const applySuggestion = createAsyncThunk(
  'realTimeAI/applySuggestion',
  async (suggestionId: string) => {
    const service = getRealTimeAIService();
    await service.applySuggestion(suggestionId);
    return suggestionId;
  }
);

/**
 * Confirm an action item
 */
export const confirmActionItem = createAsyncThunk(
  'realTimeAI/confirmActionItem',
  async (actionItemId: string) => {
    const service = getRealTimeAIService();
    await service.confirmActionItem(actionItemId);
    return actionItemId;
  }
);

/**
 * Fetch recent sessions
 */
export const fetchRecentSessions = createAsyncThunk(
  'realTimeAI/fetchRecentSessions',
  async (limit: number = 10) => {
    const service = getRealTimeAIService();
    return await service.getRecentSessions(limit);
  }
);

// ============================================================================
// SLICE
// ============================================================================

const realTimeAISlice = createSlice({
  name: 'realTimeAI',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSession: (state) => {
      state.activeSession = null;
      state.streamingTranscript = [];
      state.liveSuggestions = [];
      state.detectedActionItems = [];
      state.contextualInsights = [];
      state.metrics = null;
      state.isStreaming = false;
    },
  },
  extraReducers: (builder) => {
    // Start Real-Time Session
    builder.addCase(startRealTimeSession.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(startRealTimeSession.fulfilled, (state, action) => {
      state.loading = false;
      state.activeSession = action.payload;
      state.isStreaming = true;
      state.streamingTranscript = [];
      state.liveSuggestions = [];
      state.detectedActionItems = [];
      state.contextualInsights = [];
    });
    builder.addCase(startRealTimeSession.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to start session';
    });

    // Send Audio Chunk
    builder.addCase(sendAudioChunk.fulfilled, (state, action) => {
      state.streamingTranscript = action.payload.transcript;
      state.liveSuggestions = action.payload.suggestions;
      state.detectedActionItems = action.payload.actionItems;
      state.contextualInsights = action.payload.insights;
    });

    // Stop Real-Time Session
    builder.addCase(stopRealTimeSession.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(stopRealTimeSession.fulfilled, (state) => {
      state.loading = false;
      state.isStreaming = false;
    });
    builder.addCase(stopRealTimeSession.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to stop session';
    });

    // Fetch Live Suggestions
    builder.addCase(fetchLiveSuggestions.fulfilled, (state, action) => {
      state.liveSuggestions = action.payload;
    });

    // Fetch Contextual Insights
    builder.addCase(fetchContextualInsights.fulfilled, (state, action) => {
      state.contextualInsights = action.payload;
    });

    // Fetch Real-Time Metrics
    builder.addCase(fetchRealTimeMetrics.fulfilled, (state, action) => {
      state.metrics = action.payload;
    });

    // Apply Suggestion
    builder.addCase(applySuggestion.fulfilled, (state, action) => {
      const suggestion = state.liveSuggestions.find(s => s.id === action.payload);
      if (suggestion) {
        suggestion.is_applied = true;
      }
    });

    // Confirm Action Item
    builder.addCase(confirmActionItem.fulfilled, (state, action) => {
      const actionItem = state.detectedActionItems.find(a => a.id === action.payload);
      if (actionItem) {
        actionItem.is_confirmed = true;
      }
    });

    // Fetch Recent Sessions
    builder.addCase(fetchRecentSessions.fulfilled, (state, action) => {
      state.recentSessions = action.payload;
    });
  },
});

export const { clearError, clearSession } = realTimeAISlice.actions;
export default realTimeAISlice.reducer;

