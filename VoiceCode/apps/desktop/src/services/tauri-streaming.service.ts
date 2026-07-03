/**
 * Tauri Streaming Service
 * Bridges backend streaming events to frontend via Tauri's native IPC.
 * Replaces raw WebSocket streaming with Tauri listen/emit for desktop.
 */

import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

/** Event payload from the Rust streaming bridge */
export interface StreamingEvent {
  event_type:
    | 'connected'
    | 'disconnected'
    | 'interim'
    | 'final'
    | 'enhanced'
    | 'audio_level'
    | 'error'
    | 'vad_start'
    | 'vad_end';
  text: string | null;
  is_final: boolean | null;
  confidence: number | null;
  latency_ms: number | null;
  enhanced: boolean | null;
  original_text: string | null;
  audio_level: number | null;
  error: string | null;
}

/** Streaming stats from the backend */
export interface StreamingStats {
  is_streaming: boolean;
  session_id: string | null;
  mode: 'Instant' | 'Enhanced' | 'Hybrid';
  avg_latency_ms: number;
  target_latency_ms: number;
  meeting_target: boolean;
  ws_connected: boolean;
  samples_processed: number;
}

/** Extended stats with STT provider info */
export interface ExtendedStreamingStats extends StreamingStats {
  stt_enabled: boolean;
  available_providers: string[];
}

export type StreamingEventHandler = (event: StreamingEvent) => void;

/**
 * TauriStreamingService - singleton service that connects
 * to the Rust streaming engine via Tauri IPC events.
 */
export class TauriStreamingService {
  private handlers: Set<StreamingEventHandler> = new Set();
  private unlisten: UnlistenFn | null = null;
  private bridgeStarted = false;

  /** Register a handler for streaming events */
  on(handler: StreamingEventHandler): void {
    this.handlers.add(handler);
  }

  /** Unregister a handler */
  off(handler: StreamingEventHandler): void {
    this.handlers.delete(handler);
  }

  /** Initialize the event bridge (call once on app mount) */
  async init(): Promise<void> {
    if (this.bridgeStarted) return;

    // Start the Rust-side event bridge
    await invoke('start_streaming_event_bridge');

    // Listen for streaming events from the backend
    this.unlisten = await listen<StreamingEvent>(
      'streaming-event',
      (event) => {
        const payload = event.payload;
        this.handlers.forEach((handler) => {
          try {
            handler(payload);
          } catch (err) {
            console.error('Streaming event handler error:', err);
          }
        });
      }
    );

    this.bridgeStarted = true;
  }

  /** Start a streaming session */
  async startStreaming(): Promise<string> {
    return invoke<string>('start_streaming_session');
  }

  /** Stop the streaming session */
  async stopStreaming(): Promise<void> {
    return invoke('stop_streaming_session');
  }

  /** Set streaming mode: 'instant' | 'enhanced' | 'hybrid' */
  async setMode(mode: 'instant' | 'enhanced' | 'hybrid'): Promise<void> {
    return invoke('set_streaming_mode', { mode });
  }

  /** Get streaming statistics */
  async getStats(): Promise<StreamingStats> {
    return invoke<StreamingStats>('get_streaming_stats');
  }

  /** Get extended stats including STT provider info */
  async getExtendedStats(): Promise<ExtendedStreamingStats> {
    return invoke<ExtendedStreamingStats>('get_extended_streaming_stats');
  }

  /** Initialize STT providers (Deepgram, Whisper) */
  async initSttProviders(): Promise<void> {
    return invoke('initialize_stt_providers');
  }

  /** Get available STT providers */
  async getSttProviders(): Promise<string[]> {
    return invoke<string[]>('get_stt_providers');
  }

  /** Set the active STT provider */
  async setActiveSttProvider(provider: string): Promise<void> {
    return invoke('set_active_stt_provider', { provider });
  }

  /** Check if real STT is enabled */
  async isRealSttEnabled(): Promise<boolean> {
    return invoke<boolean>('is_real_stt_enabled');
  }

  /** Send an audio chunk to the streaming engine */
  async processAudioChunk(audioData: number[]): Promise<void> {
    return invoke('process_audio_chunk', { audioData });
  }

  /** Cleanup listeners */
  destroy(): void {
    if (this.unlisten) {
      this.unlisten();
      this.unlisten = null;
    }
    this.handlers.clear();
    this.bridgeStarted = false;
  }
}

// Singleton instance
let instance: TauriStreamingService | null = null;

export function getTauriStreamingService(): TauriStreamingService {
  if (!instance) {
    instance = new TauriStreamingService();
  }
  return instance;
}
