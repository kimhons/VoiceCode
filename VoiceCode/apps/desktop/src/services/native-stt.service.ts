/**
 * Native STT Service
 *
 * Wraps native Deepgram/Whisper STT providers exposed by Tauri backend.
 * Replaces Web Speech API for cross-platform dictation with better accuracy.
 */

import { invoke } from '@tauri-apps/api/tauri';

export type SttProviderType = 'deepgram' | 'whisper' | 'local';

export interface SttSettings {
  provider: SttProviderType;
  language: string;
  enable_streaming: boolean;
  vocabulary_boost: string[];
  punctuate: boolean;
  interim_results: boolean;
}

export interface ProviderStatus {
  name: string;
  available: boolean;
  has_api_key: boolean;
  supports_streaming: boolean;
  estimated_latency_ms: number;
}

export interface WordInfo {
  word: string;
  start_ms: number;
  end_ms: number;
  confidence: number;
}

export interface TranscriptionResponse {
  success: boolean;
  text: string;
  confidence: number;
  words: WordInfo[];
  provider: string;
  latency_ms: number;
  detected_language: string | null;
  error: string | null;
}

export interface NativeSttEvents {
  onTranscription: (result: TranscriptionResponse) => void;
  onInterimResult: (text: string) => void;
  onError: (error: string) => void;
  onStatusChange: (status: 'idle' | 'listening' | 'processing') => void;
}

class NativeSttService {
  private isListening = false;
  private events: Partial<NativeSttEvents> = {};

  /**
   * Initialize the native STT system with API keys.
   * Keys are stored securely in the backend.
   */
  async initialize(deepgramKey?: string, openaiKey?: string): Promise<boolean> {
    try {
      const result = await invoke<boolean>('init_stt', {
        deepgram_key: deepgramKey,
        openai_key: openaiKey,
      });
      return result;
    } catch (error) {
      console.error('Failed to initialize native STT:', error);
      return false;
    }
  }

  /**
   * Set API key for a specific provider (secure storage in backend)
   */
  async setApiKey(provider: SttProviderType, apiKey: string): Promise<boolean> {
    try {
      return await invoke<boolean>('set_stt_api_key', {
        provider,
        api_key: apiKey,
      });
    } catch (error) {
      console.error(`Failed to set ${provider} API key:`, error);
      return false;
    }
  }

  /**
   * Get available STT providers and their status
   */
  async getProviders(): Promise<ProviderStatus[]> {
    try {
      return await invoke<ProviderStatus[]>('get_native_stt_providers');
    } catch (error) {
      console.error('Failed to get STT providers:', error);
      return [];
    }
  }

  /**
   * Set the active STT provider
   */
  async setProvider(provider: SttProviderType): Promise<boolean> {
    try {
      return await invoke<boolean>('set_stt_provider', { provider });
    } catch (error) {
      console.error(`Failed to set STT provider to ${provider}:`, error);
      return false;
    }
  }

  /**
   * Get current STT settings
   */
  async getSettings(): Promise<SttSettings> {
    try {
      return await invoke<SttSettings>('get_stt_settings');
    } catch (error) {
      console.error('Failed to get STT settings:', error);
      return {
        provider: 'deepgram',
        language: 'en-US',
        enable_streaming: true,
        vocabulary_boost: [],
        punctuate: true,
        interim_results: true,
      };
    }
  }

  /**
   * Update STT settings
   */
  async updateSettings(settings: SttSettings): Promise<boolean> {
    try {
      return await invoke<boolean>('update_stt_settings', { settings });
    } catch (error) {
      console.error('Failed to update STT settings:', error);
      return false;
    }
  }

  /**
   * Check which API keys are configured (without exposing the keys)
   */
  async checkApiKeys(): Promise<Record<string, boolean>> {
    try {
      return await invoke<Record<string, boolean>>('check_stt_api_keys');
    } catch (error) {
      console.error('Failed to check API keys:', error);
      return { deepgram: false, openai: false };
    }
  }

  /**
   * Transcribe audio file
   */
  async transcribeFile(
    filePath: string,
    language?: string
  ): Promise<TranscriptionResponse> {
    try {
      return await invoke<TranscriptionResponse>('transcribe_audio_file', {
        file_path: filePath,
        language,
      });
    } catch (error) {
      console.error('Transcription failed:', error);
      return {
        success: false,
        text: '',
        confidence: 0,
        words: [],
        provider: '',
        latency_ms: 0,
        detected_language: null,
        error: String(error),
      };
    }
  }

  /**
   * Transcribe audio bytes
   */
  async transcribeBytes(
    audioData: Uint8Array,
    format: string,
    sampleRate: number,
    language?: string
  ): Promise<TranscriptionResponse> {
    try {
      return await invoke<TranscriptionResponse>('transcribe_audio_bytes', {
        audio_data: Array.from(audioData),
        format,
        sample_rate: sampleRate,
        language,
      });
    } catch (error) {
      console.error('Transcription failed:', error);
      return {
        success: false,
        text: '',
        confidence: 0,
        words: [],
        provider: '',
        latency_ms: 0,
        detected_language: null,
        error: String(error),
      };
    }
  }

  /**
   * Start listening for voice input using native audio capture + STT
   */
  async startListening(events: Partial<NativeSttEvents>): Promise<boolean> {
    if (this.isListening) {
      return true;
    }

    this.events = events;
    this.isListening = true;
    events.onStatusChange?.('listening');

    try {
      // Initialize audio capture
      await invoke('init_audio');

      // Start recording
      await invoke('start_recording');

      return true;
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.isListening = false;
      events.onError?.(String(error));
      events.onStatusChange?.('idle');
      return false;
    }
  }

  /**
   * Stop listening and process the recorded audio
   */
  async stopListening(): Promise<TranscriptionResponse | null> {
    if (!this.isListening) {
      return null;
    }

    this.events.onStatusChange?.('processing');

    try {
      // Stop recording and get the file
      const result = await invoke<{
        success: boolean;
        file_path: string | null;
        duration_ms: number | null;
        error: string | null;
      }>('stop_recording');

      this.isListening = false;

      if (!result.success || !result.file_path) {
        this.events.onError?.(result.error || 'Recording failed');
        this.events.onStatusChange?.('idle');
        return null;
      }

      // Transcribe the recorded audio
      const transcription = await this.transcribeFile(result.file_path);

      if (transcription.success) {
        this.events.onTranscription?.(transcription);
      } else {
        this.events.onError?.(transcription.error || 'Transcription failed');
      }

      this.events.onStatusChange?.('idle');
      return transcription;
    } catch (error) {
      console.error('Failed to stop listening:', error);
      this.isListening = false;
      this.events.onError?.(String(error));
      this.events.onStatusChange?.('idle');
      return null;
    }
  }

  /**
   * Cancel listening without processing
   */
  async cancelListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      await invoke('cancel_recording');
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }

    this.isListening = false;
    this.events.onStatusChange?.('idle');
  }

  /**
   * Check if native STT is available (at least one provider configured)
   */
  async isAvailable(): Promise<boolean> {
    const providers = await this.getProviders();
    return providers.some((p) => p.available);
  }

  /**
   * Get the best available provider
   */
  async getBestProvider(): Promise<SttProviderType | null> {
    const providers = await this.getProviders();

    // Prefer Deepgram for streaming support
    const deepgram = providers.find(
      (p) => p.name === 'deepgram' && p.available
    );
    if (deepgram) return 'deepgram';

    // Fallback to Whisper
    const whisper = providers.find((p) => p.name === 'whisper' && p.available);
    if (whisper) return 'whisper';

    // Local as last resort
    const local = providers.find((p) => p.name === 'local' && p.available);
    if (local) return 'local';

    return null;
  }

  get listening(): boolean {
    return this.isListening;
  }
}

export const nativeSttService = new NativeSttService();
export default nativeSttService;
