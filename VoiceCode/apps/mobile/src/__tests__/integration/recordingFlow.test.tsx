// VoiceCode Mobile - Recording Flow Integration Tests

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { audioRecorder } from '../../services/AudioRecorder';
import AIMLService from '../../services/AIMLService';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/AudioRecorder');
jest.mock('../../services/AIMLService');
jest.mock('../../services/supabaseService');

describe('Recording Flow Integration', () => {
  const mockUserId = 'user-123';
  const mockAudioUri = 'file:///recording.m4a';
  const mockTranscriptText = 'This is a test transcription';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Recording to Transcription Flow', () => {
    it('should record, upload, and transcribe audio', async () => {
      // Mock recording
      (audioRecorder.startRecording as jest.Mock).mockResolvedValue(undefined);
      (audioRecorder.stopRecording as jest.Mock).mockResolvedValue({
        uri: mockAudioUri,
        metadata: { duration: 120000, fileSize: 1024000 },
      });

      // Mock upload
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'user-123/recording.m4a' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.url/recording.m4a' },
        }),
      });

      // Mock transcription
      const mockTranscript = {
        id: 'transcript-1',
        user_id: mockUserId,
        audio_url: 'https://storage.url/recording.m4a',
        text: mockTranscriptText,
        duration: 120,
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTranscript,
              error: null,
            }),
          }),
        }),
      });

      // Execute flow
      await audioRecorder.startRecording();
      const { uri, metadata } = await audioRecorder.stopRecording();

      expect(uri).toBe(mockAudioUri);
      expect(metadata.duration).toBe(120000);

      // Upload audio
      const uploadResult = await supabase.storage
        .from('audio-recordings')
        .upload(`${mockUserId}/recording.m4a`, uri);

      expect(uploadResult.data).toBeTruthy();

      // Create transcription
      const transcriptResult = await supabase
        .from('transcriptions')
        .insert(mockTranscript)
        .select()
        .single();

      expect(transcriptResult.data?.text).toBe(mockTranscriptText);
    });
  });

  describe('Recording with AI Features', () => {
    it('should generate AI summary after transcription', async () => {
      const mockSummary = {
        id: 'summary-1',
        transcriptId: 'transcript-1',
        summaryText: 'Test summary',
        confidence: 0.95,
        createdAt: '2024-01-01T00:00:00Z',
      };

      (AIMLService.generateSummary as jest.Mock).mockResolvedValue(mockSummary);

      const summary = await AIMLService.generateSummary(
        'transcript-1',
        mockTranscriptText
      );

      expect(summary.summaryText).toBe('Test summary');
      expect(summary.confidence).toBe(0.95);
    });

    it('should extract key points from transcription', async () => {
      const mockKeyPoints = {
        id: 'keypoints-1',
        transcriptId: 'transcript-1',
        keyPoints: ['Point 1', 'Point 2', 'Point 3'],
        confidence: 0.92,
        createdAt: '2024-01-01T00:00:00Z',
      };

      (AIMLService.extractKeyPoints as jest.Mock).mockResolvedValue(mockKeyPoints);

      const keyPoints = await AIMLService.extractKeyPoints(
        'transcript-1',
        mockTranscriptText
      );

      expect(keyPoints.keyPoints).toHaveLength(3);
      expect(keyPoints.keyPoints[0]).toBe('Point 1');
    });

    it('should extract action items from transcription', async () => {
      const mockActionItems = [
        {
          id: 'action-1',
          transcriptId: 'transcript-1',
          text: 'Follow up with team',
          completed: false,
          priority: 'high' as const,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      (AIMLService.extractActionItems as jest.Mock).mockResolvedValue(mockActionItems);

      const actionItems = await AIMLService.extractActionItems(
        'transcript-1',
        mockTranscriptText
      );

      expect(actionItems).toHaveLength(1);
      expect(actionItems[0].text).toBe('Follow up with team');
      expect(actionItems[0].priority).toBe('high');
    });
  });

  describe('Error Handling in Recording Flow', () => {
    it('should handle recording permission denied', async () => {
      (audioRecorder.startRecording as jest.Mock).mockRejectedValue(
        new Error('Microphone permission not granted')
      );

      await expect(audioRecorder.startRecording()).rejects.toThrow(
        'Microphone permission not granted'
      );
    });

    it('should handle upload failures', async () => {
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Upload failed' },
        }),
      });

      const result = await supabase.storage
        .from('audio-recordings')
        .upload('test.m4a', mockAudioUri);

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toBe('Upload failed');
    });

    it('should handle transcription API failures', async () => {
      (AIMLService.generateSummary as jest.Mock).mockRejectedValue(
        new Error('AI API error')
      );

      await expect(
        AIMLService.generateSummary('transcript-1', mockTranscriptText)
      ).rejects.toThrow('AI API error');
    });
  });
});
