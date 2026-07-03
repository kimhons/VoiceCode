// VoiceCode Mobile - Shared With Me Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('SharedWithMeScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render shared with me screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockSharedWithMeScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('shared-with-me-screen')).toBeTruthy();
    });

    it('should display shared transcripts list', () => {
      const { getByTestId } = renderWithProviders(
        <MockSharedWithMeScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('shared-list')).toBeTruthy();
    });
  });

  describe('Shared Items', () => {
    it('should display transcript title', () => {
      const { getByText } = renderWithProviders(
        <MockSharedWithMeScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/shared transcript/i)).toBeTruthy();
    });

    it('should display sharer name', () => {
      const { getByText } = renderWithProviders(
        <MockSharedWithMeScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/shared by/i)).toBeTruthy();
    });

    it('should display permission level', () => {
      const { getByText } = renderWithProviders(
        <MockSharedWithMeScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/view|edit/i)).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should open shared transcript', async () => {
      const { getByTestId } = renderWithProviders(
        <MockSharedWithMeScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('shared-item-1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TranscriptDetail', expect.any(Object));
    });
  });

  describe('Actions', () => {
    it('should leave shared transcript', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockSharedWithMeScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('leave-share-1'));

      const confirmation = await findByText(/leave/i);
      expect(confirmation).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no shares', () => {
      const { getByText } = renderWithProviders(
        <MockSharedWithMeScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/no shared/i)).toBeTruthy();
    });
  });
});

// Mock component
const MockSharedWithMeScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
