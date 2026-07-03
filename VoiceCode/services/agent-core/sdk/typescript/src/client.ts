/**
 * VoiceCode Agent SDK - TypeScript Client
 * Unified client for web and mobile applications
 */

import {
  AgentConfig,
  ChatMessage,
  ChatResponse,
  AgentSession,
  StreamChunk,
} from './types';

const DEFAULT_CONFIG: AgentConfig = {
  baseUrl: 'http://localhost:8000',
  wsUrl: 'ws://localhost:8000',
  apiVersion: 'v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

export class VoiceCodeAgent {
  private config: AgentConfig;
  private sessionId: string | null = null;
  private ws: WebSocket | null = null;
  private messageQueue: Array<(response: ChatResponse) => void> = [];
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the agent with authentication
   */
  async initialize(authToken: string): Promise<void> {
    this.config.authToken = authToken;
  }

  /**
   * Send a chat message and get a response
   */
  async chat(
    message: string,
    options: {
      context?: Record<string, any>;
      professionalMode?: 'general' | 'medical' | 'legal' | 'business';
      stream?: boolean;
    } = {}
  ): Promise<ChatResponse> {
    const {
      context = {},
      professionalMode = 'general',
      stream = false,
    } = options;

    if (stream && this.ws?.readyState === WebSocket.OPEN) {
      return this.streamChat(message, context, professionalMode);
    }

    const response = await this.request<ChatResponse>('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        session_id: this.sessionId,
        context,
        professional_mode: professionalMode,
      }),
    });

    this.sessionId = response.session_id;
    return response;
  }

  /**
   * Stream chat response via WebSocket
   */
  private async streamChat(
    message: string,
    context: Record<string, any>,
    professionalMode: string
  ): Promise<ChatResponse> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);

        if (data.type === 'response') {
          this.ws?.removeEventListener('message', handleMessage);
          resolve({
            sessionId: data.session_id,
            message: data.content,
            intent: data.intent,
            toolCalls: data.tool_calls || [],
            suggestions: data.suggestions || [],
            metadata: data.metadata || {},
          });
        } else if (data.type === 'chunk') {
          this.emit('stream', data);
        } else if (data.type === 'thinking') {
          this.emit('thinking', data);
        } else if (data.type === 'error') {
          this.ws?.removeEventListener('message', handleMessage);
          reject(new Error(data.error));
        }
      };

      this.ws.addEventListener('message', handleMessage);

      this.ws.send(
        JSON.stringify({
          type: 'message',
          content: message,
          context,
          professional_mode: professionalMode,
        })
      );
    });
  }

  /**
   * Execute a specific command
   */
  async executeCommand(
    command: string,
    parameters: Record<string, any> = {}
  ): Promise<any> {
    return this.request('/agent/command', {
      method: 'POST',
      body: JSON.stringify({
        command,
        parameters,
        session_id: this.sessionId,
      }),
    });
  }

  /**
   * Search transcripts
   */
  async search(
    query: string,
    options: { limit?: number; filters?: Record<string, any> } = {}
  ): Promise<any> {
    return this.request('/agent/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        limit: options.limit || 10,
        filters: options.filters,
      }),
    });
  }

  /**
   * Get proactive suggestions
   */
  async getSuggestions(): Promise<any> {
    return this.request('/agent/suggestions', { method: 'GET' });
  }

  /**
   * Get session history
   */
  async getSession(sessionId?: string): Promise<AgentSession> {
    const id = sessionId || this.sessionId;
    if (!id) throw new Error('No session ID');
    return this.request(`/agent/session/${id}`, { method: 'GET' });
  }

  /**
   * Connect WebSocket for real-time communication
   */
  async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.sessionId) {
        this.sessionId = this.generateSessionId();
      }

      const wsUrl = `${this.config.wsUrl}/ws/agent/${this.sessionId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.emit('connected', { sessionId: this.sessionId });
        resolve();
      };

      this.ws.onclose = (event) => {
        this.emit('disconnected', { code: event.code, reason: event.reason });
      };

      this.ws.onerror = (error) => {
        this.emit('error', { error });
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach((callback) => callback(data));
  }

  /**
   * Make HTTP request to API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}/api/${this.config.apiVersion}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.config.authToken && {
        Authorization: `Bearer ${this.config.authToken}`,
      }),
      ...options.headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retryAttempts!; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout
        );

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.detail || `HTTP ${response.status}`);
        }

        return response.json();
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.config.retryAttempts! - 1) {
          await this.delay(this.config.retryDelay! * (attempt + 1));
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Set session ID (for resuming sessions)
   */
  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton factory
let defaultClient: VoiceCodeAgent | null = null;

export function getAgentClient(config?: Partial<AgentConfig>): VoiceCodeAgent {
  if (!defaultClient) {
    defaultClient = new VoiceCodeAgent(config);
  }
  return defaultClient;
}

export default VoiceCodeAgent;
