/**
 * useAdvancedAI Hook
 * Phase 5.6: More AI Features
 * 
 * React hook for advanced AI features
 */

import { useState, useCallback, useRef } from 'react';
import {
  getAdvancedAIService,
  AIPrompt,
  MeetingInsights,
  SmartCategory,
  EmotionAnalysis,
  SpeakerProfile,
  AISearchResult,
} from '../services/advancedAI.service';

export interface UseAdvancedAIOptions {
  userId?: string;
}

export interface UseAdvancedAIReturn {
  // Custom Prompts
  createPrompt: (
    name: string,
    description: string,
    prompt: string,
    category: AIPrompt['category'],
    isPublic?: boolean
  ) => Promise<AIPrompt>;
  getPrompts: (includePublic?: boolean) => Promise<AIPrompt[]>;
  executeCustomPrompt: (promptId: string, transcriptText: string) => Promise<string>;
  prompts: AIPrompt[];

  // Meeting Insights
  generateMeetingInsights: (transcriptId: string, transcriptText: string) => Promise<MeetingInsights>;
  meetingInsights: MeetingInsights | null;

  // Smart Categorization
  categorizeTranscript: (transcriptText: string) => Promise<SmartCategory[]>;
  categories: SmartCategory[];

  // Emotion Detection
  detectEmotions: (transcriptText: string) => Promise<EmotionAnalysis>;
  emotions: EmotionAnalysis | null;

  // Speaker Analysis
  analyzeSpeakers: (transcriptText: string) => Promise<SpeakerProfile[]>;
  speakers: SpeakerProfile[];

  // AI-Powered Search
  semanticSearch: (
    query: string,
    transcripts: Array<{ id: string; title: string; content: string }>
  ) => Promise<AISearchResult[]>;
  searchResults: AISearchResult[];

  // State
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useAdvancedAI(options: UseAdvancedAIOptions = {}): UseAdvancedAIReturn {
  const { userId } = options;

  // Service
  const service = useRef(getAdvancedAIService());

  // State
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [meetingInsights, setMeetingInsights] = useState<MeetingInsights | null>(null);
  const [categories, setCategories] = useState<SmartCategory[]>([]);
  const [emotions, setEmotions] = useState<EmotionAnalysis | null>(null);
  const [speakers, setSpeakers] = useState<SpeakerProfile[]>([]);
  const [searchResults, setSearchResults] = useState<AISearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom Prompts
  const createPrompt = useCallback(
    async (
      name: string,
      description: string,
      prompt: string,
      category: AIPrompt['category'],
      isPublic: boolean = false
    ): Promise<AIPrompt> => {
      if (!userId) throw new Error('User ID is required');

      setError(null);
      setIsLoading(true);
      try {
        const newPrompt = await service.current.createPrompt(
          userId,
          name,
          description,
          prompt,
          category,
          isPublic
        );
        setPrompts(prev => [newPrompt, ...prev]);
        return newPrompt;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create prompt';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const getPrompts = useCallback(
    async (includePublic: boolean = true): Promise<AIPrompt[]> => {
      if (!userId) return [];

      setError(null);
      setIsLoading(true);
      try {
        const fetchedPrompts = await service.current.getPrompts(userId, includePublic);
        setPrompts(fetchedPrompts);
        return fetchedPrompts;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get prompts';
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const executeCustomPrompt = useCallback(
    async (promptId: string, transcriptText: string): Promise<string> => {
      if (!userId) throw new Error('User ID is required');

      setError(null);
      setIsLoading(true);
      try {
        const response = await service.current.executeCustomPrompt(promptId, transcriptText, userId);
        return response.result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to execute prompt';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  // Meeting Insights
  const generateMeetingInsights = useCallback(
    async (transcriptId: string, transcriptText: string): Promise<MeetingInsights> => {
      setError(null);
      setIsLoading(true);
      try {
        const insights = await service.current.generateMeetingInsights(transcriptId, transcriptText);
        setMeetingInsights(insights);
        return insights;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate insights';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Smart Categorization
  const categorizeTranscript = useCallback(
    async (transcriptText: string): Promise<SmartCategory[]> => {
      setError(null);
      setIsLoading(true);
      try {
        const cats = await service.current.categorizeTranscript(transcriptText);
        setCategories(cats);
        return cats;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to categorize transcript';
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Emotion Detection
  const detectEmotions = useCallback(
    async (transcriptText: string): Promise<EmotionAnalysis> => {
      setError(null);
      setIsLoading(true);
      try {
        const emotionAnalysis = await service.current.detectEmotions(transcriptText);
        setEmotions(emotionAnalysis);
        return emotionAnalysis;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to detect emotions';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Speaker Analysis
  const analyzeSpeakers = useCallback(
    async (transcriptText: string): Promise<SpeakerProfile[]> => {
      setError(null);
      setIsLoading(true);
      try {
        const speakerProfiles = await service.current.analyzeSpeakers(transcriptText);
        setSpeakers(speakerProfiles);
        return speakerProfiles;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to analyze speakers';
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // AI-Powered Search
  const semanticSearch = useCallback(
    async (
      query: string,
      transcripts: Array<{ id: string; title: string; content: string }>
    ): Promise<AISearchResult[]> => {
      setError(null);
      setIsLoading(true);
      try {
        const results = await service.current.semanticSearch(query, transcripts);
        setSearchResults(results);
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to perform search';
        setError(message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createPrompt,
    getPrompts,
    executeCustomPrompt,
    prompts,
    generateMeetingInsights,
    meetingInsights,
    categorizeTranscript,
    categories,
    detectEmotions,
    emotions,
    analyzeSpeakers,
    speakers,
    semanticSearch,
    searchResults,
    isLoading,
    error,
    clearError,
  };
}

