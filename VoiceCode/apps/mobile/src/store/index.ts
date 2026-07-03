// VoiceCode Mobile - Redux Store

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import slices
import authReducer from './slices/authSlice';
import recordingReducer from './slices/recordingSlice';
import settingsReducer from './slices/settingsSlice';
import aiReducer from './slices/aiSlice';
import searchReducer from './slices/searchSlice';
import exportReducer from './slices/exportSlice';
import organizationReducer from './slices/organizationSlice';
import workspaceReducer from './slices/workspaceSlice';
import securityReducer from './slices/securitySlice';
import complianceReducer from './slices/complianceSlice';
import analyticsReducer from './slices/analyticsSlice';
import reportReducer from './slices/reportSlice';
import aiModelReducer from './slices/aiModelSlice';
import aiTrainingReducer from './slices/aiTrainingSlice';
import realTimeAIReducer from './slices/realTimeAISlice';
import contextEngineReducer from './slices/contextEngineSlice';
import automationReducer from './slices/automationSlice';
import workflowOptimizationReducer from './slices/workflowOptimizationSlice';
import aiQualityReducer from './slices/aiQualitySlice';
import productivityReducer from './slices/productivitySlice';
import teamPerformanceReducer from './slices/teamPerformanceSlice';
import subscriptionReducer from './slices/subscriptionSlice';
// import transcriptionReducer from './slices/transcriptionSlice';
// import syncReducer from './slices/syncSlice';

// Import API (will be created later)
// import { baseApi } from './api/baseApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recording: recordingReducer,
    settings: settingsReducer,
    ai: aiReducer,
    search: searchReducer,
    export: exportReducer,
    organization: organizationReducer,
    workspace: workspaceReducer,
    security: securityReducer,
    compliance: complianceReducer,
    analytics: analyticsReducer,
    report: reportReducer,
    aiModel: aiModelReducer,
    aiTraining: aiTrainingReducer,
    realTimeAI: realTimeAIReducer,
    contextEngine: contextEngineReducer,
    automation: automationReducer,
    workflowOptimization: workflowOptimizationReducer,
    aiQuality: aiQualityReducer,
    productivity: productivityReducer,
    teamPerformance: teamPerformanceReducer,
    subscription: subscriptionReducer,
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

