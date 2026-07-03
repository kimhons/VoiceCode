/**
 * Team Performance Slice
 * Phase 3 Week 11 Day 71-72: Productivity Analytics
 * 
 * Redux state management for team performance analytics.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getTeamPerformanceService,
  TeamMetrics,
  TeamMemberPerformance,
  MeetingEffectiveness,
  CollaborationPattern,
  PerformanceBenchmark,
} from '../../services/teamPerformanceService';

interface TeamPerformanceState {
  teamMetrics: TeamMetrics | null;
  memberPerformance: TeamMemberPerformance[];
  meetingEffectiveness: MeetingEffectiveness[];
  collaborationPatterns: CollaborationPattern[];
  benchmarks: PerformanceBenchmark[];
  teamTrend: Array<{ date: string; score: number }>;
  loading: boolean;
  error: string | null;
}

const initialState: TeamPerformanceState = {
  teamMetrics: null,
  memberPerformance: [],
  meetingEffectiveness: [],
  collaborationPatterns: [],
  benchmarks: [],
  teamTrend: [],
  loading: false,
  error: null,
};

// Async Thunks
export const fetchTeamMetrics = createAsyncThunk(
  'teamPerformance/fetchMetrics',
  async ({ teamId, period }: { teamId: string; period: 'day' | 'week' | 'month' }) => {
    const service = getTeamPerformanceService();
    return await service.getTeamMetrics(teamId, period);
  }
);

export const fetchMemberPerformance = createAsyncThunk(
  'teamPerformance/fetchMemberPerformance',
  async ({ teamId, period }: { teamId: string; period: 'week' | 'month' }) => {
    const service = getTeamPerformanceService();
    return await service.getTeamMemberPerformance(teamId, period);
  }
);

export const fetchMeetingEffectiveness = createAsyncThunk(
  'teamPerformance/fetchMeetingEffectiveness',
  async ({ teamId, startDate, endDate }: { teamId: string; startDate: string; endDate: string }) => {
    const service = getTeamPerformanceService();
    return await service.getMeetingEffectiveness(teamId, startDate, endDate);
  }
);

export const fetchCollaborationPatterns = createAsyncThunk(
  'teamPerformance/fetchCollaborationPatterns',
  async (teamId: string) => {
    const service = getTeamPerformanceService();
    return await service.getCollaborationPatterns(teamId);
  }
);

export const fetchBenchmarks = createAsyncThunk(
  'teamPerformance/fetchBenchmarks',
  async (teamId: string) => {
    const service = getTeamPerformanceService();
    return await service.getPerformanceBenchmarks(teamId);
  }
);

export const fetchTeamTrend = createAsyncThunk(
  'teamPerformance/fetchTeamTrend',
  async ({ teamId, days }: { teamId: string; days: number }) => {
    const service = getTeamPerformanceService();
    return await service.getTeamTrend(teamId, days);
  }
);

// Slice
const teamPerformanceSlice = createSlice({
  name: 'teamPerformance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetTeamPerformance: (state) => {
      state.teamMetrics = null;
      state.memberPerformance = [];
      state.meetingEffectiveness = [];
      state.collaborationPatterns = [];
      state.benchmarks = [];
      state.teamTrend = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Team Metrics
    builder.addCase(fetchTeamMetrics.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTeamMetrics.fulfilled, (state, action) => {
      state.loading = false;
      state.teamMetrics = action.payload;
    });
    builder.addCase(fetchTeamMetrics.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch team metrics';
    });

    // Fetch Member Performance
    builder.addCase(fetchMemberPerformance.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMemberPerformance.fulfilled, (state, action) => {
      state.loading = false;
      state.memberPerformance = action.payload;
    });
    builder.addCase(fetchMemberPerformance.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch member performance';
    });

    // Fetch Meeting Effectiveness
    builder.addCase(fetchMeetingEffectiveness.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMeetingEffectiveness.fulfilled, (state, action) => {
      state.loading = false;
      state.meetingEffectiveness = action.payload;
    });
    builder.addCase(fetchMeetingEffectiveness.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch meeting effectiveness';
    });

    // Fetch Collaboration Patterns
    builder.addCase(fetchCollaborationPatterns.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCollaborationPatterns.fulfilled, (state, action) => {
      state.loading = false;
      state.collaborationPatterns = action.payload;
    });
    builder.addCase(fetchCollaborationPatterns.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch collaboration patterns';
    });

    // Fetch Benchmarks
    builder.addCase(fetchBenchmarks.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBenchmarks.fulfilled, (state, action) => {
      state.loading = false;
      state.benchmarks = action.payload;
    });
    builder.addCase(fetchBenchmarks.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch benchmarks';
    });

    // Fetch Team Trend
    builder.addCase(fetchTeamTrend.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTeamTrend.fulfilled, (state, action) => {
      state.loading = false;
      state.teamTrend = action.payload;
    });
    builder.addCase(fetchTeamTrend.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch team trend';
    });
  },
});

export const { clearError, resetTeamPerformance } = teamPerformanceSlice.actions;
export default teamPerformanceSlice.reducer;

