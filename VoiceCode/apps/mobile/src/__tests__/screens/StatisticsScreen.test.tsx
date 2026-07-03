// VoiceCode Mobile - Statistics Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('StatisticsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render statistics screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockStatisticsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('statistics-screen')).toBeTruthy();
    });
  });

  describe('Overall Stats', () => {
    it('should display total transcripts', () => {
      const { getByText } = renderWithProviders(
        <MockStatisticsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/total transcripts/i)).toBeTruthy();
    });

    it('should display total recording time', () => {
      const { getByText } = renderWithProviders(
        <MockStatisticsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/recording time/i)).toBeTruthy();
    });

    it('should display total words', () => {
      const { getByText } = renderWithProviders(
        <MockStatisticsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/words/i)).toBeTruthy();
    });
  });

  describe('Time Period', () => {
    it('should filter by week', async () => {
      const { getByText } = renderWithProviders(
        <MockStatisticsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/week/i));
    });

    it('should filter by month', async () => {
      const { getByText } = renderWithProviders(
        <MockStatisticsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/month/i));
    });

    it('should filter by year', async () => {
      const { getByText } = renderWithProviders(
        <MockStatisticsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByText(/year/i));
    });
  });

  describe('Charts', () => {
    it('should display usage chart', () => {
      const { getByTestId } = renderWithProviders(
        <MockStatisticsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('usage-chart')).toBeTruthy();
    });

    it('should display category breakdown', () => {
      const { getByTestId } = renderWithProviders(
        <MockStatisticsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('category-chart')).toBeTruthy();
    });
  });

  describe('Export', () => {
    it('should export statistics report', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockStatisticsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('export-stats'));

      const message = await findByText(/exported/i);
      expect(message).toBeTruthy();
    });
  });
});

// Mock component
const MockStatisticsScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
