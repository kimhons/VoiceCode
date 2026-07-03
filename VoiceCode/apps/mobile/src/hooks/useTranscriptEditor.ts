/**
 * useTranscriptEditor Hook
 * Phase 3.1: Transcript Editor & Export
 *
 * React hook for transcript editing and export functionality
 * Extended with word-level editing support
 */

import { useState, useCallback, useRef } from 'react';
import { Transcript } from '../services/supabase.service';
import { getExportService, ExportFormat, ExportOptions } from '../services/export.service';
import { useCloudSync } from './useCloudSync';

export interface WordData {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface UseTranscriptEditorOptions {
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
}

export interface UseTranscriptEditorReturn {
  // Editor state
  isEditing: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;

  // Editor actions
  startEditing: (transcript: Transcript) => void;
  stopEditing: () => void;
  saveChanges: (content: string) => Promise<void>;
  discardChanges: () => void;

  // Word-level editing
  words: WordData[];
  updateWord: (index: number, newWord: string) => void;
  deleteWord: (index: number) => void;
  updateWords: (words: WordData[]) => void;
  wordsToText: (words: WordData[]) => string;
  textToWords: (text: string) => WordData[];

  // Export actions
  exportTranscript: (format: ExportFormat, options?: ExportOptions) => Promise<void>;
  isExporting: boolean;

  // Current transcript
  currentTranscript: Transcript | null;
  editedContent: string | null;
}

export function useTranscriptEditor(
  options: UseTranscriptEditorOptions = {}
): UseTranscriptEditorReturn {
  const {
    autoSave = true,
    autoSaveInterval = 5000,
  } = options;

  // Services
  const exportService = useRef(getExportService());
  const { updateTranscript } = useCloudSync();

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<Transcript | null>(null);
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [words, setWords] = useState<WordData[]>([]);

  // Auto-save timer
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Convert words array to text
   */
  const wordsToText = useCallback((wordArray: WordData[]): string => {
    return wordArray.map((w) => w.word).join(' ');
  }, []);

  /**
   * Convert text to words array with estimated timing
   */
  const textToWords = useCallback((text: string): WordData[] => {
    const wordStrings = text.trim().split(/\s+/);
    const avgWordDuration = 0.3; // Average word duration in seconds
    let currentTime = 0;

    return wordStrings.map((word) => {
      const start = currentTime;
      const end = currentTime + avgWordDuration;
      currentTime = end + 0.1; // Small gap between words

      return {
        word,
        start,
        end,
        confidence: 1.0, // User-provided text has high confidence
      };
    });
  }, []);

  /**
   * Update a single word
   */
  const updateWord = useCallback(
    (index: number, newWord: string) => {
      if (index < 0 || index >= words.length) return;

      const newWords = [...words];
      newWords[index] = {
        ...newWords[index],
        word: newWord,
        confidence: 1.0,
      };

      setWords(newWords);
      setEditedContent(wordsToText(newWords));
      setHasUnsavedChanges(true);
    },
    [words, wordsToText]
  );

  /**
   * Delete a word
   */
  const deleteWord = useCallback(
    (index: number) => {
      if (index < 0 || index >= words.length) return;

      const newWords = words.filter((_, i) => i !== index);
      setWords(newWords);
      setEditedContent(wordsToText(newWords));
      setHasUnsavedChanges(true);
    },
    [words, wordsToText]
  );

  /**
   * Update entire words array
   */
  const updateWords = useCallback(
    (newWords: WordData[]) => {
      setWords(newWords);
      setEditedContent(wordsToText(newWords));
      setHasUnsavedChanges(true);
    },
    [wordsToText]
  );

  /**
   * Start editing a transcript
   */
  const startEditing = useCallback((transcript: Transcript) => {
    setCurrentTranscript(transcript);
    setEditedContent(transcript.content);
    setOriginalContent(transcript.content);
    setIsEditing(true);
    setHasUnsavedChanges(false);
    setLastSaved(null);

    // Initialize words from transcript metadata or content
    const transcriptWords =
      (transcript.metadata?.words as WordData[]) ||
      textToWords(transcript.content);
    setWords(transcriptWords);

    // Start auto-save timer
    if (autoSave) {
      autoSaveTimer.current = setInterval(() => {
        if (hasUnsavedChanges) {
          saveChanges(editedContent || transcript.content);
        }
      }, autoSaveInterval);
    }
  }, [autoSave, autoSaveInterval, hasUnsavedChanges, editedContent, textToWords]);

  /**
   * Stop editing
   */
  const stopEditing = useCallback(() => {
    // Clear auto-save timer
    if (autoSaveTimer.current) {
      clearInterval(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }

    setIsEditing(false);
    setCurrentTranscript(null);
    setEditedContent(null);
    setOriginalContent(null);
    setHasUnsavedChanges(false);
    setWords([]);
  }, []);

  /**
   * Save changes
   */
  const saveChanges = useCallback(async (content: string) => {
    if (!currentTranscript) {
      throw new Error('No transcript is being edited');
    }

    setIsSaving(true);
    try {
      // Update content
      setEditedContent(content);

      // Calculate new word count
      const wordCount = content.trim().split(/\s+/).length;

      // Update transcript
      await updateTranscript(currentTranscript.id, {
        content,
        word_count: wordCount,
      });

      // Update state
      setOriginalContent(content);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());

      // Update current transcript
      setCurrentTranscript({
        ...currentTranscript,
        content,
        word_count: wordCount,
      });
    } catch (error) {
      console.error('Failed to save changes:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [currentTranscript, updateTranscript]);

  /**
   * Discard changes
   */
  const discardChanges = useCallback(() => {
    if (originalContent) {
      setEditedContent(originalContent);
      setHasUnsavedChanges(false);
    }
  }, [originalContent]);

  /**
   * Export transcript
   */
  const exportTranscript = useCallback(async (
    format: ExportFormat,
    options: ExportOptions = {}
  ) => {
    if (!currentTranscript) {
      throw new Error('No transcript to export');
    }

    setIsExporting(true);
    try {
      // Use edited content if available
      const transcriptToExport = editedContent
        ? { ...currentTranscript, content: editedContent }
        : currentTranscript;

      await exportService.current.exportTranscript(transcriptToExport, format, options);
    } catch (error) {
      console.error('Failed to export transcript:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [currentTranscript, editedContent]);

  return {
    // Editor state
    isEditing,
    isSaving,
    lastSaved,
    hasUnsavedChanges,

    // Editor actions
    startEditing,
    stopEditing,
    saveChanges,
    discardChanges,

    // Word-level editing
    words,
    updateWord,
    deleteWord,
    updateWords,
    wordsToText,
    textToWords,

    // Export actions
    exportTranscript,
    isExporting,

    // Current transcript
    currentTranscript,
    editedContent,
  };
}

