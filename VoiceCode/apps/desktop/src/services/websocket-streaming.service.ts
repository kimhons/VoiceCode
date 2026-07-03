/**
 * WebSocket Streaming Service - Desktop Version
 * Real-time audio streaming for live transcription
 * Supports AIML API Deepgram Nova-2 streaming
 */

// WebSocket Configuration
const WS_BASE_URL = 'wss://api.aimlapi.com/v1/realtime';
const RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL_MS = 30000;

export interface StreamingOptions {
  language?: string;
  model?: string;
  punctuate?: boolean;
  diarize?: boolean;
  interimResults?: boolean;
  professionalMode?: string;
}

export interface StreamingTranscript {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

export type StreamingEventType =
  | 'connected'
  | 'disconnected'
  | 'transcript'
  | 'error'
  | 'status';

export type StreamingEventHandler = (data: StreamingTranscript | { error?: string } | { status?: string } | Record<string, unknown>) => void;

/**
 * WebSocket Streaming Manager
 * Handles real-time audio streaming and transcription
 */
export class WebSocketStreamingService {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isStreaming = false;
  private eventHandlers: Map<StreamingEventType, Set<StreamingEventHandler>> =
    new Map();
  private audioContext: AudioContext | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.initializeEventHandlers();
  }

  private initializeEventHandlers(): void {
    this.eventHandlers.set('connected', new Set());
    this.eventHandlers.set('disconnected', new Set());
    this.eventHandlers.set('transcript', new Set());
    this.eventHandlers.set('error', new Set());
    this.eventHandlers.set('status', new Set());
  }

  on(event: StreamingEventType, handler: StreamingEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.add(handler);
    }
  }

  off(event: StreamingEventType, handler: StreamingEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: StreamingEventType, data: StreamingTranscript | { error?: string } | { status?: string } | Record<string, unknown>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  async connect(options: StreamingOptions = {}): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const url = new URL(WS_BASE_URL);
        url.searchParams.set('language', options.language || 'en');
        url.searchParams.set('model', options.model || '#g1_nova-2-general');
        url.searchParams.set('punctuate', String(options.punctuate !== false));
        url.searchParams.set('diarize', String(options.diarize || false));
        url.searchParams.set(
          'interim_results',
          String(options.interimResults !== false)
        );

        this.ws = new WebSocket(url.toString());

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          this.sendMessage({
            type: 'auth',
            token: this.apiKey,
          });

          this.startPingInterval();
          this.emit('connected', { timestamp: Date.now() });
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', {
            error: 'WebSocket connection error',
            timestamp: Date.now(),
          });
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          this.isConnecting = false;
          this.stopPingInterval();
          this.emit('disconnected', {
            code: event.code,
            reason: event.reason,
            timestamp: Date.now(),
          });

          if (
            event.code !== 1000 &&
            this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS
          ) {
            this.scheduleReconnect(options);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        console.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  private scheduleReconnect(options: StreamingOptions): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect(options).catch((error) => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private startPingInterval(): void {
    this.stopPingInterval();

    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'ping' });
      }
    }, PING_INTERVAL_MS);
  }

  private stopPingInterval(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'auth_success':
          console.log('✅ Authentication successful');
          this.emit('status', {
            status: 'authenticated',
            timestamp: Date.now(),
          });
          break;

        case 'transcript':
        case 'transcription':
          this.handleTranscript(message);
          break;

        case 'error':
          console.error('Server error:', message.error);
          this.emit('error', { error: message.error, timestamp: Date.now() });
          break;

        case 'pong':
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleTranscript(message: { text?: string; transcript?: string; is_final?: boolean; isFinal?: boolean; confidence?: number; timestamp?: number; words?: StreamingTranscript['words'] }): void {
    const transcript: StreamingTranscript = {
      text: message.text || message.transcript || '',
      isFinal: message.is_final || message.isFinal || false,
      confidence: message.confidence || 0.9,
      timestamp: message.timestamp || Date.now(),
      words: message.words || [],
    };

    this.emit('transcript', transcript);
  }

  private sendMessage(message: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  async startStreaming(mediaStream: MediaStream): Promise<void> {
    if (this.isStreaming) {
      console.warn('Already streaming');
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    this.isStreaming = true;

    this.sendMessage({
      type: 'start_listening',
      timestamp: Date.now(),
    });

    await this.initializeAudioProcessing(mediaStream);
    this.emit('status', { status: 'streaming', timestamp: Date.now() });
  }

  private async initializeAudioProcessing(
    mediaStream: MediaStream
  ): Promise<void> {
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    const source = this.audioContext.createMediaStreamSource(mediaStream);
    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (event) => {
      if (!this.isStreaming) return;

      const inputData = event.inputBuffer.getChannelData(0);
      const pcmData = this.float32ToInt16(inputData);
      this.sendAudioChunk(pcmData);
    };

    source.connect(processor);
    processor.connect(this.audioContext.destination);
  }

  private float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  }

  private sendAudioChunk(audioData: Int16Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const base64Audio = this.arrayBufferToBase64(
      audioData.buffer as ArrayBuffer
    );

    this.sendMessage({
      type: 'audio_chunk',
      data: base64Audio,
      timestamp: Date.now(),
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  stopStreaming(): void {
    if (!this.isStreaming) return;

    this.isStreaming = false;

    this.sendMessage({
      type: 'stop_listening',
      timestamp: Date.now(),
    });

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.emit('status', { status: 'stopped', timestamp: Date.now() });
  }

  disconnect(): void {
    this.stopStreaming();
    this.stopPingInterval();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getState(): string {
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

let streamingServiceInstance: WebSocketStreamingService | null = null;

export function getStreamingService(
  apiKey?: string
): WebSocketStreamingService {
  if (!streamingServiceInstance && apiKey) {
    streamingServiceInstance = new WebSocketStreamingService(apiKey);
  }

  if (!streamingServiceInstance) {
    throw new Error(
      'Streaming service not initialized. Provide API key on first call.'
    );
  }

  return streamingServiceInstance;
}
