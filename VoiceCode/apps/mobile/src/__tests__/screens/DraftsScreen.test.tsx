// VoiceCode Mobile - Drafts Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';

describe('DraftsScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render drafts screen', () => {
      const { getByTestId } = renderWithProviders(
        <MockDraftsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('drafts-screen')).toBeTruthy();
    });

    it('should display drafts list', () => {
      const { getByTestId } = renderWithProviders(
        <MockDraftsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('drafts-list')).toBeTruthy();
    });
  });

  describe('Draft Items', () => {
    it('should display draft title', () => {
      const { getByText } = renderWithProviders(
        <MockDraftsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/draft/i)).toBeTruthy();
    });

    it('should display last modified time', () => {
      const { getByTestId } = renderWithProviders(
        <MockDraftsScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('draft-modified-1')).toBeTruthy();
    });
  });

  describe('Continue Draft', () => {
    it('should continue editing draft', async () => {
      const { getByTestId } = renderWithProviders(
        <MockDraftsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('draft-1'));

      expect(mockNavigation.navigate).toHaveBeenCalledWith('EditTranscript', expect.any(Object));
    });
  });

  describe('Publish Draft', () => {
    it('should publish draft', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <MockDraftsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('publish-draft-1'));

      const message = await findByText(/published/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Delete Draft', () => {
    it('should delete draft', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <MockDraftsScreen navigation={mockNavigation as any} />
      );

      fireEvent.press(getByTestId('delete-draft-1'));
      fireEvent.press(getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(queryByTestId('draft-1')).toBeNull();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state', () => {
      const { getByText } = renderWithProviders(
        <MockDraftsScreen navigation={mockNavigation as any} />
      );

      expect(getByText(/no drafts/i)).toBeTruthy();
    });
  });
});

// Mock component
const MockDraftsScreen = ({ navigation }: { navigation: any }) => {
  return null;
};
