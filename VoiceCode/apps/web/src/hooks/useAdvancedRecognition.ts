/**
 * useAdvancedRecognition Hook
 * Phase 2.1: Advanced Voice Recognition
 * 
 * React hook for advanced voice recognition features:
 * - Multi-language support
 * - Custom vocabulary
 * - Speaker diarization
 * - Confidence scoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAdvancedRecognitionService,
  AdvancedRecognitionOptions,
  AdvancedRecognitionResult,
  LanguageConfig,
  Speaker,
  CustomVocabulary,
  ConfidenceScore,
} from '../services/advanced-recognition.service';
import { getStreamingService } from '../services/websocket-streaming.service';
import { ProfessionalMode } from '../services/aiml-api.service';

export interface UseAdvancedRecognitionOptions {
  apiKey: string;
  autoDetectLanguage?: boolean;
  preferredLanguages?: string[];
  enableDiarization?: boolean;
  confidenceThreshold?: number;
  professionalMode?: ProfessionalMode;
  customVocabulary?: CustomVocabulary;
  onLanguageDetected?: (language: string, confidence: number) => void;
  onSpeakerDetected?: (speaker: Speaker) => void;
  onLowConfidence?: (transcript: string, confidence: number) => void;
}

export interface UseAdvancedRecognitionReturn {
  // State
  isConnected: boolean;
  isStreaming: boolean;
  transcript: string;
  interimTranscript: string;
  currentLanguage: string;
  speakers: Speaker[];
  confidence: ConfidenceScore | null;
  error: string | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  startStreaming: (mediaStream: MediaStream) => Promise<void>;
  stopStreaming: () => void;
  clearTranscript: () => void;

  // Language
  setLanguage: (language: string) => Promise<void>;
  getSupportedLanguages: () => LanguageConfig[];
  detectLanguage: () => Promise<string>;

  // Vocabulary
  addCustomVocabulary: (vocabulary: CustomVocabulary) => void;
  boostTerms: (terms: string[]) => void;

  // Confidence
  setConfidenceThreshold: (threshold: number) => void;
  filterLowConfidence: (transcript: string) => string;
  highlightLowConfidence: (transcript: string) => string;

  // Speakers
  setSpeakerName: (speakerId: number, name: string) => void;
  getSpeakers: () => Speaker[];
}

export function useAdvancedRecognition(
  options: UseAdvancedRecognitionOptions
): UseAdvancedRecognitionReturn {
  const {
    apiKey,
    autoDetectLanguage = false,
    preferredLanguages = ['en'],
    enableDiarization = false,
    confidenceThreshold = 0.7,
    professionalMode = ProfessionalMode.GENERAL,
    customVocabulary,
    onLanguageDetected,
    onSpeakerDetected,
    onLowConfidence,
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState(preferredLanguages[0]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [confidence, setConfidence] = useState<ConfidenceScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Services
  const advancedService = useRef(getAdvancedRecognitionService(apiKey));
  const streamingService = useRef(getStreamingService(apiKey));

  // Initialize
  useEffect(() => {
    // Set initial configuration
    if (customVocabulary) {
      advancedService.current.addCustomVocabulary(customVocabulary);
    }

    advancedService.current.setConfidenceThreshold(confidenceThreshold);

    // Register event handlers
    const handleConnected = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setIsStreaming(false);
    };

    const handleTranscript = (data: any) => {
      if (data.isFinal) {
        setTranscript(prev => prev + ' ' + data.text);
        setInterimTranscript('');

        // Check confidence
        if (data.confidence && data.confidence < confidenceThreshold) {
          onLowConfidence?.(data.text, data.confidence);
        }
      } else {
        setInterimTranscript(data.text);
      }

      // Update confidence
      if (data.words) {
        const confidenceScore = advancedService.current.calculateConfidence(data.words);
        setConfidence(confidenceScore);
      }
    };

    const handleError = (err: Error) => {
      setError(err.message);
      setIsStreaming(false);
    };

    streamingService.current.on('connected', handleConnected);
    streamingService.current.on('disconnected', handleDisconnected);
    streamingService.current.on('transcript', handleTranscript);
    streamingService.current.on('error', handleError);

    return () => {
      streamingService.current.off('connected', handleConnected);
      streamingService.current.off('disconnected', handleDisconnected);
      streamingService.current.off('transcript', handleTranscript);
      streamingService.current.off('error', handleError);
    };
  }, [apiKey, confidenceThreshold, customVocabulary, onLowConfidence]);

  // Connect
  const connect = useCallback(async () => {
    try {
      await advancedService.current.startAdvancedRecognition({
        autoDetectLanguage,
        preferredLanguages,
        enableDiarization,
        confidenceThreshold,
        professionalMode,
        customVocabulary,
      });

      const detectedLanguage = advancedService.current.getCurrentLanguage();
      setCurrentLanguage(detectedLanguage);
      
      if (autoDetectLanguage) {
        onLanguageDetected?.(detectedLanguage, 0.95);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      throw err;
    }
  }, [
    autoDetectLanguage,
    preferredLanguages,
    enableDiarization,
    confidenceThreshold,
    professionalMode,
    customVocabulary,
    onLanguageDetected,
  ]);

  // Disconnect
  const disconnect = useCallback(() => {
    advancedService.current.stop();
  }, []);

  // Start streaming
  const startStreaming = useCallback(async (mediaStream: MediaStream) => {
    try {
      await streamingService.current.startStreaming(mediaStream);
      setIsStreaming(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start streaming');
      throw err;
    }
  }, []);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    streamingService.current.stopStreaming();
    setIsStreaming(false);
  }, []);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(null);
  }, []);

  // Set language
  const setLanguageCallback = useCallback(async (language: string) => {
    try {
      await advancedService.current.setLanguage(language);
      setCurrentLanguage(language);
      onLanguageDetected?.(language, 1.0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set language');
      throw err;
    }
  }, [onLanguageDetected]);

  // Get supported languages
  const getSupportedLanguages = useCallback(() => {
    return advancedService.current.getSupportedLanguages();
  }, []);

  // Detect language
  const detectLanguage = useCallback(async () => {
    const language = await advancedService.current.detectLanguage(preferredLanguages);
    setCurrentLanguage(language);
    onLanguageDetected?.(language, 0.95);
    return language;
  }, [preferredLanguages, onLanguageDetected]);

  // Add custom vocabulary
  const addCustomVocabulary = useCallback((vocabulary: CustomVocabulary) => {
    advancedService.current.addCustomVocabulary(vocabulary);
  }, []);

  // Boost terms
  const boostTerms = useCallback((terms: string[]) => {
    advancedService.current.boostTerms(terms);
  }, []);

  // Set confidence threshold
  const setConfidenceThresholdCallback = useCallback((threshold: number) => {
    advancedService.current.setConfidenceThreshold(threshold);
  }, []);

  // Filter low confidence
  const filterLowConfidence = useCallback((text: string) => {
    if (!confidence) return text;
    return advancedService.current.filterLowConfidence(text, confidence.words);
  }, [confidence]);

  // Highlight low confidence
  const highlightLowConfidence = useCallback((text: string) => {
    if (!confidence) return text;
    return advancedService.current.highlightLowConfidence(text, confidence.words);
  }, [confidence]);

  // Set speaker name
  const setSpeakerName = useCallback((speakerId: number, name: string) => {
    advancedService.current.setSpeakerName(speakerId, name);
    setSpeakers(advancedService.current.getSpeakers());
  }, []);

  // Get speakers
  const getSpeakersCallback = useCallback(() => {
    return advancedService.current.getSpeakers();
  }, []);

  return {
    // State
    isConnected,
    isStreaming,
    transcript,
    interimTranscript,
    currentLanguage,
    speakers,
    confidence,
    error,

    // Actions
    connect,
    disconnect,
    startStreaming,
    stopStreaming,
    clearTranscript,

    // Language
    setLanguage: setLanguageCallback,
    getSupportedLanguages,
    detectLanguage,

    // Vocabulary
    addCustomVocabulary,
    boostTerms,

    // Confidence
    setConfidenceThreshold: setConfidenceThresholdCallback,
    filterLowConfidence,
    highlightLowConfidence,

    // Speakers
    setSpeakerName,
    getSpeakers: getSpeakersCallback,
  };
}

