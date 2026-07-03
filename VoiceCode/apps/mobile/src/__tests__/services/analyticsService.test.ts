// VoiceCode Mobile - Analytics Service Tests

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import analyticsService from '../../services/analyticsService';
import { logEvent, setUserProperties } from '../../config/firebase';

jest.mock('../../config/firebase');

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track custom event', async () => {
      await analyticsService.trackEvent('recording_started', { duration: 120 });

      expect(logEvent).toHaveBeenCalledWith('recording_started', { duration: 120 });
    });

    it('should track event without parameters', async () => {
      await analyticsService.trackEvent('app_opened');

      expect(logEvent).toHaveBeenCalledWith('app_opened', undefined);
    });
  });

  describe('trackScreen', () => {
    it('should track screen view', async () => {
      await analyticsService.trackScreen('RecordingScreen');

      expect(logEvent).toHaveBeenCalledWith('screen_view', {
        screen_name: 'RecordingScreen',
      });
    });
  });

  describe('setUser', () => {
    it('should set user properties', async () => {
      await analyticsService.setUser('user-123', {
        tier: 'pro',
        signup_date: '2024-01-01',
      });

      expect(setUserProperties).toHaveBeenCalledWith({
        user_id: 'user-123',
        tier: 'pro',
        signup_date: '2024-01-01',
      });
    });
  });

  describe('trackRecording', () => {
    it('should track recording metrics', async () => {
      await analyticsService.trackRecording({
        duration: 300,
        fileSize: 1024000,
        quality: 'high',
      });

      expect(logEvent).toHaveBeenCalledWith('recording_completed', {
        duration: 300,
        file_size: 1024000,
        quality: 'high',
      });
    });
  });

  describe('trackTranscription', () => {
    it('should track transcription metrics', async () => {
      await analyticsService.trackTranscription({
        wordCount: 500,
        confidence: 0.95,
        language: 'en',
      });

      expect(logEvent).toHaveBeenCalledWith('transcription_completed', {
        word_count: 500,
        confidence: 0.95,
        language: 'en',
      });
    });
  });

  describe('trackError', () => {
    it('should track error events', async () => {
      const error = new Error('Test error');
      await analyticsService.trackError(error, 'RecordingScreen');

      expect(logEvent).toHaveBeenCalledWith('error_occurred', {
        error_message: 'Test error',
        screen: 'RecordingScreen',
      });
    });
  });
});
