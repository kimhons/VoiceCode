// VoiceCode Mobile - Export Options Screen Tests

import React from 'react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../setup/testUtils';
import { ExportOptionsScreen } from '../../screens/export/ExportOptionsScreen';

type ScreenProps = React.ComponentProps<typeof ExportOptionsScreen>;

function renderScreen() {
  const navigate = jest.fn();
  const navigation = {
    navigate,
    goBack: jest.fn(),
  } as unknown as ScreenProps['navigation'];

  const route = {
    key: 'export-options',
    name: 'ExportOptions',
    params: {
      transcriptId: 'transcript-123',
      transcriptTitle: 'Team Standup',
      transcriptText: 'Hello world transcript body.',
    },
  } as unknown as ScreenProps['route'];

  const utils = renderWithProviders(
    <ExportOptionsScreen navigation={navigation} route={route} />
  );

  return { navigate, ...utils };
}

describe('ExportOptionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render export options screen', () => {
      const { getByTestId } = renderScreen();

      expect(getByTestId('export-options-screen')).toBeTruthy();
    });
  });

  describe('Format Selection', () => {
    it('should display format options', () => {
      const { getByText } = renderScreen();

      expect(getByText('Plain Text')).toBeTruthy();
      expect(getByText('PDF Document')).toBeTruthy();
      expect(getByText('Word Document')).toBeTruthy();
    });

    it('should render every supported format card', () => {
      const { getByTestId } = renderScreen();

      for (const format of ['pdf', 'docx', 'txt', 'srt', 'vtt', 'json']) {
        expect(getByTestId(`export-format-${format}`)).toBeTruthy();
      }
    });

    it('should route PDF export to template selection', async () => {
      const { getByTestId, navigate } = renderScreen();

      fireEvent.press(getByTestId('export-format-pdf'));

      await waitFor(() =>
        expect(navigate).toHaveBeenCalledWith(
          'TemplateSelection',
          expect.objectContaining({ transcriptId: 'transcript-123' })
        )
      );
    });

    it('should route Word export to template selection', async () => {
      const { getByTestId, navigate } = renderScreen();

      fireEvent.press(getByTestId('export-format-docx'));

      await waitFor(() =>
        expect(navigate).toHaveBeenCalledWith(
          'TemplateSelection',
          expect.objectContaining({ transcriptId: 'transcript-123' })
        )
      );
    });
  });

  describe('Quick Actions', () => {
    it('should navigate to batch export', async () => {
      const { getByTestId, navigate } = renderScreen();

      fireEvent.press(getByTestId('batch-export-button'));

      await waitFor(() => expect(navigate).toHaveBeenCalledWith('BatchExport'));
    });

    it('should navigate to custom template', async () => {
      const { getByTestId, navigate } = renderScreen();

      fireEvent.press(getByTestId('custom-template-button'));

      await waitFor(() =>
        expect(navigate).toHaveBeenCalledWith(
          'TemplateSelection',
          expect.objectContaining({ transcriptId: 'transcript-123' })
        )
      );
    });
  });

  describe('Export History', () => {
    it('should open the export history panel', async () => {
      const { getByTestId, findByText } = renderScreen();

      fireEvent.press(getByTestId('export-history-button'));

      expect(await findByText('Export History')).toBeTruthy();
    });
  });

  describe('Analytics', () => {
    it('should open the export analytics panel', async () => {
      const { getByTestId, findByText } = renderScreen();

      fireEvent.press(getByTestId('export-analytics-button'));

      expect(await findByText('Export Analytics')).toBeTruthy();
    });
  });
});
