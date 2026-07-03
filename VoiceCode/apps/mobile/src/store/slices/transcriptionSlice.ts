/**
 * Transcription Slice
 * Manages transcription state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Transcription {
  id: string;
  user_id: string;
  audio_url: string;
  text: string;
  duration: number;
  language?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

interface TranscriptionState {
  transcriptions: Transcription[];
  currentTranscription: Transcription | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

const initialState: TranscriptionState = {
  transcriptions: [],
  currentTranscription: null,
  loading: false,
  error: null,
  hasMore: true,
  page: 0,
};

const transcriptionSlice = createSlice({
  name: 'transcription',
  initialState,
  reducers: {
    setTranscriptions: (state, action: PayloadAction<Transcription[]>) => {
      state.transcriptions = action.payload;
      state.loading = false;
      state.error = null;
    },
    addTranscription: (state, action: PayloadAction<Transcription>) => {
      state.transcriptions.unshift(action.payload);
    },
    updateTranscription: (state, action: PayloadAction<Transcription>) => {
      const index = state.transcriptions.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.transcriptions[index] = action.payload;
      }
      if (state.currentTranscription?.id === action.payload.id) {
        state.currentTranscription = action.payload;
      }
    },
    deleteTranscription: (state, action: PayloadAction<string>) => {
      state.transcriptions = state.transcriptions.filter((t) => t.id !== action.payload);
      if (state.currentTranscription?.id === action.payload) {
        state.currentTranscription = null;
      }
    },
    setCurrentTranscription: (state, action: PayloadAction<Transcription | null>) => {
      state.currentTranscription = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    appendTranscriptions: (state, action: PayloadAction<Transcription[]>) => {
      state.transcriptions.push(...action.payload);
      state.hasMore = action.payload.length > 0;
      state.page += 1;
      state.loading = false;
    },
    resetPagination: (state) => {
      state.page = 0;
      state.hasMore = true;
    },
  },
});

export const {
  setTranscriptions,
  addTranscription,
  updateTranscription,
  deleteTranscription,
  setCurrentTranscription,
  setLoading,
  setError,
  clearError,
  appendTranscriptions,
  resetPagination,
} = transcriptionSlice.actions;

export default transcriptionSlice.reducer;

