// VoiceCode Mobile - Translation Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import TranslationScreen from '../../screens/general/TranslationScreen';

describe('TranslationScreen', () => {
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
    it('should render translation screen', () => {
      const { getByTestId } = renderWithProviders(
        <TranslationScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('translation-screen')).toBeTruthy();
    });

    it('should display source text', () => {
      const { getByTestId } = renderWithProviders(
        <TranslationScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByTestId('source-text')).toBeTruthy();
    });
  });

  describe('Language Selection', () => {
    it('should select target language', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <TranslationScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('language-selector'));
      fireEvent.press(getByText('Spanish'));
    });

    it('should show available languages', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <TranslationScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('language-selector'));

      const list = await findByTestId('language-list');
      expect(list).toBeTruthy();
    });
  });

  describe('Translate', () => {
    it('should translate transcript', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <TranslationScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('translate-button'));

      const translated = await findByTestId('translated-text');
      expect(translated).toBeTruthy();
    });

    it('should show translation progress', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <TranslationScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('translate-button'));

      const progress = await findByText(/translating/i);
      expect(progress).toBeTruthy();
    });
  });

  describe('Side by Side', () => {
    it('should toggle side by side view', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <TranslationScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('toggle-side-by-side'));

      const sideView = await findByTestId('side-by-side-view');
      expect(sideView).toBeTruthy();
    });
  });

  describe('Export', () => {
    it('should export translation', async () => {
      const { getByTestId } = renderWithProviders(
        <TranslationScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('export-translation'));
    });

    it('should copy translation', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <TranslationScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('copy-translation'));

      const message = await findByText(/copied/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Save', () => {
    it('should save translation', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <TranslationScreen navigation={mockNavigation} route={mockRoute} />
      );

      fireEvent.press(getByTestId('save-translation'));

      const message = await findByText(/saved/i);
      expect(message).toBeTruthy();
    });
  });
});
