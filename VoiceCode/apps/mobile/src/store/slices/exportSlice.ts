// VoiceCode Mobile - Export Slice

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  mobileExportService,
  ExportTemplate,
  ShareLink,
  BatchExportJob,
  ExportFormat,
} from '../../services/MobileExportService';

interface ExportState {
  templates: ExportTemplate[];
  templatesLoading: boolean;
  templatesError: string | null;

  shareLinks: ShareLink[];
  shareLinksLoading: boolean;
  shareLinksError: string | null;

  batchJobs: BatchExportJob[];
  batchJobsLoading: boolean;
  batchJobsError: string | null;

  exportLoading: boolean;
  exportError: string | null;
}

const initialState: ExportState = {
  templates: [],
  templatesLoading: false,
  templatesError: null,

  shareLinks: [],
  shareLinksLoading: false,
  shareLinksError: null,

  batchJobs: [],
  batchJobsLoading: false,
  batchJobsError: null,

  exportLoading: false,
  exportError: null,
};

// Async Thunks

/**
 * Get export templates
 */
export const getTemplates = createAsyncThunk(
  'export/getTemplates',
  async (userId: string) => {
    return await mobileExportService.getTemplates(userId);
  }
);

/**
 * Create export template
 */
export const createTemplate = createAsyncThunk(
  'export/createTemplate',
  async (params: {
    userId: string;
    template: Omit<ExportTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  }) => {
    return await mobileExportService.createTemplate(params.userId, params.template);
  }
);

/**
 * Update export template
 */
export const updateTemplate = createAsyncThunk(
  'export/updateTemplate',
  async (params: {
    id: string;
    updates: Partial<Omit<ExportTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
  }) => {
    return await mobileExportService.updateTemplate(params.id, params.updates);
  }
);

/**
 * Delete export template
 */
export const deleteTemplate = createAsyncThunk(
  'export/deleteTemplate',
  async (id: string) => {
    await mobileExportService.deleteTemplate(id);
    return id;
  }
);

/**
 * Create share link
 */
export const createShareLink = createAsyncThunk(
  'export/createShareLink',
  async (params: {
    transcriptId: string;
    userId: string;
    options: {
      email?: string;
      accessLevel: 'view' | 'comment' | 'edit';
      expiresAt?: string;
      password?: string;
    };
  }) => {
    return await mobileExportService.createShareLink(
      params.transcriptId,
      params.userId,
      params.options
    );
  }
);

/**
 * Get shared transcripts
 */
export const getSharedTranscripts = createAsyncThunk(
  'export/getSharedTranscripts',
  async (userId: string) => {
    return await mobileExportService.getSharedTranscripts(userId);
  }
);

/**
 * Delete share link
 */
export const deleteShareLink = createAsyncThunk(
  'export/deleteShareLink',
  async (id: string) => {
    await mobileExportService.deleteShareLink(id);
    return id;
  }
);

/**
 * Create batch export job
 */
export const createBatchExportJob = createAsyncThunk(
  'export/createBatchExportJob',
  async (params: {
    userId: string;
    transcriptIds: string[];
    format: ExportFormat;
    templateId?: string;
  }) => {
    return await mobileExportService.createBatchExportJob(
      params.userId,
      params.transcriptIds,
      params.format,
      params.templateId
    );
  }
);

/**
 * Get batch export jobs
 */
export const getBatchExportJobs = createAsyncThunk(
  'export/getBatchExportJobs',
  async (userId: string) => {
    return await mobileExportService.getBatchExportJobs(userId);
  }
);

const exportSlice = createSlice({
  name: 'export',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Get Templates
    builder.addCase(getTemplates.pending, (state) => {
      state.templatesLoading = true;
      state.templatesError = null;
    });
    builder.addCase(getTemplates.fulfilled, (state, action: PayloadAction<ExportTemplate[]>) => {
      state.templatesLoading = false;
      state.templates = action.payload;
    });
    builder.addCase(getTemplates.rejected, (state, action) => {
      state.templatesLoading = false;
      state.templatesError = action.error.message || 'Failed to fetch templates';
    });

    // Create Template
    builder.addCase(createTemplate.fulfilled, (state, action: PayloadAction<ExportTemplate>) => {
      state.templates.unshift(action.payload);
    });

    // Update Template
    builder.addCase(updateTemplate.fulfilled, (state, action: PayloadAction<ExportTemplate>) => {
      const index = state.templates.findIndex((t) => t.id === action.payload.id);
      if (index !== -1) {
        state.templates[index] = action.payload;
      }
    });

    // Delete Template
    builder.addCase(deleteTemplate.fulfilled, (state, action: PayloadAction<string>) => {
      state.templates = state.templates.filter((t) => t.id !== action.payload);
    });

    // Create Share Link
    builder.addCase(createShareLink.pending, (state) => {
      state.shareLinksLoading = true;
      state.shareLinksError = null;
    });
    builder.addCase(createShareLink.fulfilled, (state, action: PayloadAction<ShareLink>) => {
      state.shareLinksLoading = false;
      state.shareLinks.unshift(action.payload);
    });
    builder.addCase(createShareLink.rejected, (state, action) => {
      state.shareLinksLoading = false;
      state.shareLinksError = action.error.message || 'Failed to create share link';
    });

    // Get Shared Transcripts
    builder.addCase(getSharedTranscripts.pending, (state) => {
      state.shareLinksLoading = true;
      state.shareLinksError = null;
    });
    builder.addCase(getSharedTranscripts.fulfilled, (state, action: PayloadAction<ShareLink[]>) => {
      state.shareLinksLoading = false;
      state.shareLinks = action.payload;
    });
    builder.addCase(getSharedTranscripts.rejected, (state, action) => {
      state.shareLinksLoading = false;
      state.shareLinksError = action.error.message || 'Failed to fetch shared transcripts';
    });

    // Delete Share Link
    builder.addCase(deleteShareLink.fulfilled, (state, action: PayloadAction<string>) => {
      state.shareLinks = state.shareLinks.filter((s) => s.id !== action.payload);
    });

    // Create Batch Export Job
    builder.addCase(createBatchExportJob.pending, (state) => {
      state.batchJobsLoading = true;
      state.batchJobsError = null;
    });
    builder.addCase(createBatchExportJob.fulfilled, (state, action: PayloadAction<BatchExportJob>) => {
      state.batchJobsLoading = false;
      state.batchJobs.unshift(action.payload);
    });
    builder.addCase(createBatchExportJob.rejected, (state, action) => {
      state.batchJobsLoading = false;
      state.batchJobsError = action.error.message || 'Failed to create batch export job';
    });

    // Get Batch Export Jobs
    builder.addCase(getBatchExportJobs.pending, (state) => {
      state.batchJobsLoading = true;
      state.batchJobsError = null;
    });
    builder.addCase(getBatchExportJobs.fulfilled, (state, action: PayloadAction<BatchExportJob[]>) => {
      state.batchJobsLoading = false;
      state.batchJobs = action.payload;
    });
    builder.addCase(getBatchExportJobs.rejected, (state, action) => {
      state.batchJobsLoading = false;
      state.batchJobsError = action.error.message || 'Failed to fetch batch export jobs';
    });
  },
});

export default exportSlice.reducer;

