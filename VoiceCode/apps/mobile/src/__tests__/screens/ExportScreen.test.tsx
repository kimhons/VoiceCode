// VoiceCode Mobile - Export Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ExportScreen from '../../screens/export/ExportScreen';

jest.mock('expo-sharing');
jest.mock('expo-file-system');

describe('ExportScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockRoute = {
    params: { transcriptId: 'transcript-123' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render export screen', () => {
      const { getByTestId } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByTestId('export-screen')).toBeTruthy();
    });

    it('should display format options', () => {
      const { getByText } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(getByText(/pdf/i)).toBeTruthy();
      expect(getByText(/docx/i)).toBeTruthy();
      expect(getByText(/txt/i)).toBeTruthy();
      expect(getByText(/srt/i)).toBeTruthy();
    });
  });

  describe('Format Selection', () => {
    it('should select PDF format', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/pdf/i));
      expect(getByTestId('pdf-selected')).toBeTruthy();
    });

    it('should select DOCX format', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/docx/i));
      expect(getByTestId('docx-selected')).toBeTruthy();
    });

    it('should select TXT format', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/txt/i));
      expect(getByTestId('txt-selected')).toBeTruthy();
    });

    it('should select SRT format', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/srt/i));
      expect(getByTestId('srt-selected')).toBeTruthy();
    });
  });

  describe('Export Options', () => {
    it('should toggle include summary', () => {
      const { getByTestId } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const toggle = getByTestId('include-summary-toggle');
      fireEvent(toggle, 'valueChange', true);
      // Verify toggle state
    });

    it('should toggle include timestamps', () => {
      const { getByTestId } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const toggle = getByTestId('include-timestamps-toggle');
      fireEvent(toggle, 'valueChange', true);
    });

    it('should toggle include speaker labels', () => {
      const { getByTestId } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      const toggle = getByTestId('include-speakers-toggle');
      fireEvent(toggle, 'valueChange', true);
    });
  });

  describe('Export Actions', () => {
    it('should export to PDF', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/pdf/i));
      fireEvent.press(getByTestId('export-button'));

      await waitFor(() => {
        expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      });
    });

    it('should show loading during export', async () => {
      const { getByText, getByTestId, findByTestId } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/pdf/i));
      fireEvent.press(getByTestId('export-button'));

      const loading = await findByTestId('export-loading');
      expect(loading).toBeTruthy();
    });

    it('should show success message', async () => {
      const { getByText, getByTestId, findByText } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/pdf/i));
      fireEvent.press(getByTestId('export-button'));

      const success = await findByText(/export complete/i);
      expect(success).toBeTruthy();
    });
  });

  describe('Share', () => {
    it('should share exported file', async () => {
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      const { getByText, getByTestId } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/pdf/i));
      fireEvent.press(getByTestId('export-button'));

      await waitFor(() => {
        expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      });

      fireEvent.press(getByTestId('share-button'));

      await waitFor(() => {
        expect(Sharing.shareAsync).toHaveBeenCalled();
      });
    });

    it('should handle share unavailable', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

      const { queryByTestId } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      expect(queryByTestId('share-button')).toBeNull();
    });
  });

  describe('Save to Cloud', () => {
    it('should save to cloud storage', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/pdf/i));
      fireEvent.press(getByTestId('export-button'));

      await waitFor(() => {
        expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      });

      fireEvent.press(getByTestId('save-to-cloud'));
      // Cloud save logic
    });
  });

  describe('Error Handling', () => {
    it('should show error on export failure', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValue(new Error('Write failed'));

      const { getByText, getByTestId, findByText } = renderWithProviders(
        <ExportScreen navigation={mockNavigation as any} route={mockRoute as any} />
      );

      fireEvent.press(getByText(/pdf/i));
      fireEvent.press(getByTestId('export-button'));

      const error = await findByText(/export failed/i);
      expect(error).toBeTruthy();
    });
  });
});
