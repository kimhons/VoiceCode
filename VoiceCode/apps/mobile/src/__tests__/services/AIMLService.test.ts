// VoiceCode Mobile - AIML Service Tests
// Tests the real AIMLService: summaries, key points, action items, speakers and
// their updates. External deps (fetch + supabase client) are mocked; the shared
// supabase client comes from jest.setup.js and is reconfigured per test.

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import AIMLService from '../../services/AIMLService';
import { supabase } from '../../services/supabaseService';

// Mock fetch for AI API calls.
global.fetch = jest.fn() as jest.Mock;

// Chainable builder: `.single()` resolves `result`, and directly-awaited chains
// (e.g. `.select('*').eq(...)`) resolve `result` via `.then`.
function qb(result: { data: any; error: any }) {
  const b: any = {};
  ['select', 'insert', 'update', 'eq', 'order', 'limit'].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.single = jest.fn(() => Promise.resolve(result));
  b.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
  return b;
}

const authedUser = { id: 'u1' };

describe('AIMLService', () => {
  const transcriptId = 'transcript-123';
  const transcriptText = 'This is a meeting about project planning with tasks and a Friday deadline.';

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: authedUser } });
  });

  describe('generateSummary', () => {
    it('generates and persists a summary from transcript text', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ summary: 'A short summary', confidence: 0.9, model: 'gpt-4-turbo' }),
      });

      const dbRow = {
        id: 's1',
        transcript_id: transcriptId,
        summary_text: 'A short summary',
        confidence: 0.9,
        model_version: 'gpt-4-turbo',
        created_at: '2024-01-15T10:00:00Z',
      };
      (supabase.from as jest.Mock)
        .mockReturnValueOnce(qb({ data: null, error: null })) // existing check
        .mockReturnValueOnce(qb({ data: dbRow, error: null })); // insert

      const result = await AIMLService.generateSummary(transcriptId, transcriptText);

      expect(result.summaryText).toBe('A short summary');
      expect(result.confidence).toBeCloseTo(0.9);
      expect(result.transcriptId).toBe(transcriptId);
    });

    it('returns an existing summary without calling the AI API', async () => {
      const dbRow = {
        id: 's1',
        transcript_id: transcriptId,
        summary_text: 'Cached summary',
        confidence: 0.88,
        created_at: '2024-01-15T10:00:00Z',
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(qb({ data: dbRow, error: null }));

      const result = await AIMLService.generateSummary(transcriptId, transcriptText);

      expect(result.summaryText).toBe('Cached summary');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('throws when the AI API responds with an error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, statusText: 'Bad Gateway' });
      (supabase.from as jest.Mock).mockReturnValueOnce(qb({ data: null, error: null }));

      await expect(AIMLService.generateSummary(transcriptId, transcriptText)).rejects.toThrow();
    });

    it('throws when the user is not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } });

      await expect(AIMLService.generateSummary(transcriptId, transcriptText)).rejects.toThrow(
        'User not authenticated'
      );
    });
  });

  describe('extractKeyPoints', () => {
    it('extracts and persists key points from transcript text', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ key_points: ['a', 'b', 'c', 'd', 'e'], confidence: 0.92 }),
      });

      const dbRow = {
        id: 'k1',
        transcript_id: transcriptId,
        key_points: ['a', 'b', 'c', 'd', 'e'],
        confidence: 0.92,
        created_at: '2024-01-15T10:00:00Z',
      };
      (supabase.from as jest.Mock)
        .mockReturnValueOnce(qb({ data: null, error: null }))
        .mockReturnValueOnce(qb({ data: dbRow, error: null }));

      const result = await AIMLService.extractKeyPoints(transcriptId, transcriptText);

      expect(result.keyPoints).toHaveLength(5);
      expect(result.keyPoints[0]).toBe('a');
    });
  });

  describe('extractActionItems', () => {
    it('extracts and persists action items from transcript text', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ action_items: [{ text: 'Do X', priority: 'high' }, { text: 'Do Y' }] }),
      });

      const dbRows = [
        { id: 'a1', transcript_id: transcriptId, text: 'Do X', completed: false, priority: 'high', created_at: '2024-01-15T10:00:00Z' },
        { id: 'a2', transcript_id: transcriptId, text: 'Do Y', completed: false, priority: 'medium', created_at: '2024-01-15T10:00:00Z' },
      ];
      (supabase.from as jest.Mock)
        .mockReturnValueOnce(qb({ data: [], error: null })) // existing check (awaited chain)
        .mockReturnValueOnce(qb({ data: dbRows, error: null })); // insert

      const result = await AIMLService.extractActionItems(transcriptId, transcriptText);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Do X');
      expect(result[0].completed).toBe(false);
    });
  });

  describe('identifySpeakers', () => {
    it('identifies and persists speakers from transcript text', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ speakers: [{ label: 'Speaker 1' }, { label: 'Speaker 2' }] }),
      });

      const dbRows = [
        { id: 'sp1', transcript_id: transcriptId, label: 'Speaker 1', color: '#667eea', segment_count: 3, created_at: '2024-01-15T10:00:00Z' },
        { id: 'sp2', transcript_id: transcriptId, label: 'Speaker 2', color: '#764ba2', segment_count: 2, created_at: '2024-01-15T10:00:00Z' },
      ];
      (supabase.from as jest.Mock)
        .mockReturnValueOnce(qb({ data: [], error: null })) // existing check
        .mockReturnValueOnce(qb({ data: dbRows, error: null })); // insert

      const result = await AIMLService.identifySpeakers(transcriptId, transcriptText);

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('Speaker 1');
      expect(result[0].segmentCount).toBe(3);
    });
  });

  describe('updateActionItem', () => {
    it('updates an action item and returns the mapped result', async () => {
      const dbRow = {
        id: 'a1',
        transcript_id: transcriptId,
        text: 'Updated task',
        completed: true,
        priority: 'high',
        created_at: '2024-01-15T10:00:00Z',
        completed_at: '2024-01-16T10:00:00Z',
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(qb({ data: dbRow, error: null }));

      const result = await AIMLService.updateActionItem('a1', { completed: true });

      expect(result.completed).toBe(true);
      expect(result.text).toBe('Updated task');
    });
  });

  describe('updateSpeaker', () => {
    it('updates a speaker label and color and returns the mapped result', async () => {
      const dbRow = {
        id: 'sp1',
        transcript_id: transcriptId,
        label: 'Host',
        color: '#000000',
        segment_count: 5,
        created_at: '2024-01-15T10:00:00Z',
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(qb({ data: dbRow, error: null }));

      const result = await AIMLService.updateSpeaker('sp1', 'Host', '#000000');

      expect(result.label).toBe('Host');
      expect(result.color).toBe('#000000');
    });
  });
});
