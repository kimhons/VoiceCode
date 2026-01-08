/**
 * React Hook for AIML API Integration
 * Provides easy access to 300+ AI models for VoiceFlow Pro
 */

import { useState, useCallback, useRef } from 'react';
import {
  aimlService,
  ProfessionalMode,
  STTOptions,
  STTResult,
  ChatMessage,
  ChatOptions,
  TTSOptions,
} from '@/services/aiml-api.service';

export interface UseAIMLAPIOptions {
  professionalMode?: ProfessionalMode;
  onTranscriptionComplete?: (result: STTResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number, message: string) => void;
}

export const useAIMLAPI = (options: UseAIMLAPIOptions = {}) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    professionalMode = ProfessionalMode.GENERAL,
    onTranscriptionComplete,
    onError,
    onProgress,
  } = options;

  /**
   * Transcribe audio using AIML API (Deepgram Nova-2)
   */
  const transcribeAudio = useCallback(
    async (audioBlob: Blob, sttOptions: STTOptions = {}) => {
      try {
        setIsTranscribing(true);
        setError(null);
        setProgress(10);
        onProgress?.(10, 'Uploading audio...');

        const result = await aimlService.transcribeAudio(audioBlob, {
          ...sttOptions,
          professionalMode,
        });

        setProgress(100);
        onProgress?.(100, 'Transcription complete!');
        onTranscriptionComplete?.(result);

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Transcription failed');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsTranscribing(false);
      }
    },
    [professionalMode, onTranscriptionComplete, onError, onProgress]
  );

  /**
   * Format transcript using AI
   */
  const formatTranscript = useCallback(
    async (transcript: string) => {
      try {
        setIsProcessing(true);
        setError(null);
        onProgress?.(50, 'Formatting transcript...');

        const formatted = await aimlService.formatTranscript(
          transcript,
          professionalMode
        );

        onProgress?.(100, 'Formatting complete!');
        return formatted;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Formatting failed');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [professionalMode, onError, onProgress]
  );

  /**
   * Extract action items from transcript
   */
  const extractActionItems = useCallback(
    async (transcript: string) => {
      try {
        setIsProcessing(true);
        setError(null);
        onProgress?.(50, 'Extracting action items...');

        const actionItems = await aimlService.extractActionItems(transcript);

        onProgress?.(100, 'Action items extracted!');
        return actionItems;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Action item extraction failed');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [onError, onProgress]
  );

  /**
   * Summarize transcript
   */
  const summarizeTranscript = useCallback(
    async (transcript: string) => {
      try {
        setIsProcessing(true);
        setError(null);
        onProgress?.(50, 'Generating summary...');

        const summary = await aimlService.summarizeTranscript(
          transcript,
          professionalMode
        );

        onProgress?.(100, 'Summary complete!');
        return summary;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Summarization failed');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [professionalMode, onError, onProgress]
  );

  /**
   * Translate transcript
   */
  const translateTranscript = useCallback(
    async (transcript: string, targetLanguage: string) => {
      try {
        setIsProcessing(true);
        setError(null);
        onProgress?.(50, `Translating to ${targetLanguage}...`);

        const translated = await aimlService.translateTranscript(
          transcript,
          targetLanguage
        );

        onProgress?.(100, 'Translation complete!');
        return translated;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Translation failed');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [onError, onProgress]
  );

  /**
   * Text-to-Speech
   */
  const textToSpeech = useCallback(
    async (text: string, ttsOptions: TTSOptions = {}) => {
      try {
        setIsProcessing(true);
        setError(null);
        onProgress?.(50, 'Generating speech...');

        const audioBlob = await aimlService.textToSpeech(text, ttsOptions);

        onProgress?.(100, 'Speech generated!');
        return audioBlob;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('TTS failed');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [onError, onProgress]
  );

  /**
   * Chat completion
   */
  const chatCompletion = useCallback(
    async (messages: ChatMessage[], chatOptions: ChatOptions = {}) => {
      try {
        setIsProcessing(true);
        setError(null);

        const response = await aimlService.chatCompletion(messages, {
          ...chatOptions,
          professionalMode,
        });

        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Chat failed');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [professionalMode, onError]
  );

  /**
   * Process voice command
   */
  const processVoiceCommand = useCallback(
    async (command: string) => {
      try {
        setIsProcessing(true);
        setError(null);

        // Detect intent
        const intent = await aimlService.chatCompletion([
          {
            role: 'system',
            content: 'Detect user intent from this voice command. Return only one word: save, search, translate, summarize, format, or unknown.',
          },
          { role: 'user', content: command },
        ]);

        return intent.trim().toLowerCase();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Voice command processing failed');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [onError]
  );

  /**
   * Cancel ongoing operation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsTranscribing(false);
    setIsProcessing(false);
    setProgress(0);
  }, []);

  return {
    // State
    isTranscribing,
    isProcessing,
    progress,
    error,

    // Methods
    transcribeAudio,
    formatTranscript,
    extractActionItems,
    summarizeTranscript,
    translateTranscript,
    textToSpeech,
    chatCompletion,
    processVoiceCommand,
    cancel,
  };
};

export default useAIMLAPI;

