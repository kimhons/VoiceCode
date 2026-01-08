/**
 * Real-Time AI Service
 * Phase 3 Week 10 Day 66-67: Real-Time AI Processing
 * 
 * Provides real-time AI transcription, suggestions, and insights during recording.
 * Uses WebSocket for streaming audio and receiving live AI responses.
 */

import { supabase } from './supabase.service';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type SessionStatus = 'idle' | 'connecting' | 'active' | 'paused' | 'ended' | 'error';
export type SuggestionType = 'correction' | 'completion' | 'clarification' | 'formatting';
export type InsightType = 'summary' | 'key_point' | 'question' | 'decision' | 'risk';

export interface RealTimeSession {
  id: string;
  user_id: string;
  status: SessionStatus;
  started_at: string;
  ended_at?: string;
  total_duration: number; // seconds
  audio_chunks_processed: number;
  transcription_accuracy: number; // 0-100
  suggestions_count: number;
  action_items_count: number;
  config: SessionConfig;
  metadata: Record<string, any>;
}

export interface SessionConfig {
  language: string;
  model: string; // 'whisper-1', 'gpt-4-turbo', etc.
  enable_suggestions: boolean;
  enable_action_detection: boolean;
  enable_context_analysis: boolean;
  confidence_threshold: number; // 0-1
  suggestion_frequency: 'low' | 'medium' | 'high';
}

export interface StreamingTranscript {
  id: string;
  session_id: string;
  text: string;
  is_final: boolean;
  confidence: number; // 0-1
  timestamp: number; // milliseconds from session start
  speaker_id?: string;
  language: string;
  alternatives?: string[];
}

export interface LiveSuggestion {
  id: string;
  session_id: string;
  type: SuggestionType;
  original_text: string;
  suggested_text: string;
  reason: string;
  confidence: number; // 0-1
  timestamp: number;
  is_applied: boolean;
  created_at: string;
}

export interface ActionItemDetection {
  id: string;
  session_id: string;
  text: string;
  assignee?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  timestamp: number;
  context: string;
  is_confirmed: boolean;
  created_at: string;
}

export interface ContextualInsight {
  id: string;
  session_id: string;
  type: InsightType;
  title: string;
  description: string;
  relevance: number; // 0-1
  timestamp: number;
  related_text: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface RealTimeMetrics {
  session_id: string;
  transcription_latency: number; // milliseconds
  suggestion_latency: number; // milliseconds
  accuracy_score: number; // 0-100
  words_per_minute: number;
  confidence_average: number; // 0-1
  suggestions_accepted: number;
  suggestions_rejected: number;
  action_items_detected: number;
  insights_generated: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class RealTimeAIService {
  private ws: WebSocket | null = null;
  private currentSession: RealTimeSession | null = null;
  private transcriptBuffer: StreamingTranscript[] = [];
  private suggestionsBuffer: LiveSuggestion[] = [];
  private actionItemsBuffer: ActionItemDetection[] = [];
  private insightsBuffer: ContextualInsight[] = [];

  /**
   * Start a new real-time AI session
   */
  async startRealTimeSession(config: SessionConfig): Promise<RealTimeSession> {
    try {
      // Create session in database
      const { data: session, error } = await supabase
        .from('realtime_sessions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          status: 'connecting',
          started_at: new Date().toISOString(),
          total_duration: 0,
          audio_chunks_processed: 0,
          transcription_accuracy: 0,
          suggestions_count: 0,
          action_items_count: 0,
          config,
          metadata: {},
        })
        .select()
        .single();

      if (error) throw error;

      this.currentSession = session;

      // Initialize WebSocket connection
      await this.initializeWebSocket(session.id, config);

      // Update session status
      await this.updateSessionStatus(session.id, 'active');

      return session;
    } catch (error) {
      console.error('Failed to start real-time session:', error);
      throw error;
    }
  }

  /**
   * Initialize WebSocket connection for real-time communication
   */
  private async initializeWebSocket(sessionId: string, config: SessionConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      // In production, this would connect to your WebSocket server
      // For now, we'll simulate the connection
      const wsUrl = `wss://api.voiceflowpro.com/realtime/${sessionId}`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        // Send configuration
        this.ws?.send(JSON.stringify({ type: 'config', data: config }));
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.ws = null;
      };
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'transcript':
          this.transcriptBuffer.push(message.data as StreamingTranscript);
          break;
        case 'suggestion':
          this.suggestionsBuffer.push(message.data as LiveSuggestion);
          break;
        case 'action_item':
          this.actionItemsBuffer.push(message.data as ActionItemDetection);
          break;
        case 'insight':
          this.insightsBuffer.push(message.data as ContextualInsight);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Send audio chunk for real-time processing
   */
  async sendAudioChunk(audioData: ArrayBuffer): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    if (!this.currentSession) {
      throw new Error('No active session');
    }

    // Send audio chunk via WebSocket
    this.ws.send(JSON.stringify({
      type: 'audio',
      data: Array.from(new Uint8Array(audioData)),
      session_id: this.currentSession.id,
    }));

    // Update session metrics
    await this.updateSessionMetrics(this.currentSession.id, {
      audio_chunks_processed: this.currentSession.audio_chunks_processed + 1,
    });
  }

  /**
   * Get streaming transcription
   */
  getStreamingTranscription(): StreamingTranscript[] {
    return [...this.transcriptBuffer];
  }

  /**
   * Get live suggestions
   */
  getLiveSuggestions(): LiveSuggestion[] {
    return [...this.suggestionsBuffer];
  }

  /**
   * Detect action items in real-time
   */
  detectActionItems(): ActionItemDetection[] {
    return [...this.actionItemsBuffer];
  }

  /**
   * Get contextual insights
   */
  getContextualInsights(): ContextualInsight[] {
    return [...this.insightsBuffer];
  }

  /**
   * Apply a suggestion
   */
  async applySuggestion(suggestionId: string): Promise<void> {
    const suggestion = this.suggestionsBuffer.find(s => s.id === suggestionId);
    if (!suggestion) {
      throw new Error('Suggestion not found');
    }

    // Update suggestion status
    await supabase
      .from('live_suggestions')
      .update({ is_applied: true })
      .eq('id', suggestionId);

    suggestion.is_applied = true;
  }

  /**
   * Confirm an action item
   */
  async confirmActionItem(actionItemId: string): Promise<void> {
    const actionItem = this.actionItemsBuffer.find(a => a.id === actionItemId);
    if (!actionItem) {
      throw new Error('Action item not found');
    }

    // Update action item status
    await supabase
      .from('detected_action_items')
      .update({ is_confirmed: true })
      .eq('id', actionItemId);

    actionItem.is_confirmed = true;
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(sessionId: string): Promise<RealTimeMetrics> {
    // Calculate metrics from buffers
    const transcripts = this.transcriptBuffer.filter(t => t.session_id === sessionId);
    const suggestions = this.suggestionsBuffer.filter(s => s.session_id === sessionId);
    const actionItems = this.actionItemsBuffer.filter(a => a.session_id === sessionId);
    const insights = this.insightsBuffer.filter(i => i.session_id === sessionId);

    const avgConfidence = transcripts.length > 0
      ? transcripts.reduce((sum, t) => sum + t.confidence, 0) / transcripts.length
      : 0;

    const suggestionsAccepted = suggestions.filter(s => s.is_applied).length;
    const suggestionsRejected = suggestions.length - suggestionsAccepted;

    return {
      session_id: sessionId,
      transcription_latency: 150, // milliseconds (simulated)
      suggestion_latency: 200, // milliseconds (simulated)
      accuracy_score: avgConfidence * 100,
      words_per_minute: 120, // simulated
      confidence_average: avgConfidence,
      suggestions_accepted: suggestionsAccepted,
      suggestions_rejected: suggestionsRejected,
      action_items_detected: actionItems.length,
      insights_generated: insights.length,
    };
  }

  /**
   * Stop real-time session
   */
  async stopRealTimeSession(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Update session status
    await this.updateSessionStatus(this.currentSession.id, 'ended');

    // Save final transcripts, suggestions, and action items to database
    await this.saveSessionData(this.currentSession.id);

    // Clear buffers
    this.transcriptBuffer = [];
    this.suggestionsBuffer = [];
    this.actionItemsBuffer = [];
    this.insightsBuffer = [];
    this.currentSession = null;
  }

  /**
   * Update session status
   */
  private async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
    await supabase
      .from('realtime_sessions')
      .update({ status })
      .eq('id', sessionId);

    if (this.currentSession) {
      this.currentSession.status = status;
    }
  }

  /**
   * Update session metrics
   */
  private async updateSessionMetrics(sessionId: string, metrics: Partial<RealTimeSession>): Promise<void> {
    await supabase
      .from('realtime_sessions')
      .update(metrics)
      .eq('id', sessionId);

    if (this.currentSession) {
      Object.assign(this.currentSession, metrics);
    }
  }

  /**
   * Save session data to database
   */
  private async saveSessionData(sessionId: string): Promise<void> {
    // Save transcripts
    if (this.transcriptBuffer.length > 0) {
      await supabase
        .from('streaming_transcripts')
        .insert(this.transcriptBuffer);
    }

    // Save suggestions
    if (this.suggestionsBuffer.length > 0) {
      await supabase
        .from('live_suggestions')
        .insert(this.suggestionsBuffer);
    }

    // Save action items
    if (this.actionItemsBuffer.length > 0) {
      await supabase
        .from('detected_action_items')
        .insert(this.actionItemsBuffer);
    }

    // Save insights
    if (this.insightsBuffer.length > 0) {
      await supabase
        .from('contextual_insights')
        .insert(this.insightsBuffer);
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<RealTimeSession | null> {
    const { data, error } = await supabase
      .from('realtime_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Failed to get session:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user's recent sessions
   */
  async getRecentSessions(limit: number = 10): Promise<RealTimeSession[]> {
    const { data, error } = await supabase
      .from('realtime_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get recent sessions:', error);
      return [];
    }

    return data || [];
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let realTimeAIServiceInstance: RealTimeAIService | null = null;

export function getRealTimeAIService(): RealTimeAIService {
  if (!realTimeAIServiceInstance) {
    realTimeAIServiceInstance = new RealTimeAIService();
  }
  return realTimeAIServiceInstance;
}

export default getRealTimeAIService;



