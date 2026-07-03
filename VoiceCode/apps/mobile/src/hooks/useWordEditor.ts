import { useState, useCallback, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';

export interface WordData {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

interface EditAction {
  type: 'edit' | 'delete' | 'insert';
  index: number;
  oldWord?: WordData;
  newWord?: WordData;
  oldWords?: WordData[];
}

interface UseWordEditorReturn {
  editingIndex: number | null;
  hasUnsavedChanges: boolean;
  canUndo: boolean;
  canRedo: boolean;
  startEdit: (index: number) => void;
  commitEdit: (index: number, newWord: string) => void;
  cancelEdit: () => void;
  deleteWord: (index: number) => void;
  insertWord: (index: number, word: WordData) => void;
  undo: () => void;
  redo: () => void;
  getWords: () => WordData[];
  resetChanges: () => void;
}

const MAX_HISTORY = 50;

interface UseWordEditorOptions {
  words: WordData[];
  onWordChange?: (index: number, newWord: string) => void;
  onWordsChange?: (words: WordData[]) => void;
}

export function useWordEditor(
  optionsOrWords: UseWordEditorOptions | WordData[],
  onWordsChangeArg?: (words: WordData[]) => void
): UseWordEditorReturn {
  // Support both old and new API
  const isOptionsObject = !Array.isArray(optionsOrWords) && 'words' in optionsOrWords;
  const initialWords = isOptionsObject ? optionsOrWords.words : optionsOrWords;
  const onWordChange = isOptionsObject ? optionsOrWords.onWordChange : undefined;
  const onWordsChange = isOptionsObject ? optionsOrWords.onWordsChange : onWordsChangeArg;
  const [words, setWords] = useState<WordData[]>(initialWords);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // History stacks for undo/redo
  const undoStack = useRef<EditAction[]>([]);
  const redoStack = useRef<EditAction[]>([]);

  // Sync with initial words when they change
  useEffect(() => {
    setWords(initialWords);
    undoStack.current = [];
    redoStack.current = [];
    setHasUnsavedChanges(false);
  }, [initialWords]);

  // Push action to undo stack
  const pushAction = useCallback((action: EditAction) => {
    undoStack.current.push(action);
    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }
    redoStack.current = []; // Clear redo on new action
    setHasUnsavedChanges(true);
  }, []);

  // Start editing a word
  const startEdit = useCallback((index: number) => {
    setEditingIndex(index);
  }, []);

  // Commit word edit
  const commitEdit = useCallback((index: number, newWordText: string) => {
    if (index < 0 || index >= words.length) return;

    const oldWord = words[index];
    const newWord: WordData = {
      ...oldWord,
      word: newWordText,
      confidence: 1.0, // User-edited words have high confidence
    };

    // Push to undo stack
    pushAction({
      type: 'edit',
      index,
      oldWord,
      newWord,
    });

    // Update words
    const newWords = [...words];
    newWords[index] = newWord;
    setWords(newWords);

    // Call the appropriate callback
    if (onWordChange) {
      onWordChange(index, newWordText);
    }
    onWordsChange?.(newWords);
    setEditingIndex(null);
  }, [words, pushAction, onWordsChange, onWordChange]);

  // Cancel editing
  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Delete a word
  const deleteWord = useCallback((index: number) => {
    if (index < 0 || index >= words.length) return;

    const oldWord = words[index];

    // Push to undo stack
    pushAction({
      type: 'delete',
      index,
      oldWord,
    });

    // Update words
    const newWords = words.filter((_, i) => i !== index);

    // Recalculate timestamps after deletion
    // Keep relative timing but shift words after deleted one
    const shiftedWords = newWords.map((w, i) => {
      if (i >= index && oldWord) {
        const duration = oldWord.end - oldWord.start;
        return {
          ...w,
          start: w.start - duration,
          end: w.end - duration,
        };
      }
      return w;
    });

    setWords(shiftedWords);
    onWordsChange?.(shiftedWords);

    if (editingIndex === index) {
      setEditingIndex(null);
    }
  }, [words, pushAction, onWordsChange, editingIndex]);

  // Insert a word
  const insertWord = useCallback((index: number, word: WordData) => {
    // Push to undo stack
    pushAction({
      type: 'insert',
      index,
      newWord: word,
    });

    // Insert word
    const newWords = [
      ...words.slice(0, index),
      word,
      ...words.slice(index),
    ];

    setWords(newWords);
    onWordsChange?.(newWords);
  }, [words, pushAction, onWordsChange]);

  // Undo last action
  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;

    const action = undoStack.current.pop()!;
    redoStack.current.push(action);

    let newWords: WordData[];

    switch (action.type) {
      case 'edit':
        // Restore old word
        newWords = [...words];
        if (action.oldWord) {
          newWords[action.index] = action.oldWord;
        }
        break;

      case 'delete':
        // Re-insert deleted word
        if (action.oldWord) {
          newWords = [
            ...words.slice(0, action.index),
            action.oldWord,
            ...words.slice(action.index),
          ];
        } else {
          newWords = words;
        }
        break;

      case 'insert':
        // Remove inserted word
        newWords = words.filter((_, i) => i !== action.index);
        break;

      default:
        newWords = words;
    }

    setWords(newWords);
    onWordsChange?.(newWords);

    if (undoStack.current.length === 0) {
      setHasUnsavedChanges(false);
    }
  }, [words, onWordsChange]);

  // Redo last undone action
  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;

    const action = redoStack.current.pop()!;
    undoStack.current.push(action);

    let newWords: WordData[];

    switch (action.type) {
      case 'edit':
        // Apply new word
        newWords = [...words];
        if (action.newWord) {
          newWords[action.index] = action.newWord;
        }
        break;

      case 'delete':
        // Delete again
        newWords = words.filter((_, i) => i !== action.index);
        break;

      case 'insert':
        // Re-insert word
        if (action.newWord) {
          newWords = [
            ...words.slice(0, action.index),
            action.newWord,
            ...words.slice(action.index),
          ];
        } else {
          newWords = words;
        }
        break;

      default:
        newWords = words;
    }

    setWords(newWords);
    onWordsChange?.(newWords);
    setHasUnsavedChanges(true);
  }, [words, onWordsChange]);

  // Get current words
  const getWords = useCallback(() => words, [words]);

  // Reset all changes
  const resetChanges = useCallback(() => {
    setWords(initialWords);
    undoStack.current = [];
    redoStack.current = [];
    setHasUnsavedChanges(false);
    setEditingIndex(null);
  }, [initialWords]);

  return {
    editingIndex,
    hasUnsavedChanges,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    startEdit,
    commitEdit,
    cancelEdit,
    deleteWord,
    insertWord,
    undo,
    redo,
    getWords,
    resetChanges,
  };
}

export default useWordEditor;
