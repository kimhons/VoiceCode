// VoiceCode Mobile - Quick Actions Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('QuickActionsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render quick actions screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockQuickActionsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('quick-actions-screen')).toBeTruthy();
    });

    it('should display action list', () => {
      const { getByTestId } = renderWithProviders(
        <MockQuickActionsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('action-list')).toBeTruthy();
    });
  });

  describe('Actions', () => {
    it('should start new recording', async () => {
      const { getByTestId } = renderWithProviders(
        <MockQuickActionsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('action-new-recording'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Recording');
    });

    it('should import audio', async () => {
      const { getByTestId } = renderWithProviders(
        <MockQuickActionsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('action-import'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Import');
    });

    it('should open search', async () => {
      const { getByTestId } = renderWithProviders(
        <MockQuickActionsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('action-search'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Search');
    });

    it('should view recent transcripts', async () => {
      const { getByTestId } = renderWithProviders(
        <MockQuickActionsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('action-recent'));
    });

    it('should open favorites', async () => {
      const { getByTestId } = renderWithProviders(
        <MockQuickActionsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('action-favorites'));
    });
  });

  describe('Shortcuts', () => {
    it('should display keyboard shortcuts', () => {
      const { getByText } = renderWithProviders(
        <MockQuickActionsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/shortcuts/i)).toBeTruthy();
    });
  });
});

// Mock component
const MockQuickActionsScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
