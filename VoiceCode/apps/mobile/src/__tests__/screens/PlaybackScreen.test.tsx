// VoiceCode Mobile - Playback Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import PlaybackScreen from '../../screens/recording/PlaybackScreen';

describe('PlaybackScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockRoute = {
    params: {
      transcriptId: 'transcript-123',
      audioUri: 'file:///audio.m4a',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render playback screen', () => {
      const { getByTestId } = renderWithProviders(
        <PlaybackScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('playback-screen')).toBeTruthy();
    });

    it('should display waveform', () => {
      const { getByTestId } = renderWithProviders(
        <PlaybackScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('waveform')).toBeTruthy();
    });

    it('should display transcript text', () => {
      const { getByTestId } = renderWithProviders(
        <PlaybackScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('transcript-text')).toBeTruthy();
    });
  });

  describe('Playback Controls', () => {
    it('should play audio', async () => {
      const { getByTestId } = renderWithProviders(
        <PlaybackScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('play-button'));
    });

    it('should pause audio', async () => {
      const { getByTestId } = renderWithProviders(
        <PlaybackScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('play-button'));
      fireEvent.press(getByTestId('pause-button'));
    });

    it('should seek forward', async () => {
      const { getByTestId } = renderWithProviders(
        <PlaybackScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('forward-button'));
    });

    it('should seek backward', async () => {
      const { getByTestId } = renderWithProviders(
        <PlaybackScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('backward-button'));
    });
  });

  describe('Speed Control', () => {
    it('should change playback speed', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <PlaybackScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('speed-button'));
      fireEvent.press(getByText('1.5x'));
    });
  });

  describe('Progress', () => {
    it('should display current time', () => {
      const { getByTestId } = renderWithProviders(
        <PlaybackScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('current-time')).toBeTruthy();
    });

    it('should display duration', () => {
      const { getByTestId } = renderWithProviders(
        <PlaybackScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('duration')).toBeTruthy();
    });

    it('should seek via progress bar', async () => {
      const { getByTestId } = renderWithProviders(
        <PlaybackScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Simulate slider change
      fireEvent(getByTestId('progress-slider'), 'onValueChange', 50);
    });
  });

  describe('Sync with Transcript', () => {
    it('should highlight current word', async () => {
      const { getByTestId } = renderWithProviders(
        <PlaybackScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('highlighted-word')).toBeTruthy();
    });

    it('should seek to word on tap', async () => {
      const { getByTestId } = renderWithProviders(
        <PlaybackScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('word-0'));
    });
  });
});
