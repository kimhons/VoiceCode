// VoiceFlow Pro Mobile - AIKeyPointsScreen Tests

import { configureStore } from '@reduxjs/toolkit';
import aiReducer, { extractKeyPoints } from '@/store/slices/aiSlice';

// Mock AIMLService
jest.mock('@/services/AIMLService', () => ({
  __esModule: true,
  default: {
    extractKeyPoints: jest.fn(() => Promise.resolve({
      id: 'keypoints-1',
      transcriptId: 'test-transcript-id',
      keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
      confidence: 0.92,
      createdAt: new Date().toISOString(),
    })),
  },
}));

describe('AIKeyPointsScreen - Redux Logic', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        ai: aiReducer,
      },
    });
    jest.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const state = store.getState();
    expect(state.ai.transcripts).toEqual({});
  });

  it('handles extractKeyPoints.pending', () => {
    store.dispatch({
      type: extractKeyPoints.pending.type,
      meta: { arg: { transcriptId: 'test-id', transcriptText: 'test' } },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id']).toBeDefined();
    expect(state.ai.transcripts['test-id'].keyPoints.loading).toBe(true);
    expect(state.ai.transcripts['test-id'].keyPoints.error).toBe(null);
  });

  it('handles extractKeyPoints.fulfilled', () => {
    const mockKeyPoints = {
      id: 'keypoints-1',
      transcriptId: 'test-id',
      keyPoints: ['Key point 1', 'Key point 2', 'Key point 3'],
      confidence: 0.92,
      createdAt: new Date().toISOString(),
    };

    store.dispatch({
      type: extractKeyPoints.fulfilled.type,
      payload: {
        transcriptId: 'test-id',
        keyPoints: mockKeyPoints,
      },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id'].keyPoints.data).toEqual(mockKeyPoints);
    expect(state.ai.transcripts['test-id'].keyPoints.loading).toBe(false);
    expect(state.ai.transcripts['test-id'].keyPoints.data?.keyPoints).toHaveLength(3);
  });

  it('handles extractKeyPoints.rejected', () => {
    store.dispatch({
      type: extractKeyPoints.rejected.type,
      error: { message: 'Failed to extract key points' },
      meta: { arg: { transcriptId: 'test-id' } },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id'].keyPoints.loading).toBe(false);
    expect(state.ai.transcripts['test-id'].keyPoints.error).toBe('Failed to extract key points');
  });

  it('handles multiple key points', () => {
    const mockKeyPoints = {
      id: 'keypoints-1',
      transcriptId: 'test-id',
      keyPoints: [
        'First key point',
        'Second key point',
        'Third key point',
        'Fourth key point',
        'Fifth key point',
      ],
      confidence: 0.88,
      createdAt: new Date().toISOString(),
    };

    store.dispatch({
      type: extractKeyPoints.fulfilled.type,
      payload: {
        transcriptId: 'test-id',
        keyPoints: mockKeyPoints,
      },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id'].keyPoints.data?.keyPoints).toHaveLength(5);
  });

  it('stores confidence score correctly', () => {
    const mockKeyPoints = {
      id: 'keypoints-1',
      transcriptId: 'test-id',
      keyPoints: ['Point 1'],
      confidence: 0.95,
      createdAt: new Date().toISOString(),
    };

    store.dispatch({
      type: extractKeyPoints.fulfilled.type,
      payload: {
        transcriptId: 'test-id',
        keyPoints: mockKeyPoints,
      },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id'].keyPoints.data?.confidence).toBe(0.95);
  });
});

