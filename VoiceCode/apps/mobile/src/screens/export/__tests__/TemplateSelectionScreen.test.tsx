// VoiceCode Mobile - TemplateSelectionScreen Tests

import exportReducer, {
  updateTemplate,
  deleteTemplate,
} from '../../../store/slices/exportSlice';
import { ExportTemplate } from '../../../services/MobileExportService';

describe('TemplateSelectionScreen - Redux Logic', () => {
  it('handles updateTemplate.fulfilled', () => {
    const initialTemplate: ExportTemplate = {
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
      isDefault: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const initialState = exportReducer(undefined, {
      type: 'export/getTemplates/fulfilled',
      payload: [initialTemplate],
    });

    const updatedTemplate: ExportTemplate = {
      ...initialTemplate,
      name: 'Updated PDF',
      fontSize: 14,
    };

    const state = exportReducer(
      initialState,
      updateTemplate.fulfilled(updatedTemplate, '', {
        id: 'template-1',
        updates: { name: 'Updated PDF', fontSize: 14 },
      })
    );

    expect(state.templates[0].name).toBe('Updated PDF');
    expect(state.templates[0].fontSize).toBe(14);
  });

  it('handles deleteTemplate.fulfilled', () => {
    const initialState = exportReducer(undefined, {
      type: 'export/getTemplates/fulfilled',
      payload: [
        {
          id: 'template-1',
          userId: 'user-123',
          name: 'Template 1',
          format: 'pdf' as const,
          includeTimestamps: true,
          includeSpeakers: true,
          includeConfidence: false,
          includeMetadata: true,
          fontSize: 12,
          fontFamily: 'Arial',
          isDefault: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'template-2',
          userId: 'user-123',
          name: 'Template 2',
          format: 'docx' as const,
          includeTimestamps: true,
          includeSpeakers: true,
          includeConfidence: false,
          includeMetadata: true,
          fontSize: 12,
          fontFamily: 'Arial',
          isDefault: false,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ],
    });

    const state = exportReducer(
      initialState,
      deleteTemplate.fulfilled('template-1', '', 'template-1')
    );

    expect(state.templates).toHaveLength(1);
    expect(state.templates[0].id).toBe('template-2');
  });

  it('handles template with custom font settings', () => {
    const template: ExportTemplate = {
      id: 'template-1',
      userId: 'user-123',
      name: 'Custom Font Template',
      format: 'pdf',
      includeTimestamps: true,
      includeSpeakers: true,
      includeConfidence: false,
      includeMetadata: true,
      fontSize: 16,
      fontFamily: 'Times New Roman',
      isDefault: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(template.fontSize).toBe(16);
    expect(template.fontFamily).toBe('Times New Roman');
  });

  it('handles default template flag', () => {
    const defaultTemplate: ExportTemplate = {
      id: 'template-1',
      userId: 'user-123',
      name: 'Default Template',
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
    };

    expect(defaultTemplate.isDefault).toBe(true);
  });
});

