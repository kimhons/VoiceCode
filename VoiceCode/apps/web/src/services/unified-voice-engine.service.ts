/**
 * Unified Voice Engine Service
 * Provides a single interface for both local (Whisper.js) and cloud (AIML API) transcription
 * Automatically falls back to local processing if cloud fails
 */

import { AIMLAPIService, STTOptions, STTResult, AIMLAPIError } from './aiml-api.service';

export enum TranscriptionEngine {
  AUTO = 'auto',
  CLOUD = 'cloud', // AIML API
  LOCAL = 'local', // Whisper.js or Web Speech API
}

export interface UnifiedSTTOptions extends STTOptions {
  engine?: TranscriptionEngine;
  fallbackToLocal?: boolean;
  trackUsage?: boolean;
}

export interface TranscriptionUsage {
  engine: 'cloud' | 'local';
  duration: number; // seconds
  cost: number; // USD
  timestamp: Date;
  success: boolean;
  error?: string;
}

export interface UsageStats {
  totalRequests: number;
  cloudRequests: number;
  localRequests: number;
  totalCost: number;
  totalDuration: number;
  successRate: number;
  averageResponseTime: number;
}

/**
 * Unified Voice Engine Class
 */
export class UnifiedVoiceEngine {
  private aimlService: AIMLAPIService | null = null;
  private usageHistory: TranscriptionUsage[] = [];
  private readonly CLOUD_COST_PER_MINUTE = 0.005; // $0.005/min for AIML API
  private readonly LOCAL_COST_PER_MINUTE = 0; // Free

  constructor() {
    try {
      this.aimlService = new AIMLAPIService();
    } catch (error) {
      console.warn('AIML API not available, will use local processing only:', error);
      this.aimlService = null;
    }

    // Load usage history from localStorage
    this.loadUsageHistory();
  }

  /**
   * Transcribe audio using the best available engine
   */
  async transcribe(
    audioBlob: Blob,
    options: UnifiedSTTOptions = {}
  ): Promise<STTResult> {
    const {
      engine = TranscriptionEngine.AUTO,
      fallbackToLocal = true,
      trackUsage = true,
      ...sttOptions
    } = options;

    const startTime = Date.now();
    let selectedEngine: 'cloud' | 'local' = 'cloud';
    let result: STTResult;
    let error: Error | undefined;

    try {
      // Determine which engine to use
      if (engine === TranscriptionEngine.LOCAL) {
        selectedEngine = 'local';
        result = await this.transcribeLocal(audioBlob, sttOptions);
      } else if (engine === TranscriptionEngine.CLOUD) {
        selectedEngine = 'cloud';
        result = await this.transcribeCloud(audioBlob, sttOptions);
      } else {
        // AUTO: Try cloud first, fallback to local
        try {
          selectedEngine = 'cloud';
          result = await this.transcribeCloud(audioBlob, sttOptions);
        } catch (cloudError) {
          console.warn('Cloud transcription failed, falling back to local:', cloudError);
          if (fallbackToLocal) {
            selectedEngine = 'local';
            result = await this.transcribeLocal(audioBlob, sttOptions);
          } else {
            throw cloudError;
          }
        }
      }

      // Track usage
      if (trackUsage) {
        const duration = (Date.now() - startTime) / 1000;
        const audioDuration = await this.getAudioDuration(audioBlob);
        const cost = this.calculateCost(selectedEngine, audioDuration);

        this.recordUsage({
          engine: selectedEngine,
          duration: audioDuration,
          cost,
          timestamp: new Date(),
          success: true,
        });
      }

      return result;
    } catch (err) {
      error = err as Error;

      // Track failed usage
      if (trackUsage) {
        const audioDuration = await this.getAudioDuration(audioBlob);
        const cost = this.calculateCost(selectedEngine, audioDuration);

        this.recordUsage({
          engine: selectedEngine,
          duration: audioDuration,
          cost: 0, // No cost for failed requests
          timestamp: new Date(),
          success: false,
          error: error.message,
        });
      }

      throw error;
    }
  }

  /**
   * Transcribe using AIML API (cloud)
   */
  private async transcribeCloud(
    audioBlob: Blob,
    options: STTOptions
  ): Promise<STTResult> {
    if (!this.aimlService) {
      throw new Error('AIML API service not available');
    }

    return await this.aimlService.transcribeAudio(audioBlob, options);
  }

  /**
   * Transcribe using local engine (Whisper.js or Web Speech API)
   */
  private async transcribeLocal(
    audioBlob: Blob,
    options: STTOptions
  ): Promise<STTResult> {
    // Check if Web Speech API is available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      return await this.transcribeWithWebSpeech(audioBlob, options);
    }

    // Fallback to basic transcription
    console.warn('No local transcription engine available');
    return {
      transcript: '[Local transcription not available. Please configure AIML API.]',
      confidence: 0,
    };
  }

  /**
   * Transcribe using Web Speech API
   */
  private async transcribeWithWebSpeech(
    audioBlob: Blob,
    options: STTOptions
  ): Promise<STTResult> {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = options.language || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const result = event.results[0];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        resolve({
          transcript,
          confidence,
        });
      };

      recognition.onerror = (event: any) => {
        reject(new Error(`Web Speech API error: ${event.error}`));
      };

      // Convert blob to audio element and play (required for Web Speech API)
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.onloadedmetadata = () => {
        recognition.start();
      };
      audio.load();
    });
  }

  /**
   * Get audio duration in seconds
   */
  private async getAudioDuration(audioBlob: Blob): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
        URL.revokeObjectURL(audio.src);
      };
      audio.onerror = () => {
        // Estimate based on file size (rough approximation)
        const estimatedDuration = audioBlob.size / (16000 * 2); // Assuming 16kHz, 16-bit
        resolve(estimatedDuration);
      };
      audio.load();
    });
  }

  /**
   * Calculate cost based on engine and duration
   */
  private calculateCost(engine: 'cloud' | 'local', durationSeconds: number): number {
    const durationMinutes = durationSeconds / 60;
    if (engine === 'cloud') {
      return durationMinutes * this.CLOUD_COST_PER_MINUTE;
    }
    return this.LOCAL_COST_PER_MINUTE;
  }

  /**
   * Record usage for tracking
   */
  private recordUsage(usage: TranscriptionUsage): void {
    this.usageHistory.push(usage);

    // Keep only last 1000 records
    if (this.usageHistory.length > 1000) {
      this.usageHistory = this.usageHistory.slice(-1000);
    }

    // Save to localStorage
    try {
      localStorage.setItem('voiceflow_usage_history', JSON.stringify(this.usageHistory));
    } catch (error) {
      console.warn('Failed to save usage history:', error);
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): UsageStats {
    const totalRequests = this.usageHistory.length;
    const cloudRequests = this.usageHistory.filter(u => u.engine === 'cloud').length;
    const localRequests = this.usageHistory.filter(u => u.engine === 'local').length;
    const totalCost = this.usageHistory.reduce((sum, u) => sum + u.cost, 0);
    const totalDuration = this.usageHistory.reduce((sum, u) => sum + u.duration, 0);
    const successfulRequests = this.usageHistory.filter(u => u.success).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    // Calculate average response time (for successful requests)
    const successfulUsage = this.usageHistory.filter(u => u.success);
    const averageResponseTime = successfulUsage.length > 0
      ? successfulUsage.reduce((sum, u) => sum + u.duration, 0) / successfulUsage.length
      : 0;

    return {
      totalRequests,
      cloudRequests,
      localRequests,
      totalCost,
      totalDuration,
      successRate,
      averageResponseTime,
    };
  }

  /**
   * Get usage history
   */
  getUsageHistory(): TranscriptionUsage[] {
    return [...this.usageHistory];
  }

  /**
   * Clear usage history
   */
  clearUsageHistory(): void {
    this.usageHistory = [];
    try {
      localStorage.removeItem('voiceflow_usage_history');
    } catch (error) {
      console.warn('Failed to clear usage history:', error);
    }
  }

  /**
   * Load usage history from localStorage
   */
  private loadUsageHistory(): void {
    try {
      const saved = localStorage.getItem('voiceflow_usage_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        this.usageHistory = parsed.map((usage: any) => ({
          ...usage,
          timestamp: new Date(usage.timestamp),
        }));
      }
    } catch (error) {
      console.warn('Failed to load usage history:', error);
      this.usageHistory = [];
    }
  }

  /**
   * Check if cloud engine is available
   */
  isCloudAvailable(): boolean {
    return !!this.aimlService;
  }

  /**
   * Check if local engine is available
   */
  isLocalAvailable(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Get recommended engine based on availability and cost
   */
  getRecommendedEngine(): TranscriptionEngine {
    if (this.isCloudAvailable()) {
      return TranscriptionEngine.CLOUD;
    } else if (this.isLocalAvailable()) {
      return TranscriptionEngine.LOCAL;
    }
    return TranscriptionEngine.AUTO;
  }
}

// Export singleton instance
export const unifiedVoiceEngine = new UnifiedVoiceEngine();

