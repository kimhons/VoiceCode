/**
 * Security Redux Slice
 * Phase 3 Week 9 Day 59-60: Advanced Security & Compliance
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  securityService,
  SecurityEvent,
  ThreatAlert,
  SecurityPolicy,
} from '../../services/securityService';

// ============================================================================
// STATE
// ============================================================================

interface SecurityState {
  events: SecurityEvent[];
  threats: ThreatAlert[];
  policies: SecurityPolicy[];
  stats: {
    total_events: number;
    critical_events: number;
    active_threats: number;
    failed_logins: number;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: SecurityState = {
  events: [],
  threats: [],
  policies: [],
  stats: null,
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchSecurityEvents = createAsyncThunk(
  'security/fetchEvents',
  async (params: { organizationId: string; filters?: any }) => {
    return await securityService.getSecurityEvents(params.organizationId, params.filters);
  }
);

export const fetchThreatAlerts = createAsyncThunk(
  'security/fetchThreats',
  async (params: { organizationId: string; status?: string }) => {
    return await securityService.getThreatAlerts(params.organizationId, params.status);
  }
);

export const fetchSecurityPolicies = createAsyncThunk(
  'security/fetchPolicies',
  async (organizationId: string) => {
    return await securityService.getSecurityPolicies(organizationId);
  }
);

export const updateSecurityPolicy = createAsyncThunk(
  'security/updatePolicy',
  async (params: { id: string; updates: any }) => {
    return await securityService.updateSecurityPolicy(params.id, params.updates);
  }
);

export const fetchSecurityStats = createAsyncThunk(
  'security/fetchStats',
  async (params: { organizationId: string; days?: number }) => {
    return await securityService.getSecurityStats(params.organizationId, params.days);
  }
);

export const updateThreatAlert = createAsyncThunk(
  'security/updateThreat',
  async (params: { id: string; updates: any }) => {
    return await securityService.updateThreatAlert(params.id, params.updates);
  }
);

// ============================================================================
// SLICE
// ============================================================================

const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    clearSecurityError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Events
      .addCase(fetchSecurityEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSecurityEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchSecurityEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch security events';
      })
      // Fetch Threats
      .addCase(fetchThreatAlerts.fulfilled, (state, action) => {
        state.threats = action.payload;
      })
      // Fetch Policies
      .addCase(fetchSecurityPolicies.fulfilled, (state, action) => {
        state.policies = action.payload;
      })
      // Update Policy
      .addCase(updateSecurityPolicy.fulfilled, (state, action) => {
        const index = state.policies.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.policies[index] = action.payload;
        }
      })
      // Fetch Stats
      .addCase(fetchSecurityStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Update Threat
      .addCase(updateThreatAlert.fulfilled, (state, action) => {
        const index = state.threats.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.threats[index] = action.payload;
        }
      });
  },
});

export const { clearSecurityError } = securitySlice.actions;
export default securitySlice.reducer;

