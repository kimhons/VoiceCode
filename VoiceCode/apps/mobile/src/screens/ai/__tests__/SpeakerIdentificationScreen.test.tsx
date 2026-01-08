// VoiceFlow Pro Mobile - SpeakerIdentificationScreen Tests

import { configureStore } from '@reduxjs/toolkit';
import aiReducer, { identifySpeakers, updateSpeaker } from '@/store/slices/aiSlice';

// Mock AIMLService
jest.mock('@/services/AIMLService', () => ({
  __esModule: true,
  default: {
    identifySpeakers: jest.fn(() => Promise.resolve([
      {
        id: 'speaker-1',
        transcriptId: 'test-transcript-id',
        label: 'Speaker 1',
        color: '#667eea',
        segmentCount: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'speaker-2',
        transcriptId: 'test-transcript-id',
        label: 'Speaker 2',
        color: '#f59e0b',
        segmentCount: 3,
        createdAt: new Date().toISOString(),
      },
    ])),
    updateSpeaker: jest.fn((id, label, color) => Promise.resolve({
      id,
      transcriptId: 'test-transcript-id',
      label,
      color,
      segmentCount: 5,
      createdAt: new Date().toISOString(),
    })),
  },
}));

describe('SpeakerIdentificationScreen - Redux Logic', () => {
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

  it('handles identifySpeakers.pending', () => {
    store.dispatch({
      type: identifySpeakers.pending.type,
      meta: { arg: { transcriptId: 'test-id', transcriptText: 'test' } },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id']).toBeDefined();
    expect(state.ai.transcripts['test-id'].speakers.loading).toBe(true);
    expect(state.ai.transcripts['test-id'].speakers.error).toBe(null);
  });

  it('handles identifySpeakers.fulfilled', () => {
    const mockSpeakers = [
      {
        id: 'speaker-1',
        transcriptId: 'test-id',
        label: 'Speaker 1',
        color: '#667eea',
        segmentCount: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'speaker-2',
        transcriptId: 'test-id',
        label: 'Speaker 2',
        color: '#f59e0b',
        segmentCount: 3,
        createdAt: new Date().toISOString(),
      },
    ];

    store.dispatch({
      type: identifySpeakers.fulfilled.type,
      payload: {
        transcriptId: 'test-id',
        speakers: mockSpeakers,
      },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id'].speakers.data).toEqual(mockSpeakers);
    expect(state.ai.transcripts['test-id'].speakers.loading).toBe(false);
    expect(state.ai.transcripts['test-id'].speakers.data).toHaveLength(2);
  });

  it('handles identifySpeakers.rejected', () => {
    store.dispatch({
      type: identifySpeakers.rejected.type,
      error: { message: 'Failed to identify speakers' },
      meta: { arg: { transcriptId: 'test-id' } },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id'].speakers.loading).toBe(false);
    expect(state.ai.transcripts['test-id'].speakers.error).toBe('Failed to identify speakers');
  });

  it('handles updateSpeaker.fulfilled', () => {
    // First add speakers
    const mockSpeakers = [
      {
        id: 'speaker-1',
        transcriptId: 'test-id',
        label: 'Speaker 1',
        color: '#667eea',
        segmentCount: 5,
        createdAt: new Date().toISOString(),
      },
    ];

    store.dispatch({
      type: identifySpeakers.fulfilled.type,
      payload: {
        transcriptId: 'test-id',
        speakers: mockSpeakers,
      },
    });

    // Then update speaker
    const updatedSpeaker = {
      ...mockSpeakers[0],
      label: 'John Doe',
      color: '#10b981',
    };

    store.dispatch({
      type: updateSpeaker.fulfilled.type,
      payload: {
        transcriptId: 'test-id',
        speaker: updatedSpeaker,
      },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id'].speakers.data[0].label).toBe('John Doe');
    expect(state.ai.transcripts['test-id'].speakers.data[0].color).toBe('#10b981');
  });
});

