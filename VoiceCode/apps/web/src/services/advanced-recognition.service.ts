/**
 * Advanced Voice Recognition Service
 * Phase 2.1: Advanced Voice Recognition
 * 
 * Features:
 * - Multi-language support with auto-detection
 * - Custom vocabulary and terminology
 * - Speaker diarization
 * - Confidence scoring and filtering
 * - Real-time language detection
 */

import { getStreamingService, StreamingOptions } from './websocket-streaming.service';
import { aimlService, ProfessionalMode } from './aiml-api.service';

// Language Configuration
export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  region?: string;
  confidence: number;
  supported: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', confidence: 0.95, supported: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', confidence: 0.93, supported: true },
  { code: 'fr', name: 'French', nativeName: 'Français', confidence: 0.92, supported: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', confidence: 0.91, supported: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', confidence: 0.90, supported: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', confidence: 0.90, supported: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', confidence: 0.88, supported: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', confidence: 0.87, supported: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', confidence: 0.86, supported: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', confidence: 0.85, supported: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', confidence: 0.84, supported: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', confidence: 0.83, supported: true },
];

// Custom Vocabulary
export interface VocabularyTerm {
  term: string;
  pronunciation?: string;
  weight: number;
  category?: string;
}

export interface CustomVocabulary {
  terms: VocabularyTerm[];
  professionalMode?: ProfessionalMode;
  caseSensitive?: boolean;
}

// Speaker Diarization
export interface Speaker {
  id: number;
  name?: string;
  confidence: number;
  segments: SpeakerSegment[];
}

export interface SpeakerSegment {
  speaker: number;
  text: string;
  start: number;
  end: number;
  confidence: number;
}

// Confidence Scoring
export interface ConfidenceScore {
  overall: number;
  words: WordConfidence[];
  threshold: number;
  filtered: boolean;
}

export interface WordConfidence {
  word: string;
  confidence: number;
  start: number;
  end: number;
}

// Advanced Recognition Options
export interface AdvancedRecognitionOptions extends StreamingOptions {
  // Language
  autoDetectLanguage?: boolean;
  preferredLanguages?: string[];
  languageConfidenceThreshold?: number;

  // Custom Vocabulary
  customVocabulary?: CustomVocabulary;
  boostTerms?: string[];

  // Speaker Diarization
  enableDiarization?: boolean;
  maxSpeakers?: number;
  speakerNames?: Record<number, string>;

  // Confidence Filtering
  confidenceThreshold?: number;
  filterLowConfidence?: boolean;
  highlightLowConfidence?: boolean;

  // Professional Mode
  professionalMode?: ProfessionalMode;
}

// Advanced Recognition Result
export interface AdvancedRecognitionResult {
  transcript: string;
  language: string;
  languageConfidence: number;
  speakers?: Speaker[];
  confidence: ConfidenceScore;
  metadata: {
    duration: number;
    wordCount: number;
    speakerCount: number;
    averageConfidence: number;
  };
}

/**
 * Advanced Voice Recognition Service
 */
export class AdvancedRecognitionService {
  private streamingService: ReturnType<typeof getStreamingService>;
  private currentLanguage: string = 'en';
  private detectedLanguages: Map<string, number> = new Map();
  private customVocabulary: CustomVocabulary | null = null;
  private speakers: Map<number, Speaker> = new Map();
  private confidenceThreshold: number = 0.7;

  constructor(apiKey: string) {
    this.streamingService = getStreamingService(apiKey);
  }

  /**
   * Start advanced recognition with all features
   */
  async startAdvancedRecognition(options: AdvancedRecognitionOptions = {}): Promise<void> {
    const {
      autoDetectLanguage = false,
      preferredLanguages = ['en'],
      customVocabulary,
      enableDiarization = false,
      confidenceThreshold = 0.7,
      professionalMode = ProfessionalMode.GENERAL,
      ...streamingOptions
    } = options;

    // Set configuration
    this.confidenceThreshold = confidenceThreshold;
    this.customVocabulary = customVocabulary || null;

    // Determine language
    const language = autoDetectLanguage 
      ? await this.detectLanguage(preferredLanguages)
      : preferredLanguages[0];

    this.currentLanguage = language;

    // Connect with advanced options
    await this.streamingService.connect({
      language,
      diarize: enableDiarization,
      ...streamingOptions,
    });
  }

  /**
   * Detect language from audio or text
   */
  async detectLanguage(preferredLanguages: string[]): Promise<string> {
    // Simple language detection based on character patterns
    // In production, use a proper language detection library
    
    // For now, return first preferred language
    return preferredLanguages[0];
  }

  /**
   * Add custom vocabulary terms
   */
  addCustomVocabulary(vocabulary: CustomVocabulary): void {
    this.customVocabulary = vocabulary;
  }

  /**
   * Boost specific terms in recognition
   */
  boostTerms(terms: string[]): void {
    if (!this.customVocabulary) {
      this.customVocabulary = { terms: [] };
    }

    terms.forEach(term => {
      this.customVocabulary!.terms.push({
        term,
        weight: 2.0,
      });
    });
  }

  /**
   * Process transcript with custom vocabulary
   */
  private applyCustomVocabulary(transcript: string): string {
    if (!this.customVocabulary) return transcript;

    let processed = transcript;

    // Apply vocabulary terms
    this.customVocabulary.terms.forEach(({ term, weight }) => {
      if (weight > 1.0) {
        // Boost term recognition
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        processed = processed.replace(regex, term);
      }
    });

    return processed;
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(words: WordConfidence[]): ConfidenceScore {
    if (words.length === 0) {
      return {
        overall: 0,
        words: [],
        threshold: this.confidenceThreshold,
        filtered: false,
      };
    }

    const overall = words.reduce((sum, w) => sum + w.confidence, 0) / words.length;
    const filtered = overall < this.confidenceThreshold;

    return {
      overall,
      words,
      threshold: this.confidenceThreshold,
      filtered,
    };
  }

  /**
   * Filter low confidence words
   */
  filterLowConfidence(transcript: string, words: WordConfidence[]): string {
    const filtered = words
      .filter(w => w.confidence >= this.confidenceThreshold)
      .map(w => w.word)
      .join(' ');

    return filtered;
  }

  /**
   * Highlight low confidence words
   */
  highlightLowConfidence(transcript: string, words: WordConfidence[]): string {
    let highlighted = transcript;

    words.forEach(({ word, confidence }) => {
      if (confidence < this.confidenceThreshold) {
        highlighted = highlighted.replace(
          new RegExp(`\\b${word}\\b`, 'g'),
          `[${word}?]`
        );
      }
    });

    return highlighted;
  }

  /**
   * Process speaker diarization
   */
  processSpeakers(segments: SpeakerSegment[], speakerNames?: Record<number, string>): Speaker[] {
    const speakerMap = new Map<number, Speaker>();

    segments.forEach(segment => {
      if (!speakerMap.has(segment.speaker)) {
        speakerMap.set(segment.speaker, {
          id: segment.speaker,
          name: speakerNames?.[segment.speaker],
          confidence: segment.confidence,
          segments: [],
        });
      }

      const speaker = speakerMap.get(segment.speaker)!;
      speaker.segments.push(segment);
      
      // Update average confidence
      speaker.confidence = 
        (speaker.confidence + segment.confidence) / 2;
    });

    return Array.from(speakerMap.values());
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Get language by code
   */
  getLanguage(code: string): LanguageConfig | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Set language
   */
  async setLanguage(language: string): Promise<void> {
    this.currentLanguage = language;
    
    // Reconnect with new language
    if (this.streamingService.isConnected()) {
      await this.streamingService.disconnect();
      await this.streamingService.connect({ language });
    }
  }

  /**
   * Get confidence threshold
   */
  getConfidenceThreshold(): number {
    return this.confidenceThreshold;
  }

  /**
   * Set confidence threshold
   */
  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Get speakers
   */
  getSpeakers(): Speaker[] {
    return Array.from(this.speakers.values());
  }

  /**
   * Set speaker name
   */
  setSpeakerName(speakerId: number, name: string): void {
    const speaker = this.speakers.get(speakerId);
    if (speaker) {
      speaker.name = name;
    }
  }

  /**
   * Stop recognition
   */
  async stop(): Promise<void> {
    this.streamingService.disconnect();
    this.detectedLanguages.clear();
    this.speakers.clear();
  }
}

// Export singleton instance
let advancedRecognitionInstance: AdvancedRecognitionService | null = null;

export function getAdvancedRecognitionService(apiKey?: string): AdvancedRecognitionService {
  if (!advancedRecognitionInstance && apiKey) {
    advancedRecognitionInstance = new AdvancedRecognitionService(apiKey);
  }

  if (!advancedRecognitionInstance) {
    throw new Error('Advanced recognition service not initialized. Provide API key on first call.');
  }

  return advancedRecognitionInstance;
}

