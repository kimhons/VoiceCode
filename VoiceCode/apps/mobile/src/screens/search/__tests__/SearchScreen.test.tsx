// VoiceFlow Pro Mobile - SearchScreen Tests

import searchReducer, {
  searchTranscripts,
  setFilters,
  clearFilters,
  clearResults,
} from '../../../store/slices/searchSlice';

describe('SearchScreen - Redux Logic', () => {
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

  it('initializes with empty state', () => {
    const state = searchReducer(undefined, { type: 'unknown' });
    expect(state.results).toEqual([]);
    expect(state.searchLoading).toBe(false);
    expect(state.searchError).toBeNull();
  });

  it('handles searchTranscripts.pending', () => {
    const action = { type: searchTranscripts.pending.type };
    const state = searchReducer(initialState, action);
    expect(state.searchLoading).toBe(true);
    expect(state.searchError).toBeNull();
  });

  it('handles searchTranscripts.fulfilled', () => {
    const mockResults = [
      {
        id: '1',
        title: 'Test Transcript',
        text: 'This is a test transcript',
        createdAt: '2024-01-01T00:00:00Z',
        duration: 120,
        tags: ['meeting'],
        folders: ['work'],
      },
    ];

    const action = {
      type: searchTranscripts.fulfilled.type,
      payload: mockResults,
    };

    const state = searchReducer(initialState, action);
    expect(state.searchLoading).toBe(false);
    expect(state.results).toEqual(mockResults);
  });

  it('handles searchTranscripts.rejected', () => {
    const action = {
      type: searchTranscripts.rejected.type,
      error: { message: 'Search failed' },
    };

    const state = searchReducer(initialState, action);
    expect(state.searchLoading).toBe(false);
    expect(state.searchError).toBe('Search failed');
  });

  it('handles setFilters', () => {
    const filters = {
      query: 'test',
      tags: ['meeting'],
      sortBy: 'title' as const,
    };

    const state = searchReducer(initialState, setFilters(filters));
    expect(state.filters.query).toBe('test');
    expect(state.filters.tags).toEqual(['meeting']);
    expect(state.filters.sortBy).toBe('title');
  });

  it('handles clearFilters', () => {
    const stateWithFilters = {
      ...initialState,
      filters: {
        query: 'test',
        tags: ['meeting'],
        sortBy: 'title' as const,
        sortOrder: 'asc' as const,
      },
    };

    const state = searchReducer(stateWithFilters, clearFilters());
    expect(state.filters.query).toBeUndefined();
    expect(state.filters.tags).toBeUndefined();
    expect(state.filters.sortBy).toBe('date');
    expect(state.filters.sortOrder).toBe('desc');
  });

  it('handles clearResults', () => {
    const stateWithResults = {
      ...initialState,
      results: [
        {
          id: '1',
          title: 'Test',
          text: 'Test',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
      searchError: 'Some error',
    };

    const state = searchReducer(stateWithResults, clearResults());
    expect(state.results).toEqual([]);
    expect(state.searchError).toBeNull();
  });

  it('handles multiple search results', () => {
    const mockResults = [
      {
        id: '1',
        title: 'First Transcript',
        text: 'Content 1',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        title: 'Second Transcript',
        text: 'Content 2',
        createdAt: '2024-01-02T00:00:00Z',
      },
      {
        id: '3',
        title: 'Third Transcript',
        text: 'Content 3',
        createdAt: '2024-01-03T00:00:00Z',
      },
    ];

    const action = {
      type: searchTranscripts.fulfilled.type,
      payload: mockResults,
    };

    const state = searchReducer(initialState, action);
    expect(state.results).toHaveLength(3);
    expect(state.results[0].title).toBe('First Transcript');
    expect(state.results[2].title).toBe('Third Transcript');
  });
});

