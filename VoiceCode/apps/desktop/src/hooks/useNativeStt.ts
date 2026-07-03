/**
 * useNativeStt Hook
 *
 * React hook for native STT (Deepgram/Whisper) integration.
 * Provides a drop-in replacement for Web Speech API with better accuracy.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import nativeSttService, {
  SttProviderType,
  SttSettings,
  ProviderStatus,
  TranscriptionResponse,
  WordInfo,
} from '../services/native-stt.service';

export type SttStatus = 'idle' | 'listening' | 'processing' | 'error';

export interface UseNativeSttOptions {
  autoInitialize?: boolean;
  preferredProvider?: SttProviderType;
  language?: string;
  onTranscription?: (text: string, result: TranscriptionResponse) => void;
  onInterimResult?: (text: string) => void;
  onError?: (error: string) => void;
}

export interface UseNativeSttReturn {
  // State
  status: SttStatus;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  words: WordInfo[];
  error: string | null;

  // Provider info
  providers: ProviderStatus[];
  activeProvider: SttProviderType | null;
  isAvailable: boolean;

  // Actions
  startListening: () => Promise<boolean>;
  stopListening: () => Promise<TranscriptionResponse | null>;
  cancelListening: () => Promise<void>;
  resetTranscript: () => void;

  // Configuration
  setProvider: (provider: SttProviderType) => Promise<boolean>;
  setApiKey: (provider: SttProviderType, key: string) => Promise<boolean>;
  initialize: (deepgramKey?: string, openaiKey?: string) => Promise<boolean>;

  // Settings
  settings: SttSettings | null;
  updateSettings: (settings: Partial<SttSettings>) => Promise<boolean>;
}

export function useNativeStt(
  options: UseNativeSttOptions = {}
): UseNativeSttReturn {
  const {
    autoInitialize = true,
    preferredProvider,
    language: _language = 'en-US',
    onTranscription,
    onInterimResult,
    onError,
  } = options;

  // State
  const [status, setStatus] = useState<SttStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [words, setWords] = useState<WordInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [activeProvider, setActiveProvider] = useState<SttProviderType | null>(
    null
  );
  const [settings, setSettings] = useState<SttSettings | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  const isListening = status === 'listening';
  const initializedRef = useRef(false);

  // Initialize on mount
  useEffect(() => {
    if (autoInitialize && !initializedRef.current) {
      initializedRef.current = true;
      initializeAsync();
    }
  }, [autoInitialize]);

  const initializeAsync = async () => {
    try {
      // Check if any providers are available
      const available = await nativeSttService.isAvailable();
      setIsAvailable(available);

      if (available) {
        // Load providers
        const providerList = await nativeSttService.getProviders();
        setProviders(providerList);

        // Load settings
        const currentSettings = await nativeSttService.getSettings();
        setSettings(currentSettings);
        setActiveProvider(currentSettings.provider);

        // Set preferred provider if specified
        if (preferredProvider) {
          const provider = providerList.find(
            (p) => p.name === preferredProvider && p.available
          );
          if (provider) {
            await nativeSttService.setProvider(preferredProvider);
            setActiveProvider(preferredProvider);
          }
        }
      }
    } catch (err) {
      console.error('Failed to initialize native STT:', err);
      setError(String(err));
    }
  };

  // Initialize with API keys
  const initialize = useCallback(
    async (deepgramKey?: string, openaiKey?: string): Promise<boolean> => {
      try {
        setError(null);
        const result = await nativeSttService.initialize(
          deepgramKey,
          openaiKey
        );

        if (result) {
          await initializeAsync();
        }

        return result;
      } catch (err) {
        const errorMsg = String(err);
        setError(errorMsg);
        onError?.(errorMsg);
        return false;
      }
    },
    [onError]
  );

  // Start listening
  const startListening = useCallback(async (): Promise<boolean> => {
    if (status !== 'idle') {
      return false;
    }

    setError(null);
    setInterimTranscript('');

    const success = await nativeSttService.startListening({
      onTranscription: (result) => {
        setTranscript((prev) => prev + (prev ? ' ' : '') + result.text);
        setConfidence(result.confidence);
        setWords(result.words);
        onTranscription?.(result.text, result);
      },
      onInterimResult: (text) => {
        setInterimTranscript(text);
        onInterimResult?.(text);
      },
      onError: (err) => {
        setError(err);
        setStatus('error');
        onError?.(err);
      },
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
    });

    return success;
  }, [status, onTranscription, onInterimResult, onError]);

  // Stop listening
  const stopListening =
    useCallback(async (): Promise<TranscriptionResponse | null> => {
      if (status !== 'listening') {
        return null;
      }

      const result = await nativeSttService.stopListening();
      setInterimTranscript('');

      return result;
    }, [status]);

  // Cancel listening
  const cancelListening = useCallback(async (): Promise<void> => {
    await nativeSttService.cancelListening();
    setInterimTranscript('');
    setStatus('idle');
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    setWords([]);
    setError(null);
  }, []);

  // Set provider
  const setProvider = useCallback(
    async (provider: SttProviderType): Promise<boolean> => {
      try {
        const success = await nativeSttService.setProvider(provider);
        if (success) {
          setActiveProvider(provider);
        }
        return success;
      } catch (err) {
        setError(String(err));
        return false;
      }
    },
    []
  );

  // Set API key
  const setApiKey = useCallback(
    async (provider: SttProviderType, key: string): Promise<boolean> => {
      try {
        const success = await nativeSttService.setApiKey(provider, key);
        if (success) {
          // Refresh providers list
          const providerList = await nativeSttService.getProviders();
          setProviders(providerList);
          setIsAvailable(providerList.some((p) => p.available));
        }
        return success;
      } catch (err) {
        setError(String(err));
        return false;
      }
    },
    []
  );

  // Update settings
  const updateSettings = useCallback(
    async (newSettings: Partial<SttSettings>): Promise<boolean> => {
      if (!settings) return false;

      try {
        const merged: SttSettings = { ...settings, ...newSettings };
        const success = await nativeSttService.updateSettings(merged);
        if (success) {
          setSettings(merged);
          if (newSettings.provider) {
            setActiveProvider(newSettings.provider);
          }
        }
        return success;
      } catch (err) {
        setError(String(err));
        return false;
      }
    },
    [settings]
  );

  return {
    // State
    status,
    isListening,
    transcript,
    interimTranscript,
    confidence,
    words,
    error,

    // Provider info
    providers,
    activeProvider,
    isAvailable,

    // Actions
    startListening,
    stopListening,
    cancelListening,
    resetTranscript,

    // Configuration
    setProvider,
    setApiKey,
    initialize,

    // Settings
    settings,
    updateSettings,
  };
}

export default useNativeStt;
