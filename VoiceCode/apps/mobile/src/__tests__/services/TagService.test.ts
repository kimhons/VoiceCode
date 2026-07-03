// VoiceCode Mobile - Tag Service Tests

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import TagService from '../../services/TagService';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

describe('TagService', () => {
  const mockUserId = 'user-123';
  const mockTag = {
    id: 'tag-1',
    user_id: mockUserId,
    name: 'Meeting',
    color: '#667eea',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getTags', () => {
    it('should fetch all tags for user', async () => {
      const mockData = [mockTag];
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      });

      const result = await TagService.getTags(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Meeting');
    });

    it('should handle errors when fetching tags', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
          }),
        }),
      });

      await expect(TagService.getTags(mockUserId)).rejects.toThrow();
    });
  });

  describe('createTag', () => {
    it('should create a new tag', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockTag, error: null }),
          }),
        }),
      });

      const result = await TagService.createTag(mockUserId, 'Meeting', '#667eea');

      expect(result.name).toBe('Meeting');
      expect(result.color).toBe('#667eea');
    });
  });

  describe('updateTag', () => {
    it('should update tag name and color', async () => {
      const updated = { ...mockTag, name: 'Updated Meeting' };
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: updated, error: null }),
            }),
          }),
        }),
      });

      const result = await TagService.updateTag('tag-1', 'Updated Meeting', '#764ba2');

      expect(result.name).toBe('Updated Meeting');
    });
  });

  describe('deleteTag', () => {
    it('should delete a tag', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(TagService.deleteTag('tag-1')).resolves.not.toThrow();
    });
  });
});
