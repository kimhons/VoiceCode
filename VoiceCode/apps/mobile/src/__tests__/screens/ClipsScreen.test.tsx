// VoiceCode Mobile - Clips Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import ClipsScreen from '../../screens/library/ClipsScreen';

describe('ClipsScreen', () => {
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
    it('should render clips screen', () => {
      const { getByTestId } = renderWithProviders(
        <ClipsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('clips-screen')).toBeTruthy();
    });

    it('should display clips list', () => {
      const { getByTestId } = renderWithProviders(
        <ClipsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('clips-list')).toBeTruthy();
    });
  });

  describe('Clip Items', () => {
    it('should display clip title', () => {
      const { getByText } = renderWithProviders(
        <ClipsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(/clip/i)).toBeTruthy();
    });

    it('should display clip duration', () => {
      const { getByTestId } = renderWithProviders(
        <ClipsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('clip-duration-1')).toBeTruthy();
    });
  });

  describe('Play Clip', () => {
    it('should play clip on tap', async () => {
      const { getByTestId } = renderWithProviders(
        <ClipsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('play-clip-1'));
    });
  });

  describe('Actions', () => {
    it('should edit clip', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <ClipsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('edit-clip-1'));

      const modal = await findByTestId('edit-clip-modal');
      expect(modal).toBeTruthy();
    });

    it('should delete clip', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(
        <ClipsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('delete-clip-1'));
      fireEvent.press(getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(queryByTestId('clip-1')).toBeNull();
      });
    });

    it('should export clip', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <ClipsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('export-clip-1'));

      const message = await findByText(/exporting/i);
      expect(message).toBeTruthy();
    });

    it('should share clip', async () => {
      const { getByTestId } = renderWithProviders(
        <ClipsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('share-clip-1'));
    });
  });

  describe('Create Clip', () => {
    it('should open create clip modal', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <ClipsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('create-clip'));

      const modal = await findByTestId('create-clip-modal');
      expect(modal).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no clips', () => {
      const { getByText } = renderWithProviders(
        <ClipsScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(/no clips/i)).toBeTruthy();
    });
  });
});
