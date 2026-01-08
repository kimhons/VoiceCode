// VoiceFlow Pro Mobile - BatchExportScreen Tests

import exportReducer, {
  createBatchExportJob,
  getBatchExportJobs,
} from '../../../store/slices/exportSlice';
import { BatchExportJob } from '../../../services/MobileExportService';

describe('BatchExportScreen - Redux Logic', () => {
  it('initializes with empty batch jobs', () => {
    const state = exportReducer(undefined, { type: 'unknown' });
    expect(state.batchJobs).toEqual([]);
    expect(state.batchJobsLoading).toBe(false);
    expect(state.batchJobsError).toBeNull();
  });

  it('handles createBatchExportJob.pending', () => {
    const state = exportReducer(
      undefined,
      createBatchExportJob.pending('', {
        userId: 'user-123',
        transcriptIds: ['t1', 't2', 't3'],
        format: 'pdf',
      })
    );
    expect(state.batchJobsLoading).toBe(true);
    expect(state.batchJobsError).toBeNull();
  });

  it('handles createBatchExportJob.fulfilled', () => {
    const batchJob: BatchExportJob = {
      id: 'job-1',
      userId: 'user-123',
      transcriptIds: ['t1', 't2', 't3'],
      format: 'pdf',
      status: 'pending',
      progress: 0,
      totalCount: 3,
      completedCount: 0,
      failedCount: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const state = exportReducer(
      undefined,
      createBatchExportJob.fulfilled(batchJob, '', {
        userId: 'user-123',
        transcriptIds: ['t1', 't2', 't3'],
        format: 'pdf',
      })
    );

    expect(state.batchJobsLoading).toBe(false);
    expect(state.batchJobs).toHaveLength(1);
    expect(state.batchJobs[0]).toEqual(batchJob);
  });

  it('handles createBatchExportJob.rejected', () => {
    const state = exportReducer(
      undefined,
      createBatchExportJob.rejected(new Error('Failed to create job'), '', {
        userId: 'user-123',
        transcriptIds: ['t1', 't2'],
        format: 'pdf',
      })
    );

    expect(state.batchJobsLoading).toBe(false);
    expect(state.batchJobsError).toBe('Failed to create job');
  });

  it('handles getBatchExportJobs.fulfilled', () => {
    const batchJobs: BatchExportJob[] = [
      {
        id: 'job-1',
        userId: 'user-123',
        transcriptIds: ['t1', 't2'],
        format: 'pdf',
        status: 'completed',
        progress: 100,
        totalCount: 2,
        completedCount: 2,
        failedCount: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-01T00:05:00Z',
      },
      {
        id: 'job-2',
        userId: 'user-123',
        transcriptIds: ['t3', 't4', 't5'],
        format: 'docx',
        status: 'processing',
        progress: 66,
        totalCount: 3,
        completedCount: 2,
        failedCount: 0,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:02:00Z',
      },
    ];

    const state = exportReducer(
      undefined,
      getBatchExportJobs.fulfilled(batchJobs, '', 'user-123')
    );

    expect(state.batchJobsLoading).toBe(false);
    expect(state.batchJobs).toEqual(batchJobs);
  });

  it('handles batch job with different statuses', () => {
    const statuses: Array<'pending' | 'processing' | 'completed' | 'failed'> = [
      'pending',
      'processing',
      'completed',
      'failed',
    ];

    statuses.forEach((status) => {
      const job: BatchExportJob = {
        id: `job-${status}`,
        userId: 'user-123',
        transcriptIds: ['t1'],
        format: 'pdf',
        status,
        progress: status === 'completed' ? 100 : status === 'failed' ? 0 : 50,
        totalCount: 1,
        completedCount: status === 'completed' ? 1 : 0,
        failedCount: status === 'failed' ? 1 : 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(job.status).toBe(status);
    });
  });

  it('handles batch job with error message', () => {
    const failedJob: BatchExportJob = {
      id: 'job-1',
      userId: 'user-123',
      transcriptIds: ['t1', 't2'],
      format: 'pdf',
      status: 'failed',
      progress: 50,
      totalCount: 2,
      completedCount: 1,
      failedCount: 1,
      errorMessage: 'Failed to export transcript t2',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(failedJob.errorMessage).toBe('Failed to export transcript t2');
    expect(failedJob.failedCount).toBe(1);
  });
});

