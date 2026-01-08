/**
 * useAudioUpload Hook
 * Phase 3.2: Audio File Upload & Processing
 * 
 * React hook for audio file upload and processing
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getAudioProcessingService, 
  AudioFile, 
  AudioProcessingOptions,
  AudioFormat 
} from '../services/audio-processing.service';

export interface UseAudioUploadOptions {
  autoProcess?: boolean;
  maxFiles?: number;
  language?: string;
  professionalMode?: string;
  enableDiarization?: boolean;
}

export interface UseAudioUploadReturn {
  // Files
  files: AudioFile[];
  addFiles: (files: FileList | File[]) => Promise<void>;
  removeFile: (fileId: string) => void;
  retryFile: (fileId: string) => Promise<void>;
  clearAll: () => void;

  // Queue status
  queueStatus: {
    total: number;
    pending: number;
    processing: number;
    complete: number;
    error: number;
  };

  // State
  isProcessing: boolean;
  isDragging: boolean;
  error: string | null;

  // Drag and drop handlers
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;

  // Supported formats
  supportedFormats: AudioFormat[];
}

export function useAudioUpload(
  options: UseAudioUploadOptions = {}
): UseAudioUploadReturn {
  const {
    autoProcess = true,
    maxFiles = 10,
    language = 'en',
    professionalMode = 'general',
    enableDiarization = false,
  } = options;

  // Services
  const audioService = useRef(getAudioProcessingService());

  // State
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    complete: 0,
    error: 0,
  });

  // Drag counter for nested drag events
  const dragCounter = useRef(0);

  // Initialize event listeners
  useEffect(() => {
    const service = audioService.current;

    // File added
    const handleFileAdded = (file: AudioFile) => {
      setFiles(prev => [...prev, file]);
      updateQueueStatus();
    };

    // File progress
    const handleFileProgress = (file: AudioFile) => {
      setFiles(prev => prev.map(f => f.id === file.id ? file : f));
      updateQueueStatus();
    };

    // File complete
    const handleFileComplete = (file: AudioFile) => {
      setFiles(prev => prev.map(f => f.id === file.id ? file : f));
      updateQueueStatus();
    };

    // File error
    const handleFileError = (file: AudioFile, err: Error) => {
      setFiles(prev => prev.map(f => f.id === file.id ? file : f));
      setError(err.message);
      updateQueueStatus();
    };

    // Queue complete
    const handleQueueComplete = () => {
      setIsProcessing(false);
      updateQueueStatus();
    };

    // Register listeners
    service.on('file:added', handleFileAdded);
    service.on('file:progress', handleFileProgress);
    service.on('file:complete', handleFileComplete);
    service.on('file:error', handleFileError);
    service.on('queue:complete', handleQueueComplete);

    return () => {
      service.off('file:added', handleFileAdded);
      service.off('file:progress', handleFileProgress);
      service.off('file:complete', handleFileComplete);
      service.off('file:error', handleFileError);
      service.off('queue:complete', handleQueueComplete);
    };
  }, []);

  // Update queue status
  const updateQueueStatus = useCallback(() => {
    const status = audioService.current.getQueueStatus();
    setQueueStatus(status);
    setIsProcessing(status.processing > 0);
  }, []);

  // Add files
  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    setError(null);

    // Convert FileList to array
    const filesArray = Array.from(fileList);

    // Check max files
    if (files.length + filesArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Processing options
    const processingOptions: AudioProcessingOptions = {
      language,
      professionalMode,
      enableDiarization,
    };

    try {
      await audioService.current.addFiles(filesArray, processingOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add files');
    }
  }, [files.length, maxFiles, language, professionalMode, enableDiarization]);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    audioService.current.removeFile(fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
    updateQueueStatus();
  }, [updateQueueStatus]);

  // Retry file
  const retryFile = useCallback(async (fileId: string) => {
    setError(null);
    const processingOptions: AudioProcessingOptions = {
      language,
      professionalMode,
      enableDiarization,
    };

    try {
      await audioService.current.retryFile(fileId, processingOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry file');
    }
  }, [language, professionalMode, enableDiarization]);

  // Clear all
  const clearAll = useCallback(() => {
    audioService.current.clearQueue();
    setFiles([]);
    setError(null);
    updateQueueStatus();
  }, [updateQueueStatus]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  // Get supported formats
  const supportedFormats = audioService.current.getSupportedFormats();

  return {
    // Files
    files,
    addFiles,
    removeFile,
    retryFile,
    clearAll,

    // Queue status
    queueStatus,

    // State
    isProcessing,
    isDragging,
    error,

    // Drag and drop handlers
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,

    // Supported formats
    supportedFormats,
  };
}

