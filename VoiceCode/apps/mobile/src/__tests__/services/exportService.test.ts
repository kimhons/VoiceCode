// VoiceCode Mobile - Export Service Tests

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { getExportService } from '../../services/exportService';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

describe('ExportService', () => {
  const exportService = getExportService();
  const mockTranscript = {
    id: 'transcript-123',
    title: 'Meeting Notes',
    text: 'This is a test transcript.',
    created_at: '2024-01-15T10:00:00Z',
    duration: 300,
    word_count: 100,
    confidence: 0.95,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToPDF', () => {
    it('should export transcript to PDF format', async () => {
      const result = await exportService.exportToPDF(mockTranscript);

      expect(result).toBeTruthy();
      expect(result.mimeType).toBe('application/pdf');
    });

    it('should include transcript metadata in PDF', async () => {
      const result = await exportService.exportToPDF(mockTranscript, {
        includeMetadata: true,
      });

      expect(result).toBeTruthy();
    });
  });

  describe('exportToDocx', () => {
    it('should export transcript to DOCX format', async () => {
      const result = await exportService.exportToDocx(mockTranscript);

      expect(result).toBeTruthy();
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });
  });

  describe('exportToTxt', () => {
    it('should export transcript to plain text', async () => {
      const result = await exportService.exportToTxt(mockTranscript);

      expect(result).toBeTruthy();
      expect(result.mimeType).toBe('text/plain');
      expect(result.content).toContain('This is a test transcript');
    });

    it('should include timestamps if requested', async () => {
      const result = await exportService.exportToTxt(mockTranscript, {
        includeTimestamps: true,
      });

      expect(result.content).toContain('[');
    });
  });

  describe('exportToSRT', () => {
    it('should export transcript to SRT subtitle format', async () => {
      const transcriptWithSegments = {
        ...mockTranscript,
        segments: [
          { start: 0, end: 5, text: 'Hello everyone.' },
          { start: 5, end: 10, text: 'Welcome to the meeting.' },
        ],
      };

      const result = await exportService.exportToSRT(transcriptWithSegments);

      expect(result).toBeTruthy();
      expect(result.mimeType).toBe('text/srt');
      expect(result.content).toContain('-->');
    });
  });

  describe('exportToVTT', () => {
    it('should export transcript to WebVTT format', async () => {
      const transcriptWithSegments = {
        ...mockTranscript,
        segments: [
          { start: 0, end: 5, text: 'Hello everyone.' },
          { start: 5, end: 10, text: 'Welcome to the meeting.' },
        ],
      };

      const result = await exportService.exportToVTT(transcriptWithSegments);

      expect(result).toBeTruthy();
      expect(result.mimeType).toBe('text/vtt');
      expect(result.content).toContain('WEBVTT');
    });
  });

  describe('exportToJSON', () => {
    it('should export transcript to JSON format', async () => {
      const result = await exportService.exportToJSON(mockTranscript);

      expect(result).toBeTruthy();
      expect(result.mimeType).toBe('application/json');

      const parsed = JSON.parse(result.content);
      expect(parsed.title).toBe('Meeting Notes');
    });

    it('should include AI features if available', async () => {
      const transcriptWithAI = {
        ...mockTranscript,
        summary: 'Brief meeting summary',
        keyPoints: ['Point 1', 'Point 2'],
        actionItems: [{ text: 'Task 1', completed: false }],
      };

      const result = await exportService.exportToJSON(transcriptWithAI);
      const parsed = JSON.parse(result.content);

      expect(parsed.summary).toBe('Brief meeting summary');
      expect(parsed.keyPoints).toHaveLength(2);
    });
  });

  describe('exportMultiple', () => {
    it('should export multiple transcripts to a single file', async () => {
      const transcripts = [
        mockTranscript,
        { ...mockTranscript, id: 'transcript-456', title: 'Second Meeting' },
      ];

      const result = await exportService.exportMultiple(transcripts, 'json');

      expect(result).toBeTruthy();
      const parsed = JSON.parse(result.content);
      expect(parsed).toHaveLength(2);
    });
  });

  describe('shareExport', () => {
    it('should share exported file', async () => {
      const exportResult = {
        content: 'Test content',
        mimeType: 'text/plain',
        filename: 'test.txt',
      };

      const shareResult = await exportService.shareExport(exportResult);

      expect(shareResult.shared).toBe(true);
    });
  });

  describe('saveToCloud', () => {
    it('should save export to cloud storage', async () => {
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'exports/test.pdf' },
          error: null,
        }),
      });

      const exportResult = {
        content: 'Test content',
        mimeType: 'application/pdf',
        filename: 'test.pdf',
      };

      const result = await exportService.saveToCloud(exportResult, 'user-123');

      expect(result.path).toContain('exports');
    });
  });
});
