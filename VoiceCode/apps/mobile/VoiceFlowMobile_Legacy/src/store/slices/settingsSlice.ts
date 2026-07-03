// VoiceCode Pro Mobile - Settings Slice

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings } from '../../types';

const initialState: AppSettings = {
  recording: {
    defaultLanguage: 'en-US',
    audioQuality: 'high',
    backgroundRecording: false,
    autoStop: {
      enabled: false,
      silenceDuration: 3,
      maxDuration: 3600,
    },
    noiseReduction: true,
  },
  transcription: {
    autoPunctuation: true,
    smartFormatting: true,
    languageDetection: true,
    confidenceThreshold: 70,
    speakerIdentification: false,
  },
  ai: {
    defaultTone: 'professional',
    defaultContext: 'general',
    autoProcess: false,
    removeFillers: true,
    correctGrammar: true,
  },
  appearance: {
    theme: 'auto',
    fontSize: 'medium',
    highContrast: false,
    reduceAnimations: false,
  },
  privacy: {
    saveTranscriptions: true,
    shareAnalytics: false,
    encryption: {
      enabled: false,
    },
  },
  sync: {
    enabled: true,
    frequency: 'realtime',
    wifiOnly: false,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Update recording settings
    updateRecordingSettings: (
      state,
      action: PayloadAction<Partial<AppSettings['recording']>>
    ) => {
      state.recording = { ...state.recording, ...action.payload };
    },

    // Update transcription settings
    updateTranscriptionSettings: (
      state,
      action: PayloadAction<Partial<AppSettings['transcription']>>
    ) => {
      state.transcription = { ...state.transcription, ...action.payload };
    },

    // Update AI settings
    updateAISettings: (state, action: PayloadAction<Partial<AppSettings['ai']>>) => {
      state.ai = { ...state.ai, ...action.payload };
    },

    // Update appearance settings
    updateAppearanceSettings: (
      state,
      action: PayloadAction<Partial<AppSettings['appearance']>>
    ) => {
      state.appearance = { ...state.appearance, ...action.payload };
    },

    // Update privacy settings
    updatePrivacySettings: (
      state,
      action: PayloadAction<Partial<AppSettings['privacy']>>
    ) => {
      state.privacy = { ...state.privacy, ...action.payload };
    },

    // Update sync settings
    updateSyncSettings: (state, action: PayloadAction<Partial<AppSettings['sync']>>) => {
      state.sync = { ...state.sync, ...action.payload };
    },

    // Reset all settings to default
    resetSettings: () => initialState,

    // Reset specific category
    resetRecordingSettings: state => {
      state.recording = initialState.recording;
    },
    resetTranscriptionSettings: state => {
      state.transcription = initialState.transcription;
    },
    resetAISettings: state => {
      state.ai = initialState.ai;
    },
    resetAppearanceSettings: state => {
      state.appearance = initialState.appearance;
    },
    resetPrivacySettings: state => {
      state.privacy = initialState.privacy;
    },
    resetSyncSettings: state => {
      state.sync = initialState.sync;
    },
  },
});

export const {
  updateRecordingSettings,
  updateTranscriptionSettings,
  updateAISettings,
  updateAppearanceSettings,
  updatePrivacySettings,
  updateSyncSettings,
  resetSettings,
  resetRecordingSettings,
  resetTranscriptionSettings,
  resetAISettings,
  resetAppearanceSettings,
  resetPrivacySettings,
  resetSyncSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;

