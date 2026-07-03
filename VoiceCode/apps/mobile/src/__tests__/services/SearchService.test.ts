// VoiceCode Mobile - Search Service Tests

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import SearchService from '../../services/SearchService';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

describe('SearchService', () => {
  const mockUserId = 'user-123';
  const mockTranscript = {
    id: 'transcript-1',
    title: 'Meeting Notes',
    text: 'This is a test transcript about project planning',
    created_at: '2024-01-15T10:00:00Z',
    duration: 300,
    transcript_tags: [{ tags: { name: 'work' } }],
    transcript_folders: [{ folders: { name: 'Projects' } }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchTranscripts', () => {
    it('should search transcripts by query', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [mockTranscript],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await SearchService.searchTranscripts(mockUserId, {
        query: 'project',
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Meeting Notes');
    });

    it('should filter by date range', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [mockTranscript],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await SearchService.searchTranscripts(mockUserId, {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      });

      expect(result).toHaveLength(1);
    });

    it('should filter by duration', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: [mockTranscript],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await SearchService.searchTranscripts(mockUserId, {
        minDuration: 60,
        maxDuration: 600,
      });

      expect(result).toHaveLength(1);
    });

    it('should sort by date descending by default', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockTranscript],
              error: null,
            }),
          }),
        }),
      });

      const result = await SearchService.searchTranscripts(mockUserId, {});

      expect(result).toHaveLength(1);
    });

    it('should filter by tags', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockTranscript],
              error: null,
            }),
          }),
        }),
      });

      const result = await SearchService.searchTranscripts(mockUserId, {
        tags: ['work'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].tags).toContain('work');
    });

    it('should filter by folders', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockTranscript],
              error: null,
            }),
          }),
        }),
      });

      const result = await SearchService.searchTranscripts(mockUserId, {
        folders: ['Projects'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].folders).toContain('Projects');
    });

    it('should handle search errors', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Search failed'),
            }),
          }),
        }),
      });

      await expect(
        SearchService.searchTranscripts(mockUserId, {})
      ).rejects.toThrow('Failed to search transcripts');
    });

    it('should extract matched text snippets', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [mockTranscript],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await SearchService.searchTranscripts(mockUserId, {
        query: 'project',
      });

      expect(result[0].matchedText).toContain('project');
    });
  });
});
