// VoiceFlow Pro Mobile - TagManagementScreen Tests

import searchReducer, {
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from '../../../store/slices/searchSlice';

describe('TagManagementScreen - Redux Logic', () => {
  const initialState = {
    results: [],
    searchLoading: false,
    searchError: null,
    tags: [],
    tagsLoading: false,
    tagsError: null,
    folders: [],
    foldersLoading: false,
    foldersError: null,
    filters: {
      sortBy: 'date' as const,
      sortOrder: 'desc' as const,
    },
  };

  it('initializes with empty tags', () => {
    const state = searchReducer(undefined, { type: 'unknown' });
    expect(state.tags).toEqual([]);
    expect(state.tagsLoading).toBe(false);
    expect(state.tagsError).toBeNull();
  });

  it('handles getTags.pending', () => {
    const action = { type: getTags.pending.type };
    const state = searchReducer(initialState, action);
    expect(state.tagsLoading).toBe(true);
    expect(state.tagsError).toBeNull();
  });

  it('handles getTags.fulfilled', () => {
    const mockTags = [
      {
        id: '1',
        userId: 'user1',
        name: 'Meeting',
        color: '#667eea',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        transcriptCount: 5,
      },
      {
        id: '2',
        userId: 'user1',
        name: 'Personal',
        color: '#f59e0b',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        transcriptCount: 3,
      },
    ];

    const action = {
      type: getTags.fulfilled.type,
      payload: mockTags,
    };

    const state = searchReducer(initialState, action);
    expect(state.tagsLoading).toBe(false);
    expect(state.tags).toEqual(mockTags);
    expect(state.tags).toHaveLength(2);
  });

  it('handles getTags.rejected', () => {
    const action = {
      type: getTags.rejected.type,
      error: { message: 'Failed to fetch tags' },
    };

    const state = searchReducer(initialState, action);
    expect(state.tagsLoading).toBe(false);
    expect(state.tagsError).toBe('Failed to fetch tags');
  });

  it('handles createTag.fulfilled', () => {
    const newTag = {
      id: '3',
      userId: 'user1',
      name: 'Work',
      color: '#10b981',
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    };

    const action = {
      type: createTag.fulfilled.type,
      payload: newTag,
    };

    const state = searchReducer(initialState, action);
    expect(state.tags).toHaveLength(1);
    expect(state.tags[0]).toEqual(newTag);
  });

  it('handles updateTag.fulfilled', () => {
    const existingTag = {
      id: '1',
      userId: 'user1',
      name: 'Meeting',
      color: '#667eea',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const stateWithTag = {
      ...initialState,
      tags: [existingTag],
    };

    const updatedTag = {
      ...existingTag,
      name: 'Team Meeting',
      color: '#ef4444',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    const action = {
      type: updateTag.fulfilled.type,
      payload: updatedTag,
    };

    const state = searchReducer(stateWithTag, action);
    expect(state.tags).toHaveLength(1);
    expect(state.tags[0].name).toBe('Team Meeting');
    expect(state.tags[0].color).toBe('#ef4444');
  });

  it('handles deleteTag.fulfilled', () => {
    const stateWithTags = {
      ...initialState,
      tags: [
        {
          id: '1',
          userId: 'user1',
          name: 'Meeting',
          color: '#667eea',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          userId: 'user1',
          name: 'Personal',
          color: '#f59e0b',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ],
    };

    const action = {
      type: deleteTag.fulfilled.type,
      payload: '1',
    };

    const state = searchReducer(stateWithTags, action);
    expect(state.tags).toHaveLength(1);
    expect(state.tags[0].id).toBe('2');
  });
});

