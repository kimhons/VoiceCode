/**
 * WebSocket Streaming Service
 * Handles real-time audio streaming for transcription
 */

export interface StreamingOptions {
  language?: string;
  sampleRate?: number;
  encoding?: 'pcm' | 'opus' | 'flac';
  enableInterimResults?: boolean;
  punctuation?: boolean;
  profanityFilter?: boolean;
}

export interface StreamingResult {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
}

export class WebSocketStreamingService {
  private ws: WebSocket | null = null;
  private url: string;
  private options: StreamingOptions;
  private onResult?: (result: StreamingResult) => void;
  private onError?: (error: Error) => void;

  constructor(url: string, options: StreamingOptions = {}) {
    this.url = url;
    this.options = {
      language: 'en-US',
      sampleRate: 16000,
      encoding: 'pcm',
      enableInterimResults: true,
      punctuation: true,
      profanityFilter: false,
      ...options,
    };
  }

  connect(
    onResult: (result: StreamingResult) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.onResult = onResult;
        this.onError = onError;

        this.ws.onopen = () => {
          // Send configuration
          this.ws?.send(JSON.stringify({
            type: 'config',
            config: this.options,
          }));
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'result' && this.onResult) {
              this.onResult({
                text: data.text,
                isFinal: data.isFinal,
                confidence: data.confidence,
                timestamp: Date.now(),
              });
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          const err = new Error('WebSocket error');
          if (this.onError) {
            this.onError(err);
          }
          reject(err);
        };

        this.ws.onclose = () => {
          console.log('WebSocket connection closed');
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(audioData);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let streamingServiceInstance: WebSocketStreamingService | null = null;

export const getStreamingService = (
  url?: string,
  options?: StreamingOptions
): WebSocketStreamingService => {
  if (!streamingServiceInstance && url) {
    streamingServiceInstance = new WebSocketStreamingService(url, options);
  }
  if (!streamingServiceInstance) {
    throw new Error('Streaming service not initialized. Provide URL on first call.');
  }
  return streamingServiceInstance;
};

export const resetStreamingService = (): void => {
  if (streamingServiceInstance) {
    streamingServiceInstance.disconnect();
    streamingServiceInstance = null;
  }
};

