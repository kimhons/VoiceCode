// VoiceCode Mobile - Keyboard Shortcuts Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import KeyboardShortcutsScreen from '../../screens/accessibility/KeyboardShortcutsScreen';

describe('KeyboardShortcutsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render keyboard shortcuts screen', () => {
      const { getByTestId } = renderWithProviders(<KeyboardShortcutsScreen />);

      expect(getByTestId('keyboard-shortcuts-screen')).toBeTruthy();
    });

    it('should display shortcuts list', () => {
      const { getByTestId } = renderWithProviders(<KeyboardShortcutsScreen />);

      expect(getByTestId('shortcuts-list')).toBeTruthy();
    });
  });

  describe('Shortcut Categories', () => {
    // Each category label renders in both the filter chip row and as a section
    // heading, so assert on all matches rather than a single one.
    it('should display playback shortcuts', () => {
      const { getAllByText } = renderWithProviders(<KeyboardShortcutsScreen />);

      expect(getAllByText(/playback/i).length).toBeGreaterThan(0);
    });

    it('should display editing shortcuts', () => {
      const { getAllByText } = renderWithProviders(<KeyboardShortcutsScreen />);

      expect(getAllByText(/editing/i).length).toBeGreaterThan(0);
    });

    it('should display navigation shortcuts', () => {
      const { getAllByText } = renderWithProviders(<KeyboardShortcutsScreen />);

      expect(getAllByText(/navigation/i).length).toBeGreaterThan(0);
    });
  });

  describe('Customize Shortcut', () => {
    it('should open customize modal', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(<KeyboardShortcutsScreen />);

      fireEvent.press(getByTestId('shortcut-1'));

      const modal = await findByTestId('customize-shortcut-modal');
      expect(modal).toBeTruthy();
    });

    it('should save custom shortcut', async () => {
      const { getByTestId, findByText } = renderWithProviders(<KeyboardShortcutsScreen />);

      fireEvent.press(getByTestId('shortcut-1'));
      fireEvent.press(getByTestId('save-shortcut'));

      const message = await findByText(/saved/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Reset', () => {
    it('should reset to defaults', async () => {
      const { getByTestId, findByText } = renderWithProviders(<KeyboardShortcutsScreen />);

      fireEvent.press(getByTestId('reset-shortcuts'));

      const message = await findByText(/reset/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Search', () => {
    it('should search shortcuts', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(<KeyboardShortcutsScreen />);

      fireEvent.changeText(getByTestId('search-input'), 'play');

      const results = await findByTestId('search-results');
      expect(results).toBeTruthy();
    });
  });
});
