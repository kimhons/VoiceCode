/**
 * VoiceFlow Pro - Redux Store Configuration
 */

import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// Recording state
interface Recording {
  id: string;
  title: string;
  duration: number;
  createdAt: string;
  transcription?: string;
  language: string;
}

interface RecordingsState {
  recordings: Recording[];
  currentRecording: Recording | null;
  isRecording: boolean;
  isTranscribing: boolean;
}

const initialRecordingsState: RecordingsState = {
  recordings: [],
  currentRecording: null,
  isRecording: false,
  isTranscribing: false,
};

const recordingsSlice = createSlice({
  name: 'recordings',
  initialState: initialRecordingsState,
  reducers: {
    startRecording: (state) => {
      state.isRecording = true;
    },
    stopRecording: (state) => {
      state.isRecording = false;
    },
    addRecording: (state, action: PayloadAction<Recording>) => {
      state.recordings.unshift(action.payload);
    },
    setCurrentRecording: (state, action: PayloadAction<Recording | null>) => {
      state.currentRecording = action.payload;
    },
    updateTranscription: (state, action: PayloadAction<{ id: string; transcription: string }>) => {
      const recording = state.recordings.find(r => r.id === action.payload.id);
      if (recording) {
        recording.transcription = action.payload.transcription;
      }
    },
    deleteRecording: (state, action: PayloadAction<string>) => {
      state.recordings = state.recordings.filter(r => r.id !== action.payload);
    },
    setTranscribing: (state, action: PayloadAction<boolean>) => {
      state.isTranscribing = action.payload;
    },
  },
});

// User state
interface UserState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  subscription: 'free' | 'pro' | 'enterprise';
}

const initialUserState: UserState = {
  isAuthenticated: false,
  user: null,
  subscription: 'free',
};

const userSlice = createSlice({
  name: 'user',
  initialState: initialUserState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState['user']>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setSubscription: (state, action: PayloadAction<UserState['subscription']>) => {
      state.subscription = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.subscription = 'free';
    },
  },
});

// Settings state
interface SettingsState {
  language: string;
  autoTranscribe: boolean;
  darkMode: boolean;
  audioQuality: 'low' | 'medium' | 'high';
}

const initialSettingsState: SettingsState = {
  language: 'en-US',
  autoTranscribe: true,
  darkMode: false,
  audioQuality: 'high',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialSettingsState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setAutoTranscribe: (state, action: PayloadAction<boolean>) => {
      state.autoTranscribe = action.payload;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
    setAudioQuality: (state, action: PayloadAction<SettingsState['audioQuality']>) => {
      state.audioQuality = action.payload;
    },
  },
});

// Configure store
export const store = configureStore({
  reducer: {
    recordings: recordingsSlice.reducer,
    user: userSlice.reducer,
    settings: settingsSlice.reducer,
  },
});

// Export actions
export const { startRecording, stopRecording, addRecording, setCurrentRecording, updateTranscription, deleteRecording, setTranscribing } = recordingsSlice.actions;
export const { setUser, setSubscription, logout } = userSlice.actions;
export const { setLanguage, setAutoTranscribe, setDarkMode, setAudioQuality } = settingsSlice.actions;

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

