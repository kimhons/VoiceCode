/**
 * useAIFeatures Hook
 * Phase 3.3: AI-Powered Features
 * 
 * React hook for AI-powered transcript analysis
 */

import { useState, useCallback, useRef } from 'react';
import {
  getAIFeaturesService,
  TranscriptSummary,
  KeyPoint,
  ActionItem,
  SentimentAnalysis,
  Topic,
  SmartSearchResult,
} from '../services/ai-features.service';
import { Transcript } from '../services/supabase.service';

export interface UseAIFeaturesOptions {
  apiKey?: string;
}

export interface UseAIFeaturesReturn {
  // Summary
  summary: TranscriptSummary | null;
  generateSummary: (transcript: Transcript) => Promise<void>;
  isSummarizing: boolean;

  // Key Points
  keyPoints: KeyPoint[];
  extractKeyPoints: (transcript: Transcript, maxPoints?: number) => Promise<void>;
  isExtractingKeyPoints: boolean;

  // Action Items
  actionItems: ActionItem[];
  detectActionItems: (transcript: Transcript) => Promise<void>;
  isDetectingActionItems: boolean;
  toggleActionItem: (id: string) => void;

  // Sentiment
  sentiment: SentimentAnalysis | null;
  analyzeSentiment: (transcript: Transcript) => Promise<void>;
  isAnalyzingSentiment: boolean;

  // Topics
  topics: Topic[];
  detectTopics: (transcript: Transcript, maxTopics?: number) => Promise<void>;
  isDetectingTopics: boolean;

  // Smart Search
  searchResults: SmartSearchResult[];
  smartSearch: (query: string, transcripts: Transcript[], maxResults?: number) => Promise<void>;
  isSearching: boolean;

  // State
  error: string | null;
  clearError: () => void;
  clearAll: () => void;
}

export function useAIFeatures(
  options: UseAIFeaturesOptions = {}
): UseAIFeaturesReturn {
  const { apiKey } = options;

  // Service
  const aiService = useRef(getAIFeaturesService(apiKey));

  // State
  const [summary, setSummary] = useState<TranscriptSummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [isExtractingKeyPoints, setIsExtractingKeyPoints] = useState(false);

  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isDetectingActionItems, setIsDetectingActionItems] = useState(false);

  const [sentiment, setSentiment] = useState<SentimentAnalysis | null>(null);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [isDetectingTopics, setIsDetectingTopics] = useState(false);

  const [searchResults, setSearchResults] = useState<SmartSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Generate summary
  const generateSummary = useCallback(async (transcript: Transcript) => {
    setError(null);
    setIsSummarizing(true);

    try {
      const result = await aiService.current.generateSummary(transcript);
      setSummary(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate summary';
      setError(message);
      console.error('Failed to generate summary:', err);
    } finally {
      setIsSummarizing(false);
    }
  }, []);

  // Extract key points
  const extractKeyPoints = useCallback(async (transcript: Transcript, maxPoints: number = 10) => {
    setError(null);
    setIsExtractingKeyPoints(true);

    try {
      const result = await aiService.current.extractKeyPoints(transcript, maxPoints);
      setKeyPoints(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to extract key points';
      setError(message);
      console.error('Failed to extract key points:', err);
    } finally {
      setIsExtractingKeyPoints(false);
    }
  }, []);

  // Detect action items
  const detectActionItems = useCallback(async (transcript: Transcript) => {
    setError(null);
    setIsDetectingActionItems(true);

    try {
      const result = await aiService.current.detectActionItems(transcript);
      setActionItems(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to detect action items';
      setError(message);
      console.error('Failed to detect action items:', err);
    } finally {
      setIsDetectingActionItems(false);
    }
  }, []);

  // Toggle action item completion
  const toggleActionItem = useCallback((id: string) => {
    setActionItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  // Analyze sentiment
  const analyzeSentiment = useCallback(async (transcript: Transcript) => {
    setError(null);
    setIsAnalyzingSentiment(true);

    try {
      const result = await aiService.current.analyzeSentiment(transcript);
      setSentiment(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze sentiment';
      setError(message);
      console.error('Failed to analyze sentiment:', err);
    } finally {
      setIsAnalyzingSentiment(false);
    }
  }, []);

  // Detect topics
  const detectTopics = useCallback(async (transcript: Transcript, maxTopics: number = 5) => {
    setError(null);
    setIsDetectingTopics(true);

    try {
      const result = await aiService.current.detectTopics(transcript, maxTopics);
      setTopics(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to detect topics';
      setError(message);
      console.error('Failed to detect topics:', err);
    } finally {
      setIsDetectingTopics(false);
    }
  }, []);

  // Smart search
  const smartSearch = useCallback(async (
    query: string,
    transcripts: Transcript[],
    maxResults: number = 10
  ) => {
    setError(null);
    setIsSearching(true);

    try {
      const result = await aiService.current.smartSearch(query, transcripts, maxResults);
      setSearchResults(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search';
      setError(message);
      console.error('Failed to search:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setSummary(null);
    setKeyPoints([]);
    setActionItems([]);
    setSentiment(null);
    setTopics([]);
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    // Summary
    summary,
    generateSummary,
    isSummarizing,

    // Key Points
    keyPoints,
    extractKeyPoints,
    isExtractingKeyPoints,

    // Action Items
    actionItems,
    detectActionItems,
    isDetectingActionItems,
    toggleActionItem,

    // Sentiment
    sentiment,
    analyzeSentiment,
    isAnalyzingSentiment,

    // Topics
    topics,
    detectTopics,
    isDetectingTopics,

    // Smart Search
    searchResults,
    smartSearch,
    isSearching,

    // State
    error,
    clearError,
    clearAll,
  };
}

