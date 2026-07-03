// VoiceCode Mobile - Home Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

describe('HomeScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  };

  const mockRoute = {
    params: {},
  };

  const mockTranscripts = [
    {
      id: 'transcript-1',
      title: 'Meeting Notes',
      text: 'Discussion about project...',
      created_at: '2024-01-15T10:00:00Z',
      duration: 300,
    },
    {
      id: 'transcript-2',
      title: 'Interview',
      text: 'Interview with candidate...',
      created_at: '2024-01-14T09:00:00Z',
      duration: 600,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockTranscripts,
              error: null,
            }),
          }),
        }),
      }),
    });
  });

  describe('Rendering', () => {
    it('should render home screen correctly', () => {
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(/welcome/i)).toBeTruthy();
    });

    it('should display recent transcripts', async () => {
      const { findByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const transcript = await findByText('Meeting Notes');
      expect(transcript).toBeTruthy();
    });

    it('should show empty state when no transcripts', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const { findByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const emptyState = await findByText(/no recordings yet/i);
      expect(emptyState).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to recording screen on record button press', async () => {
      const { getByTestId } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const recordButton = getByTestId('record-button');
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('Recording');
      });
    });

    it('should navigate to transcript detail on item press', async () => {
      const { findByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const transcript = await findByText('Meeting Notes');
      fireEvent.press(transcript);

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('TranscriptDetail', {
          transcriptId: 'transcript-1',
        });
      });
    });

    it('should navigate to library on see all press', async () => {
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const seeAllButton = getByText(/see all/i);
      fireEvent.press(seeAllButton);

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('Library');
      });
    });
  });

  describe('Quick Actions', () => {
    it('should display quick action buttons', () => {
      const { getByTestId } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('record-button')).toBeTruthy();
      expect(getByTestId('search-button')).toBeTruthy();
    });

    it('should navigate to search on search button press', () => {
      const { getByTestId } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const searchButton = getByTestId('search-button');
      fireEvent.press(searchButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Search');
    });
  });

  describe('Stats Display', () => {
    it('should display user stats', async () => {
      const { findByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Stats should be rendered
      const statsSection = await findByText(/this week/i);
      expect(statsSection).toBeTruthy();
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh data on pull down', async () => {
      const { getByTestId } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const scrollView = getByTestId('home-scroll-view');
      
      // Simulate pull to refresh
      fireEvent(scrollView, 'refresh');

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledTimes(2); // Initial + refresh
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on fetch failure', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('Failed to fetch'),
              }),
            }),
          }),
        }),
      });

      const { findByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const errorMessage = await findByText(/something went wrong/i);
      expect(errorMessage).toBeTruthy();
    });
  });
});
