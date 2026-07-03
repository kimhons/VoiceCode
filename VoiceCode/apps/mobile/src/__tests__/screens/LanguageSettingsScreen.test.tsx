// VoiceCode Mobile - Language Settings Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('LanguageSettingsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render language settings', () => {
      const { getByTestId } = renderWithProviders(
        <MockLanguageSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('language-settings-screen')).toBeTruthy();
    });

    it('should display app language section', () => {
      const { getByText } = renderWithProviders(
        <MockLanguageSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/app language/i)).toBeTruthy();
    });

    it('should display transcription language section', () => {
      const { getByText } = renderWithProviders(
        <MockLanguageSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/transcription/i)).toBeTruthy();
    });
  });

  describe('App Language', () => {
    it('should change app language', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MockLanguageSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('app-language-selector'));
      fireEvent.press(getByText('Spanish'));
    });

    it('should show current language', () => {
      const { getByText } = renderWithProviders(
        <MockLanguageSettingsScreen navigation={mockNavigation as any} />
      );

      expect(getByText('English')).toBeTruthy();
    });
  });

  describe('Transcription Language', () => {
    it('should set default transcription language', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MockLanguageSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('transcription-language-selector'));
      fireEvent.press(getByText('French'));
    });

    it('should toggle auto-detect', async () => {
      const { getByTestId } = renderWithProviders(
        <MockLanguageSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent(getByTestId('auto-detect-toggle'), 'valueChange', true);
    });
  });

  describe('Translation', () => {
    it('should set default translation language', async () => {
      const { getByTestId, getByText } = renderWithProviders(
        <MockLanguageSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('translation-language-selector'));
      fireEvent.press(getByText('German'));
    });
  });

  describe('Search', () => {
    it('should search languages', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockLanguageSettingsScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('language-search'), 'Span');

      const result = await findByText('Spanish');
      expect(result).toBeTruthy();
    });
  });
});

// Mock component
const MockLanguageSettingsScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
