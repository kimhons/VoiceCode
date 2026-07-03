// VoiceCode Mobile - Analytics Service Tests

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockInsert = jest.fn(() => Promise.resolve({ data: null, error: null }));
const mockFrom = jest.fn(() => ({ insert: mockInsert }));
const mockGetCurrentUser = jest.fn<() => Promise<{ id: string } | null>>();

jest.mock('../../services/supabase.service', () => ({
  __esModule: true,
  getSupabaseService: () => ({ from: mockFrom }),
  getCurrentUser: () => mockGetCurrentUser(),
}));

import { getAnalyticsService } from '../../services/analyticsService';

describe('AnalyticsService', () => {
  const service = getAnalyticsService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ id: 'user-123' });
  });

  describe('trackEvent', () => {
    it('inserts an analytics event scoped to the current user', async () => {
      await service.trackEvent({
        event_type: 'transcript_created',
        event_data: { transcript_id: 't-1' },
        metadata: { source: 'test' },
      });

      expect(mockFrom).toHaveBeenCalledWith('analytics_events');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        event_type: 'transcript_created',
        event_data: { transcript_id: 't-1' },
        metadata: { source: 'test' },
      });
    });

    it('does not insert when there is no authenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      await service.trackEvent({ event_type: 'audio_uploaded' });

      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe('trackTranscript', () => {
    it('records a transcript_created event with transcript details', async () => {
      await service.trackTranscript({
        id: 't-9',
        user_id: 'user-123',
        audio_url: 'file://a.m4a',
        text: 'hello',
        content: 'hello',
        duration: 42,
        language: 'en',
        professional_mode: 'legal',
        word_count: 1,
        confidence: 0.9,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        event_type: 'transcript_created',
        event_data: {
          transcript_id: 't-9',
          language: 'en',
          professional_mode: 'legal',
          duration: 42,
          word_count: 1,
          confidence: 0.9,
        },
        metadata: {},
      });
    });
  });

  describe('trackAudioUpload', () => {
    it('records an audio_uploaded event with file details', async () => {
      await service.trackAudioUpload({ id: 'a-1', format: 'm4a', size: 2048 });

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        event_type: 'audio_uploaded',
        event_data: { audio_id: 'a-1', format: 'm4a', size: 2048 },
        metadata: {},
      });
    });
  });

  describe('trackExport', () => {
    it('records an export_<format> event', async () => {
      await service.trackExport('pdf');

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        event_type: 'export_pdf',
        event_data: {},
        metadata: {},
      });
    });
  });

  describe('trackAIFeature', () => {
    it('records an ai_<feature> event', async () => {
      await service.trackAIFeature('summary');

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        event_type: 'ai_summary',
        event_data: {},
        metadata: {},
      });
    });
  });
});
