// VoiceCode Mobile - Highlights Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import HighlightsScreen from '../../screens/ai/HighlightsScreen';

describe('HighlightsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockRoute = {
    params: { transcriptId: 'transcript-123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render highlights screen', () => {
      const { getByTestId } = renderWithProviders(
        <HighlightsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('highlights-screen')).toBeTruthy();
    });

    it('should display highlight list', () => {
      const { getByTestId } = renderWithProviders(
        <HighlightsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('highlight-list')).toBeTruthy();
    });
  });

  describe('Highlight Items', () => {
    it('should display highlighted text', () => {
      const { getByTestId } = renderWithProviders(
        <HighlightsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('highlight-text-1')).toBeTruthy();
    });

    it('should display highlight color', () => {
      const { getByTestId } = renderWithProviders(
        <HighlightsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('highlight-color-1')).toBeTruthy();
    });

    it('should display highlight note', () => {
      const { getByText } = renderWithProviders(
        <HighlightsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(/note/i)).toBeTruthy();
    });
  });

  describe('Actions', () => {
    it('should navigate to highlight in transcript', async () => {
      const { getByTestId } = renderWithProviders(
        <HighlightsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('highlight-1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TranscriptDetail', expect.any(Object));
    });

    it('should edit highlight', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <HighlightsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('edit-highlight-1'));

      const modal = await findByTestId('edit-highlight-modal');
      expect(modal).toBeTruthy();
    });

    it('should delete highlight', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <HighlightsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('delete-highlight-1'));
      fireEvent.press(getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(queryByTestId('highlight-1')).toBeNull();
      });
    });
  });

  describe('Export', () => {
    it('should export highlights', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <HighlightsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('export-highlights'));

      const message = await findByText(/exported/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Filter', () => {
    it('should filter by color', async () => {
      const { getByTestId } = renderWithProviders(
        <HighlightsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('filter-yellow'));
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no highlights', () => {
      const { getByText } = renderWithProviders(
        <HighlightsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(/no highlights/i)).toBeTruthy();
    });
  });
});
