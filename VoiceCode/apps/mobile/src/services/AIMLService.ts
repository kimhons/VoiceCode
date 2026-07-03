// VoiceCode Mobile - AIML Service
// Handles AI/ML API calls for summaries, key points, action items, and speaker identification

import { supabase } from './supabaseService';

/**
 * AI Summary response
 */
export interface AISummary {
  id: string;
  transcriptId: string;
  summaryText: string;
  confidence: number;
  modelVersion?: string;
  createdAt: string;
}

/**
 * AI Key Points response
 */
export interface AIKeyPoints {
  id: string;
  transcriptId: string;
  keyPoints: string[];
  confidence: number;
  modelVersion?: string;
  createdAt: string;
}

/**
 * Action Item
 */
export interface ActionItem {
  id: string;
  transcriptId: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  confidence?: number;
  createdAt: string;
  completedAt?: string;
}

/**
 * Speaker
 */
export interface Speaker {
  id: string;
  transcriptId: string;
  label: string;
  color: string;
  segmentCount: number;
  createdAt: string;
}

/**
 * AIML Service for AI-powered features
 */
export class AIMLService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.EXPO_PUBLIC_AIML_API_KEY || '';
    this.baseUrl = process.env.EXPO_PUBLIC_AIML_API_URL || 'https://api.aimlapi.com/v1';
  }

  /**
   * Generate AI summary for a transcript
   */
  async generateSummary(transcriptId: string, transcriptText: string): Promise<AISummary> {
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if summary already exists
      const { data: existing } = await supabase
        .from('ai_summaries')
        .select('*')
        .eq('transcript_id', transcriptId)
        .single();

      if (existing) {
        return this.mapSummaryFromDB(existing);
      }

      // Call AI API to generate summary
      const response = await fetch(`${this.baseUrl}/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text: transcriptText,
          max_length: 500,
          model: 'gpt-4-turbo',
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`);
      }

      const result = await response.json();

      // Save to database
      const { data, error } = await supabase
        .from('ai_summaries')
        .insert({
          transcript_id: transcriptId,
          user_id: user.id,
          summary_text: result.summary,
          confidence: result.confidence || 0.95,
          model_version: result.model || 'gpt-4-turbo',
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapSummaryFromDB(data);
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  /**
   * Extract key points from a transcript
   */
  async extractKeyPoints(transcriptId: string, transcriptText: string): Promise<AIKeyPoints> {
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if key points already exist
      const { data: existing } = await supabase
        .from('ai_key_points')
        .select('*')
        .eq('transcript_id', transcriptId)
        .single();

      if (existing) {
        return this.mapKeyPointsFromDB(existing);
      }

      // Call AI API to extract key points
      const response = await fetch(`${this.baseUrl}/extract-key-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text: transcriptText,
          max_points: 10,
          model: 'gpt-4-turbo',
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`);
      }

      const result = await response.json();

      // Save to database
      const { data, error } = await supabase
        .from('ai_key_points')
        .insert({
          transcript_id: transcriptId,
          user_id: user.id,
          key_points: result.key_points,
          confidence: result.confidence || 0.95,
          model_version: result.model || 'gpt-4-turbo',
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapKeyPointsFromDB(data);
    } catch (error) {
      console.error('Error extracting key points:', error);
      throw error;
    }
  }

  /**
   * Extract action items from a transcript
   */
  async extractActionItems(transcriptId: string, transcriptText: string): Promise<ActionItem[]> {
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if action items already exist
      const { data: existing } = await supabase
        .from('action_items')
        .select('*')
        .eq('transcript_id', transcriptId);

      if (existing && existing.length > 0) {
        return existing.map(this.mapActionItemFromDB);
      }

      // Call AI API to extract action items
      const response = await fetch(`${this.baseUrl}/extract-action-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text: transcriptText,
          model: 'gpt-4-turbo',
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`);
      }

      const result = await response.json();

      // Save to database
      const actionItems = result.action_items.map((item: any) => ({
        transcript_id: transcriptId,
        user_id: user.id,
        text: item.text,
        completed: false,
        priority: item.priority || 'medium',
        confidence: item.confidence || 0.90,
      }));

      const { data, error } = await supabase
        .from('action_items')
        .insert(actionItems)
        .select();

      if (error) throw error;

      return data.map(this.mapActionItemFromDB);
    } catch (error) {
      console.error('Error extracting action items:', error);
      throw error;
    }
  }

  /**
   * Identify speakers in a transcript
   */
  async identifySpeakers(transcriptId: string, transcriptText: string): Promise<Speaker[]> {
    try {
      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if speakers already exist
      const { data: existing } = await supabase
        .from('speakers')
        .select('*')
        .eq('transcript_id', transcriptId);

      if (existing && existing.length > 0) {
        return existing.map(this.mapSpeakerFromDB);
      }

      // Call AI API to identify speakers
      const response = await fetch(`${this.baseUrl}/identify-speakers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text: transcriptText,
          model: 'whisper-large-v3',
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`);
      }

      const result = await response.json();

      // Save to database
      const speakers = result.speakers.map((speaker: any, index: number) => ({
        transcript_id: transcriptId,
        user_id: user.id,
        label: speaker.label || `Speaker ${index + 1}`,
        color: speaker.color || this.getRandomColor(),
        segment_count: speaker.segment_count || 0,
      }));

      const { data, error } = await supabase
        .from('speakers')
        .insert(speakers)
        .select();

      if (error) throw error;

      return data.map(this.mapSpeakerFromDB);
    } catch (error) {
      console.error('Error identifying speakers:', error);
      throw error;
    }
  }

  /**
   * Update action item completion status
   */
  async updateActionItem(id: string, updates: Partial<ActionItem>): Promise<ActionItem> {
    try {
      const { data, error } = await supabase
        .from('action_items')
        .update({
          text: updates.text,
          completed: updates.completed,
          due_date: updates.dueDate,
          priority: updates.priority,
          completed_at: updates.completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapActionItemFromDB(data);
    } catch (error) {
      console.error('Error updating action item:', error);
      throw error;
    }
  }

  /**
   * Update speaker label and color
   */
  async updateSpeaker(id: string, label: string, color: string): Promise<Speaker> {
    try {
      const { data, error } = await supabase
        .from('speakers')
        .update({
          label,
          color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapSpeakerFromDB(data);
    } catch (error) {
      console.error('Error updating speaker:', error);
      throw error;
    }
  }

  // Private helper methods
  private mapSummaryFromDB(data: any): AISummary {
    return {
      id: data.id,
      transcriptId: data.transcript_id,
      summaryText: data.summary_text,
      confidence: parseFloat(data.confidence),
      modelVersion: data.model_version,
      createdAt: data.created_at,
    };
  }

  private mapKeyPointsFromDB(data: any): AIKeyPoints {
    return {
      id: data.id,
      transcriptId: data.transcript_id,
      keyPoints: data.key_points,
      confidence: parseFloat(data.confidence),
      modelVersion: data.model_version,
      createdAt: data.created_at,
    };
  }

  private mapActionItemFromDB(data: any): ActionItem {
    return {
      id: data.id,
      transcriptId: data.transcript_id,
      text: data.text,
      completed: data.completed,
      dueDate: data.due_date,
      priority: data.priority,
      confidence: data.confidence ? parseFloat(data.confidence) : undefined,
      createdAt: data.created_at,
      completedAt: data.completed_at,
    };
  }

  private mapSpeakerFromDB(data: any): Speaker {
    return {
      id: data.id,
      transcriptId: data.transcript_id,
      label: data.label,
      color: data.color,
      segmentCount: data.segment_count,
      createdAt: data.created_at,
    };
  }

  private getRandomColor(): string {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#4facfe',
      '#43e97b', '#fa709a', '#fee140', '#30cfd0',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export default new AIMLService();

