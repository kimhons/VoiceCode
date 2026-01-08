// VoiceFlow Pro Mobile - Recording Types

export interface Recording {
  id: string;
  title: string;
  duration: number; // in milliseconds
  fileUri: string;
  fileSize: number; // in bytes
  createdAt: string;
  updatedAt: string;
  transcription?: string;
  tags?: string[];
  folder?: string;
  folderId?: string;
  isFavorite?: boolean;
  isProcessing?: boolean;
}

export interface RecordingMetadata {
  duration: number;
  fileSize: number;
  sampleRate: number;
  channels: number;
  bitRate: number;
}

export enum RecordingQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  LOSSLESS = 'lossless',
}

export interface RecordingSettings {
  quality: RecordingQuality;
  sampleRate: number;
  channels: 1 | 2; // mono or stereo
  bitRate: number;
  format: 'caf' | 'm4a' | 'wav';
}

export enum RecordingStatus {
  IDLE = 'idle',
  RECORDING = 'recording',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

export interface AudioMetering {
  averagePower: number; // in dB
  peakPower: number; // in dB
}

