// VoiceCode Mobile - Recording Slice

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Recording } from '../../types/recording';
import { RecordingState } from '../../types';

interface RecordingSliceState {
  // Current recording state
  currentRecording: RecordingState;
  
  // Recordings list
  recordings: Recording[];
  isLoadingRecordings: boolean;
  
  // Selected recording
  selectedRecording: Recording | null;
  
  // Error
  error: string | null;
}

const initialState: RecordingSliceState = {
  currentRecording: {
    isRecording: false,
    isPaused: false,
    duration: 0,
    volume: 0,
    audioData: [],
  },
  recordings: [],
  isLoadingRecordings: false,
  selectedRecording: null,
  error: null,
};

const recordingSlice = createSlice({
  name: 'recording',
  initialState,
  reducers: {
    // Start recording
    startRecording: state => {
      state.currentRecording.isRecording = true;
      state.currentRecording.isPaused = false;
      state.currentRecording.duration = 0;
      state.currentRecording.audioData = [];
      state.error = null;
    },

    // Pause recording
    pauseRecording: state => {
      state.currentRecording.isPaused = true;
    },

    // Resume recording
    resumeRecording: state => {
      state.currentRecording.isPaused = false;
    },

    // Stop recording
    stopRecording: state => {
      state.currentRecording.isRecording = false;
      state.currentRecording.isPaused = false;
      state.currentRecording.duration = 0;
      state.currentRecording.volume = 0;
      state.currentRecording.audioData = [];
    },

    // Update recording duration
    updateDuration: (state, action: PayloadAction<number>) => {
      state.currentRecording.duration = action.payload;
    },

    // Update volume level
    updateVolume: (state, action: PayloadAction<number>) => {
      state.currentRecording.volume = action.payload;
    },

    // Update audio data (for waveform visualization)
    updateAudioData: (state, action: PayloadAction<number[]>) => {
      state.currentRecording.audioData = action.payload;
    },

    // Load recordings
    loadRecordingsStart: state => {
      state.isLoadingRecordings = true;
      state.error = null;
    },
    loadRecordingsSuccess: (state, action: PayloadAction<Recording[]>) => {
      state.isLoadingRecordings = false;
      state.recordings = action.payload;
    },
    loadRecordingsFailure: (state, action: PayloadAction<string>) => {
      state.isLoadingRecordings = false;
      state.error = action.payload;
    },

    // Add recording
    addRecording: (state, action: PayloadAction<Recording>) => {
      state.recordings.unshift(action.payload);
    },

    // Update recording
    updateRecording: (state, action: PayloadAction<Recording>) => {
      const index = state.recordings.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.recordings[index] = action.payload;
      }
    },

    // Delete recording
    deleteRecording: (state, action: PayloadAction<string>) => {
      state.recordings = state.recordings.filter(r => r.id !== action.payload);
    },

    // Select recording
    selectRecording: (state, action: PayloadAction<Recording | null>) => {
      state.selectedRecording = action.payload;
    },

    // Clear error
    clearError: state => {
      state.error = null;
    },
  },
});

export const {
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  updateDuration,
  updateVolume,
  updateAudioData,
  loadRecordingsStart,
  loadRecordingsSuccess,
  loadRecordingsFailure,
  addRecording,
  updateRecording,
  deleteRecording,
  selectRecording,
  clearError,
} = recordingSlice.actions;

export default recordingSlice.reducer;

