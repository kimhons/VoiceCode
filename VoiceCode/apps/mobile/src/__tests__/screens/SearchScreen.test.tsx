// VoiceCode Mobile - Search Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, waitFor } from '@testing-library/react-native';
import {
  renderWithProviders,
  createMockNavigation,
  createMockRoute,
} from '../setup/testUtils';
import { rootReducer } from '../../store';
import { loginSuccess } from '../../store/slices/authSlice';
import { setFilters } from '../../store/slices/searchSlice';
import SearchService, { SearchFilters } from '../../services/SearchService';
import { SearchScreen } from '../../screens/search/SearchScreen';

jest.mock('../../services/SearchService');

type SearchScreenProps = React.ComponentProps<typeof SearchScreen>;

describe('SearchScreen', () => {
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
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

  // The real SearchScreen only dispatches a search when an authenticated user
  // id is present in the store (state.auth.user.id). Build a store that is
  // signed in, and optionally seed the active search filters.
  function authedStore(filters?: SearchFilters) {
    const store = configureStore({ reducer: rootReducer });
    store.dispatch(loginSuccess({ user: testUser, token: 'test-token' }));
    if (filters) {
      store.dispatch(setFilters(filters));
    }
    return store;
  }

  function renderSearch(store: ReturnType<typeof authedStore>) {
    const navigation = createMockNavigation() as unknown as SearchScreenProps['navigation'];
    const route = createMockRoute() as unknown as SearchScreenProps['route'];
    const utils = renderWithProviders(
      <SearchScreen navigation={navigation} route={route} />,
      { store }
    );
    return { navigation, ...utils };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (SearchService.searchTranscripts as jest.Mock).mockResolvedValue(mockSearchResults);
  });

  describe('Rendering', () => {
    it('should render search screen with input', () => {
      const { getByTestId } = renderSearch(authedStore());

      expect(getByTestId('search-input')).toBeTruthy();
    });

    it('should show empty state initially', () => {
      const { getByText } = renderSearch(authedStore());

      expect(getByText(/start typing/i)).toBeTruthy();
    });
  });

  describe('Search Functionality', () => {
    it('should search on text input', async () => {
      const { getByTestId, findByText } = renderSearch(authedStore());

      fireEvent.changeText(getByTestId('search-input'), 'project');

      await waitFor(() => {
        expect(SearchService.searchTranscripts).toHaveBeenCalled();
      });

      expect(await findByText('Meeting Notes')).toBeTruthy();
    });

    it('should debounce search requests', async () => {
      const { getByTestId } = renderSearch(authedStore());

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
      await waitFor(
        () => {
          expect(SearchService.searchTranscripts).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 }
      );
    });

    it('should clear search on clear button press', async () => {
      const { getByTestId, findByText, queryByText } = renderSearch(authedStore());

      const searchInput = getByTestId('search-input');
      fireEvent.changeText(searchInput, 'project');

      await findByText('Meeting Notes');

      fireEvent.press(getByTestId('clear-search'));

      await waitFor(() => {
        expect(getByTestId('search-input').props.value).toBe('');
        expect(queryByText('Meeting Notes')).toBeNull();
      });
    });
  });

  describe('Filters', () => {
    // The real screen delegates advanced filtering to a dedicated
    // AdvancedFilter screen rather than an inline modal.
    it('should open advanced filters', async () => {
      const { getByTestId, navigation } = renderSearch(authedStore());

      fireEvent.press(getByTestId('advanced-filters'));

      await waitFor(() => {
        expect(navigation.navigate).toHaveBeenCalledWith('AdvancedFilter');
      });
    });

    it('should apply date filter', async () => {
      const dateFrom = '2024-01-01T00:00:00Z';
      const { getByTestId } = renderSearch(authedStore({ dateFrom }));

      fireEvent.changeText(getByTestId('search-input'), 'project');

      await waitFor(() => {
        expect(SearchService.searchTranscripts).toHaveBeenCalledWith(
          'test-user-id',
          expect.objectContaining({ dateFrom })
        );
      });
    });

    it('should filter by tags', async () => {
      const { getByTestId } = renderSearch(authedStore({ tags: ['work'] }));

      fireEvent.changeText(getByTestId('search-input'), 'project');

      await waitFor(() => {
        expect(SearchService.searchTranscripts).toHaveBeenCalledWith(
          'test-user-id',
          expect.objectContaining({ tags: ['work'] })
        );
      });
    });
  });

  describe('Results', () => {
    it('should render pressable search results', async () => {
      const { getByTestId, findByText } = renderSearch(authedStore());

      fireEvent.changeText(getByTestId('search-input'), 'project');

      expect(await findByText('Meeting Notes')).toBeTruthy();
      expect(await findByText('...project planning...')).toBeTruthy();
      expect(getByTestId('result-transcript-1')).toBeTruthy();
      expect(getByTestId('result-transcript-2')).toBeTruthy();

      fireEvent.press(getByTestId('result-transcript-1'));
    });
  });

  describe('Recent Searches', () => {
    it('should display recent searches', () => {
      const { getByTestId, getByText } = renderSearch(authedStore());

      fireEvent(getByTestId('search-input'), 'focus');

      expect(getByText(/recent searches/i)).toBeTruthy();
    });

    it('should use recent search on press', async () => {
      const { getByTestId, getByText } = renderSearch(authedStore());

      fireEvent(getByTestId('search-input'), 'focus');
      fireEvent.press(getByText('meeting notes'));

      await waitFor(
        () => {
          expect(SearchService.searchTranscripts).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Empty State', () => {
    it('should show no results message', async () => {
      (SearchService.searchTranscripts as jest.Mock).mockResolvedValue([]);

      const { getByTestId, findByText } = renderSearch(authedStore());

      fireEvent.changeText(getByTestId('search-input'), 'nonexistent');

      expect(await findByText(/no results/i)).toBeTruthy();
    });
  });
});
