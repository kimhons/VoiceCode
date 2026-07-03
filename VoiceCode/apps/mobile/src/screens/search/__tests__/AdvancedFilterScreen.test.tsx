// VoiceCode Mobile - AdvancedFilterScreen Tests

import searchReducer, { setFilters, clearFilters } from '../../../store/slices/searchSlice';

describe('AdvancedFilterScreen - Redux Logic', () => {
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

  it('initializes with default filters', () => {
    const state = searchReducer(undefined, { type: 'unknown' });
    expect(state.filters).toEqual({
      sortBy: 'date',
      sortOrder: 'desc',
    });
  });

  it('handles setFilters with date range', () => {
    const action = {
      type: setFilters.type,
      payload: {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      },
    };

    const state = searchReducer(initialState, action);
    expect(state.filters.dateFrom).toBe('2024-01-01');
    expect(state.filters.dateTo).toBe('2024-01-31');
  });

  it('handles setFilters with duration range', () => {
    const action = {
      type: setFilters.type,
      payload: {
        minDuration: 60,
        maxDuration: 300,
      },
    };

    const state = searchReducer(initialState, action);
    expect(state.filters.minDuration).toBe(60);
    expect(state.filters.maxDuration).toBe(300);
  });

  it('handles setFilters with tags', () => {
    const action = {
      type: setFilters.type,
      payload: {
        tags: ['tag1', 'tag2', 'tag3'],
      },
    };

    const state = searchReducer(initialState, action);
    expect(state.filters.tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('handles setFilters with folders', () => {
    const action = {
      type: setFilters.type,
      payload: {
        folders: ['folder1', 'folder2'],
      },
    };

    const state = searchReducer(initialState, action);
    expect(state.filters.folders).toEqual(['folder1', 'folder2']);
  });

  it('handles setFilters with sort options', () => {
    const action = {
      type: setFilters.type,
      payload: {
        sortBy: 'duration' as const,
        sortOrder: 'asc' as const,
      },
    };

    const state = searchReducer(initialState, action);
    expect(state.filters.sortBy).toBe('duration');
    expect(state.filters.sortOrder).toBe('asc');
  });

  it('handles setFilters with multiple filters', () => {
    const action = {
      type: setFilters.type,
      payload: {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        minDuration: 60,
        maxDuration: 300,
        tags: ['tag1', 'tag2'],
        folders: ['folder1'],
        sortBy: 'relevance' as const,
        sortOrder: 'desc' as const,
      },
    };

    const state = searchReducer(initialState, action);
    expect(state.filters).toEqual({
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
      minDuration: 60,
      maxDuration: 300,
      tags: ['tag1', 'tag2'],
      folders: ['folder1'],
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
  });

  it('handles clearFilters', () => {
    const stateWithFilters = {
      ...initialState,
      filters: {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        minDuration: 60,
        maxDuration: 300,
        tags: ['tag1', 'tag2'],
        folders: ['folder1'],
        sortBy: 'relevance' as const,
        sortOrder: 'asc' as const,
      },
    };

    const action = { type: clearFilters.type };
    const state = searchReducer(stateWithFilters, action);

    expect(state.filters).toEqual({
      sortBy: 'date',
      sortOrder: 'desc',
    });
  });

  it('merges filters when calling setFilters multiple times', () => {
    let state = searchReducer(initialState, {
      type: setFilters.type,
      payload: { dateFrom: '2024-01-01' },
    });

    state = searchReducer(state, {
      type: setFilters.type,
      payload: { dateTo: '2024-01-31' },
    });

    state = searchReducer(state, {
      type: setFilters.type,
      payload: { tags: ['tag1'] },
    });

    expect(state.filters.dateFrom).toBe('2024-01-01');
    expect(state.filters.dateTo).toBe('2024-01-31');
    expect(state.filters.tags).toEqual(['tag1']);
  });
});

