// VoiceFlow Pro Mobile - FolderManagementScreen Tests

import searchReducer, {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from '../../../store/slices/searchSlice';

describe('FolderManagementScreen - Redux Logic', () => {
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

  it('initializes with empty folders', () => {
    const state = searchReducer(undefined, { type: 'unknown' });
    expect(state.folders).toEqual([]);
    expect(state.foldersLoading).toBe(false);
    expect(state.foldersError).toBeNull();
  });

  it('handles getFolders.pending', () => {
    const action = { type: getFolders.pending.type };
    const state = searchReducer(initialState, action);
    expect(state.foldersLoading).toBe(true);
    expect(state.foldersError).toBeNull();
  });

  it('handles getFolders.fulfilled', () => {
    const mockFolders = [
      {
        id: '1',
        userId: 'user1',
        name: 'Work',
        color: '#667eea',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        transcriptCount: 5,
        subfolderCount: 2,
      },
      {
        id: '2',
        userId: 'user1',
        name: 'Personal',
        parentId: '1',
        color: '#f59e0b',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        transcriptCount: 3,
        subfolderCount: 0,
      },
    ];

    const action = {
      type: getFolders.fulfilled.type,
      payload: mockFolders,
    };

    const state = searchReducer(initialState, action);
    expect(state.foldersLoading).toBe(false);
    expect(state.folders).toEqual(mockFolders);
    expect(state.folders).toHaveLength(2);
  });

  it('handles getFolders.rejected', () => {
    const action = {
      type: getFolders.rejected.type,
      error: { message: 'Failed to fetch folders' },
    };

    const state = searchReducer(initialState, action);
    expect(state.foldersLoading).toBe(false);
    expect(state.foldersError).toBe('Failed to fetch folders');
  });

  it('handles createFolder.fulfilled', () => {
    const newFolder = {
      id: '3',
      userId: 'user1',
      name: 'Projects',
      color: '#10b981',
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    };

    const action = {
      type: createFolder.fulfilled.type,
      payload: newFolder,
    };

    const state = searchReducer(initialState, action);
    expect(state.folders).toHaveLength(1);
    expect(state.folders[0]).toEqual(newFolder);
  });

  it('handles updateFolder.fulfilled', () => {
    const existingFolder = {
      id: '1',
      userId: 'user1',
      name: 'Work',
      color: '#667eea',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const stateWithFolder = {
      ...initialState,
      folders: [existingFolder],
    };

    const updatedFolder = {
      ...existingFolder,
      name: 'Work Projects',
      color: '#ef4444',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    const action = {
      type: updateFolder.fulfilled.type,
      payload: updatedFolder,
    };

    const state = searchReducer(stateWithFolder, action);
    expect(state.folders).toHaveLength(1);
    expect(state.folders[0].name).toBe('Work Projects');
    expect(state.folders[0].color).toBe('#ef4444');
  });

  it('handles deleteFolder.fulfilled', () => {
    const stateWithFolders = {
      ...initialState,
      folders: [
        {
          id: '1',
          userId: 'user1',
          name: 'Work',
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
      type: deleteFolder.fulfilled.type,
      payload: '1',
    };

    const state = searchReducer(stateWithFolders, action);
    expect(state.folders).toHaveLength(1);
    expect(state.folders[0].id).toBe('2');
  });
});

