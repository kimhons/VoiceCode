// VoiceCode Mobile - Confidence Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import ConfidenceScreen from '../../screens/ai/ConfidenceScreen';

describe('ConfidenceScreen', () => {
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
    it('should render confidence screen', () => {
      const { getByTestId } = renderWithProviders(
        <ConfidenceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('confidence-screen')).toBeTruthy();
    });

    it('should display average confidence', () => {
      const { getByTestId } = renderWithProviders(
        <ConfidenceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('average-confidence')).toBeTruthy();
    });

    it('should display confidence chart', () => {
      const { getByTestId } = renderWithProviders(
        <ConfidenceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('confidence-chart')).toBeTruthy();
    });
  });

  describe('Low Confidence Words', () => {
    it('should display low confidence word list', () => {
      const { getByTestId } = renderWithProviders(
        <ConfidenceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('low-confidence-list')).toBeTruthy();
    });

    it('should navigate to word in transcript', async () => {
      const { getByTestId } = renderWithProviders(
        <ConfidenceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('low-confidence-word-1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TranscriptDetail', expect.any(Object));
    });

    it('should correct low confidence word', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <ConfidenceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('correct-word-1'));

      const input = await findByTestId('correction-input');
      expect(input).toBeTruthy();
    });
  });

  describe('Threshold', () => {
    it('should adjust confidence threshold', async () => {
      const { getByTestId } = renderWithProviders(
        <ConfidenceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent(getByTestId('threshold-slider'), 'onValueChange', 0.8);
    });
  });

  describe('Export', () => {
    it('should export low confidence report', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <ConfidenceScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('export-report'));

      const message = await findByText(/exported/i);
      expect(message).toBeTruthy();
    });
  });
});
