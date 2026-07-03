// VoiceCode Mobile - Home Screen Tests
//
// HomeScreen is the Redux-backed inline recording dashboard: it shows a live
// streaming toggle, an in-place record button, quick stats, and the recent
// recordings pulled from `state.recording.recordings`. These tests assert that
// real behavior. (The screen does not fetch from Supabase or navigate to a
// separate "Recording"/"Search" screen — those affordances belong to a
// different design and are intentionally not asserted here.)

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { HomeScreen } from '../../screens/home/HomeScreen';

describe('HomeScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  };

  const recordings = [
    {
      id: 'rec-1',
      title: 'Meeting Notes',
      duration: 300000,
      fileUri: 'file://rec-1.m4a',
      fileSize: 1024,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'rec-2',
      title: 'Interview',
      duration: 600000,
      fileUri: 'file://rec-2.m4a',
      fileSize: 2048,
      createdAt: '2024-01-14T09:00:00Z',
      updatedAt: '2024-01-14T09:00:00Z',
    },
  ];

  const stateWithRecordings = {
    recording: {
      currentRecording: {
        isRecording: false,
        isPaused: false,
        duration: 0,
        volume: 0,
        audioData: [],
      },
      recordings,
      isLoadingRecordings: false,
      selectedRecording: null,
      error: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the welcome greeting', () => {
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/welcome back/i)).toBeTruthy();
    });

    it('should render the idle recording prompt', () => {
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/ready to record/i)).toBeTruthy();
    });

    it('should render the real-time streaming card', () => {
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/real-time streaming/i)).toBeTruthy();
    });
  });

  describe('Recent Recordings', () => {
    it('should display recent recordings from the store', () => {
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} />,
        { preloadedState: stateWithRecordings }
      );

      expect(getByText('Meeting Notes')).toBeTruthy();
      expect(getByText('Interview')).toBeTruthy();
    });

    it('should show empty state when there are no recordings', () => {
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/no recordings yet/i)).toBeTruthy();
    });

    it('should render the recent recordings section with a view-all action', () => {
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/recent recordings/i)).toBeTruthy();
      expect(getByText(/view all/i)).toBeTruthy();
    });
  });

  describe('Stats Display', () => {
    it('should display the stat labels', () => {
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} />
      );

      expect(getByText('Recordings')).toBeTruthy();
      expect(getByText('Total Time')).toBeTruthy();
      expect(getByText('Today')).toBeTruthy();
    });

    it('should reflect the recordings count in the stats', () => {
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} />,
        { preloadedState: stateWithRecordings }
      );

      expect(getByText(String(recordings.length))).toBeTruthy();
    });
  });

  describe('Controls', () => {
    it('should render the record button', () => {
      const { getByTestId } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('record-button')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to audio settings on settings button press', () => {
      const { getByTestId } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('settings-button'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('AudioTest');
    });
  });
});
