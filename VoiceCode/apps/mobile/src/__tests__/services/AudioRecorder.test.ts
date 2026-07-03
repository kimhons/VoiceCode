// VoiceCode Mobile - Audio Recorder Service Tests

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AudioRecorder } from '../../services/AudioRecorder';

describe('AudioRecorder', () => {
  let recorder: AudioRecorder;

  beforeEach(() => {
    recorder = new AudioRecorder();
    jest.clearAllMocks();
  });

  describe('Permissions', () => {
    it('should request microphone permissions', async () => {
      const result = await recorder.requestPermissions();
      expect(result).toBeDefined();
    });

    it('should check if permissions are granted', async () => {
      const hasPermissions = await recorder.hasPermissions();
      expect(typeof hasPermissions).toBe('boolean');
    });
  });

  describe('Recording', () => {
    it('should start recording', async () => {
      await recorder.requestPermissions();
      const result = await recorder.startRecording();
      expect(result).toHaveProperty('uri');
    });

    it('should stop recording', async () => {
      await recorder.startRecording();
      const result = await recorder.stopRecording();
      expect(result).toHaveProperty('uri');
      expect(result).toHaveProperty('duration');
    });

    it('should pause recording', async () => {
      await recorder.startRecording();
      await recorder.pauseRecording();
      const status = await recorder.getRecordingStatus();
      expect(status).toBe('paused');
    });

    it('should resume recording', async () => {
      await recorder.startRecording();
      await recorder.pauseRecording();
      await recorder.resumeRecording();
      const status = await recorder.getRecordingStatus();
      expect(status).toBe('recording');
    });

    it('should get recording duration', async () => {
      await recorder.startRecording();
      const duration = await recorder.getRecordingDuration();
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle recording without permissions', async () => {
      await expect(recorder.startRecording()).rejects.toThrow();
    });

    it('should handle stopping when not recording', async () => {
      await expect(recorder.stopRecording()).rejects.toThrow();
    });
  });
});
