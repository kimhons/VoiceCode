// Custom hook for AI Processing Web Worker
import { useState, useRef, useEffect, useCallback } from 'react';
import { TranscriptionSegment } from '@/types';

interface AIWorkerMessage {
  type: string;
  [key: string]: any;
}

interface UseAIWorkerOptions {
  onInit?: (status: { status: string; progress?: number; message: string }) => void;
  onTranscription?: (segments: TranscriptionSegment[], metadata: any) => void;
  onLanguageDetection?: (language: any) => void;
  onEnhancement?: (enhancements: any[]) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number, message: string) => void;
}

export const useAIWorker = (options: UseAIWorkerOptions = {}) => {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker('/workers/ai-processor.worker.js');

    const handleMessage = (event: MessageEvent<AIWorkerMessage>) => {
      const { type, ...data } = event.data;

      switch (type) {
        case 'INIT_STATUS':
          options.onInit?.(data);
          if (data.status === 'complete') {
            setIsReady(true);
          }
          break;

        case 'TRANSCRIPTION_STATUS':
        case 'LANGUAGE_STATUS':
        case 'ENHANCEMENT_STATUS':
          options.onProgress?.(data.progress || 0, data.message);
          if (data.status === 'processing') {
            setIsProcessing(true);
          }
          break;

        case 'TRANSCRIPTION_COMPLETE':
          options.onTranscription?.(data.segments, data.metadata);
          setIsProcessing(false);
          break;

        case 'TRANSCRIPTION_SEGMENT':
          // Handle streaming transcription segments
          if (options.onTranscription) {
            options.onTranscription([data.segment], { streaming: true, progress: data.progress });
          }
          break;

        case 'LANGUAGE_DETECTED':
          options.onLanguageDetection?.(data.language);
          setIsProcessing(false);
          break;

        case 'ENHANCEMENT_COMPLETE':
          options.onEnhancement?.(data.enhancements);
          setIsProcessing(false);
          break;

        case 'TRANSCRIPTION_ERROR':
        case 'LANGUAGE_ERROR':
        case 'ENHANCEMENT_ERROR':
        case 'ERROR':
          options.onError?.(data.error);
          setIsProcessing(false);
          break;

        case 'TRANSCRIPTION_PROGRESS':
        case 'ENHANCEMENT_PROGRESS':
          options.onProgress?.(data.progress, data.message || 'Processing...');
          break;
      }
    };

    const handleError = (error: ErrorEvent) => {
      options.onError?.(`Worker error: ${error.message}`);
      setIsProcessing(false);
    };

    workerRef.current.addEventListener('message', handleMessage);
    workerRef.current.addEventListener('error', handleError);

    return () => {
      if (workerRef.current) {
        workerRef.current.removeEventListener('message', handleMessage);
        workerRef.current.removeEventListener('error', handleError);
        workerRef.current.terminate();
      }
    };
  }, [options]);

  const transcribeAudio = useCallback((audioData: any) => {
    if (!workerRef.current || !isReady) {
      options.onError?.('AI worker not ready');
      return;
    }

    workerRef.current.postMessage({
      type: 'TRANSCRIBE_AUDIO',
      data: audioData
    });
  }, [isReady, options]);

  const detectLanguage = useCallback((audioData: any) => {
    if (!workerRef.current || !isReady) {
      options.onError?.('AI worker not ready');
      return;
    }

    workerRef.current.postMessage({
      type: 'DETECT_LANGUAGE',
      data: audioData
    });
  }, [isReady, options]);

  const enhanceAudio = useCallback((audioData: any) => {
    if (!workerRef.current || !isReady) {
      options.onError?.('AI worker not ready');
      return;
    }

    workerRef.current.postMessage({
      type: 'ENHANCE_AUDIO',
      data: audioData
    });
  }, [isReady, options]);

  const processBatch = useCallback((tasks: Array<{ type: string; data: any }>) => {
    if (!workerRef.current || !isReady) {
      options.onError?.('AI worker not ready');
      return;
    }

    workerRef.current.postMessage({
      type: 'PROCESS_BATCH',
      data: { tasks }
    });
  }, [isReady, options]);

  return {
    isReady,
    isProcessing,
    transcribeAudio,
    detectLanguage,
    enhanceAudio,
    processBatch
  };
};