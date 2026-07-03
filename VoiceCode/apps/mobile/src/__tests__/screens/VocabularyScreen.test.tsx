// VoiceCode Mobile - Vocabulary Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('VocabularyScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render vocabulary screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockVocabularyScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('vocabulary-screen')).toBeTruthy();
    });

    it('should display vocabulary list', () => {
      const { getByTestId } = renderWithProviders(
        <MockVocabularyScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('vocabulary-list')).toBeTruthy();
    });
  });

  describe('Add Word', () => {
    it('should open add word modal', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <MockVocabularyScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('add-word'));

      const modal = await findByTestId('add-word-modal');
      expect(modal).toBeTruthy();
    });

    it('should add new word', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockVocabularyScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('add-word'));
      fireEvent.changeText(getByTestId('word-input'), 'customword');
      fireEvent.press(getByTestId('save-word'));

      const word = await findByText('customword');
      expect(word).toBeTruthy();
    });
  });

  describe('Edit Word', () => {
    it('should edit word', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <MockVocabularyScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('edit-word-1'));

      const modal = await findByTestId('edit-word-modal');
      expect(modal).toBeTruthy();
    });
  });

  describe('Delete Word', () => {
    it('should delete word', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <MockVocabularyScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('delete-word-1'));

      await waitFor(() => {
        expect(queryByTestId('word-1')).toBeNull();
      });
    });
  });

  describe('Import/Export', () => {
    it('should import vocabulary', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockVocabularyScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('import-vocabulary'));

      const message = await findByText(/imported/i);
      expect(message).toBeTruthy();
    });

    it('should export vocabulary', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockVocabularyScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('export-vocabulary'));

      const message = await findByText(/exported/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Search', () => {
    it('should search vocabulary', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <MockVocabularyScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('search-input'), 'word');

      const results = await findByTestId('search-results');
      expect(results).toBeTruthy();
    });
  });
});

// Mock component
const MockVocabularyScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
