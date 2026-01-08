// VoiceFlow Pro Mobile - Tag Service

import { supabase } from './supabaseService';

/**
 * Tag interface
 */
export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  transcriptCount?: number;
}

/**
 * Tag Service
 * Handles CRUD operations for tags
 */
class TagService {
  /**
   * Get all tags for a user
   */
  async getTags(userId: string): Promise<Tag[]> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select(`
          id,
          user_id,
          name,
          color,
          created_at,
          updated_at,
          transcript_tags(count)
        `)
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch tags: ${error.message}`);
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        color: item.color,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        transcriptCount: item.transcript_tags?.length || 0,
      }));
    } catch (error) {
      console.error('Get tags error:', error);
      throw error;
    }
  }

  /**
   * Create a new tag
   */
  async createTag(userId: string, name: string, color: string): Promise<Tag> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          user_id: userId,
          name,
          color,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create tag: ${error.message}`);
      }

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        color: data.color,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Create tag error:', error);
      throw error;
    }
  }

  /**
   * Update a tag
   */
  async updateTag(id: string, name: string, color: string): Promise<Tag> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .update({
          name,
          color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update tag: ${error.message}`);
      }

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        color: data.color,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Update tag error:', error);
      throw error;
    }
  }

  /**
   * Delete a tag
   */
  async deleteTag(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('tags').delete().eq('id', id);

      if (error) {
        throw new Error(`Failed to delete tag: ${error.message}`);
      }
    } catch (error) {
      console.error('Delete tag error:', error);
      throw error;
    }
  }

  /**
   * Add tag to transcript
   */
  async addTagToTranscript(transcriptId: string, tagId: string): Promise<void> {
    try {
      const { error } = await supabase.from('transcript_tags').insert({
        transcript_id: transcriptId,
        tag_id: tagId,
      });

      if (error) {
        throw new Error(`Failed to add tag to transcript: ${error.message}`);
      }
    } catch (error) {
      console.error('Add tag to transcript error:', error);
      throw error;
    }
  }

  /**
   * Remove tag from transcript
   */
  async removeTagFromTranscript(transcriptId: string, tagId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('transcript_tags')
        .delete()
        .eq('transcript_id', transcriptId)
        .eq('tag_id', tagId);

      if (error) {
        throw new Error(`Failed to remove tag from transcript: ${error.message}`);
      }
    } catch (error) {
      console.error('Remove tag from transcript error:', error);
      throw error;
    }
  }
}

export default new TagService();

