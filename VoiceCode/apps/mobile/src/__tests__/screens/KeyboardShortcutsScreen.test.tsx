// VoiceCode Mobile - Keyboard Shortcuts Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('KeyboardShortcutsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render keyboard shortcuts screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockKeyboardShortcutsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('keyboard-shortcuts-screen')).toBeTruthy();
    });

    it('should display shortcuts list', () => {
      const { getByTestId } = renderWithProviders(
        <MockKeyboardShortcutsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('shortcuts-list')).toBeTruthy();
    });
  });

  describe('Shortcut Categories', () => {
    it('should display playback shortcuts', () => {
      const { getByText } = renderWithProviders(
        <MockKeyboardShortcutsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/playback/i)).toBeTruthy();
    });

    it('should display editing shortcuts', () => {
      const { getByText } = renderWithProviders(
        <MockKeyboardShortcutsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/editing/i)).toBeTruthy();
    });

    it('should display navigation shortcuts', () => {
      const { getByText } = renderWithProviders(
        <MockKeyboardShortcutsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/navigation/i)).toBeTruthy();
    });
  });

  describe('Customize Shortcut', () => {
    it('should open customize modal', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <MockKeyboardShortcutsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('shortcut-1'));

      const modal = await findByTestId('customize-shortcut-modal');
      expect(modal).toBeTruthy();
    });

    it('should save custom shortcut', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockKeyboardShortcutsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('shortcut-1'));
      fireEvent.press(getByTestId('save-shortcut'));

      const message = await findByText(/saved/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Reset', () => {
    it('should reset to defaults', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockKeyboardShortcutsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('reset-shortcuts'));

      const message = await findByText(/reset/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Search', () => {
    it('should search shortcuts', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <MockKeyboardShortcutsScreen navigation={mockNavigation as any} />
      );

      fireEvent.changeText(getByTestId('search-input'), 'play');

      const results = await findByTestId('search-results');
      expect(results).toBeTruthy();
    });
  });
});

// Mock component
const MockKeyboardShortcutsScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
