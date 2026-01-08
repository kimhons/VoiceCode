/**
 * AIML API Service
 * Unified gateway to 300+ AI models for VoiceFlow Pro
 * Provides STT, TTS, Chat, Image, Video, and OCR capabilities
 */

// import { TranscriptionSegment } from '@/types'; // TODO: Use for segment analysis

// AIML API Configuration
const AIML_API_KEY = import.meta.env.VITE_AIML_API_KEY || '';
const AIML_BASE_URL = import.meta.env.VITE_AIML_BASE_URL || 'https://api.aimlapi.com/v1';

// Retry Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 30000;

// Rate Limiting Configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;

// API Key Validation
if (!AIML_API_KEY || AIML_API_KEY === 'your_api_key_here') {
  console.warn('⚠️ AIML API key not configured. Please set VITE_AIML_API_KEY in .env.local');
}

// Professional Mode to Model Mapping
export enum ProfessionalMode {
  MEDICAL = 'medical',
  DEVELOPER = 'developer',
  BUSINESS = 'business',
  LEGAL = 'legal',
  EDUCATION = 'education',
  GENERAL = 'general',
}

export const STT_MODEL_MAP: Record<ProfessionalMode, string> = {
  [ProfessionalMode.MEDICAL]: '#g1_nova-2-medical',
  [ProfessionalMode.BUSINESS]: '#g1_nova-2-meeting',
  [ProfessionalMode.DEVELOPER]: '#g1_nova-2-general',
  [ProfessionalMode.LEGAL]: '#g1_nova-2-general',
  [ProfessionalMode.EDUCATION]: '#g1_nova-2-general',
  [ProfessionalMode.GENERAL]: '#g1_nova-2-general',
};

export const CHAT_MODEL_MAP: Record<ProfessionalMode, string> = {
  [ProfessionalMode.MEDICAL]: 'gpt-5',
  [ProfessionalMode.BUSINESS]: 'gpt-5',
  [ProfessionalMode.DEVELOPER]: 'claude-4.5-sonnet',
  [ProfessionalMode.LEGAL]: 'gpt-5',
  [ProfessionalMode.EDUCATION]: 'gemini-2.5-flash',
  [ProfessionalMode.GENERAL]: 'gpt-4o',
};

// Types
export interface STTOptions {
  model?: string;
  language?: string;
  diarize?: boolean;
  punctuate?: boolean;
  detectEntities?: boolean;
  sentiment?: boolean;
  summarize?: boolean;
  professionalMode?: ProfessionalMode;
}

export interface STTResult {
  transcript: string;
  confidence: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  speakers?: Array<{
    speaker: number;
    text: string;
    start: number;
    end: number;
  }>;
  entities?: Array<{
    type: string;
    text: string;
    confidence: number;
  }>;
  sentiment?: {
    overall: string;
    score: number;
  };
  summary?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  professionalMode?: ProfessionalMode;
}

export interface TTSOptions {
  model?: string;
  voice?: string;
  speed?: number;
}

/**
 * Custom Error Classes
 */
export class AIMLAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIMLAPIError';
  }
}

export class RateLimitError extends AIMLAPIError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends AIMLAPIError {
  constructor(message: string) {
    super(message, 400, false);
    this.name = 'ValidationError';
  }
}

/**
 * Rate Limiter Class
 */
class RateLimiter {
  private requests: number[] = [];

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
    return this.requests.length < MAX_REQUESTS_PER_WINDOW;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getWaitTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    const waitTime = RATE_LIMIT_WINDOW_MS - (Date.now() - oldestRequest);
    return Math.max(0, waitTime);
  }
}

/**
 * AIML API Service Class
 */
export class AIMLAPIService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly rateLimiter: RateLimiter;

  constructor(apiKey: string = AIML_API_KEY, baseUrl: string = AIML_BASE_URL) {
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new ValidationError('AIML API key is required. Please set VITE_AIML_API_KEY in .env.local');
    }
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Retry logic with exponential backoff
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = MAX_RETRIES,
    delay: number = RETRY_DELAY_MS
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;

      const isRetryable = error instanceof AIMLAPIError && error.retryable;
      if (!isRetryable) throw error;

      console.warn(`Retrying request in ${delay}ms... (${retries} retries left)`);
      await this.sleep(delay);
      return this.retryWithBackoff(fn, retries - 1, delay * 2);
    }
  }

  /**
   * Make API request with timeout and error handling
   */
  private async makeRequest<T>(
    url: string,
    options: RequestInit,
    timeout: number = REQUEST_TIMEOUT_MS
  ): Promise<T> {
    // Check rate limit
    if (!this.rateLimiter.canMakeRequest()) {
      const waitTime = this.rateLimiter.getWaitTime();
      throw new RateLimitError(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)}s`);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      this.rateLimiter.recordRequest();

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;

        // Determine if error is retryable
        const retryable = response.status >= 500 || response.status === 429;

        if (response.status === 429) {
          throw new RateLimitError(errorMessage);
        }

        throw new AIMLAPIError(
          `API error: ${errorMessage}`,
          response.status,
          retryable
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AIMLAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new AIMLAPIError('Request timeout', 408, true);
        }
        throw new AIMLAPIError(error.message, undefined, false);
      }

      throw new AIMLAPIError('Unknown error occurred', undefined, false);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Speech-to-Text using Deepgram Nova-2
   */
  async transcribeAudio(
    audioBlob: Blob,
    options: STTOptions = {}
  ): Promise<STTResult> {
    // Validate input
    if (!audioBlob || audioBlob.size === 0) {
      throw new ValidationError('Audio blob is empty or invalid');
    }

    if (audioBlob.size > 25 * 1024 * 1024) { // 25MB limit
      throw new ValidationError('Audio file too large. Maximum size is 25MB');
    }

    return this.retryWithBackoff(async () => {
      const {
        model,
        language = 'en',
        diarize = false,
        punctuate = true,
        detectEntities = false,
        sentiment = false,
        summarize = false,
        professionalMode = ProfessionalMode.GENERAL,
      } = options;

      // Select model based on professional mode
      const selectedModel = model || STT_MODEL_MAP[professionalMode];

      // Convert blob to base64
      const base64Audio = await this.blobToBase64(audioBlob);

      // Create STT request
      const data = await this.makeRequest<{ generation_id: string }>(
        `${this.baseUrl}/stt/create`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            audio: base64Audio,
            language,
            diarize,
            punctuate,
            detect_entities: detectEntities,
            sentiment,
            summarize: summarize ? 'v2' : undefined,
          }),
        }
      );

      const generationId = data.generation_id;

      if (!generationId) {
        throw new AIMLAPIError('No generation ID returned from API', undefined, false);
      }

      // Poll for result
      const result = await this.pollSTTResult(generationId);

      return this.parseSTTResult(result);
    });
  }

  /**
   * Real-time streaming transcription using WebSocket
   */
  async transcribeAudioStream(
    audioStream: MediaStream,
    options: STTOptions | undefined,
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): Promise<() => void> {
    const { getStreamingService } = await import('./websocket-streaming.service');

    try {
      const streamingService = getStreamingService(this.apiKey);

      // Register transcript handler
      const transcriptHandler = (data: any) => {
        onTranscript(data.text, data.isFinal);
      };

      // Register error handler
      const errorHandler = (data: any) => {
        if (onError) {
          onError(data.error || 'Streaming error');
        }
      };

      streamingService.on('transcript', transcriptHandler);
      streamingService.on('error', errorHandler);

      // Connect to WebSocket
      const opts = options || {};
      await streamingService.connect({
        language: opts.language || 'en',
        model: opts.model,
        punctuate: opts.punctuate,
        diarize: opts.diarize,
        interimResults: true,
        professionalMode: opts.professionalMode,
      });

      // Start streaming audio
      await streamingService.startStreaming(audioStream);

      // Return cleanup function
      return () => {
        streamingService.off('transcript', transcriptHandler);
        streamingService.off('error', errorHandler);
        streamingService.stopStreaming();
      };

    } catch (error) {
      console.error('Failed to start streaming:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Failed to start streaming');
      }
      throw error;
    }
  }

  /**
   * Chat completion using GPT-5, Claude, or other models
   */
  async chatCompletion(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<string> {
    try {
      const {
        model,
        temperature = 0.7,
        maxTokens = 2000,
        professionalMode = ProfessionalMode.GENERAL,
      } = options;

      const selectedModel = model || CHAT_MODEL_MAP[professionalMode];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AIML Chat Error:', error);
      throw error;
    }
  }

  /**
   * Text-to-Speech using OpenAI TTS or ElevenLabs
   */
  async textToSpeech(
    text: string,
    options: TTSOptions = {}
  ): Promise<Blob> {
    try {
      const {
        model = 'tts-1-hd',
        voice = 'alloy',
        speed = 1,
      } = options;

      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          voice,
          input: text,
          speed,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('AIML TTS Error:', error);
      throw error;
    }
  }

  /**
   * Smart formatting using AI
   */
  async formatTranscript(
    transcript: string,
    professionalMode: ProfessionalMode
  ): Promise<string> {
    const systemPrompts: Record<ProfessionalMode, string> = {
      [ProfessionalMode.MEDICAL]: 
        'Format this medical consultation as SOAP notes (Subjective, Objective, Assessment, Plan). Include ICD-10 codes where applicable.',
      [ProfessionalMode.BUSINESS]: 
        'Format this business meeting transcript with: 1) Summary, 2) Key Discussion Points, 3) Action Items with owners, 4) Decisions Made.',
      [ProfessionalMode.DEVELOPER]: 
        'Format this technical discussion with: 1) Code snippets properly formatted, 2) Technical decisions, 3) Implementation tasks, 4) Architecture notes.',
      [ProfessionalMode.LEGAL]: 
        'Format this legal discussion with: 1) Case summary, 2) Legal issues, 3) Arguments, 4) Action items, 5) Relevant citations.',
      [ProfessionalMode.EDUCATION]: 
        'Format this lecture/lesson with: 1) Main topics, 2) Key concepts, 3) Examples, 4) Study questions, 5) Summary.',
      [ProfessionalMode.GENERAL]: 
        'Format this transcript with proper paragraphs, punctuation, and structure. Make it easy to read.',
    };

    return await this.chatCompletion(
      [
        { role: 'system', content: systemPrompts[professionalMode] },
        { role: 'user', content: transcript },
      ],
      { professionalMode }
    );
  }

  /**
   * Extract action items from transcript
   */
  async extractActionItems(transcript: string): Promise<Array<{
    task: string;
    owner?: string;
    deadline?: string;
    priority?: string;
  }>> {
    const response = await this.chatCompletion([
      {
        role: 'system',
        content: 'Extract action items from this transcript. Return as JSON array with fields: task, owner, deadline, priority. Only return the JSON array, no other text.',
      },
      { role: 'user', content: transcript },
    ]);

    try {
      return JSON.parse(response);
    } catch {
      return [];
    }
  }

  /**
   * Summarize transcript
   */
  async summarizeTranscript(
    transcript: string,
    professionalMode: ProfessionalMode
  ): Promise<string> {
    return await this.chatCompletion(
      [
        {
          role: 'system',
          content: `Provide a concise summary of this ${professionalMode} transcript. Focus on key points and important information.`,
        },
        { role: 'user', content: transcript },
      ],
      { professionalMode }
    );
  }

  /**
   * Translate transcript
   */
  async translateTranscript(
    transcript: string,
    targetLanguage: string
  ): Promise<string> {
    return await this.chatCompletion([
      {
        role: 'system',
        content: `Translate this text to ${targetLanguage}. Preserve technical terminology and formatting.`,
      },
      { role: 'user', content: transcript },
    ]);
  }

  // Helper methods

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async pollSTTResult(generationId: string, maxAttempts = 60): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${this.baseUrl}/stt/${generationId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`STT polling error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'completed') {
        return data;
      } else if (data.status === 'failed') {
        throw new Error(`STT failed: ${data.error}`);
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('STT timeout: transcription took too long');
  }

  private parseSTTResult(result: any): STTResult {
    const channel = result.result?.results?.channels?.[0];
    const alternative = channel?.alternatives?.[0];

    return {
      transcript: alternative?.transcript || '',
      confidence: alternative?.confidence || 0,
      words: alternative?.words?.map((w: any) => ({
        word: w.word,
        start: w.start,
        end: w.end,
        confidence: w.confidence,
      })),
      speakers: channel?.speakers?.map((s: any) => ({
        speaker: s.speaker,
        text: s.text,
        start: s.start,
        end: s.end,
      })),
      entities: result.result?.entities,
      sentiment: result.result?.sentiment,
      summary: result.result?.summary,
    };
  }
}

// Export singleton instance
export const aimlService = new AIMLAPIService();

