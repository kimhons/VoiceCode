// VoiceCode Mobile - Recent Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('RecentScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render recent screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockRecentScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('recent-screen')).toBeTruthy();
    });

    it('should display recent transcripts list', () => {
      const { getByTestId } = renderWithProviders(
        <MockRecentScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('recent-list')).toBeTruthy();
    });
  });

  describe('Recent Items', () => {
    it('should display transcript title', () => {
      const { getByText } = renderWithProviders(
        <MockRecentScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/meeting/i)).toBeTruthy();
    });

    it('should display access time', () => {
      const { getByText } = renderWithProviders(
        <MockRecentScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/ago/i)).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to transcript on tap', async () => {
      const { getByTestId } = renderWithProviders(
        <MockRecentScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('recent-item-1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TranscriptDetail', expect.any(Object));
    });
  });

  describe('Clear History', () => {
    it('should clear recent history', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockRecentScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('clear-history'));

      const confirmation = await findByText(/are you sure/i);
      expect(confirmation).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no recent items', () => {
      const { getByText } = renderWithProviders(
        <MockRecentScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/no recent/i)).toBeTruthy();
    });
  });
});

// Mock component
const MockRecentScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
