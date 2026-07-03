// VoiceCode Mobile - Favorites Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import FavoritesScreen from '../../screens/library/FavoritesScreen';

describe('FavoritesScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render favorites screen', () => {
      const { getByTestId } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('favorites-screen')).toBeTruthy();
    });

    it('should display favorites list', () => {
      const { getByTestId } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('favorites-list')).toBeTruthy();
    });
  });

  describe('Favorite Items', () => {
    it('should display transcript title', () => {
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/transcript/i)).toBeTruthy();
    });

    it('should display favorite indicator', () => {
      const { getByTestId } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('favorite-icon-1')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to transcript on tap', async () => {
      const { getByTestId } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('favorite-item-1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TranscriptDetail', expect.any(Object));
    });
  });

  describe('Remove Favorite', () => {
    it('should remove from favorites', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('remove-favorite-1'));

      await waitFor(() => {
        expect(queryByTestId('favorite-item-1')).toBeNull();
      });
    });
  });

  describe('Sorting', () => {
    it('should sort by date added', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('sort-button'));
      fireEvent.press(getByText(/date added/i));
    });

    it('should sort by title', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('sort-button'));
      fireEvent.press(getByText(/title/i));
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no favorites', () => {
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/no favorites/i)).toBeTruthy();
    });
  });
});
