// VoiceCode Mobile - Summary Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import SummaryScreen from '../../screens/ai/SummaryScreen';

describe('SummaryScreen', () => {
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
    it('should render summary screen', () => {
      const { getByTestId } = renderWithProviders(
        <SummaryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('summary-screen')).toBeTruthy();
    });

    it('should display summary text', () => {
      const { getByTestId } = renderWithProviders(
        <SummaryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('summary-text')).toBeTruthy();
    });
  });

  describe('Summary Types', () => {
    it('should show brief summary', async () => {
      const { getByText } = renderWithProviders(
        <SummaryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/brief/i));
    });

    it('should show detailed summary', async () => {
      const { getByText } = renderWithProviders(
        <SummaryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/detailed/i));
    });

    it('should show bullet points', async () => {
      const { getByText } = renderWithProviders(
        <SummaryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/bullets/i));
    });
  });

  describe('Actions', () => {
    it('should copy summary', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <SummaryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('copy-summary'));

      const message = await findByText(/copied/i);
      expect(message).toBeTruthy();
    });

    it('should share summary', async () => {
      const { getByTestId } = renderWithProviders(
        <SummaryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('share-summary'));
    });

    it('should regenerate summary', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <SummaryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('regenerate'));

      const loading = await findByText(/generating/i);
      expect(loading).toBeTruthy();
    });
  });

  describe('Edit', () => {
    it('should edit summary', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <SummaryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('edit-summary'));

      const editor = await findByTestId('summary-editor');
      expect(editor).toBeTruthy();
    });

    it('should save edited summary', async () => {
      const { getByTestId } = renderWithProviders(
        <SummaryScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('edit-summary'));
      fireEvent.changeText(getByTestId('summary-editor'), 'Edited summary');
      fireEvent.press(getByTestId('save-summary'));
    });
  });
});

