/**
 * Organization Redux Slice
 * Manages organization state and multi-tenant context
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { organizationService, Organization, OrganizationMember, CreateOrganizationInput, UpdateOrganizationInput } from '../../services/organizationService';

// ============================================================================
// STATE INTERFACE
// ============================================================================

interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  members: OrganizationMember[];
  loading: boolean;
  error: string | null;
}

const initialState: OrganizationState = {
  organizations: [],
  currentOrganization: null,
  members: [],
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchUserOrganizations = createAsyncThunk(
  'organization/fetchUserOrganizations',
  async () => {
    return await organizationService.getUserOrganizations();
  }
);

export const fetchOrganization = createAsyncThunk(
  'organization/fetchOrganization',
  async (id: string) => {
    return await organizationService.getOrganization(id);
  }
);

export const createOrganization = createAsyncThunk(
  'organization/createOrganization',
  async (input: CreateOrganizationInput) => {
    return await organizationService.createOrganization(input);
  }
);

export const updateOrganization = createAsyncThunk(
  'organization/updateOrganization',
  async ({ id, input }: { id: string; input: UpdateOrganizationInput }) => {
    return await organizationService.updateOrganization(id, input);
  }
);

export const deleteOrganization = createAsyncThunk(
  'organization/deleteOrganization',
  async (id: string) => {
    await organizationService.deleteOrganization(id);
    return id;
  }
);

export const fetchOrganizationMembers = createAsyncThunk(
  'organization/fetchMembers',
  async (organizationId: string) => {
    return await organizationService.getOrganizationMembers(organizationId);
  }
);

export const addOrganizationMember = createAsyncThunk(
  'organization/addMember',
  async ({ organizationId, userId, role }: { organizationId: string; userId: string; role?: OrganizationMember['role'] }) => {
    return await organizationService.addMember(organizationId, userId, role);
  }
);

export const removeOrganizationMember = createAsyncThunk(
  'organization/removeMember',
  async ({ organizationId, userId }: { organizationId: string; userId: string }) => {
    await organizationService.removeMember(organizationId, userId);
    return userId;
  }
);

// ============================================================================
// SLICE
// ============================================================================

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {
    setCurrentOrganization: (state, action: PayloadAction<Organization | null>) => {
      state.currentOrganization = action.payload;
    },
    clearOrganizationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch user organizations
    builder.addCase(fetchUserOrganizations.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserOrganizations.fulfilled, (state, action) => {
      state.loading = false;
      state.organizations = action.payload;
      // Set first organization as current if none selected
      if (!state.currentOrganization && action.payload.length > 0) {
        state.currentOrganization = action.payload[0];
      }
    });
    builder.addCase(fetchUserOrganizations.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch organizations';
    });

    // Fetch single organization
    builder.addCase(fetchOrganization.fulfilled, (state, action) => {
      if (action.payload) {
        const index = state.organizations.findIndex(org => org.id === action.payload!.id);
        if (index >= 0) {
          state.organizations[index] = action.payload;
        } else {
          state.organizations.push(action.payload);
        }
        if (state.currentOrganization?.id === action.payload.id) {
          state.currentOrganization = action.payload;
        }
      }
    });

    // Create organization
    builder.addCase(createOrganization.fulfilled, (state, action) => {
      state.organizations.push(action.payload);
      state.currentOrganization = action.payload;
    });

    // Update organization
    builder.addCase(updateOrganization.fulfilled, (state, action) => {
      const index = state.organizations.findIndex(org => org.id === action.payload.id);
      if (index >= 0) {
        state.organizations[index] = action.payload;
      }
      if (state.currentOrganization?.id === action.payload.id) {
        state.currentOrganization = action.payload;
      }
    });

    // Delete organization
    builder.addCase(deleteOrganization.fulfilled, (state, action) => {
      state.organizations = state.organizations.filter(org => org.id !== action.payload);
      if (state.currentOrganization?.id === action.payload) {
        state.currentOrganization = state.organizations[0] || null;
      }
    });

    // Fetch members
    builder.addCase(fetchOrganizationMembers.fulfilled, (state, action) => {
      state.members = action.payload;
    });

    // Add member
    builder.addCase(addOrganizationMember.fulfilled, (state, action) => {
      state.members.push(action.payload);
    });

    // Remove member
    builder.addCase(removeOrganizationMember.fulfilled, (state, action) => {
      state.members = state.members.filter(member => member.user_id !== action.payload);
    });
  },
});

export const { setCurrentOrganization, clearOrganizationError } = organizationSlice.actions;
export default organizationSlice.reducer;

