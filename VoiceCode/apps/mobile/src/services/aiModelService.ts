/**
 * AI Model Service
 * Phase 3 Week 10 Day 64-65: AI Model Management
 * 
 * Manages AI model selection, comparison, and configuration
 */

import { supabase } from './supabase.service';

export type AIProvider = 'openai' | 'anthropic' | 'google';
export type AIModelType = 'transcription' | 'analysis' | 'both';
export type ModelSpeed = 'slow' | 'medium' | 'fast' | 'very_fast';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  type: AIModelType;
  accuracy: number; // 0-100
  speed: ModelSpeed;
  cost_per_minute: number;
  features: string[];
  languages: string[];
  max_audio_length: number; // in minutes
  description: string;
  icon: string;
  color: string;
  is_available: boolean;
  requires_api_key: boolean;
}

export interface ModelComparison {
  models: AIModel[];
  comparison_matrix: {
    feature: string;
    values: Record<string, string | number | boolean>;
  }[];
  recommendation: string;
  cost_difference: number;
}

export interface ModelBenchmark {
  model_id: string;
  metric: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface ModelUsageStats {
  model_id: string;
  total_minutes: number;
  total_requests: number;
  total_cost: number;
  average_accuracy: number;
  error_rate: number;
  period_start: string;
  period_end: string;
}

export interface ModelCostAnalysis {
  model_id: string;
  current_cost: number;
  projected_monthly_cost: number;
  cost_breakdown: {
    transcription: number;
    analysis: number;
    training: number;
  };
  savings_opportunities: {
    description: string;
    potential_savings: number;
  }[];
  recommendations: string[];
}

export interface ModelConfig {
  model_id: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  custom_prompt?: string;
  language?: string;
  auto_detect_language?: boolean;
}

class AIModelService {
  /**
   * Get list of available AI models
   */
  async getAvailableModels(): Promise<AIModel[]> {
    // Mock data - replace with actual API call
    const models: AIModel[] = [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        type: 'both',
        accuracy: 95,
        speed: 'medium',
        cost_per_minute: 0.03,
        features: ['Transcription', 'Summarization', 'Analysis', 'Translation', 'Q&A'],
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh'],
        max_audio_length: 120,
        description: 'Most capable model for complex transcription and analysis tasks',
        icon: '🤖',
        color: '#10A37F',
        is_available: true,
        requires_api_key: true,
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        type: 'analysis',
        accuracy: 96,
        speed: 'fast',
        cost_per_minute: 0.025,
        features: ['Summarization', 'Analysis', 'Key Points', 'Action Items', 'Long Context'],
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
        max_audio_length: 180,
        description: 'Best for long-form content analysis and detailed summaries',
        icon: '🧠',
        color: '#CC785C',
        is_available: true,
        requires_api_key: true,
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        type: 'both',
        accuracy: 94,
        speed: 'very_fast',
        cost_per_minute: 0.02,
        features: ['Transcription', 'Multilingual', 'Real-time', 'Translation', 'Analysis'],
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'],
        max_audio_length: 90,
        description: 'Fast multilingual transcription and real-time processing',
        icon: '✨',
        color: '#4285F4',
        is_available: true,
        requires_api_key: true,
      },
      {
        id: 'whisper-large-v3',
        name: 'Whisper Large V3',
        provider: 'openai',
        type: 'transcription',
        accuracy: 93,
        speed: 'fast',
        cost_per_minute: 0.006,
        features: ['Transcription', 'Multilingual', 'Offline Support', 'Speaker Diarization'],
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'tr'],
        max_audio_length: 60,
        description: 'Cost-effective transcription with offline support',
        icon: '🎙️',
        color: '#8E44AD',
        is_available: true,
        requires_api_key: false,
      },
    ];

    return models;
  }

  /**
   * Get detailed information about a specific model
   */
  async getModelDetails(modelId: string): Promise<AIModel | null> {
    const models = await this.getAvailableModels();
    return models.find(m => m.id === modelId) || null;
  }

  /**
   * Compare multiple AI models
   */
  async compareModels(modelIds: string[]): Promise<ModelComparison> {
    const models = await this.getAvailableModels();
    const selectedModels = models.filter(m => modelIds.includes(m.id));

    if (selectedModels.length === 0) {
      throw new Error('No valid models selected for comparison');
    }

    // Build comparison matrix
    const comparison_matrix = [
      {
        feature: 'Accuracy',
        values: Object.fromEntries(selectedModels.map(m => [m.id, `${m.accuracy}%`])),
      },
      {
        feature: 'Speed',
        values: Object.fromEntries(selectedModels.map(m => [m.id, m.speed])),
      },
      {
        feature: 'Cost per Minute',
        values: Object.fromEntries(selectedModels.map(m => [m.id, `$${m.cost_per_minute.toFixed(3)}`])),
      },
      {
        feature: 'Max Audio Length',
        values: Object.fromEntries(selectedModels.map(m => [m.id, `${m.max_audio_length} min`])),
      },
      {
        feature: 'Languages',
        values: Object.fromEntries(selectedModels.map(m => [m.id, m.languages.length])),
      },
      {
        feature: 'Features',
        values: Object.fromEntries(selectedModels.map(m => [m.id, m.features.length])),
      },
    ];

    // Determine recommendation
    const bestAccuracy = selectedModels.reduce((best, m) => m.accuracy > best.accuracy ? m : best);
    const lowestCost = selectedModels.reduce((best, m) => m.cost_per_minute < best.cost_per_minute ? m : best);
    const fastest = selectedModels.reduce((best, m) => {
      const speedOrder = { 'very_fast': 4, 'fast': 3, 'medium': 2, 'slow': 1 };
      return speedOrder[m.speed] > speedOrder[best.speed] ? m : best;
    });

    let recommendation = '';
    if (bestAccuracy.id === lowestCost.id && bestAccuracy.id === fastest.id) {
      recommendation = `${bestAccuracy.name} is the best overall choice with highest accuracy, lowest cost, and fastest speed.`;
    } else {
      recommendation = `For accuracy: ${bestAccuracy.name}. For cost: ${lowestCost.name}. For speed: ${fastest.name}.`;
    }

    const cost_difference = Math.max(...selectedModels.map(m => m.cost_per_minute)) -
                           Math.min(...selectedModels.map(m => m.cost_per_minute));

    return {
      models: selectedModels,
      comparison_matrix,
      recommendation,
      cost_difference,
    };
  }

  /**
   * Get performance benchmarks for a model
   */
  async getModelBenchmarks(modelId: string): Promise<ModelBenchmark[]> {
    // Mock data - replace with actual API call
    const benchmarks: ModelBenchmark[] = [
      { model_id: modelId, metric: 'Word Error Rate', value: 5.2, unit: '%', timestamp: new Date().toISOString() },
      { model_id: modelId, metric: 'Processing Speed', value: 1.8, unit: 'x realtime', timestamp: new Date().toISOString() },
      { model_id: modelId, metric: 'Latency', value: 250, unit: 'ms', timestamp: new Date().toISOString() },
      { model_id: modelId, metric: 'Speaker Diarization Accuracy', value: 92.5, unit: '%', timestamp: new Date().toISOString() },
      { model_id: modelId, metric: 'Punctuation Accuracy', value: 94.8, unit: '%', timestamp: new Date().toISOString() },
      { model_id: modelId, metric: 'Capitalization Accuracy', value: 96.2, unit: '%', timestamp: new Date().toISOString() },
    ];

    return benchmarks;
  }

  /**
   * Select and configure a model
   */
  async selectModel(modelId: string, config: ModelConfig): Promise<void> {
    // Validate model exists
    const model = await this.getModelDetails(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Save configuration to database
    const { data, error } = await supabase
      .from('ai_model_configs')
      .upsert({
        model_id: modelId,
        config: config,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving model configuration:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics for a model
   */
  async getModelUsageStats(modelId: string, startDate: Date, endDate: Date): Promise<ModelUsageStats> {
    // Mock data - replace with actual API call
    const stats: ModelUsageStats = {
      model_id: modelId,
      total_minutes: 1250,
      total_requests: 342,
      total_cost: 37.50,
      average_accuracy: 94.5,
      error_rate: 2.1,
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
    };

    return stats;
  }

  /**
   * Get cost analysis for a model
   */
  async getModelCostAnalysis(modelId: string): Promise<ModelCostAnalysis> {
    const model = await this.getModelDetails(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Mock data - replace with actual calculations
    const current_cost = 125.50;
    const projected_monthly_cost = current_cost * 4.33; // weeks to month

    const analysis: ModelCostAnalysis = {
      model_id: modelId,
      current_cost,
      projected_monthly_cost,
      cost_breakdown: {
        transcription: current_cost * 0.6,
        analysis: current_cost * 0.3,
        training: current_cost * 0.1,
      },
      savings_opportunities: [
        {
          description: 'Switch to Whisper for simple transcriptions',
          potential_savings: 45.20,
        },
        {
          description: 'Use batch processing for non-urgent tasks',
          potential_savings: 22.10,
        },
        {
          description: 'Enable caching for repeated content',
          potential_savings: 15.30,
        },
      ],
      recommendations: [
        'Consider using Whisper for cost-effective transcription',
        'Enable batch processing to reduce costs by 20%',
        'Use model routing to automatically select the best model for each task',
      ],
    };

    return analysis;
  }
}

// Singleton instance
let aiModelServiceInstance: AIModelService | null = null;

export function getAIModelService(): AIModelService {
  if (!aiModelServiceInstance) {
    aiModelServiceInstance = new AIModelService();
  }
  return aiModelServiceInstance;
}
