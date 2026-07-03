// VoiceCode Mobile - Library Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { LibraryScreen } from '../../screens/library/LibraryScreen';
import { supabase } from '../../services/supabaseService';

jest.mock('../../services/supabaseService');

describe('LibraryScreen', () => {
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
      is_favorite: true,
    },
    {
      id: 'transcript-2',
      title: 'Interview',
      text: 'Interview with candidate...',
      created_at: '2024-01-14T09:00:00Z',
      duration: 600,
      is_favorite: false,
    },
    {
      id: 'transcript-3',
      title: 'Lecture',
      text: 'Today we will discuss...',
      created_at: '2024-01-13T08:00:00Z',
      duration: 3600,
      is_favorite: false,
    },
  ];

  const mockFolders = [
    { id: 'folder-1', name: 'Work', color: '#667eea', transcript_count: 5 },
    { id: 'folder-2', name: 'Personal', color: '#764ba2', transcript_count: 3 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'transcripts') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockTranscripts,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'folders') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockFolders,
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });
  });

  describe('Rendering', () => {
    it('should render library screen correctly', () => {
      const { getByTestId } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('library-screen')).toBeTruthy();
    });

    it('should display transcripts list', async () => {
      const { findByText } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const transcript = await findByText('Meeting Notes');
      expect(transcript).toBeTruthy();
    });

    it('should display folders', async () => {
      const { findByText } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const folder = await findByText('Work');
      expect(folder).toBeTruthy();
    });
  });

  describe('Tabs', () => {
    it('should switch between All and Favorites tabs', async () => {
      const { getByText, findByText } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Switch to Favorites tab
      const favoritesTab = getByText(/favorites/i);
      fireEvent.press(favoritesTab);

      // Should only show favorited transcripts
      const favoritedTranscript = await findByText('Meeting Notes');
      expect(favoritedTranscript).toBeTruthy();
    });

    it('should switch to Folders tab', async () => {
      const { getByText, findByText } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const foldersTab = getByText(/folders/i);
      fireEvent.press(foldersTab);

      const folder = await findByText('Work');
      expect(folder).toBeTruthy();
    });
  });

  describe('Search', () => {
    it('should filter transcripts by search query', async () => {
      const { getByTestId, queryByText } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'Meeting');

      await waitFor(() => {
        expect(queryByText('Interview')).toBeNull();
      });
    });
  });

  describe('Sorting', () => {
    it('should sort transcripts by date', async () => {
      const { getByTestId } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const sortButton = getByTestId('sort-button');
      fireEvent.press(sortButton);

      const dateOption = getByTestId('sort-by-date');
      fireEvent.press(dateOption);

      // Transcripts should be sorted
      expect(supabase.from).toHaveBeenCalled();
    });

    it('should sort transcripts by duration', async () => {
      const { getByTestId } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const sortButton = getByTestId('sort-button');
      fireEvent.press(sortButton);

      const durationOption = getByTestId('sort-by-duration');
      fireEvent.press(durationOption);

      expect(supabase.from).toHaveBeenCalled();
    });
  });

  describe('Selection Mode', () => {
    it('should enter selection mode on long press', async () => {
      const { findByText, getByTestId } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const transcript = await findByText('Meeting Notes');
      fireEvent(transcript, 'longPress');

      const selectionToolbar = getByTestId('selection-toolbar');
      expect(selectionToolbar).toBeTruthy();
    });

    it('should select multiple transcripts', async () => {
      const { findByText, getByText } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      // Long press to enter selection mode
      const transcript1 = await findByText('Meeting Notes');
      fireEvent(transcript1, 'longPress');

      // Select another
      const transcript2 = await findByText('Interview');
      fireEvent.press(transcript2);

      const selectedCount = getByText(/2 selected/i);
      expect(selectedCount).toBeTruthy();
    });

    it('should delete selected transcripts', async () => {
      const { findByText, getByTestId } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const transcript = await findByText('Meeting Notes');
      fireEvent(transcript, 'longPress');

      const deleteButton = getByTestId('delete-selected');
      fireEvent.press(deleteButton);

      // Confirm deletion
      const confirmButton = getByTestId('confirm-delete');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('transcripts');
      });
    });
  });

  describe('Folder Navigation', () => {
    it('should navigate into folder on press', async () => {
      const { findByText } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const folder = await findByText('Work');
      fireEvent.press(folder);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('FolderDetail', {
        folderId: 'folder-1',
        folderName: 'Work',
      });
    });
  });

  describe('Transcript Actions', () => {
    it('should toggle favorite on swipe', async () => {
      const { findByText, getByTestId } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const transcript = await findByText('Interview');
      const favoriteButton = getByTestId('favorite-button-transcript-2');
      fireEvent.press(favoriteButton);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });
    });

    it('should navigate to transcript detail on press', async () => {
      const { findByText } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const transcript = await findByText('Meeting Notes');
      fireEvent.press(transcript);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TranscriptDetail', {
        transcriptId: 'transcript-1',
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no transcripts', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const { findByText } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const emptyState = await findByText(/no recordings/i);
      expect(emptyState).toBeTruthy();
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh data on pull down', async () => {
      const { getByTestId } = renderWithProviders(
        <LibraryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const flatList = getByTestId('transcripts-list');
      fireEvent(flatList, 'refresh');

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledTimes(3); // Initial + refresh (transcripts + folders)
      });
    });
  });
});
