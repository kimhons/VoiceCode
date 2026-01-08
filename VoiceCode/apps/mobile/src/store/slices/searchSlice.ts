// VoiceFlow Pro Mobile - Search Redux Slice

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import SearchService, { TranscriptSearchResult, SearchFilters } from '../../services/SearchService';
import TagService, { Tag } from '../../services/TagService';
import FolderService, { Folder } from '../../services/FolderService';

/**
 * Search state interface
 */
interface SearchState {
  // Search results
  results: TranscriptSearchResult[];
  searchLoading: boolean;
  searchError: string | null;

  // Tags
  tags: Tag[];
  tagsLoading: boolean;
  tagsError: string | null;

  // Folders
  folders: Folder[];
  foldersLoading: boolean;
  foldersError: string | null;

  // Current filters
  filters: SearchFilters;
}

/**
 * Initial state
 */
const initialState: SearchState = {
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
    sortBy: 'date',
    sortOrder: 'desc',
  },
};

/**
 * Async thunks
 */

// Search transcripts
export const searchTranscripts = createAsyncThunk(
  'search/searchTranscripts',
  async ({ userId, filters }: { userId: string; filters: SearchFilters }) => {
    return await SearchService.searchTranscripts(userId, filters);
  }
);

// Get tags
export const getTags = createAsyncThunk('search/getTags', async (userId: string) => {
  return await TagService.getTags(userId);
});

// Create tag
export const createTag = createAsyncThunk(
  'search/createTag',
  async ({ userId, name, color }: { userId: string; name: string; color: string }) => {
    return await TagService.createTag(userId, name, color);
  }
);

// Update tag
export const updateTag = createAsyncThunk(
  'search/updateTag',
  async ({ id, name, color }: { id: string; name: string; color: string }) => {
    return await TagService.updateTag(id, name, color);
  }
);

// Delete tag
export const deleteTag = createAsyncThunk('search/deleteTag', async (id: string) => {
  await TagService.deleteTag(id);
  return id;
});

// Get folders
export const getFolders = createAsyncThunk('search/getFolders', async (userId: string) => {
  return await FolderService.getFolders(userId);
});

// Create folder
export const createFolder = createAsyncThunk(
  'search/createFolder',
  async ({
    userId,
    name,
    color,
    parentId,
  }: {
    userId: string;
    name: string;
    color: string;
    parentId?: string;
  }) => {
    return await FolderService.createFolder(userId, name, color, parentId);
  }
);

// Update folder
export const updateFolder = createAsyncThunk(
  'search/updateFolder',
  async ({ id, name, color, parentId }: { id: string; name: string; color: string; parentId?: string | null }) => {
    return await FolderService.updateFolder(id, name, color, parentId);
  }
);

// Delete folder
export const deleteFolder = createAsyncThunk('search/deleteFolder', async (id: string) => {
  await FolderService.deleteFolder(id);
  return id;
});

/**
 * Search slice
 */
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        sortBy: 'date',
        sortOrder: 'desc',
      };
    },
    clearResults: (state) => {
      state.results = [];
      state.searchError = null;
    },
  },
  extraReducers: (builder) => {
    // Search transcripts
    builder.addCase(searchTranscripts.pending, (state) => {
      state.searchLoading = true;
      state.searchError = null;
    });
    builder.addCase(searchTranscripts.fulfilled, (state, action) => {
      state.searchLoading = false;
      state.results = action.payload;
    });
    builder.addCase(searchTranscripts.rejected, (state, action) => {
      state.searchLoading = false;
      state.searchError = action.error.message || 'Failed to search transcripts';
    });

    // Get tags
    builder.addCase(getTags.pending, (state) => {
      state.tagsLoading = true;
      state.tagsError = null;
    });
    builder.addCase(getTags.fulfilled, (state, action) => {
      state.tagsLoading = false;
      state.tags = action.payload;
    });
    builder.addCase(getTags.rejected, (state, action) => {
      state.tagsLoading = false;
      state.tagsError = action.error.message || 'Failed to fetch tags';
    });

    // Create tag
    builder.addCase(createTag.fulfilled, (state, action) => {
      state.tags.push(action.payload);
    });

    // Update tag
    builder.addCase(updateTag.fulfilled, (state, action) => {
      const index = state.tags.findIndex((tag) => tag.id === action.payload.id);
      if (index !== -1) {
        state.tags[index] = action.payload;
      }
    });

    // Delete tag
    builder.addCase(deleteTag.fulfilled, (state, action) => {
      state.tags = state.tags.filter((tag) => tag.id !== action.payload);
    });

    // Get folders
    builder.addCase(getFolders.pending, (state) => {
      state.foldersLoading = true;
      state.foldersError = null;
    });
    builder.addCase(getFolders.fulfilled, (state, action) => {
      state.foldersLoading = false;
      state.folders = action.payload;
    });
    builder.addCase(getFolders.rejected, (state, action) => {
      state.foldersLoading = false;
      state.foldersError = action.error.message || 'Failed to fetch folders';
    });

    // Create folder
    builder.addCase(createFolder.fulfilled, (state, action) => {
      state.folders.push(action.payload);
    });

    // Update folder
    builder.addCase(updateFolder.fulfilled, (state, action) => {
      const index = state.folders.findIndex((folder) => folder.id === action.payload.id);
      if (index !== -1) {
        state.folders[index] = action.payload;
      }
    });

    // Delete folder
    builder.addCase(deleteFolder.fulfilled, (state, action) => {
      state.folders = state.folders.filter((folder) => folder.id !== action.payload);
    });
  },
});

export const { setFilters, clearFilters, clearResults } = searchSlice.actions;
export default searchSlice.reducer;
