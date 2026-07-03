/**
 * React Hook for Unified Voice Engine
 * Provides easy access to transcription with automatic fallback and usage tracking
 */

import { useState, useCallback, useEffect } from 'react';
import {
  UnifiedVoiceEngine,
  unifiedVoiceEngine,
  TranscriptionEngine,
  UnifiedSTTOptions,
  UsageStats,
  TranscriptionUsage,
} from '@/services/unified-voice-engine.service';
import { STTResult } from '@/services/aiml-api.service';

// Re-export for convenience
export { TranscriptionEngine } from '@/services/unified-voice-engine.service';
export type { UnifiedSTTOptions, UsageStats, TranscriptionUsage } from '@/services/unified-voice-engine.service';
export type { STTResult } from '@/services/aiml-api.service';

export interface UseUnifiedVoiceEngineOptions {
  engine?: TranscriptionEngine;
  fallbackToLocal?: boolean;
  trackUsage?: boolean;
  onTranscriptionComplete?: (result: STTResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export interface UseUnifiedVoiceEngineReturn {
  // State
  isTranscribing: boolean;
  progress: number;
  error: Error | null;
  result: STTResult | null;
  usageStats: UsageStats;
  
  // Actions
  transcribe: (audioBlob: Blob, options?: UnifiedSTTOptions) => Promise<STTResult>;
  reset: () => void;
  clearUsageHistory: () => void;
  
  // Engine info
  isCloudAvailable: boolean;
  isLocalAvailable: boolean;
  recommendedEngine: TranscriptionEngine;
  currentEngine: 'cloud' | 'local' | null;
}

/**
 * Hook for unified voice engine
 */
export function useUnifiedVoiceEngine(
  options: UseUnifiedVoiceEngineOptions = {}
): UseUnifiedVoiceEngineReturn {
  const {
    engine = TranscriptionEngine.AUTO,
    fallbackToLocal = true,
    trackUsage = true,
    onTranscriptionComplete,
    onError,
    onProgress,
  } = options;

  // State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<STTResult | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalRequests: 0,
    cloudRequests: 0,
    localRequests: 0,
    totalCost: 0,
    totalDuration: 0,
    successRate: 0,
    averageResponseTime: 0,
  });
  const [currentEngine, setCurrentEngine] = useState<'cloud' | 'local' | null>(null);

  // Engine availability
  const [isCloudAvailable] = useState(() => unifiedVoiceEngine.isCloudAvailable());
  const [isLocalAvailable] = useState(() => unifiedVoiceEngine.isLocalAvailable());
  const [recommendedEngine] = useState(() => unifiedVoiceEngine.getRecommendedEngine());

  // Load usage history on mount
  useEffect(() => {
    // loadUsageHistory is already called in the constructor
    updateUsageStats();
  }, []);

  // Update usage stats
  const updateUsageStats = useCallback(() => {
    const stats = unifiedVoiceEngine.getUsageStats();
    setUsageStats(stats);
  }, []);

  // Transcribe audio
  const transcribe = useCallback(
    async (audioBlob: Blob, transcribeOptions?: UnifiedSTTOptions): Promise<STTResult> => {
      setIsTranscribing(true);
      setProgress(0);
      setError(null);
      setResult(null);
      setCurrentEngine(null);

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            const next = prev + 10;
            if (next >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return next;
          });
        }, 500);

        // Transcribe
        const transcriptionResult = await unifiedVoiceEngine.transcribe(audioBlob, {
          engine,
          fallbackToLocal,
          trackUsage,
          ...transcribeOptions,
        });

        clearInterval(progressInterval);
        setProgress(100);

        // Determine which engine was used
        const history = unifiedVoiceEngine.getUsageHistory();
        const lastUsage = history[history.length - 1];
        if (lastUsage) {
          setCurrentEngine(lastUsage.engine);
        }

        setResult(transcriptionResult);
        updateUsageStats();

        if (onTranscriptionComplete) {
          onTranscriptionComplete(transcriptionResult);
        }

        if (onProgress) {
          onProgress(100);
        }

        return transcriptionResult;
      } catch (err) {
        const transcriptionError = err as Error;
        setError(transcriptionError);
        updateUsageStats();

        if (onError) {
          onError(transcriptionError);
        }

        throw transcriptionError;
      } finally {
        setIsTranscribing(false);
      }
    },
    [engine, fallbackToLocal, trackUsage, onTranscriptionComplete, onError, onProgress, updateUsageStats]
  );

  // Reset state
  const reset = useCallback(() => {
    setIsTranscribing(false);
    setProgress(0);
    setError(null);
    setResult(null);
    setCurrentEngine(null);
  }, []);

  // Clear usage history
  const clearUsageHistory = useCallback(() => {
    unifiedVoiceEngine.clearUsageHistory();
    updateUsageStats();
  }, [updateUsageStats]);

  return {
    // State
    isTranscribing,
    progress,
    error,
    result,
    usageStats,
    
    // Actions
    transcribe,
    reset,
    clearUsageHistory,
    
    // Engine info
    isCloudAvailable,
    isLocalAvailable,
    recommendedEngine,
    currentEngine,
  };
}

/**
 * Hook for usage statistics only
 */
export function useUsageStats() {
  const [stats, setStats] = useState<UsageStats>({
    totalRequests: 0,
    cloudRequests: 0,
    localRequests: 0,
    totalCost: 0,
    totalDuration: 0,
    successRate: 0,
    averageResponseTime: 0,
  });

  const [history, setHistory] = useState<TranscriptionUsage[]>([]);

  useEffect(() => {
    // loadUsageHistory is already called in the constructor
    updateStats();
  }, []);

  const updateStats = useCallback(() => {
    setStats(unifiedVoiceEngine.getUsageStats());
    setHistory(unifiedVoiceEngine.getUsageHistory());
  }, []);

  const clearHistory = useCallback(() => {
    unifiedVoiceEngine.clearUsageHistory();
    updateStats();
  }, [updateStats]);

  return {
    stats,
    history,
    updateStats,
    clearHistory,
  };
}

/**
 * Hook for engine availability check
 */
export function useEngineAvailability() {
  const [isCloudAvailable] = useState(() => unifiedVoiceEngine.isCloudAvailable());
  const [isLocalAvailable] = useState(() => unifiedVoiceEngine.isLocalAvailable());
  const [recommendedEngine] = useState(() => unifiedVoiceEngine.getRecommendedEngine());

  return {
    isCloudAvailable,
    isLocalAvailable,
    recommendedEngine,
    hasAnyEngine: isCloudAvailable || isLocalAvailable,
  };
}

