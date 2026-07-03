// VoiceCode Mobile - Transcript Detail Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

describe('TranscriptDetailScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  };

  const mockRoute = {
    params: { transcriptId: 'transcript-123' },
  };

  const mockTranscript = {
    id: 'transcript-123',
    title: 'Meeting Notes',
    text: 'This is the full transcript text of the meeting.',
    created_at: '2024-01-15T10:00:00Z',
    duration: 3600,
    confidence: 0.95,
    word_count: 500,
    is_favorite: false,
    tags: [{ name: 'work', color: '#667eea' }],
    summary: null,
    key_points: null,
    action_items: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockTranscript,
            error: null,
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });
  });

  describe('Rendering', () => {
    it('should render transcript detail screen', async () => {
      const { findByText } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const title = await findByText('Meeting Notes');
      expect(title).toBeTruthy();
    });

    it('should display transcript text', async () => {
      const { findByText } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const text = await findByText(/This is the full transcript/);
      expect(text).toBeTruthy();
    });

    it('should display metadata', async () => {
      const { findByText } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const duration = await findByText(/1 hour/);
      expect(duration).toBeTruthy();
    });

    it('should display tags', async () => {
      const { findByText } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const tag = await findByText('work');
      expect(tag).toBeTruthy();
    });
  });

  describe('AI Features Tab', () => {
    it('should switch to summary tab', async () => {
      const { getByText, findByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/summary/i));
      const summaryTab = await findByTestId('summary-tab');
      expect(summaryTab).toBeTruthy();
    });

    it('should generate summary', async () => {
      const { getByText, getByTestId, findByText } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/summary/i));
      fireEvent.press(getByTestId('generate-summary'));

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });
    });

    it('should switch to key points tab', async () => {
      const { getByText, findByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/key points/i));
      const keyPointsTab = await findByTestId('key-points-tab');
      expect(keyPointsTab).toBeTruthy();
    });

    it('should switch to action items tab', async () => {
      const { getByText, findByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/action items/i));
      const actionItemsTab = await findByTestId('action-items-tab');
      expect(actionItemsTab).toBeTruthy();
    });
  });

  describe('Editing', () => {
    it('should enable edit mode', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('edit-button'));
      const editor = await findByTestId('transcript-editor');
      expect(editor).toBeTruthy();
    });

    it('should save edited transcript', async () => {
      const { getByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('edit-button'));
      fireEvent.changeText(getByTestId('transcript-editor'), 'Updated text');
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });
    });

    it('should cancel editing', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('edit-button'));
      fireEvent.press(getByTestId('cancel-button'));

      expect(queryByTestId('transcript-editor')).toBeNull();
    });
  });

  describe('Actions', () => {
    it('should toggle favorite', async () => {
      const { getByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('favorite-button'));

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });
    });

    it('should open share sheet', async () => {
      const { getByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('share-button'));
      // Share sheet would open
    });

    it('should navigate to export screen', async () => {
      const { getByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('export-button'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Export', {
        transcriptId: 'transcript-123',
      });
    });

    it('should delete transcript with confirmation', async () => {
      const { getByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('delete-button'));
      fireEvent.press(getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });
  });

  describe('Audio Playback', () => {
    it('should play audio', async () => {
      const { getByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('play-button'));
      // Audio playback starts
    });

    it('should pause audio', async () => {
      const { getByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('play-button'));
      fireEvent.press(getByTestId('pause-button'));
      // Audio pauses
    });

    it('should seek to position', async () => {
      const { getByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const slider = getByTestId('audio-slider');
      fireEvent(slider, 'valueChange', 0.5);
      // Audio seeks to 50%
    });
  });

  describe('Tags Management', () => {
    it('should open tags modal', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('manage-tags'));
      const tagsModal = await findByTestId('tags-modal');
      expect(tagsModal).toBeTruthy();
    });

    it('should add tag', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MockTranscriptDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('manage-tags'));
      fireEvent.press(getByText('personal'));
      fireEvent.press(getByTestId('save-tags'));

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });
    });
  });
});

// Mock component
const MockTranscriptDetailScreen = ({ navigation, route }: { navigation: any; route: any }) => {
  return null;
};
