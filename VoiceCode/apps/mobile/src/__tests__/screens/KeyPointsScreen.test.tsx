// VoiceCode Mobile - Key Points Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import KeyPointsScreen from '../../screens/ai/KeyPointsScreen';

describe('KeyPointsScreen', () => {
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
    it('should render key points screen', () => {
      const { getByTestId } = renderWithProviders(
        <KeyPointsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('key-points-screen')).toBeTruthy();
    });

    it('should display key points list', () => {
      const { getByTestId } = renderWithProviders(
        <KeyPointsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('key-points-list')).toBeTruthy();
    });

    it('should show key point importance', () => {
      const { getByTestId } = renderWithProviders(
        <KeyPointsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('importance-indicator-1')).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should navigate to key point in transcript', async () => {
      const { getByTestId } = renderWithProviders(
        <KeyPointsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('key-point-1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TranscriptDetail', expect.any(Object));
    });
  });

  describe('Export', () => {
    it('should copy key points', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <KeyPointsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('copy-key-points'));

      const message = await findByText(/copied/i);
      expect(message).toBeTruthy();
    });

    it('should share key points', async () => {
      const { getByTestId } = renderWithProviders(
        <KeyPointsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('share-key-points'));
    });
  });

  describe('Regenerate', () => {
    it('should regenerate key points', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <KeyPointsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('regenerate'));

      const loading = await findByText(/generating/i);
      expect(loading).toBeTruthy();
    });
  });
});
