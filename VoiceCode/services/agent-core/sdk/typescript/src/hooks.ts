/**
 * VoiceCode Agent SDK - React Hooks
 * Custom hooks for React/React Native integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceCodeAgent, getAgentClient } from './client';
import {
  ChatResponse,
  StreamChunk,
  Suggestion,
  ProfessionalMode,
  AgentConfig,
} from './types';

/**
 * Main hook for using the VoiceCode Agent
 */
export function useAgent(config?: Partial<AgentConfig>) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<ChatResponse[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  const agentRef = useRef<VoiceCodeAgent | null>(null);

  // Initialize agent
  useEffect(() => {
    agentRef.current = getAgentClient(config);

    return () => {
      agentRef.current?.disconnectWebSocket();
    };
  }, []);

  // Connect WebSocket
  const connect = useCallback(async () => {
    if (!agentRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Set up event listeners
      agentRef.current.on('connected', () => setIsConnected(true));
      agentRef.current.on('disconnected', () => setIsConnected(false));
      agentRef.current.on('stream', (chunk: StreamChunk) => {
        if (chunk.type === 'text') {
          setStreamingContent((prev) => prev + chunk.content);
        }
      });
      agentRef.current.on('error', ({ error }) => setError(error));

      await agentRef.current.connectWebSocket();
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    agentRef.current?.disconnectWebSocket();
    setIsConnected(false);
  }, []);

  // Send chat message
  const sendMessage = useCallback(
    async (
      message: string,
      options?: {
        professionalMode?: ProfessionalMode;
        context?: Record<string, any>;
        stream?: boolean;
      }
    ) => {
      if (!agentRef.current) {
        throw new Error('Agent not initialized');
      }

      try {
        setIsLoading(true);
        setError(null);

        if (options?.stream) {
          setIsStreaming(true);
          setStreamingContent('');
        }

        const response = await agentRef.current.chat(message, options);

        setMessages((prev) => [...prev, response]);
        setIsStreaming(false);
        setStreamingContent('');

        return response;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Execute command
  const executeCommand = useCallback(
    async (command: string, parameters?: Record<string, any>) => {
      if (!agentRef.current) {
        throw new Error('Agent not initialized');
      }

      try {
        setIsLoading(true);
        setError(null);
        return await agentRef.current.executeCommand(command, parameters);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Search
  const search = useCallback(
    async (query: string, options?: { limit?: number }) => {
      if (!agentRef.current) {
        throw new Error('Agent not initialized');
      }

      try {
        setIsLoading(true);
        setError(null);
        return await agentRef.current.search(query, options);
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    // State
    isConnected,
    isLoading,
    isStreaming,
    error,
    messages,
    streamingContent,
    sessionId: agentRef.current?.getSessionId(),

    // Actions
    connect,
    disconnect,
    sendMessage,
    executeCommand,
    search,
    clearMessages,

    // Agent instance
    agent: agentRef.current,
  };
}

/**
 * Hook for proactive suggestions
 */
export function useSuggestions(pollInterval?: number) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const agentRef = useRef<VoiceCodeAgent | null>(null);

  useEffect(() => {
    agentRef.current = getAgentClient();
  }, []);

  const fetchSuggestions = useCallback(async () => {
    if (!agentRef.current) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await agentRef.current.getSuggestions();
      setSuggestions(response.suggestions);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Polling
  useEffect(() => {
    if (!pollInterval) return;

    const intervalId = setInterval(fetchSuggestions, pollInterval);
    return () => clearInterval(intervalId);
  }, [pollInterval, fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
    refresh: fetchSuggestions,
  };
}

/**
 * Hook for medical documentation
 */
export function useMedicalScribe() {
  const { sendMessage, executeCommand, isLoading, error } = useAgent();

  const generateSOAPNote = useCallback(
    async (transcriptId: string) => {
      return executeCommand('generate_soap_note', {
        transcript_id: transcriptId,
      });
    },
    [executeCommand]
  );

  const generateProgressNote = useCallback(
    async (transcriptId: string) => {
      return executeCommand('generate_progress_note', {
        transcript_id: transcriptId,
      });
    },
    [executeCommand]
  );

  const generateDischargeSummary = useCallback(
    async (transcriptId: string) => {
      return executeCommand('generate_discharge_summary', {
        transcript_id: transcriptId,
      });
    },
    [executeCommand]
  );

  const suggestBillingCodes = useCallback(
    async (transcriptId: string) => {
      return executeCommand('suggest_billing_codes', {
        transcript_id: transcriptId,
      });
    },
    [executeCommand]
  );

  return {
    generateSOAPNote,
    generateProgressNote,
    generateDischargeSummary,
    suggestBillingCodes,
    isLoading,
    error,
  };
}

/**
 * Hook for productivity features
 */
export function useProductivity() {
  const { executeCommand, isLoading, error } = useAgent();

  const summarize = useCallback(
    async (
      transcriptId: string,
      length: 'short' | 'medium' | 'long' = 'medium'
    ) => {
      return executeCommand('summarize_transcript', {
        transcript_id: transcriptId,
        length,
      });
    },
    [executeCommand]
  );

  const extractActionItems = useCallback(
    async (transcriptId: string) => {
      return executeCommand('extract_action_items', {
        transcript_id: transcriptId,
      });
    },
    [executeCommand]
  );

  const extractKeyPoints = useCallback(
    async (transcriptId: string, maxPoints = 5) => {
      return executeCommand('extract_key_points', {
        transcript_id: transcriptId,
        max_points: maxPoints,
      });
    },
    [executeCommand]
  );

  const generateMeetingMinutes = useCallback(
    async (transcriptId: string) => {
      return executeCommand('generate_meeting_minutes', {
        transcript_id: transcriptId,
      });
    },
    [executeCommand]
  );

  return {
    summarize,
    extractActionItems,
    extractKeyPoints,
    generateMeetingMinutes,
    isLoading,
    error,
  };
}

/**
 * Hook for transcription features
 */
export function useTranscription() {
  const { executeCommand, isLoading, error } = useAgent();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);

  const startRecording = useCallback(
    async (language = 'en', speakerDetection = true) => {
      const result = await executeCommand('start_recording', {
        language,
        speaker_detection: speakerDetection,
      });
      setIsRecording(true);
      setRecordingId(result.result?.recording_id);
      return result;
    },
    [executeCommand]
  );

  const stopRecording = useCallback(async () => {
    if (!recordingId) throw new Error('No active recording');

    const result = await executeCommand('stop_recording', {
      recording_id: recordingId,
    });
    setIsRecording(false);
    setRecordingId(null);
    return result;
  }, [executeCommand, recordingId]);

  const getTranscript = useCallback(
    async (transcriptId: string) => {
      return executeCommand('get_transcript', { transcript_id: transcriptId });
    },
    [executeCommand]
  );

  const listTranscripts = useCallback(
    async (limit = 10) => {
      return executeCommand('list_recent_transcripts', { limit });
    },
    [executeCommand]
  );

  return {
    startRecording,
    stopRecording,
    getTranscript,
    listTranscripts,
    isRecording,
    recordingId,
    isLoading,
    error,
  };
}
