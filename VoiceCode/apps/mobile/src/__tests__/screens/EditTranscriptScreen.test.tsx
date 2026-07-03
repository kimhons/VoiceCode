// VoiceCode Mobile - Edit Transcript Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import EditTranscriptScreen from '../../screens/editing/EditTranscriptScreen';

describe('EditTranscriptScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  };

  const mockRoute = {
    params: { transcriptId: 'transcript-123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render edit screen', () => {
      const { getByTestId } = renderWithProviders(
        <EditTranscriptScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('edit-transcript-screen')).toBeTruthy();
    });

    it('should display transcript text', () => {
      const { getByTestId } = renderWithProviders(
        <EditTranscriptScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('transcript-editor')).toBeTruthy();
    });
  });

  describe('Editing', () => {
    it('should enable text editing', async () => {
      const { getByTestId } = renderWithProviders(
        <EditTranscriptScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const editor = getByTestId('transcript-editor');
      fireEvent.changeText(editor, 'Updated text');
    });

    it('should track unsaved changes', async () => {
      const { getByTestId } = renderWithProviders(
        <EditTranscriptScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('transcript-editor'), 'Updated');
      expect(getByTestId('unsaved-indicator')).toBeTruthy();
    });

    it('should support undo', async () => {
      const { getByTestId } = renderWithProviders(
        <EditTranscriptScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('undo-button'));
    });

    it('should support redo', async () => {
      const { getByTestId } = renderWithProviders(
        <EditTranscriptScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('redo-button'));
    });
  });

  describe('Save', () => {
    it('should save changes', async () => {
      const { getByTestId } = renderWithProviders(
        <EditTranscriptScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('transcript-editor'), 'Updated');
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });

    it('should show save confirmation', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <EditTranscriptScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('save-button'));

      const message = await findByText(/saved/i);
      expect(message).toBeTruthy();
    });
  });

  describe('Cancel', () => {
    it('should confirm discard changes', async () => {
      const { getByTestId, findByText } = renderWithProviders(
        <EditTranscriptScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('transcript-editor'), 'Updated');
      fireEvent.press(getByTestId('cancel-button'));

      const confirmation = await findByText(/discard/i);
      expect(confirmation).toBeTruthy();
    });

    it('should go back without confirm if no changes', () => {
      const { getByTestId } = renderWithProviders(
        <EditTranscriptScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('cancel-button'));

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  describe('Title Editing', () => {
    it('should edit transcript title', async () => {
      const { getByTestId } = renderWithProviders(
        <EditTranscriptScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.changeText(getByTestId('title-input'), 'New Title');
    });
  });
});
