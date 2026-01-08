// VoiceFlow Pro Mobile - Search Service

import { supabase } from './supabaseService';

/**
 * Transcript search result
 */
export interface TranscriptSearchResult {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  duration?: number;
  tags?: string[];
  folders?: string[];
  matchedText?: string;
  relevanceScore?: number;
}

/**
 * Search filters
 */
export interface SearchFilters {
  query?: string;
  tags?: string[];
  folders?: string[];
  dateFrom?: string;
  dateTo?: string;
  minDuration?: number;
  maxDuration?: number;
  sortBy?: 'relevance' | 'date' | 'duration' | 'title';
  sortOrder?: 'asc' | 'desc';
}

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
}

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
}

/**
 * Search Service
 * Handles full-text search and filtering of transcripts
 */
class SearchService {
  /**
   * Search transcripts with filters
   */
  async searchTranscripts(
    userId: string,
    filters: SearchFilters
  ): Promise<TranscriptSearchResult[]> {
    try {
      let query = supabase
        .from('transcripts')
        .select(`
          id,
          title,
          text,
          created_at,
          duration,
          transcript_tags(tag_id, tags(name)),
          transcript_folders(folder_id, folders(name))
        `)
        .eq('user_id', userId);

      // Full-text search
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,text.ilike.%${filters.query}%`);
      }

      // Date range filter
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Duration filter
      if (filters.minDuration) {
        query = query.gte('duration', filters.minDuration);
      }
      if (filters.maxDuration) {
        query = query.lte('duration', filters.maxDuration);
      }

      // Sorting
      const sortBy = filters.sortBy || 'date';
      const sortOrder = filters.sortOrder || 'desc';
      
      switch (sortBy) {
        case 'date':
          query = query.order('created_at', { ascending: sortOrder === 'asc' });
          break;
        case 'duration':
          query = query.order('duration', { ascending: sortOrder === 'asc' });
          break;
        case 'title':
          query = query.order('title', { ascending: sortOrder === 'asc' });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to search transcripts: ${error.message}`);
      }

      // Transform results
      const results: TranscriptSearchResult[] = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title || 'Untitled',
        text: item.text || '',
        createdAt: item.created_at,
        duration: item.duration,
        tags: item.transcript_tags?.map((tt: any) => tt.tags?.name).filter(Boolean) || [],
        folders: item.transcript_folders?.map((tf: any) => tf.folders?.name).filter(Boolean) || [],
        matchedText: this.extractMatchedText(item.text, filters.query),
      }));

      // Filter by tags if specified
      if (filters.tags && filters.tags.length > 0) {
        return results.filter((result) =>
          filters.tags!.some((tag) => result.tags?.includes(tag))
        );
      }

      // Filter by folders if specified
      if (filters.folders && filters.folders.length > 0) {
        return results.filter((result) =>
          filters.folders!.some((folder) => result.folders?.includes(folder))
        );
      }

      return results;
    } catch (error) {
      console.error('Search transcripts error:', error);
      throw error;
    }
  }

  /**
   * Extract matched text snippet
   */
  private extractMatchedText(text: string, query?: string): string {
    if (!query || !text) return '';

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return '';

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    const snippet = text.substring(start, end);

    return (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '');
  }
}

export default new SearchService();

