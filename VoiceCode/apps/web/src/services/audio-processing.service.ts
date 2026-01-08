/**
 * Audio Processing Service
 * Phase 3.2: Audio File Upload & Processing
 * 
 * Provides audio file processing, conversion, and transcription
 */

import { EventEmitter } from 'eventemitter3';
import { getSupabaseService, Transcript } from './supabase.service';
import { getStreamingService } from './websocket-streaming.service';

export type AudioFormat = 'mp3' | 'wav' | 'm4a' | 'ogg' | 'flac' | 'webm';

export interface AudioFile {
  id: string;
  file: File;
  name: string;
  size: number;
  format: AudioFormat;
  duration?: number;
  status: 'pending' | 'uploading' | 'processing' | 'transcribing' | 'complete' | 'error';
  progress: number;
  error?: string;
  transcript?: Transcript;
  audioUrl?: string;
}

export interface AudioProcessingOptions {
  language?: string;
  professionalMode?: string;
  enableDiarization?: boolean;
  targetSampleRate?: number;
  chunkSize?: number; // MB
}

export interface AudioProcessingEvents {
  'file:added': (file: AudioFile) => void;
  'file:progress': (file: AudioFile) => void;
  'file:complete': (file: AudioFile) => void;
  'file:error': (file: AudioFile, error: Error) => void;
  'queue:complete': () => void;
}

/**
 * Audio Processing Service Class
 */
export class AudioProcessingService extends EventEmitter<AudioProcessingEvents> {
  private supabase = getSupabaseService();
  private streamingService = getStreamingService(import.meta.env.VITE_AIML_API_KEY || '');
  private queue: AudioFile[] = [];
  private isProcessing: boolean = false;
  private maxConcurrent: number = 1;

  // Supported formats
  private supportedFormats: AudioFormat[] = ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'webm'];

  /**
   * Add files to processing queue
   */
  async addFiles(files: File[], options: AudioProcessingOptions = {}): Promise<AudioFile[]> {
    const audioFiles: AudioFile[] = [];

    for (const file of files) {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        console.error(`Invalid file ${file.name}:`, validation.error);
        continue;
      }

      // Create audio file entry
      const audioFile: AudioFile = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        format: this.getFileFormat(file),
        status: 'pending',
        progress: 0,
      };

      this.queue.push(audioFile);
      audioFiles.push(audioFile);
      this.emit('file:added', audioFile);
    }

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue(options);
    }

    return audioFiles;
  }

  /**
   * Process queue
   */
  private async processQueue(options: AudioProcessingOptions): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const file = this.queue[0];
      
      try {
        await this.processFile(file, options);
        this.queue.shift(); // Remove from queue
      } catch (error) {
        console.error('Failed to process file:', error);
        file.status = 'error';
        file.error = error instanceof Error ? error.message : 'Unknown error';
        this.emit('file:error', file, error as Error);
        this.queue.shift(); // Remove from queue even on error
      }
    }

    this.isProcessing = false;
    this.emit('queue:complete');
  }

  /**
   * Process individual file
   */
  private async processFile(audioFile: AudioFile, options: AudioProcessingOptions): Promise<void> {
    // Step 1: Upload to Supabase Storage
    audioFile.status = 'uploading';
    audioFile.progress = 0;
    this.emit('file:progress', audioFile);

    const audioUrl = await this.uploadToStorage(audioFile);
    audioFile.audioUrl = audioUrl;
    audioFile.progress = 30;
    this.emit('file:progress', audioFile);

    // Step 2: Convert audio if needed
    audioFile.status = 'processing';
    audioFile.progress = 40;
    this.emit('file:progress', audioFile);

    const audioBuffer = await this.convertAudio(audioFile, options.targetSampleRate || 16000);
    audioFile.progress = 60;
    this.emit('file:progress', audioFile);

    // Step 3: Transcribe audio
    audioFile.status = 'transcribing';
    audioFile.progress = 70;
    this.emit('file:progress', audioFile);

    const transcript = await this.transcribeAudio(audioFile, audioBuffer, options);
    audioFile.transcript = transcript;
    audioFile.progress = 100;
    audioFile.status = 'complete';
    this.emit('file:complete', audioFile);
  }

  /**
   * Upload to Supabase Storage
   */
  private async uploadToStorage(audioFile: AudioFile): Promise<string> {
    if (!this.supabase.isAvailable()) {
      throw new Error('Supabase not available');
    }

    // For now, create a local URL (in production, upload to Supabase Storage)
    const url = URL.createObjectURL(audioFile.file);
    return url;

    // TODO: Implement actual Supabase Storage upload
    // const { data, error } = await supabase.storage
    //   .from('audio-files')
    //   .upload(`${userId}/${audioFile.id}`, audioFile.file);
  }

  /**
   * Convert audio to target format
   */
  private async convertAudio(audioFile: AudioFile, targetSampleRate: number): Promise<AudioBuffer> {
    const arrayBuffer = await audioFile.file.arrayBuffer();
    const audioContext = new AudioContext({ sampleRate: targetSampleRate });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get duration
    audioFile.duration = audioBuffer.duration;

    return audioBuffer;
  }

  /**
   * Transcribe audio using AIML API
   */
  private async transcribeAudio(
    audioFile: AudioFile,
    audioBuffer: AudioBuffer,
    options: AudioProcessingOptions
  ): Promise<Transcript> {
    // Convert AudioBuffer to PCM data
    const pcmData = this.audioBufferToPCM(audioBuffer);

    // Create transcript placeholder
    const transcript: Partial<Transcript> = {
      id: crypto.randomUUID(),
      user_id: this.supabase.getCurrentUser()?.id || '',
      title: audioFile.name.replace(/\.[^/.]+$/, ''), // Remove extension
      content: '',
      language: options.language || 'en',
      professional_mode: options.professionalMode || 'general',
      duration: audioFile.duration || 0,
      word_count: 0,
      confidence: 0,
      metadata: {
        device: 'web',
        platform: navigator.platform || 'unknown',
        version: '1.0.0',
        source: 'audio_upload',
        original_filename: audioFile.name,
        audio_url: audioFile.audioUrl,
        file_size: audioFile.size,
        format: audioFile.format,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    };

    // Transcribe using streaming service (simulated for now)
    // In production, this would send audio chunks to AIML API
    transcript.content = `[Transcription of ${audioFile.name}]\n\nThis is a placeholder transcript. In production, this would contain the actual transcription from the audio file.`;
    transcript.word_count = transcript.content.split(/\s+/).length;
    transcript.confidence = 0.85;

    // Save transcript to database
    if (this.supabase.isAvailable()) {
      const savedTranscript = await this.supabase.saveTranscript(transcript as any);
      return savedTranscript;
    }

    return transcript as Transcript;
  }

  /**
   * Convert AudioBuffer to PCM data
   */
  private audioBufferToPCM(audioBuffer: AudioBuffer): Int16Array {
    const channelData = audioBuffer.getChannelData(0); // Get first channel (mono)
    const pcmData = new Int16Array(channelData.length);

    for (let i = 0; i < channelData.length; i++) {
      // Convert float32 (-1 to 1) to int16 (-32768 to 32767)
      const s = Math.max(-1, Math.min(1, channelData[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    return pcmData;
  }

  /**
   * Validate file
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File too large (max 500MB)' };
    }

    // Check file format
    const format = this.getFileFormat(file);
    if (!this.supportedFormats.includes(format)) {
      return { valid: false, error: `Unsupported format: ${format}` };
    }

    return { valid: true };
  }

  /**
   * Get file format from file
   */
  private getFileFormat(file: File): AudioFormat {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Map extensions to formats
    const formatMap: Record<string, AudioFormat> = {
      'mp3': 'mp3',
      'wav': 'wav',
      'm4a': 'm4a',
      'ogg': 'ogg',
      'flac': 'flac',
      'webm': 'webm',
    };

    return formatMap[extension] || 'mp3';
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    total: number;
    pending: number;
    processing: number;
    complete: number;
    error: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(f => f.status === 'pending').length,
      processing: this.queue.filter(f => ['uploading', 'processing', 'transcribing'].includes(f.status)).length,
      complete: this.queue.filter(f => f.status === 'complete').length,
      error: this.queue.filter(f => f.status === 'error').length,
    };
  }

  /**
   * Get all files in queue
   */
  getQueue(): AudioFile[] {
    return [...this.queue];
  }

  /**
   * Clear queue
   */
  clearQueue(): void {
    this.queue = [];
  }

  /**
   * Remove file from queue
   */
  removeFile(fileId: string): void {
    this.queue = this.queue.filter(f => f.id !== fileId);
  }

  /**
   * Retry failed file
   */
  async retryFile(fileId: string, options: AudioProcessingOptions = {}): Promise<void> {
    const file = this.queue.find(f => f.id === fileId);
    if (!file) {
      throw new Error('File not found in queue');
    }

    file.status = 'pending';
    file.progress = 0;
    file.error = undefined;

    if (!this.isProcessing) {
      this.processQueue(options);
    }
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): AudioFormat[] {
    return [...this.supportedFormats];
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format duration
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
let audioProcessingInstance: AudioProcessingService | null = null;

export function getAudioProcessingService(): AudioProcessingService {
  if (!audioProcessingInstance) {
    audioProcessingInstance = new AudioProcessingService();
  }
  return audioProcessingInstance;
}

export default getAudioProcessingService;

