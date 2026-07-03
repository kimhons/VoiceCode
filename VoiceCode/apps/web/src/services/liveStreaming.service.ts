/**
 * Live Streaming Service
 * Phase 5.9: Live Streaming
 * 
 * Real-time audio streaming and live transcription
 */

import { getSupabaseService } from './supabase.service';

// Types
export interface LiveStream {
  id: string;
  userId: string;
  title: string;
  status: 'starting' | 'live' | 'paused' | 'stopped' | 'ended';
  mode: string;
  language: string;
  startedAt: Date;
  endedAt?: Date;
  duration: number;
  viewerCount: number;
  transcriptId?: string;
  config: LiveStreamConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiveStreamConfig {
  enableCaptions: boolean;
  captionDelay: number; // milliseconds
  enableRecording: boolean;
  enableChat: boolean;
  isPublic: boolean;
  maxViewers: number;
  quality: 'low' | 'medium' | 'high';
  protocol: 'websocket' | 'webrtc' | 'hls';
}

export interface LiveCaption {
  id: string;
  streamId: string;
  text: string;
  confidence: number;
  timestamp: number;
  isFinal: boolean;
  speakerId?: string;
}

export interface StreamViewer {
  id: string;
  streamId: string;
  userId?: string;
  username: string;
  joinedAt: Date;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  streamId: string;
  userId?: string;
  username: string;
  message: string;
  timestamp: Date;
}

// Live Streaming Service
class LiveStreamingService {
  private activeStreams = new Map<string, MediaStream>();
  private websockets = new Map<string, WebSocket>();
  private audioContexts = new Map<string, AudioContext>();

  // =====================================================
  // STREAM MANAGEMENT
  // =====================================================

  async createStream(
    userId: string,
    title: string,
    mode: string,
    language: string,
    config: LiveStreamConfig
  ): Promise<LiveStream> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('live_streams')
        .insert({
          user_id: userId,
          title,
          status: 'starting',
          mode,
          language,
          started_at: new Date().toISOString(),
          duration: 0,
          viewer_count: 0,
          config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as LiveStream;
    } catch (error) {
      console.error('Failed to create stream:', error);
      throw error;
    }
  }

  async updateStreamStatus(streamId: string, status: LiveStream['status']): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'ended') {
        updates.ended_at = new Date().toISOString();
      }

      const { error } = await client
        .from('live_streams')
        .update(updates)
        .eq('id', streamId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update stream status:', error);
      throw error;
    }
  }

  async getStream(streamId: string): Promise<LiveStream | null> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('live_streams')
        .select('*')
        .eq('id', streamId)
        .single();

      if (error) throw error;
      return data as LiveStream;
    } catch (error) {
      console.error('Failed to get stream:', error);
      return null;
    }
  }

  async getUserStreams(userId: string, limit: number = 50): Promise<LiveStream[]> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('live_streams')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as LiveStream[];
    } catch (error) {
      console.error('Failed to get user streams:', error);
      throw error;
    }
  }

  // =====================================================
  // AUDIO STREAMING
  // =====================================================

  async startAudioStream(streamId: string, constraints?: MediaStreamConstraints): Promise<MediaStream> {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia(
        constraints || {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
          },
          video: false,
        }
      );

      this.activeStreams.set(streamId, stream);

      // Update stream status
      await this.updateStreamStatus(streamId, 'live');

      return stream;
    } catch (error) {
      console.error('Failed to start audio stream:', error);
      throw error;
    }
  }

  async stopAudioStream(streamId: string): Promise<void> {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      this.activeStreams.delete(streamId);
    }

    // Close WebSocket
    const ws = this.websockets.get(streamId);
    if (ws) {
      ws.close();
      this.websockets.delete(streamId);
    }

    // Close AudioContext
    const audioContext = this.audioContexts.get(streamId);
    if (audioContext) {
      await audioContext.close();
      this.audioContexts.delete(streamId);
    }

    // Update stream status
    await this.updateStreamStatus(streamId, 'ended');
  }

  async pauseAudioStream(streamId: string): Promise<void> {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }

    await this.updateStreamStatus(streamId, 'paused');
  }

  async resumeAudioStream(streamId: string): Promise<void> {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    }

    await this.updateStreamStatus(streamId, 'live');
  }

  // =====================================================
  // LIVE TRANSCRIPTION
  // =====================================================

  async startLiveTranscription(
    streamId: string,
    stream: MediaStream,
    onCaption: (caption: LiveCaption) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      // Create WebSocket connection to transcription service
      const apiKey = import.meta.env.VITE_AIML_API_KEY || '';
      const ws = new WebSocket('wss://api.aimlapi.com/v1/realtime');

      ws.onopen = () => {
        console.log('WebSocket connected');
        
        // Send configuration
        ws.send(
          JSON.stringify({
            type: 'configure',
            config: {
              model: 'deepgram-nova-2',
              language: 'en',
              interim_results: true,
              punctuate: true,
              diarize: true,
            },
            apiKey,
          })
        );

        // Start sending audio
        this.streamAudioToWebSocket(streamId, stream, ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'transcript') {
            const caption: LiveCaption = {
              id: `caption_${Date.now()}_${Math.random()}`,
              streamId,
              text: data.text,
              confidence: data.confidence || 0,
              timestamp: Date.now(),
              isFinal: data.is_final || false,
              speakerId: data.speaker_id,
            };

            onCaption(caption);

            // Save final captions to database
            if (caption.isFinal) {
              this.saveLiveCaption(caption);
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        if (onError) {
          onError(new Error('WebSocket connection error'));
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
      };

      this.websockets.set(streamId, ws);
    } catch (error) {
      console.error('Failed to start live transcription:', error);
      if (onError) {
        onError(error as Error);
      }
      throw error;
    }
  }

  private async streamAudioToWebSocket(streamId: string, stream: MediaStream, ws: WebSocket): Promise<void> {
    try {
      const audioContext = new AudioContext({ sampleRate: 16000 });
      this.audioContexts.set(streamId, audioContext);

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          const audioData = event.inputBuffer.getChannelData(0);
          
          // Convert Float32Array to Int16Array
          const int16Data = new Int16Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            int16Data[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
          }

          // Send audio data
          ws.send(int16Data.buffer);
        }
      };
    } catch (error) {
      console.error('Failed to stream audio to WebSocket:', error);
      throw error;
    }
  }

  private async saveLiveCaption(caption: LiveCaption): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return;

      await client.from('live_captions').insert({
        stream_id: caption.streamId,
        text: caption.text,
        confidence: caption.confidence,
        timestamp: caption.timestamp,
        is_final: caption.isFinal,
        speaker_id: caption.speakerId,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save live caption:', error);
    }
  }

  async getLiveCaptions(streamId: string): Promise<LiveCaption[]> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('live_captions')
        .select('*')
        .eq('stream_id', streamId)
        .eq('is_final', true)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data as LiveCaption[];
    } catch (error) {
      console.error('Failed to get live captions:', error);
      throw error;
    }
  }

  // =====================================================
  // VIEWERS
  // =====================================================

  async addViewer(streamId: string, userId: string | undefined, username: string): Promise<StreamViewer> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('stream_viewers')
        .insert({
          stream_id: streamId,
          user_id: userId,
          username,
          joined_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Update viewer count
      await this.updateViewerCount(streamId);

      return data as StreamViewer;
    } catch (error) {
      console.error('Failed to add viewer:', error);
      throw error;
    }
  }

  async removeViewer(viewerId: string): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      // Get stream ID before deleting
      const { data: viewer } = await client
        .from('stream_viewers')
        .select('stream_id')
        .eq('id', viewerId)
        .single();

      const { error } = await client
        .from('stream_viewers')
        .update({ is_active: false })
        .eq('id', viewerId);

      if (error) throw error;

      // Update viewer count
      if (viewer) {
        await this.updateViewerCount(viewer.stream_id);
      }
    } catch (error) {
      console.error('Failed to remove viewer:', error);
      throw error;
    }
  }

  private async updateViewerCount(streamId: string): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return;

      const { count } = await client
        .from('stream_viewers')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', streamId)
        .eq('is_active', true);

      await client
        .from('live_streams')
        .update({ viewer_count: count || 0 })
        .eq('id', streamId);
    } catch (error) {
      console.error('Failed to update viewer count:', error);
    }
  }
}

// Singleton instance
let liveStreamingInstance: LiveStreamingService | null = null;

export function getLiveStreamingService(): LiveStreamingService {
  if (!liveStreamingInstance) {
    liveStreamingInstance = new LiveStreamingService();
  }
  return liveStreamingInstance;
}

export default LiveStreamingService;

