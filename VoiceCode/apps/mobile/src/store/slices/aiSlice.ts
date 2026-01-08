// VoiceFlow Pro Mobile - AI Features Redux Slice

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AIMLService, { AISummary, AIKeyPoints, ActionItem, Speaker } from '@/services/AIMLService';

/**
 * AI state for a single transcript
 */
interface TranscriptAIState {
  summary: {
    data: AISummary | null;
    loading: boolean;
    error: string | null;
  };
  keyPoints: {
    data: AIKeyPoints | null;
    loading: boolean;
    error: string | null;
  };
  actionItems: {
    data: ActionItem[];
    loading: boolean;
    error: string | null;
  };
  speakers: {
    data: Speaker[];
    loading: boolean;
    error: string | null;
  };
}

/**
 * Overall AI state
 */
interface AIState {
  transcripts: Record<string, TranscriptAIState>;
}

const initialState: AIState = {
  transcripts: {},
};

/**
 * Get initial transcript state
 */
const getInitialTranscriptState = (): TranscriptAIState => ({
  summary: { data: null, loading: false, error: null },
  keyPoints: { data: null, loading: false, error: null },
  actionItems: { data: [], loading: false, error: null },
  speakers: { data: [], loading: false, error: null },
});

/**
 * Async thunk: Generate summary
 */
export const generateSummary = createAsyncThunk(
  'ai/generateSummary',
  async ({ transcriptId, transcriptText }: { transcriptId: string; transcriptText: string }) => {
    const summary = await AIMLService.generateSummary(transcriptId, transcriptText);
    return { transcriptId, summary };
  }
);

/**
 * Async thunk: Extract key points
 */
export const extractKeyPoints = createAsyncThunk(
  'ai/extractKeyPoints',
  async ({ transcriptId, transcriptText }: { transcriptId: string; transcriptText: string }) => {
    const keyPoints = await AIMLService.extractKeyPoints(transcriptId, transcriptText);
    return { transcriptId, keyPoints };
  }
);

/**
 * Async thunk: Extract action items
 */
export const extractActionItems = createAsyncThunk(
  'ai/extractActionItems',
  async ({ transcriptId, transcriptText }: { transcriptId: string; transcriptText: string }) => {
    const actionItems = await AIMLService.extractActionItems(transcriptId, transcriptText);
    return { transcriptId, actionItems };
  }
);

/**
 * Async thunk: Identify speakers
 */
export const identifySpeakers = createAsyncThunk(
  'ai/identifySpeakers',
  async ({ transcriptId, transcriptText }: { transcriptId: string; transcriptText: string }) => {
    const speakers = await AIMLService.identifySpeakers(transcriptId, transcriptText);
    return { transcriptId, speakers };
  }
);

/**
 * Async thunk: Update action item
 */
export const updateActionItem = createAsyncThunk(
  'ai/updateActionItem',
  async ({ transcriptId, id, updates }: { transcriptId: string; id: string; updates: Partial<ActionItem> }) => {
    const actionItem = await AIMLService.updateActionItem(id, updates);
    return { transcriptId, actionItem };
  }
);

/**
 * Async thunk: Update speaker
 */
export const updateSpeaker = createAsyncThunk(
  'ai/updateSpeaker',
  async ({ transcriptId, id, label, color }: { transcriptId: string; id: string; label: string; color: string }) => {
    const speaker = await AIMLService.updateSpeaker(id, label, color);
    return { transcriptId, speaker };
  }
);

/**
 * AI Slice
 */
const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearTranscriptAI: (state, action: PayloadAction<string>) => {
      delete state.transcripts[action.payload];
    },
  },
  extraReducers: (builder) => {
    // Generate Summary
    builder.addCase(generateSummary.pending, (state, action) => {
      const transcriptId = action.meta.arg.transcriptId;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      state.transcripts[transcriptId].summary.loading = true;
      state.transcripts[transcriptId].summary.error = null;
    });
    builder.addCase(generateSummary.fulfilled, (state, action) => {
      const { transcriptId, summary } = action.payload;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      state.transcripts[transcriptId].summary.data = summary;
      state.transcripts[transcriptId].summary.loading = false;
    });
    builder.addCase(generateSummary.rejected, (state, action) => {
      const transcriptId = action.meta.arg.transcriptId;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      state.transcripts[transcriptId].summary.loading = false;
      state.transcripts[transcriptId].summary.error = action.error.message || 'Failed to generate summary';
    });

    // Extract Key Points
    builder.addCase(extractKeyPoints.pending, (state, action) => {
      const transcriptId = action.meta.arg.transcriptId;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      state.transcripts[transcriptId].keyPoints.loading = true;
      state.transcripts[transcriptId].keyPoints.error = null;
    });
    builder.addCase(extractKeyPoints.fulfilled, (state, action) => {
      const { transcriptId, keyPoints } = action.payload;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      state.transcripts[transcriptId].keyPoints.data = keyPoints;
      state.transcripts[transcriptId].keyPoints.loading = false;
    });
    builder.addCase(extractKeyPoints.rejected, (state, action) => {
      const transcriptId = action.meta.arg.transcriptId;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      state.transcripts[transcriptId].keyPoints.loading = false;
      state.transcripts[transcriptId].keyPoints.error = action.error.message || 'Failed to extract key points';
    });

    // Extract Action Items
    builder.addCase(extractActionItems.pending, (state, action) => {
      const transcriptId = action.meta.arg.transcriptId;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      state.transcripts[transcriptId].actionItems.loading = true;
      state.transcripts[transcriptId].actionItems.error = null;
    });
    builder.addCase(extractActionItems.fulfilled, (state, action) => {
      const { transcriptId, actionItems } = action.payload;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      state.transcripts[transcriptId].actionItems.data = actionItems;
      state.transcripts[transcriptId].actionItems.loading = false;
    });
    builder.addCase(extractActionItems.rejected, (state, action) => {
      const transcriptId = action.meta.arg.transcriptId;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      state.transcripts[transcriptId].actionItems.loading = false;
      state.transcripts[transcriptId].actionItems.error = action.error.message || 'Failed to extract action items';
    });

    // Identify Speakers
    builder.addCase(identifySpeakers.pending, (state, action) => {
      const transcriptId = action.meta.arg.transcriptId;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      state.transcripts[transcriptId].speakers.loading = true;
      state.transcripts[transcriptId].speakers.error = null;
    });
    builder.addCase(identifySpeakers.fulfilled, (state, action) => {
      const { transcriptId, speakers } = action.payload;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      state.transcripts[transcriptId].speakers.data = speakers;
      state.transcripts[transcriptId].speakers.loading = false;
    });
    builder.addCase(identifySpeakers.rejected, (state, action) => {
      const transcriptId = action.meta.arg.transcriptId;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      state.transcripts[transcriptId].speakers.loading = false;
      state.transcripts[transcriptId].speakers.error = action.error.message || 'Failed to identify speakers';
    });

    // Update Action Item
    builder.addCase(updateActionItem.fulfilled, (state, action) => {
      const { transcriptId, actionItem } = action.payload;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      const index = state.transcripts[transcriptId].actionItems.data.findIndex(
        (item) => item.id === actionItem.id
      );
      if (index !== -1) {
        state.transcripts[transcriptId].actionItems.data[index] = actionItem;
      }
    });

    // Update Speaker
    builder.addCase(updateSpeaker.fulfilled, (state, action) => {
      const { transcriptId, speaker } = action.payload;
      if (!state.transcripts[transcriptId]) {
        state.transcripts[transcriptId] = getInitialTranscriptState();
      }
      const index = state.transcripts[transcriptId].speakers.data.findIndex(
        (s) => s.id === speaker.id
      );
      if (index !== -1) {
        state.transcripts[transcriptId].speakers.data[index] = speaker;
      }
    });
  },
});

export const { clearTranscriptAI } = aiSlice.actions;
export default aiSlice.reducer;

