// VoiceFlow Pro Mobile - AISummaryScreen Tests

import { configureStore } from '@reduxjs/toolkit';
import aiReducer, { generateSummary } from '@/store/slices/aiSlice';

// Mock AIMLService
jest.mock('@/services/AIMLService', () => ({
  __esModule: true,
  default: {
    generateSummary: jest.fn(() => Promise.resolve({
      id: 'summary-1',
      transcriptId: 'test-transcript-id',
      summaryText: 'This is a test summary.',
      confidence: 0.95,
      createdAt: new Date().toISOString(),
    })),
  },
}));

describe('AISummaryScreen - Redux Logic', () => {
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

  it('handles generateSummary.pending', () => {
    store.dispatch({
      type: generateSummary.pending.type,
      meta: { arg: { transcriptId: 'test-id', transcriptText: 'test' } },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id']).toBeDefined();
    expect(state.ai.transcripts['test-id'].summary.loading).toBe(true);
    expect(state.ai.transcripts['test-id'].summary.error).toBe(null);
  });

  it('handles generateSummary.fulfilled', () => {
    const mockSummary = {
      id: 'summary-1',
      transcriptId: 'test-id',
      summaryText: 'This is a test summary.',
      confidence: 0.95,
      createdAt: new Date().toISOString(),
    };

    store.dispatch({
      type: generateSummary.fulfilled.type,
      payload: {
        transcriptId: 'test-id',
        summary: mockSummary,
      },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id'].summary.data).toEqual(mockSummary);
    expect(state.ai.transcripts['test-id'].summary.loading).toBe(false);
  });

  it('handles generateSummary.rejected', () => {
    store.dispatch({
      type: generateSummary.rejected.type,
      error: { message: 'Failed to generate summary' },
      meta: { arg: { transcriptId: 'test-id' } },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id'].summary.loading).toBe(false);
    expect(state.ai.transcripts['test-id'].summary.error).toBe('Failed to generate summary');
  });

  it('clears transcript AI data', () => {
    // First add some data
    store.dispatch({
      type: generateSummary.fulfilled.type,
      payload: {
        transcriptId: 'test-id',
        summary: {
          id: 'summary-1',
          transcriptId: 'test-id',
          summaryText: 'Test',
          confidence: 0.95,
          createdAt: new Date().toISOString(),
        },
      },
    });

    // Then clear it
    store.dispatch({
      type: 'ai/clearTranscriptAI',
      payload: 'test-id',
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id']).toBeUndefined();
  });
});

