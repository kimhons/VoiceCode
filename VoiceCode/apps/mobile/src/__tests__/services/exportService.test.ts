// VoiceCode Mobile - Export Service Tests

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { getExportService } from '../../services/exportService';
import type { Transcript } from '../../services/supabase.service';

// jsPDF is mocked in jest.setup.js. Capture file output via file-saver, and stub
// docx so exportToDOCX can produce a blob without the native OOXML packer.
jest.mock('file-saver', () => ({ __esModule: true, saveAs: jest.fn() }));
jest.mock('docx', () => {
  class Paragraph {}
  class TextRun {}
  class Document {
    toBlob() {
      return Promise.resolve(new Blob(['docx-bytes']));
    }
  }
  return {
    __esModule: true,
    Document,
    Paragraph,
    TextRun,
    HeadingLevel: { HEADING_1: 'Heading1' },
    AlignmentType: { LEFT: 'left' },
  };
});

const exportService = getExportService();

const baseTranscript: Transcript = {
  id: 'transcript-123',
  user_id: 'user-1',
  audio_url: 'file://meeting.m4a',
  text: 'This is a test transcript.',
  content: 'This is a test transcript.',
  title: 'Meeting Notes',
  duration: 300,
  language: 'en',
  professional_mode: 'general',
  word_count: 5,
  confidence: 0.95,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

const transcriptWithSpeakers: Transcript = {
  ...baseTranscript,
  speakers: [
    {
      id: '1',
      name: 'Alice',
      segments: [
        { start: 0, end: 5, text: 'Hello everyone.' },
        { start: 5, end: 10, text: 'Welcome to the meeting.' },
      ],
    },
  ],
};

async function lastSaved(): Promise<{ content: string; filename: string }> {
  const calls = jest.mocked(saveAs).mock.calls;
  const [data, filename] = calls[calls.length - 1];
  const content = typeof data === 'string' ? data : await data.text();
  return { content, filename: filename ?? '' };
}

describe('ExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportTranscript -> TXT', () => {
    it('writes a text file containing the title, metadata, and spoken content', async () => {
      await exportService.exportTranscript(transcriptWithSpeakers, 'txt', {
        includeMetadata: true,
        includeSpeakers: true,
        includeTimestamps: true,
      });

      const { content, filename } = await lastSaved();
      expect(filename).toBe('meeting_notes.txt');
      expect(content).toContain('Meeting Notes');
      expect(content).toContain('Alice');
      expect(content).toContain('Hello everyone.');
      expect(content).toContain('Language: EN');
    });
  });

  describe('exportTranscript -> JSON', () => {
    it('writes the full transcript as JSON when metadata is included', async () => {
      await exportService.exportTranscript(baseTranscript, 'json', {
        includeMetadata: true,
      });

      const { content, filename } = await lastSaved();
      expect(filename).toBe('meeting_notes.json');
      const parsed = JSON.parse(content);
      expect(parsed.title).toBe('Meeting Notes');
      expect(parsed.content).toBe('This is a test transcript.');
    });

    it('writes only the content when metadata is excluded', async () => {
      await exportService.exportTranscript(baseTranscript, 'json', {
        includeMetadata: false,
      });

      const { content } = await lastSaved();
      const parsed = JSON.parse(content);
      expect(parsed).toEqual({ content: 'This is a test transcript.' });
    });
  });

  describe('exportTranscript -> SRT', () => {
    it('writes SubRip cues with correct HH:MM:SS,mmm timings', async () => {
      await exportService.exportTranscript(transcriptWithSpeakers, 'srt', {
        includeSpeakers: true,
      });

      const { content, filename } = await lastSaved();
      expect(filename).toBe('meeting_notes.srt');
      expect(content).toContain('00:00:00,000 --> 00:00:05,000');
      expect(content).toContain('00:00:05,000 --> 00:00:10,000');
      expect(content).toContain('[Alice] Hello everyone.');
    });
  });

  describe('exportTranscript -> VTT', () => {
    it('writes a WebVTT file with correct HH:MM:SS.mmm timings', async () => {
      await exportService.exportTranscript(transcriptWithSpeakers, 'vtt', {
        includeSpeakers: true,
      });

      const { content, filename } = await lastSaved();
      expect(filename).toBe('meeting_notes.vtt');
      expect(content.startsWith('WEBVTT')).toBe(true);
      expect(content).toContain('00:00:00.000 --> 00:00:05.000');
      expect(content).toContain('<v Alice>Hello everyone.');
    });
  });

  describe('exportTranscript -> DOCX', () => {
    it('saves a .docx file', async () => {
      await exportService.exportTranscript(baseTranscript, 'docx');

      const { filename } = await lastSaved();
      expect(filename).toBe('meeting_notes.docx');
    });
  });

  describe('exportTranscript -> PDF', () => {
    it('builds a PDF document and saves it with the sanitized filename', async () => {
      await exportService.exportTranscript(baseTranscript, 'pdf');

      const instance = jest.mocked(jsPDF).mock.results[0].value;
      expect(instance.text).toHaveBeenCalledWith('Meeting Notes', 20, 20);
      expect(instance.save).toHaveBeenCalledWith('meeting_notes.pdf');
      // PDF output goes through jsPDF, not the file-saver blob path.
      expect(saveAs).not.toHaveBeenCalled();
    });
  });
});
