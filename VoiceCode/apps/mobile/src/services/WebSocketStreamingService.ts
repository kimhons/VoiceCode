/**
 * WebSocket Streaming Service - React Native Mobile Version
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

export type StreamingEventHandler = (data: any) => void;

/**
 * WebSocket Streaming Manager for React Native
 * Handles real-time audio streaming and transcription
 */
export class WebSocketStreamingService {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private isConnecting = false;
  private isStreaming = false;
  private eventHandlers: Map<StreamingEventType, Set<StreamingEventHandler>> = new Map();

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

  private emit(event: StreamingEventType, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
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
        // Build WebSocket URL with query parameters
        const params = new URLSearchParams({
          language: options.language || 'en',
          model: options.model || '#g1_nova-2-general',
          punctuate: String(options.punctuate !== false),
          diarize: String(options.diarize || false),
          interim_results: String(options.interimResults !== false),
        });

        const url = `${WS_BASE_URL}?${params.toString()}`;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Authenticate
          this.sendMessage({
            type: 'auth',
            token: this.apiKey,
          });

          // Start ping interval
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
          this.emit('error', { error: 'WebSocket connection error', timestamp: Date.now() });
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          this.isConnecting = false;
          this.stopPingInterval();
          this.emit('disconnected', { code: event.code, reason: event.reason, timestamp: Date.now() });

          // Attempt reconnection if not a clean close
          if (event.code !== 1000 && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
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
    const delay = RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(options).catch(error => {
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
          this.emit('status', { status: 'authenticated', timestamp: Date.now() });
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
          // Ping response received
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleTranscript(message: any): void {
    const transcript: StreamingTranscript = {
      text: message.text || message.transcript || '',
      isFinal: message.is_final || message.isFinal || false,
      confidence: message.confidence || 0.9,
      timestamp: message.timestamp || Date.now(),
      words: message.words || [],
    };

    this.emit('transcript', transcript);
  }

  private sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  /**
   * Start streaming audio chunks
   * Note: In React Native, audio chunks should be sent from the recording service
   */
  startStreaming(): void {
    if (this.isStreaming) {
      console.warn('Already streaming');
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected. Call connect() first.');
    }

    this.isStreaming = true;

    // Send start command
    this.sendMessage({
      type: 'start_listening',
      timestamp: Date.now(),
    });

    this.emit('status', { status: 'streaming', timestamp: Date.now() });
  }

  /**
   * Send audio chunk to server
   * @param audioData - Base64 encoded audio data or raw audio buffer
   */
  sendAudioChunk(audioData: string | ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send audio: WebSocket not connected');
      return;
    }

    if (!this.isStreaming) {
      console.warn('Cannot send audio: Not streaming');
      return;
    }

    let base64Audio: string;

    if (typeof audioData === 'string') {
      // Already base64 encoded
      base64Audio = audioData;
    } else {
      // Convert ArrayBuffer to base64
      base64Audio = this.arrayBufferToBase64(audioData);
    }

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
    // Note: btoa is not available in React Native, use a polyfill or library
    // For now, we'll use a simple implementation
    return this.base64Encode(binary);
  }

  private base64Encode(str: string): string {
    // Simple base64 encoding for React Native
    // In production, use a library like 'base-64' or 'react-native-base64'
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;

    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;

      const bitmap = (a << 16) | (b << 8) | c;

      result += chars[(bitmap >> 18) & 63];
      result += chars[(bitmap >> 12) & 63];
      result += i - 2 < str.length ? chars[(bitmap >> 6) & 63] : '=';
      result += i - 1 < str.length ? chars[bitmap & 63] : '=';
    }

    return result;
  }

  stopStreaming(): void {
    if (!this.isStreaming) return;

    this.isStreaming = false;

    // Send stop command
    this.sendMessage({
      type: 'stop_listening',
      timestamp: Date.now(),
    });

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

  getIsStreaming(): boolean {
    return this.isStreaming;
  }

  getState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }
}

// Export singleton instance
let streamingServiceInstance: WebSocketStreamingService | null = null;

export function getStreamingService(apiKey?: string): WebSocketStreamingService {
  if (!streamingServiceInstance && apiKey) {
    streamingServiceInstance = new WebSocketStreamingService(apiKey);
  }
  
  if (!streamingServiceInstance) {
    throw new Error('Streaming service not initialized. Provide API key on first call.');
  }
  
  return streamingServiceInstance;
}

