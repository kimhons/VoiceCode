// VoiceCode Mobile - Audio Recorder Service Tests
// Tests the real AudioRecorder API against the mocked expo-av / expo-file-system.

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { AudioRecorder } from '../../services/AudioRecorder';
import { RecordingStatus, RecordingQuality } from '../../types/recording';

describe('AudioRecorder', () => {
  let recorder: AudioRecorder;

  beforeEach(() => {
    jest.clearAllMocks();
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 2048 });
    recorder = new AudioRecorder();
  });

  describe('status', () => {
    it('starts in the IDLE state', () => {
      expect(recorder.getStatus()).toBe(RecordingStatus.IDLE);
    });
  });

  describe('startRecording', () => {
    it('creates a recording and transitions to RECORDING', async () => {
      await recorder.startRecording(RecordingQuality.HIGH);

      expect(Audio.Recording.createAsync).toHaveBeenCalled();
      expect(recorder.getStatus()).toBe(RecordingStatus.RECORDING);
    });

    it('throws when microphone permission is denied', async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        granted: false,
        status: 'denied',
      });

      await expect(recorder.startRecording()).rejects.toThrow('Microphone permission not granted');
    });
  });

  describe('pause / resume', () => {
    it('transitions to PAUSED when pausing an active recording', async () => {
      await recorder.startRecording();
      await recorder.pauseRecording();

      expect(recorder.getStatus()).toBe(RecordingStatus.PAUSED);
    });

    it('transitions back to RECORDING when resuming a paused recording', async () => {
      await recorder.startRecording();
      await recorder.pauseRecording();
      await recorder.resumeRecording();

      expect(recorder.getStatus()).toBe(RecordingStatus.RECORDING);
    });
  });

  describe('stopRecording', () => {
    it('returns the uri and metadata and transitions to STOPPED', async () => {
      await recorder.startRecording();

      const result = await recorder.stopRecording();

      expect(result.uri).toBe('file://mock-recording.m4a');
      expect(typeof result.metadata.duration).toBe('number');
      expect(result.metadata.fileSize).toBe(2048);
      expect(recorder.getStatus()).toBe(RecordingStatus.STOPPED);
    });

    it('throws when there is no active recording', async () => {
      await expect(recorder.stopRecording()).rejects.toThrow('No active recording');
    });
  });

  describe('getDuration', () => {
    it('returns 0 while idle', () => {
      expect(recorder.getDuration()).toBe(0);
    });

    it('returns a non-negative duration while recording', async () => {
      await recorder.startRecording();
      expect(recorder.getDuration()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getMetering', () => {
    it('returns metering levels while recording', async () => {
      await recorder.startRecording();

      const metering = await recorder.getMetering();

      expect(metering).not.toBeNull();
      expect(metering?.averagePower).toBe(-30);
    });

    it('returns null when not recording', async () => {
      const metering = await recorder.getMetering();
      expect(metering).toBeNull();
    });
  });

  describe('cancelRecording', () => {
    it('discards the recording and returns to IDLE', async () => {
      await recorder.startRecording();

      await recorder.cancelRecording();

      expect(recorder.getStatus()).toBe(RecordingStatus.IDLE);
    });
  });
});
