// VoiceCode Pro Mobile - Audio Player Service

import { Audio, AVPlaybackStatus } from 'expo-av';

export enum PlaybackStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error',
}

export interface PlaybackState {
  status: PlaybackStatus;
  position: number; // in milliseconds
  duration: number; // in milliseconds
  isLoaded: boolean;
  rate: number; // playback speed (0.5 - 2.0)
  volume: number; // 0.0 - 1.0
}

type PlaybackStatusCallback = (state: PlaybackState) => void;

export class AudioPlayer {
  private sound: Audio.Sound | null = null;
  private currentUri: string | null = null;
  private playbackState: PlaybackState = {
    status: PlaybackStatus.IDLE,
    position: 0,
    duration: 0,
    isLoaded: false,
    rate: 1.0,
    volume: 1.0,
  };
  private statusCallback: PlaybackStatusCallback | null = null;

  constructor() {
    this.setupAudio();
  }

  private async setupAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  }

  private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      const newState: PlaybackState = {
        status: status.isPlaying ? PlaybackStatus.PLAYING : PlaybackStatus.PAUSED,
        position: status.positionMillis,
        duration: status.durationMillis || 0,
        isLoaded: true,
        rate: status.rate,
        volume: status.volume,
      };

      this.playbackState = newState;

      if (this.statusCallback) {
        this.statusCallback(newState);
      }

      // Auto-stop when playback finishes
      if (status.didJustFinish && !status.isLooping) {
        this.playbackState.status = PlaybackStatus.STOPPED;
        if (this.statusCallback) {
          this.statusCallback(this.playbackState);
        }
      }
    } else if (status.error) {
      console.error('Playback error:', status.error);
      this.playbackState.status = PlaybackStatus.ERROR;
      if (this.statusCallback) {
        this.statusCallback(this.playbackState);
      }
    }
  };

  async loadAudio(uri: string): Promise<void> {
    try {
      // Unload previous audio if exists
      if (this.sound) {
        await this.unloadAudio();
      }

      this.playbackState.status = PlaybackStatus.LOADING;
      if (this.statusCallback) {
        this.statusCallback(this.playbackState);
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, volume: this.playbackState.volume, rate: this.playbackState.rate },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;
      this.currentUri = uri;
      this.playbackState.status = PlaybackStatus.PAUSED;
      this.playbackState.isLoaded = true;
    } catch (error) {
      console.error('Error loading audio:', error);
      this.playbackState.status = PlaybackStatus.ERROR;
      if (this.statusCallback) {
        this.statusCallback(this.playbackState);
      }
      throw error;
    }
  }

  async play(): Promise<void> {
    try {
      if (!this.sound) {
        throw new Error('No audio loaded');
      }

      await this.sound.playAsync();
      this.playbackState.status = PlaybackStatus.PLAYING;
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    try {
      if (!this.sound) {
        throw new Error('No audio loaded');
      }

      await this.sound.pauseAsync();
      this.playbackState.status = PlaybackStatus.PAUSED;
    } catch (error) {
      console.error('Error pausing audio:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      if (!this.sound) {
        return;
      }

      await this.sound.stopAsync();
      await this.sound.setPositionAsync(0);
      this.playbackState.status = PlaybackStatus.STOPPED;
      this.playbackState.position = 0;
    } catch (error) {
      console.error('Error stopping audio:', error);
      throw error;
    }
  }

  async seekTo(positionMillis: number): Promise<void> {
    try {
      if (!this.sound) {
        throw new Error('No audio loaded');
      }

      await this.sound.setPositionAsync(positionMillis);
      this.playbackState.position = positionMillis;
    } catch (error) {
      console.error('Error seeking audio:', error);
      throw error;
    }
  }

  async setRate(rate: number): Promise<void> {
    try {
      if (!this.sound) {
        throw new Error('No audio loaded');
      }

      // Clamp rate between 0.5 and 2.0
      const clampedRate = Math.max(0.5, Math.min(2.0, rate));
      await this.sound.setRateAsync(clampedRate, true);
      this.playbackState.rate = clampedRate;
    } catch (error) {
      console.error('Error setting playback rate:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    try {
      if (!this.sound) {
        throw new Error('No audio loaded');
      }

      // Clamp volume between 0.0 and 1.0
      const clampedVolume = Math.max(0.0, Math.min(1.0, volume));
      await this.sound.setVolumeAsync(clampedVolume);
      this.playbackState.volume = clampedVolume;
    } catch (error) {
      console.error('Error setting volume:', error);
      throw error;
    }
  }

  async unloadAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
        this.currentUri = null;
        this.playbackState = {
          status: PlaybackStatus.IDLE,
          position: 0,
          duration: 0,
          isLoaded: false,
          rate: 1.0,
          volume: 1.0,
        };
      }
    } catch (error) {
      console.error('Error unloading audio:', error);
      throw error;
    }
  }

  setStatusCallback(callback: PlaybackStatusCallback | null): void {
    this.statusCallback = callback;
  }

  getPlaybackState(): PlaybackState {
    return { ...this.playbackState };
  }

  getCurrentUri(): string | null {
    return this.currentUri;
  }

  isPlaying(): boolean {
    return this.playbackState.status === PlaybackStatus.PLAYING;
  }

  isPaused(): boolean {
    return this.playbackState.status === PlaybackStatus.PAUSED;
  }

  isLoaded(): boolean {
    return this.playbackState.isLoaded;
  }
}

// Singleton instance
export const audioPlayer = new AudioPlayer();

