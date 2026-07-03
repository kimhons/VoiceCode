// VoiceCode Mobile - Appearance Settings Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { AppearanceSettingsScreen } from '../../screens/settings/AppearanceSettingsScreen';

describe('AppearanceSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render appearance settings', () => {
      const { getByTestId } = renderWithProviders(
        <AppearanceSettingsScreen />
      );

      expect(getByTestId('appearance-settings-screen')).toBeTruthy();
    });
  });

  describe('Theme', () => {
    it('should select light theme', async () => {
      const { getByTestId } = renderWithProviders(
        <AppearanceSettingsScreen />
      );

      fireEvent.press(getByTestId('theme-light'));
    });

    it('should select dark theme', async () => {
      const { getByTestId } = renderWithProviders(
        <AppearanceSettingsScreen />
      );

      fireEvent.press(getByTestId('theme-dark'));
    });

    it('should select system theme', async () => {
      const { getByTestId } = renderWithProviders(
        <AppearanceSettingsScreen />
      );

      fireEvent.press(getByTestId('theme-system'));
    });
  });

  describe('Accent Color', () => {
    it('should change accent color', async () => {
      const { getByTestId } = renderWithProviders(
        <AppearanceSettingsScreen />
      );

      fireEvent.press(getByTestId('color-blue'));
    });

    it('should show color preview', () => {
      const { getByTestId } = renderWithProviders(
        <AppearanceSettingsScreen />
      );

      expect(getByTestId('color-preview')).toBeTruthy();
    });
  });

  describe('Font Size', () => {
    it('should change font size', async () => {
      const { getByTestId } = renderWithProviders(
        <AppearanceSettingsScreen />
      );

      fireEvent(getByTestId('font-size-slider'), 'onValueChange', 18);
    });

    it('should show font preview', () => {
      const { getByTestId } = renderWithProviders(
        <AppearanceSettingsScreen />
      );

      expect(getByTestId('font-preview')).toBeTruthy();
    });
  });

  describe('Display Density', () => {
    it('should select compact density', async () => {
      const { getByText } = renderWithProviders(
        <AppearanceSettingsScreen />
      );

      fireEvent.press(getByText(/compact/i));
    });

    it('should select comfortable density', async () => {
      const { getByText } = renderWithProviders(
        <AppearanceSettingsScreen />
      );

      fireEvent.press(getByText(/comfortable/i));
    });
  });

  describe('Accessibility', () => {
    it('should toggle reduce motion', async () => {
      const { getByTestId } = renderWithProviders(
        <AppearanceSettingsScreen />
      );

      fireEvent(getByTestId('reduce-motion-toggle'), 'valueChange', true);
    });

    it('should toggle bold text', async () => {
      const { getByTestId } = renderWithProviders(
        <AppearanceSettingsScreen />
      );

      fireEvent(getByTestId('bold-text-toggle'), 'valueChange', true);
    });
  });
});
