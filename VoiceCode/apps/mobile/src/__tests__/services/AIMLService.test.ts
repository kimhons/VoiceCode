// VoiceCode Mobile - AIML Service Tests

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import AIMLService from '../../services/AIMLService';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

// Mock fetch for AI API calls
global.fetch = jest.fn() as jest.Mock;

describe('AIMLService', () => {
  const mockTranscriptId = 'transcript-123';
  const mockTranscriptText = 'This is a meeting about project planning. We discussed the timeline and assigned tasks to team members. John will handle the frontend. Sarah will work on the backend. We need to complete this by Friday.';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSummary', () => {
    it('should generate a summary from transcript text', async () => {
      const mockSummary = {
        id: 'summary-1',
        transcript_id: mockTranscriptId,
        summary_text: 'Meeting about project planning with timeline and task assignments.',
        confidence: 0.95,
        created_at: '2024-01-15T10:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ summary: mockSummary.summary_text }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockSummary, error: null }),
          }),
        }),
      });

      const result = await AIMLService.generateSummary(mockTranscriptId, mockTranscriptText);

      expect(result.summaryText).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        AIMLService.generateSummary(mockTranscriptId, mockTranscriptText)
      ).rejects.toThrow();
    });
  });

  describe('extractKeyPoints', () => {
    it('should extract key points from transcript', async () => {
      const mockKeyPoints = {
        id: 'keypoints-1',
        transcript_id: mockTranscriptId,
        key_points: [
          'Project planning discussion',
          'Timeline established',
          'John assigned to frontend',
          'Sarah assigned to backend',
          'Deadline is Friday',
        ],
        confidence: 0.92,
        created_at: '2024-01-15T10:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ keyPoints: mockKeyPoints.key_points }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockKeyPoints, error: null }),
          }),
        }),
      });

      const result = await AIMLService.extractKeyPoints(mockTranscriptId, mockTranscriptText);

      expect(result.keyPoints).toHaveLength(5);
      expect(result.keyPoints).toContain('Project planning discussion');
    });
  });

  describe('extractActionItems', () => {
    it('should extract action items from transcript', async () => {
      const mockActionItems = [
        {
          id: 'action-1',
          transcript_id: mockTranscriptId,
          text: 'John to handle frontend development',
          assignee: 'John',
          priority: 'high',
          completed: false,
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'action-2',
          transcript_id: mockTranscriptId,
          text: 'Sarah to work on backend',
          assignee: 'Sarah',
          priority: 'high',
          completed: false,
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ actionItems: mockActionItems }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: mockActionItems, error: null }),
        }),
      });

      const result = await AIMLService.extractActionItems(mockTranscriptId, mockTranscriptText);

      expect(result).toHaveLength(2);
      expect(result[0].assignee).toBe('John');
      expect(result[1].assignee).toBe('Sarah');
    });
  });

  describe('identifySpeakers', () => {
    it('should identify speakers from transcript', async () => {
      const mockSpeakers = [
        {
          id: 'speaker-1',
          transcript_id: mockTranscriptId,
          name: 'John',
          color: '#FF5733',
          segments: [{ start: 0, end: 30 }],
        },
        {
          id: 'speaker-2',
          transcript_id: mockTranscriptId,
          name: 'Sarah',
          color: '#33FF57',
          segments: [{ start: 30, end: 60 }],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ speakers: mockSpeakers }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: mockSpeakers, error: null }),
        }),
      });

      const result = await AIMLService.identifySpeakers(mockTranscriptId, mockTranscriptText);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John');
      expect(result[1].name).toBe('Sarah');
    });
  });

  describe('getSummary', () => {
    it('should retrieve existing summary', async () => {
      const mockSummary = {
        id: 'summary-1',
        transcript_id: mockTranscriptId,
        summary_text: 'Existing summary',
        confidence: 0.95,
        created_at: '2024-01-15T10:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockSummary, error: null }),
          }),
        }),
      });

      const result = await AIMLService.getSummary(mockTranscriptId);

      expect(result?.summaryText).toBe('Existing summary');
    });

    it('should return null if no summary exists', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      const result = await AIMLService.getSummary(mockTranscriptId);

      expect(result).toBeNull();
    });
  });

  describe('getKeyPoints', () => {
    it('should retrieve existing key points', async () => {
      const mockKeyPoints = {
        id: 'keypoints-1',
        transcript_id: mockTranscriptId,
        key_points: ['Point 1', 'Point 2'],
        confidence: 0.90,
        created_at: '2024-01-15T10:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockKeyPoints, error: null }),
          }),
        }),
      });

      const result = await AIMLService.getKeyPoints(mockTranscriptId);

      expect(result?.keyPoints).toHaveLength(2);
    });
  });

  describe('getActionItems', () => {
    it('should retrieve existing action items', async () => {
      const mockActionItems = [
        { id: 'action-1', text: 'Task 1', completed: false },
        { id: 'action-2', text: 'Task 2', completed: true },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockActionItems, error: null }),
        }),
      });

      const result = await AIMLService.getActionItems(mockTranscriptId);

      expect(result).toHaveLength(2);
      expect(result[1].completed).toBe(true);
    });
  });
});
