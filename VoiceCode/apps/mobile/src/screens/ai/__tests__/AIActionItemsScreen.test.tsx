// VoiceCode Mobile - AIActionItemsScreen Tests

import { configureStore } from '@reduxjs/toolkit';
import aiReducer, { extractActionItems, updateActionItem } from '@/store/slices/aiSlice';

// Mock AIMLService
jest.mock('@/services/AIMLService', () => ({
  __esModule: true,
  default: {
    extractActionItems: jest.fn(() => Promise.resolve([
      {
        id: 'action-1',
        transcriptId: 'test-transcript-id',
        text: 'Follow up with client',
        completed: false,
        priority: 'high',
        confidence: 0.9,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'action-2',
        transcriptId: 'test-transcript-id',
        text: 'Review proposal',
        completed: false,
        priority: 'medium',
        confidence: 0.85,
        createdAt: new Date().toISOString(),
      },
    ])),
    updateActionItem: jest.fn((id, updates) => Promise.resolve({
      id,
      transcriptId: 'test-transcript-id',
      text: 'Follow up with client',
      completed: updates.completed ?? false,
      priority: updates.priority ?? 'medium',
      dueDate: updates.dueDate,
      confidence: 0.9,
      createdAt: new Date().toISOString(),
      completedAt: updates.completed ? new Date().toISOString() : undefined,
    })),
  },
}));

describe('AIActionItemsScreen - Redux Logic', () => {
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

  it('handles extractActionItems.pending', () => {
    store.dispatch({
      type: extractActionItems.pending.type,
      meta: { arg: { transcriptId: 'test-id', transcriptText: 'test' } },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id']).toBeDefined();
    expect(state.ai.transcripts['test-id'].actionItems.loading).toBe(true);
    expect(state.ai.transcripts['test-id'].actionItems.error).toBe(null);
  });

  it('handles extractActionItems.fulfilled', () => {
    const mockActionItems = [
      {
        id: 'action-1',
        transcriptId: 'test-id',
        text: 'Follow up with client',
        completed: false,
        priority: 'high' as const,
        confidence: 0.9,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'action-2',
        transcriptId: 'test-id',
        text: 'Review proposal',
        completed: false,
        priority: 'medium' as const,
        confidence: 0.85,
        createdAt: new Date().toISOString(),
      },
    ];

    store.dispatch({
      type: extractActionItems.fulfilled.type,
      payload: {
        transcriptId: 'test-id',
        actionItems: mockActionItems,
      },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id'].actionItems.data).toEqual(mockActionItems);
    expect(state.ai.transcripts['test-id'].actionItems.loading).toBe(false);
    expect(state.ai.transcripts['test-id'].actionItems.data).toHaveLength(2);
  });

  it('handles extractActionItems.rejected', () => {
    store.dispatch({
      type: extractActionItems.rejected.type,
      error: { message: 'Failed to extract action items' },
      meta: { arg: { transcriptId: 'test-id' } },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id'].actionItems.loading).toBe(false);
    expect(state.ai.transcripts['test-id'].actionItems.error).toBe('Failed to extract action items');
  });

  it('handles updateActionItem.fulfilled - mark as complete', () => {
    // First add action items
    const mockActionItems = [
      {
        id: 'action-1',
        transcriptId: 'test-id',
        text: 'Follow up with client',
        completed: false,
        priority: 'high' as const,
        confidence: 0.9,
        createdAt: new Date().toISOString(),
      },
    ];

    store.dispatch({
      type: extractActionItems.fulfilled.type,
      payload: {
        transcriptId: 'test-id',
        actionItems: mockActionItems,
      },
    });

    // Then update it
    const updatedItem = {
      ...mockActionItems[0],
      completed: true,
      completedAt: new Date().toISOString(),
    };

    store.dispatch({
      type: updateActionItem.fulfilled.type,
      payload: {
        transcriptId: 'test-id',
        actionItem: updatedItem,
      },
    });

    const state = store.getState();
    expect(state.ai.transcripts['test-id'].actionItems.data[0].completed).toBe(true);
  });
});

