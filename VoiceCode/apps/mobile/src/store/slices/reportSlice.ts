/**
 * Report Redux Slice
 * Phase 3 Week 9 Day 61-63: Advanced Analytics & Reporting
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAnalyticsService, Report, ScheduledReport, ReportType, ExportFormat } from '../../services/analyticsService';

// ============================================================================
// TYPES
// ============================================================================

export interface ReportState {
  reports: Report[];
  scheduledReports: ScheduledReport[];
  currentReport: Report | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const generateReport = createAsyncThunk(
  'report/generateReport',
  async ({ type, startDate, endDate }: { type: ReportType; startDate: Date; endDate: Date }) => {
    const analyticsService = getAnalyticsService();
    return await analyticsService.generateReport(type, startDate, endDate);
  }
);

export const exportReport = createAsyncThunk(
  'report/exportReport',
  async ({ report, format }: { report: Report; format: ExportFormat }) => {
    const analyticsService = getAnalyticsService();
    return await analyticsService.exportReport(report, format);
  }
);

export const fetchScheduledReports = createAsyncThunk(
  'report/fetchScheduledReports',
  async () => {
    const analyticsService = getAnalyticsService();
    return await analyticsService.getScheduledReports();
  }
);

export const createScheduledReport = createAsyncThunk(
  'report/createScheduledReport',
  async (config: Omit<ScheduledReport, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const analyticsService = getAnalyticsService();
    return await analyticsService.createScheduledReport(config);
  }
);

export const updateScheduledReport = createAsyncThunk(
  'report/updateScheduledReport',
  async ({ id, updates }: { id: string; updates: Partial<ScheduledReport> }) => {
    const analyticsService = getAnalyticsService();
    return await analyticsService.updateScheduledReport(id, updates);
  }
);

export const deleteScheduledReport = createAsyncThunk(
  'report/deleteScheduledReport',
  async (id: string) => {
    const analyticsService = getAnalyticsService();
    await analyticsService.deleteScheduledReport(id);
    return id;
  }
);

// ============================================================================
// SLICE
// ============================================================================

const initialState: ReportState = {
  reports: [],
  scheduledReports: [],
  currentReport: null,
  loading: false,
  error: null,
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    setCurrentReport: (state, action: PayloadAction<Report | null>) => {
      state.currentReport = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Generate Report
    builder.addCase(generateReport.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateReport.fulfilled, (state, action) => {
      state.loading = false;
      state.currentReport = action.payload;
      state.reports.unshift(action.payload);
    });
    builder.addCase(generateReport.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to generate report';
    });

    // Export Report
    builder.addCase(exportReport.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(exportReport.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(exportReport.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to export report';
    });

    // Fetch Scheduled Reports
    builder.addCase(fetchScheduledReports.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchScheduledReports.fulfilled, (state, action) => {
      state.loading = false;
      state.scheduledReports = action.payload;
    });
    builder.addCase(fetchScheduledReports.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch scheduled reports';
    });

    // Create Scheduled Report
    builder.addCase(createScheduledReport.fulfilled, (state, action) => {
      state.scheduledReports.unshift(action.payload);
    });

    // Update Scheduled Report
    builder.addCase(updateScheduledReport.fulfilled, (state, action) => {
      const index = state.scheduledReports.findIndex((r) => r.id === action.payload.id);
      if (index !== -1) {
        state.scheduledReports[index] = action.payload;
      }
    });

    // Delete Scheduled Report
    builder.addCase(deleteScheduledReport.fulfilled, (state, action) => {
      state.scheduledReports = state.scheduledReports.filter((r) => r.id !== action.payload);
    });
  },
});

export const { setCurrentReport, clearError } = reportSlice.actions;
export default reportSlice.reducer;

