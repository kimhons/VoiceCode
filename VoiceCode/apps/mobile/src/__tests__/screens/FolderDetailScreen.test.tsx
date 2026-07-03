// VoiceCode Mobile - Folder Detail Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { supabase } from '../../services/supabaseService';
import FolderDetailScreen from '../../screens/library/FolderDetailScreen';

jest.mock('../../services/supabaseService');

describe('FolderDetailScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  };

  const mockRoute = {
    params: { folderId: 'folder-123' },
  };

  const mockFolder = {
    id: 'folder-123',
    name: 'Work',
    color: '#667eea',
    transcript_count: 5,
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockTranscripts = [
    { id: 'transcript-1', title: 'Meeting 1', created_at: '2024-01-15T10:00:00Z' },
    { id: 'transcript-2', title: 'Meeting 2', created_at: '2024-01-14T09:00:00Z' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockFolder,
            error: null,
          }),
        }),
      }),
    });
  });

  describe('Rendering', () => {
    it('should render folder detail screen', async () => {
      const { findByText } = renderWithProviders(
        <FolderDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const name = await findByText('Work');
      expect(name).toBeTruthy();
    });

    it('should display folder color', async () => {
      const { findByTestId } = renderWithProviders(
        <FolderDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const header = await findByTestId('folder-header');
      expect(header).toBeTruthy();
    });

    it('should display transcript count', async () => {
      const { findByText } = renderWithProviders(
        <FolderDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const count = await findByText(/5 transcripts/i);
      expect(count).toBeTruthy();
    });
  });

  describe('Transcripts List', () => {
    it('should display transcripts in folder', async () => {
      const { findByText } = renderWithProviders(
        <FolderDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const transcript = await findByText('Meeting 1');
      expect(transcript).toBeTruthy();
    });

    it('should navigate to transcript detail', async () => {
      const { findByText } = renderWithProviders(
        <FolderDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const transcript = await findByText('Meeting 1');
      fireEvent.press(transcript);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('TranscriptDetail', {
        transcriptId: 'transcript-1',
      });
    });
  });

  describe('Folder Actions', () => {
    it('should rename folder', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <FolderDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('rename-folder'));
      const input = await findByTestId('folder-name-input');
      fireEvent.changeText(input, 'New Name');
      fireEvent.press(getByTestId('save-name'));

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });
    });

    it('should change folder color', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <FolderDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('change-color'));
      const colorPicker = await findByTestId('color-picker');
      expect(colorPicker).toBeTruthy();
    });

    it('should delete folder', async () => {
      const { getByTestId } = renderWithProviders(
        <FolderDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('delete-folder'));
      fireEvent.press(getByTestId('confirm-delete'));

      await waitFor(() => {
        expect(mockNavigation.goBack).toHaveBeenCalled();
      });
    });
  });

  describe('Add Transcripts', () => {
    it('should add transcripts to folder', async () => {
      const { getByTestId, findByTestId } = renderWithProviders(
        <FolderDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('add-transcripts'));
      const modal = await findByTestId('add-transcripts-modal');
      expect(modal).toBeTruthy();
    });
  });

  describe('Remove Transcripts', () => {
    it('should remove transcript from folder', async () => {
      const { findByText, getByTestId } = renderWithProviders(
        <FolderDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const transcript = await findByText('Meeting 1');
      // Long press to select
      fireEvent(transcript, 'onLongPress');
      fireEvent.press(getByTestId('remove-from-folder'));

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalled();
      });
    });
  });

  describe('Sorting', () => {
    it('should sort transcripts by date', async () => {
      const { getByTestId } = renderWithProviders(
        <FolderDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('sort-by-date'));
    });

    it('should sort transcripts by name', async () => {
      const { getByTestId } = renderWithProviders(
        <FolderDetailScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByTestId('sort-by-name'));
    });
  });
});
