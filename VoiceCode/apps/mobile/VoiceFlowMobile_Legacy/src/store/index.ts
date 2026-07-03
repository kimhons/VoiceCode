// VoiceCode Pro Mobile - Redux Store

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import slices
import authReducer from './slices/authSlice';
import recordingReducer from './slices/recordingSlice';
import settingsReducer from './slices/settingsSlice';
// import transcriptionReducer from './slices/transcriptionSlice';
// import syncReducer from './slices/syncSlice';

// Import API (will be created later)
// import { baseApi } from './api/baseApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recording: recordingReducer,
    settings: settingsReducer,
    // transcription: transcriptionReducer,
    // sync: syncReducer,
    // [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['recording/setAudioData'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.audioData'],
        // Ignore these paths in the state
        ignoredPaths: ['recording.audioData'],
      },
    }),
  // .concat(baseApi.middleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

