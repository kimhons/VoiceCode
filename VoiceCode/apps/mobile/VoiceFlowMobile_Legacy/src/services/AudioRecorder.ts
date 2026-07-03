// VoiceCode Pro Mobile - Audio Recorder Service

import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import {
  RecordingQuality,
  RecordingSettings,
  RecordingStatus,
  AudioMetering,
  RecordingMetadata,
} from '../types/recording';

export class AudioRecorder {
  private recording: Audio.Recording | null = null;
  private status: RecordingStatus = RecordingStatus.IDLE;
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private lastPauseTime: number = 0;

  constructor() {
    this.setupAudio();
  }

  private async setupAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
      throw error;
    }
  }

  private getRecordingOptions(quality: RecordingQuality): RecordingSettings {
    const qualitySettings: Record<RecordingQuality, RecordingSettings> = {
      [RecordingQuality.LOW]: {
        quality: RecordingQuality.LOW,
        sampleRate: 16000,
        channels: 1,
        bitRate: 32000,
        format: 'm4a',
      },
      [RecordingQuality.MEDIUM]: {
        quality: RecordingQuality.MEDIUM,
        sampleRate: 44100,
        channels: 1,
        bitRate: 128000,
        format: 'm4a',
      },
      [RecordingQuality.HIGH]: {
        quality: RecordingQuality.HIGH,
        sampleRate: 48000,
        channels: 2,
        bitRate: 192000,
        format: 'm4a',
      },
      [RecordingQuality.LOSSLESS]: {
        quality: RecordingQuality.LOSSLESS,
        sampleRate: 48000,
        channels: 2,
        bitRate: 320000,
        format: 'caf',
      },
    };

    return qualitySettings[quality];
  }

  async startRecording(quality: RecordingQuality = RecordingQuality.HIGH): Promise<void> {
    try {
      if (this.status === RecordingStatus.RECORDING) {
        console.warn('Recording already in progress');
        return;
      }

      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        throw new Error('Microphone permission not granted');
      }

      // Create new recording
      const settings = this.getRecordingOptions(quality);
      const { recording } = await Audio.Recording.createAsync(
        {
          isMeteringEnabled: true,
          android: {
            extension: `.${settings.format}`,
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: settings.sampleRate,
            numberOfChannels: settings.channels,
            bitRate: settings.bitRate,
          },
          ios: {
            extension: `.${settings.format}`,
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: settings.sampleRate,
            numberOfChannels: settings.channels,
            bitRate: settings.bitRate,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: settings.bitRate,
          },
        },
        undefined,
        100 // Update interval for metering (ms)
      );

      this.recording = recording;
      this.status = RecordingStatus.RECORDING;
      this.startTime = Date.now();
      this.pausedDuration = 0;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async pauseRecording(): Promise<void> {
    try {
      if (this.status !== RecordingStatus.RECORDING) {
        console.warn('No active recording to pause');
        return;
      }

      if (this.recording) {
        await this.recording.pauseAsync();
        this.status = RecordingStatus.PAUSED;
        this.lastPauseTime = Date.now();
      }
    } catch (error) {
      console.error('Error pausing recording:', error);
      throw error;
    }
  }

  async resumeRecording(): Promise<void> {
    try {
      if (this.status !== RecordingStatus.PAUSED) {
        console.warn('Recording is not paused');
        return;
      }

      if (this.recording) {
        await this.recording.startAsync();
        this.status = RecordingStatus.RECORDING;
        this.pausedDuration += Date.now() - this.lastPauseTime;
      }
    } catch (error) {
      console.error('Error resuming recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<{ uri: string; metadata: RecordingMetadata }> {
    try {
      if (!this.recording) {
        throw new Error('No active recording');
      }

      if (this.status === RecordingStatus.PAUSED) {
        this.pausedDuration += Date.now() - this.lastPauseTime;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const recordingStatus = await this.recording.getStatusAsync();

      this.status = RecordingStatus.STOPPED;

      if (!uri) {
        throw new Error('Recording URI is null');
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

      // Calculate actual recording duration (excluding paused time)
      const totalDuration = Date.now() - this.startTime;
      const actualDuration = totalDuration - this.pausedDuration;

      const metadata: RecordingMetadata = {
        duration: actualDuration,
        fileSize,
        sampleRate: 48000, // Default, can be extracted from settings
        channels: 2,
        bitRate: 192000,
      };

      // Clean up
      this.recording = null;
      this.startTime = 0;
      this.pausedDuration = 0;
      this.lastPauseTime = 0;

      return { uri, metadata };
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  async getMetering(): Promise<AudioMetering | null> {
    try {
      if (!this.recording || this.status !== RecordingStatus.RECORDING) {
        return null;
      }

      const recordingStatus = await this.recording.getStatusAsync();
      
      if (recordingStatus.isRecording && recordingStatus.metering !== undefined) {
        return {
          averagePower: recordingStatus.metering,
          peakPower: recordingStatus.metering,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting metering:', error);
      return null;
    }
  }

  getStatus(): RecordingStatus {
    return this.status;
  }

  getDuration(): number {
    if (this.status === RecordingStatus.IDLE) {
      return 0;
    }

    const totalDuration = Date.now() - this.startTime;
    const pausedTime = this.status === RecordingStatus.PAUSED
      ? this.pausedDuration + (Date.now() - this.lastPauseTime)
      : this.pausedDuration;

    return totalDuration - pausedTime;
  }

  async cancelRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        
        // Delete the file
        if (uri) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }

        this.recording = null;
        this.status = RecordingStatus.IDLE;
        this.startTime = 0;
        this.pausedDuration = 0;
        this.lastPauseTime = 0;
      }
    } catch (error) {
      console.error('Error canceling recording:', error);
      throw error;
    }
  }
}

// Singleton instance
export const audioRecorder = new AudioRecorder();

