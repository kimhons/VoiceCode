/**
 * Workspace Redux Slice
 * Manages workspace state and data isolation context
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { workspaceService, Workspace, WorkspaceMember, CreateWorkspaceInput, UpdateWorkspaceInput } from '../../services/workspaceService';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  members: WorkspaceMember[];
  loading: boolean;
  error: string | null;
}

const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspace: null,
  members: [],
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchOrganizationWorkspaces = createAsyncThunk(
  'workspace/fetchOrganizationWorkspaces',
  async (organizationId: string) => {
    return await workspaceService.getOrganizationWorkspaces(organizationId);
  }
);

export const fetchUserWorkspaces = createAsyncThunk(
  'workspace/fetchUserWorkspaces',
  async () => {
    return await workspaceService.getUserWorkspaces();
  }
);

export const fetchWorkspace = createAsyncThunk(
  'workspace/fetchWorkspace',
  async (id: string) => {
    return await workspaceService.getWorkspace(id);
  }
);

export const createWorkspace = createAsyncThunk(
  'workspace/createWorkspace',
  async (input: CreateWorkspaceInput) => {
    return await workspaceService.createWorkspace(input);
  }
);

export const updateWorkspace = createAsyncThunk(
  'workspace/updateWorkspace',
  async ({ id, input }: { id: string; input: UpdateWorkspaceInput }) => {
    return await workspaceService.updateWorkspace(id, input);
  }
);

export const deleteWorkspace = createAsyncThunk(
  'workspace/deleteWorkspace',
  async (id: string) => {
    await workspaceService.deleteWorkspace(id);
    return id;
  }
);

export const fetchWorkspaceMembers = createAsyncThunk(
  'workspace/fetchMembers',
  async (workspaceId: string) => {
    return await workspaceService.getWorkspaceMembers(workspaceId);
  }
);

export const addWorkspaceMember = createAsyncThunk(
  'workspace/addMember',
  async ({ workspaceId, userId, role }: { workspaceId: string; userId: string; role?: WorkspaceMember['role'] }) => {
    return await workspaceService.addMember(workspaceId, userId, role);
  }
);

export const removeWorkspaceMember = createAsyncThunk(
  'workspace/removeMember',
  async ({ workspaceId, userId }: { workspaceId: string; userId: string }) => {
    await workspaceService.removeMember(workspaceId, userId);
    return userId;
  }
);

// ============================================================================
// SLICE
// ============================================================================

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setCurrentWorkspace: (state, action: PayloadAction<Workspace | null>) => {
      state.currentWorkspace = action.payload;
    },
    clearWorkspaceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch organization workspaces
    builder.addCase(fetchOrganizationWorkspaces.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchOrganizationWorkspaces.fulfilled, (state, action) => {
      state.loading = false;
      state.workspaces = action.payload;
      // Set first workspace as current if none selected
      if (!state.currentWorkspace && action.payload.length > 0) {
        state.currentWorkspace = action.payload[0];
      }
    });
    builder.addCase(fetchOrganizationWorkspaces.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch workspaces';
    });

    // Fetch user workspaces
    builder.addCase(fetchUserWorkspaces.fulfilled, (state, action) => {
      state.workspaces = action.payload;
    });

    // Fetch single workspace
    builder.addCase(fetchWorkspace.fulfilled, (state, action) => {
      if (action.payload) {
        const index = state.workspaces.findIndex(ws => ws.id === action.payload!.id);
        if (index >= 0) {
          state.workspaces[index] = action.payload;
        } else {
          state.workspaces.push(action.payload);
        }
        if (state.currentWorkspace?.id === action.payload.id) {
          state.currentWorkspace = action.payload;
        }
      }
    });

    // Create workspace
    builder.addCase(createWorkspace.fulfilled, (state, action) => {
      state.workspaces.push(action.payload);
      state.currentWorkspace = action.payload;
    });

    // Update workspace
    builder.addCase(updateWorkspace.fulfilled, (state, action) => {
      const index = state.workspaces.findIndex(ws => ws.id === action.payload.id);
      if (index >= 0) {
        state.workspaces[index] = action.payload;
      }
      if (state.currentWorkspace?.id === action.payload.id) {
        state.currentWorkspace = action.payload;
      }
    });

    // Delete workspace
    builder.addCase(deleteWorkspace.fulfilled, (state, action) => {
      state.workspaces = state.workspaces.filter(ws => ws.id !== action.payload);
      if (state.currentWorkspace?.id === action.payload) {
        state.currentWorkspace = state.workspaces[0] || null;
      }
    });

    // Fetch members
    builder.addCase(fetchWorkspaceMembers.fulfilled, (state, action) => {
      state.members = action.payload;
    });

    // Add member
    builder.addCase(addWorkspaceMember.fulfilled, (state, action) => {
      state.members.push(action.payload);
    });

    // Remove member
    builder.addCase(removeWorkspaceMember.fulfilled, (state, action) => {
      state.members = state.members.filter(member => member.user_id !== action.payload);
    });
  },
});

export const { setCurrentWorkspace, clearWorkspaceError } = workspaceSlice.actions;
export default workspaceSlice.reducer;

