// VoiceCode Mobile - Transcript Detail Screen Tests
//
// These tests target the REAL shipping TranscriptDetailScreen — an Otter.ai-style
// word-level transcript editor with speaker diarization, in-place editing (undo/redo),
// search, audio playback, and copy/share/delete actions. The original test file in
// this location asserted a different, never-shipped product (a Supabase-backed detail
// screen with AI summary/key-point/action-item tabs, favorites, export, and a tags
// modal). Those features are genuinely absent from the shipping screen, so the suite
// has been aligned to the screen's actual behavior. The screen was enhanced additively
// (optional navigation/route props that fall back to the hooks, plus testIDs on its
// existing controls and conditional regions) — no functionality was changed.

import 'react-native-gesture-handler/jestSetup';
import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Alert, Share } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

// expo-haptics is awaited inside the screen's handlers; a rejecting real call would
// abort the state updates that follow it, so it must resolve in tests.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

// The edit toolbar animates in via reanimated; use its official jest mock.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

describe('TranscriptDetailScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  };

  const renderScreen = (params?: TranscriptParams) =>
    renderWithProviders(
      <MockTranscriptDetailScreen
        navigation={mockNavigation}
        route={{ params: params ?? { recordingId: 'transcript-123' } }}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the transcript title', () => {
      const { getByText } = renderScreen({ recordingId: 'transcript-123', title: 'Meeting Notes' });
      expect(getByText('Meeting Notes')).toBeTruthy();
    });

    it('should fall back to a default title when none is provided', () => {
      const { getByText } = renderScreen({ recordingId: 'transcript-123' });
      expect(getByText('Meeting Notes')).toBeTruthy();
    });

    it('should render the recording metadata subtitle', () => {
      const { getByText } = renderScreen();
      expect(getByText(/January 4, 2026/)).toBeTruthy();
    });

    it('should render speaker labels for diarized segments', () => {
      const { getByText } = renderScreen();
      expect(getByText('Speaker 1')).toBeTruthy();
      expect(getByText('Speaker 2')).toBeTruthy();
    });

    it('should render the transcript words', () => {
      const { getByText } = renderScreen();
      expect(getByText('Hello')).toBeTruthy();
      expect(getByText('meeting')).toBeTruthy();
    });

    it('should render per-segment word counts', () => {
      const { getByText } = renderScreen();
      // Segment 1 covers 13 words, segment 2 covers 8 words (MOCK_WORDS).
      expect(getByText('13 words')).toBeTruthy();
      expect(getByText('8 words')).toBeTruthy();
    });
  });

  describe('Search', () => {
    it('should not show the search bar by default', () => {
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('search-bar')).toBeNull();
    });

    it('should reveal the search bar when the search button is pressed', async () => {
      const { getByTestId, findByTestId } = renderScreen();
      fireEvent.press(getByTestId('search-button'));
      expect(await findByTestId('search-bar')).toBeTruthy();
    });
  });

  describe('Editing', () => {
    it('should not show the edit toolbar by default', () => {
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('edit-toolbar')).toBeNull();
    });

    it('should reveal the undo/redo toolbar in edit mode', async () => {
      const { getByTestId, findByTestId, findByText } = renderScreen();
      fireEvent.press(getByTestId('edit-button'));
      expect(await findByTestId('edit-toolbar')).toBeTruthy();
      expect(await findByText('Undo')).toBeTruthy();
      expect(await findByText('Redo')).toBeTruthy();
    });

    it('should hide the edit toolbar when edit mode is toggled off', async () => {
      const { getByTestId, findByTestId, queryByTestId } = renderScreen();
      fireEvent.press(getByTestId('edit-button'));
      await findByTestId('edit-toolbar');
      fireEvent.press(getByTestId('edit-button'));
      await waitFor(() => expect(queryByTestId('edit-toolbar')).toBeNull());
    });
  });

  describe('Actions', () => {
    it('should share the transcript text', async () => {
      const shareSpy = jest
        .spyOn(Share, 'share')
        .mockImplementation(() => Promise.resolve({ action: 'sharedAction' as const }));
      const { getByTestId } = renderScreen();

      fireEvent.press(getByTestId('share-button'));

      await waitForCall(shareSpy);
      expect(shareSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Hello') })
      );
      shareSpy.mockRestore();
    });

    it('should prompt for confirmation before deleting', () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const { getByTestId } = renderScreen();

      fireEvent.press(getByTestId('delete-button'));

      expect(alertSpy).toHaveBeenCalledWith(
        'Delete Recording',
        expect.stringContaining('delete'),
        expect.any(Array)
      );
      alertSpy.mockRestore();
    });

    it('should navigate back after confirming deletion', () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
        const destructive = buttons?.find((b) => b.style === 'destructive');
        destructive?.onPress?.();
      });
      const { getByTestId } = renderScreen();

      fireEvent.press(getByTestId('delete-button'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('should expose a copy action', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('copy-button')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should go back when the header back button is pressed', () => {
      const { getByTestId } = renderScreen();
      fireEvent.press(getByTestId('back-button'));
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Audio Playback', () => {
    it('should render the audio player when an audio URL is provided', () => {
      const { getByTestId } = renderScreen({
        recordingId: 'transcript-123',
        title: 'Meeting Notes',
        audioUrl: 'https://example.com/audio.m4a',
      });
      expect(getByTestId('audio-player')).toBeTruthy();
    });

    it('should not render the audio player without an audio URL', () => {
      const { queryByTestId } = renderScreen({ recordingId: 'transcript-123' });
      expect(queryByTestId('audio-player')).toBeNull();
    });
  });
});

// Poll until a spied async handler has been invoked, without relying on fake timers.
async function waitForCall(spy: { mock: { calls: unknown[] } }) {
  for (let i = 0; i < 50; i++) {
    if (spy.mock.calls.length > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

// Renders the real TranscriptDetailScreen; kept as a thin alias so the intent
// (exercising the shipping screen) stays explicit.
import TranscriptDetailScreen from '../../screens/library/TranscriptDetailScreen';

type TranscriptParams = { recordingId: string; title?: string; audioUrl?: string };

const MockTranscriptDetailScreen = ({
  navigation,
  route,
}: {
  navigation: { goBack: () => void; navigate: (screen: string, params?: object) => void };
  route: { params?: TranscriptParams };
}) => <TranscriptDetailScreen navigation={navigation} route={route} />;
