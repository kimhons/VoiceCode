// VoiceCode Mobile - Folder Service Tests

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import FolderService from '../../services/FolderService';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

describe('FolderService', () => {
  const mockUserId = 'user-123';
  const mockFolder = {
    id: 'folder-1',
    user_id: mockUserId,
    name: 'Work',
    parent_id: null,
    color: '#667eea',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFolders', () => {
    it('should fetch all folders for user', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [mockFolder], error: null }),
          }),
        }),
      });

      const result = await FolderService.getFolders(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Work');
    });
  });

  describe('createFolder', () => {
    it('should create a new folder', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockFolder, error: null }),
          }),
        }),
      });

      const result = await FolderService.createFolder(mockUserId, 'Work', null, '#667eea');

      expect(result.name).toBe('Work');
    });
  });

  describe('updateFolder', () => {
    it('should update folder properties', async () => {
      const updated = { ...mockFolder, name: 'Personal' };
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: updated, error: null }),
            }),
          }),
        }),
      });

      const result = await FolderService.updateFolder('folder-1', { name: 'Personal' });

      expect(result.name).toBe('Personal');
    });
  });

  describe('deleteFolder', () => {
    it('should delete a folder', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(FolderService.deleteFolder('folder-1')).resolves.not.toThrow();
    });
  });

  describe('moveFolder', () => {
    it('should move folder to new parent', async () => {
      const moved = { ...mockFolder, parent_id: 'folder-2' };
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: moved, error: null }),
            }),
          }),
        }),
      });

      const result = await FolderService.moveFolder('folder-1', 'folder-2');

      // FolderService maps DB snake_case → domain camelCase; assert the domain field
      expect(result.parentId).toBe('folder-2');
    });
  });
});
