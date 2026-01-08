/**
 * Compliance Redux Slice
 * Phase 3 Week 9 Day 59-60: Advanced Security & Compliance
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  complianceService,
  ComplianceConfig,
  DataRetentionPolicy,
  ComplianceReport,
  ComplianceFramework,
} from '../../services/complianceService';

// ============================================================================
// STATE
// ============================================================================

interface ComplianceState {
  configs: ComplianceConfig[];
  retentionPolicies: DataRetentionPolicy[];
  reports: ComplianceReport[];
  stats: {
    active_frameworks: number;
    compliant_frameworks: number;
    pending_export_requests: number;
    pending_deletion_requests: number;
    last_audit_date?: string;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: ComplianceState = {
  configs: [],
  retentionPolicies: [],
  reports: [],
  stats: null,
  loading: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchComplianceConfigs = createAsyncThunk(
  'compliance/fetchConfigs',
  async (organizationId: string) => {
    return await complianceService.getComplianceConfigs(organizationId);
  }
);

export const updateComplianceConfig = createAsyncThunk(
  'compliance/updateConfig',
  async (params: { id: string; updates: any }) => {
    return await complianceService.updateComplianceConfig(params.id, params.updates);
  }
);

export const createComplianceConfig = createAsyncThunk(
  'compliance/createConfig',
  async (params: { organizationId: string; framework: ComplianceFramework; settings?: any }) => {
    return await complianceService.createComplianceConfig(
      params.organizationId,
      params.framework,
      params.settings
    );
  }
);

export const fetchDataRetentionPolicies = createAsyncThunk(
  'compliance/fetchRetentionPolicies',
  async (organizationId: string) => {
    return await complianceService.getDataRetentionPolicies(organizationId);
  }
);

export const updateDataRetentionPolicy = createAsyncThunk(
  'compliance/updateRetentionPolicy',
  async (params: { id: string; updates: any }) => {
    return await complianceService.updateDataRetentionPolicy(params.id, params.updates);
  }
);

export const fetchComplianceReports = createAsyncThunk(
  'compliance/fetchReports',
  async (params: { organizationId: string; framework?: ComplianceFramework }) => {
    return await complianceService.getComplianceReports(params.organizationId, params.framework);
  }
);

export const generateComplianceReport = createAsyncThunk(
  'compliance/generateReport',
  async (params: {
    organizationId: string;
    framework: ComplianceFramework;
    reportType: any;
    generatedBy: string;
  }) => {
    return await complianceService.generateComplianceReport(
      params.organizationId,
      params.framework,
      params.reportType,
      params.generatedBy
    );
  }
);

export const fetchComplianceStats = createAsyncThunk(
  'compliance/fetchStats',
  async (organizationId: string) => {
    return await complianceService.getComplianceStats(organizationId);
  }
);

// ============================================================================
// SLICE
// ============================================================================

const complianceSlice = createSlice({
  name: 'compliance',
  initialState,
  reducers: {
    clearComplianceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Configs
      .addCase(fetchComplianceConfigs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplianceConfigs.fulfilled, (state, action) => {
        state.loading = false;
        state.configs = action.payload;
      })
      .addCase(fetchComplianceConfigs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch compliance configs';
      })
      // Update Config
      .addCase(updateComplianceConfig.fulfilled, (state, action) => {
        const index = state.configs.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.configs[index] = action.payload;
        }
      })
      // Create Config
      .addCase(createComplianceConfig.fulfilled, (state, action) => {
        state.configs.push(action.payload);
      })
      // Fetch Retention Policies
      .addCase(fetchDataRetentionPolicies.fulfilled, (state, action) => {
        state.retentionPolicies = action.payload;
      })
      // Update Retention Policy
      .addCase(updateDataRetentionPolicy.fulfilled, (state, action) => {
        const index = state.retentionPolicies.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.retentionPolicies[index] = action.payload;
        }
      })
      // Fetch Reports
      .addCase(fetchComplianceReports.fulfilled, (state, action) => {
        state.reports = action.payload;
      })
      // Generate Report
      .addCase(generateComplianceReport.fulfilled, (state, action) => {
        state.reports.unshift(action.payload);
      })
      // Fetch Stats
      .addCase(fetchComplianceStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearComplianceError } = complianceSlice.actions;
export default complianceSlice.reducer;

