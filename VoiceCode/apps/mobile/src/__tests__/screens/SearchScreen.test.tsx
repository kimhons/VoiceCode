// VoiceCode Mobile - Search Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import SearchService from '../../services/SearchService';

jest.mock('../../services/SearchService');

describe('SearchScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockSearchResults = [
    {
      id: 'transcript-1',
      title: 'Meeting Notes',
      text: 'Discussion about project planning',
      createdAt: '2024-01-15T10:00:00Z',
      matchedText: '...project planning...',
    },
    {
      id: 'transcript-2',
      title: 'Interview',
      text: 'Interview with candidate',
      createdAt: '2024-01-14T09:00:00Z',
      matchedText: '...candidate interview...',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (SearchService.searchTranscripts as jest.Mock).mockResolvedValue(mockSearchResults);
  });

  describe('Rendering', () => {
    it('should render search screen with input', () => {
      const { getByTestId } = renderWithProviders(
        <MockSearchScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('search-input')).toBeTruthy();
    });

    it('should show empty state initially', () => {
      const { getByText } = renderWithProviders(
        <MockSearchScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/start typing/i)).toBeTruthy();
    });
  });

  describe('Search Functionality', () => {
    it('should search on text input', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockSearchScreen navigation={mockNavigation as any} />
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'project');

      await waitFor(() => {
        expect(SearchService.searchTranscripts).toHaveBeenCalled();
      });

      const result = await findByText('Meeting Notes');
      expect(result).toBeTruthy();
    });

    it('should debounce search requests', async () => {
      const { getByTestId } = renderWithProviders(
        <MockSearchScreen navigation={mockNavigation as any} />
      );

      const searchInput = getByTestId('search-input');
      
      // Type quickly
      fireEvent.changeText(searchInput, 'p');
      fireEvent.changeText(searchInput, 'pr');
      fireEvent.changeText(searchInput, 'pro');
      fireEvent.changeText(searchInput, 'proj');
      fireEvent.changeText(searchInput, 'proje');
      fireEvent.changeText(searchInput, 'projec');
      fireEvent.changeText(searchInput, 'project');

      // Should only call search once after debounce
      await waitFor(() => {
        expect(SearchService.searchTranscripts).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });

    it('should clear search on clear button press', async () => {
      const { getByTestId, queryByText } = renderWithProviders(
        <MockSearchScreen navigation={mockNavigation as any} />
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'project');

      await waitFor(() => {
        expect(SearchService.searchTranscripts).toHaveBeenCalled();
      });

      const clearButton = getByTestId('clear-search');
      fireEvent.press(clearButton);

      expect(searchInput.props.value).toBe('');
      expect(queryByText('Meeting Notes')).toBeNull();
    });
  });

  describe('Filters', () => {
    it('should open filter modal', () => {
      const { getByTestId } = renderWithProviders(
        <MockSearchScreen navigation={mockNavigation as any} />
      );

      const filterButton = getByTestId('filter-button');
      fireEvent.press(filterButton);

      expect(getByTestId('filter-modal')).toBeTruthy();
    });

    it('should apply date filter', async () => {
      const { getByTestId } = renderWithProviders(
        <MockSearchScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('filter-button'));
      fireEvent.press(getByTestId('date-filter-today'));
      fireEvent.press(getByTestId('apply-filters'));

      await waitFor(() => {
        expect(SearchService.searchTranscripts).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ dateFrom: expect.any(String) })
        );
      });
    });

    it('should filter by tags', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MockSearchScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('filter-button'));
      fireEvent.press(getByText('work'));
      fireEvent.press(getByTestId('apply-filters'));

      await waitFor(() => {
        expect(SearchService.searchTranscripts).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ tags: ['work'] })
        );
      });
    });
  });

  describe('Results Navigation', () => {
    it('should navigate to transcript on result press', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockSearchScreen navigation={mockNavigation as any} />
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'project');

      const result = await findByText('Meeting Notes');
      fireEvent.press(result);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TranscriptDetail', {
        transcriptId: 'transcript-1',
        highlightQuery: 'project',
      });
    });
  });

  describe('Recent Searches', () => {
    it('should display recent searches', () => {
      const { getByText } = renderWithProviders(
        <MockSearchScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/recent searches/i)).toBeTruthy();
    });

    it('should use recent search on press', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MockSearchScreen navigation={mockNavigation as any} />
      );

      const recentSearch = getByText('previous query');
      fireEvent.press(recentSearch);

      await waitFor(() => {
        expect(SearchService.searchTranscripts).toHaveBeenCalled();
      });
    });
  });

  describe('Empty State', () => {
    it('should show no results message', async () => {
      (SearchService.searchTranscripts as jest.Mock).mockResolvedValue([]);

      const { getByTestId, findByText } = renderWithProviders(
        <MockSearchScreen navigation={mockNavigation as any} />
      );

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'nonexistent');

      const noResults = await findByText(/no results/i);
      expect(noResults).toBeTruthy();
    });
  });
});

// Mock component for testing
const MockSearchScreen = ({ navigation }: { navigation: any }) => {
  return null; // Placeholder - actual component would be imported
};
