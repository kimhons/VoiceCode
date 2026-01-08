/**
 * useTranscriptEditor Hook
 * Phase 3.1: Transcript Editor & Export
 * 
 * React hook for transcript editing and export functionality
 */

import { useState, useCallback, useRef } from 'react';
import { Transcript } from '../services/supabase.service';
import { getExportService, ExportFormat, ExportOptions } from '../services/export.service';
import { useCloudSync } from './useCloudSync';

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

  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

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

    // Start auto-save timer
    if (autoSave) {
      autoSaveTimer.current = setInterval(() => {
        if (hasUnsavedChanges) {
          saveChanges(editedContent || transcript.content);
        }
      }, autoSaveInterval);
    }
  }, [autoSave, autoSaveInterval, hasUnsavedChanges, editedContent]);

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

    // Export actions
    exportTranscript,
    isExporting,

    // Current transcript
    currentTranscript,
    editedContent,
  };
}

