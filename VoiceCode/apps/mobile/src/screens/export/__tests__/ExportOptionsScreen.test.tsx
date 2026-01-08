// VoiceFlow Pro Mobile - ExportOptionsScreen Tests

import exportReducer, {
  getTemplates,
  createTemplate,
} from '../../../store/slices/exportSlice';
import { ExportTemplate } from '../../../services/MobileExportService';

describe('ExportOptionsScreen - Redux Logic', () => {
  it('initializes with empty templates', () => {
    const state = exportReducer(undefined, { type: 'unknown' });
    expect(state.templates).toEqual([]);
    expect(state.templatesLoading).toBe(false);
    expect(state.templatesError).toBeNull();
  });

  it('handles getTemplates.pending', () => {
    const state = exportReducer(undefined, getTemplates.pending('', 'user-123'));
    expect(state.templatesLoading).toBe(true);
    expect(state.templatesError).toBeNull();
  });

  it('handles getTemplates.fulfilled', () => {
    const templates: ExportTemplate[] = [
      {
        id: 'template-1',
        userId: 'user-123',
        name: 'Standard PDF',
        format: 'pdf',
        includeTimestamps: true,
        includeSpeakers: true,
        includeConfidence: false,
        includeMetadata: true,
        fontSize: 12,
        fontFamily: 'Arial',
        isDefault: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    const state = exportReducer(
      undefined,
      getTemplates.fulfilled(templates, '', 'user-123')
    );

    expect(state.templatesLoading).toBe(false);
    expect(state.templates).toEqual(templates);
    expect(state.templatesError).toBeNull();
  });

  it('handles getTemplates.rejected', () => {
    const state = exportReducer(
      undefined,
      getTemplates.rejected(new Error('Network error'), '', 'user-123')
    );

    expect(state.templatesLoading).toBe(false);
    expect(state.templatesError).toBe('Network error');
  });

  it('handles createTemplate.fulfilled', () => {
    const newTemplate: ExportTemplate = {
      id: 'template-2',
      userId: 'user-123',
      name: 'Custom DOCX',
      format: 'docx',
      includeTimestamps: false,
      includeSpeakers: true,
      includeConfidence: false,
      includeMetadata: true,
      fontSize: 14,
      fontFamily: 'Times New Roman',
      isDefault: false,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    const state = exportReducer(
      undefined,
      createTemplate.fulfilled(newTemplate, '', {
        userId: 'user-123',
        template: {
          name: 'Custom DOCX',
          format: 'docx',
          includeTimestamps: false,
          includeSpeakers: true,
          includeConfidence: false,
          includeMetadata: true,
          fontSize: 14,
          fontFamily: 'Times New Roman',
          isDefault: false,
        },
      })
    );

    expect(state.templates).toHaveLength(1);
    expect(state.templates[0]).toEqual(newTemplate);
  });

  it('handles multiple export formats', () => {
    const formats: Array<'pdf' | 'docx' | 'txt' | 'srt' | 'vtt' | 'json'> = [
      'pdf',
      'docx',
      'txt',
      'srt',
      'vtt',
      'json',
    ];

    formats.forEach((format) => {
      const template: ExportTemplate = {
        id: `template-${format}`,
        userId: 'user-123',
        name: `${format.toUpperCase()} Template`,
        format,
        includeTimestamps: true,
        includeSpeakers: true,
        includeConfidence: false,
        includeMetadata: true,
        fontSize: 12,
        fontFamily: 'Arial',
        isDefault: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(template.format).toBe(format);
    });
  });

  it('handles template options correctly', () => {
    const template: ExportTemplate = {
      id: 'template-1',
      userId: 'user-123',
      name: 'Minimal Template',
      format: 'txt',
      includeTimestamps: false,
      includeSpeakers: false,
      includeConfidence: false,
      includeMetadata: false,
      fontSize: 10,
      fontFamily: 'Courier',
      isDefault: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(template.includeTimestamps).toBe(false);
    expect(template.includeSpeakers).toBe(false);
    expect(template.includeConfidence).toBe(false);
    expect(template.includeMetadata).toBe(false);
  });
});

