// VoiceCode Mobile - Folder Service

import { supabase } from './supabaseService';

/**
 * Folder interface
 */
export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  transcriptCount?: number;
  subfolderCount?: number;
}

/**
 * Folder Service
 * Handles CRUD operations for folders
 */
class FolderService {
  /**
   * Get all folders for a user
   */
  async getFolders(userId: string): Promise<Folder[]> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select(`
          id,
          user_id,
          name,
          parent_id,
          color,
          created_at,
          updated_at,
          transcript_folders(count),
          subfolders:folders!parent_id(count)
        `)
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch folders: ${error.message}`);
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        parentId: item.parent_id,
        color: item.color,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        transcriptCount: item.transcript_folders?.length || 0,
        subfolderCount: item.subfolders?.length || 0,
      }));
    } catch (error) {
      console.error('Get folders error:', error);
      throw error;
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(
    userId: string,
    name: string,
    parentId: string | null,
    color: string
  ): Promise<Folder> {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          user_id: userId,
          name,
          color,
          parent_id: parentId,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create folder: ${error.message}`);
      }

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        parentId: data.parent_id,
        color: data.color,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Create folder error:', error);
      throw error;
    }
  }

  /**
   * Update a folder
   */
  async updateFolder(id: string, updates: Partial<{ name: string; color: string; parentId: string | null }>): Promise<Folder> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }
      if (updates.color !== undefined) {
        updateData.color = updates.color;
      }
      if (updates.parentId !== undefined) {
        updateData.parent_id = updates.parentId;
      }

      const { data, error } = await supabase
        .from('folders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update folder: ${error.message}`);
      }

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        parentId: data.parent_id,
        color: data.color,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Update folder error:', error);
      throw error;
    }
  }

  /**
   * Move folder to new parent
   */
  async moveFolder(folderId: string, newParentId: string | null): Promise<Folder> {
    return this.updateFolder(folderId, { parentId: newParentId });
  }

  /**
   * Delete a folder
   */
  async deleteFolder(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('folders').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete folder: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete folder error:', error);
      throw error;
    }
  }

  /**
   * Add folder to transcript
   */
  async addFolderToTranscript(transcriptId: string, folderId: string): Promise<void> {
    try {
      const { error } = await supabase.from('transcript_folders').insert({
        transcript_id: transcriptId,
        folder_id: folderId,
      });

      if (error) {
        throw new Error(`Failed to add folder to transcript: ${error.message}`);
      }
    } catch (error) {
      console.error('Add folder to transcript error:', error);
      throw error;
    }
  }

  /**
   * Remove folder from transcript
   */
  async removeFolderFromTranscript(transcriptId: string, folderId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('transcript_folders')
        .delete()
        .eq('transcript_id', transcriptId)
        .eq('folder_id', folderId);

      if (error) {
        throw new Error(`Failed to remove folder from transcript: ${error.message}`);
      }
    } catch (error) {
      console.error('Remove folder from transcript error:', error);
      throw error;
    }
  }
}

export default new FolderService();

