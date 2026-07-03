import React, { useState } from 'react';
import { X, FileText, FileJson, File, Download } from 'lucide-react';

export type ExportFormat = 'txt' | 'json' | 'md' | 'srt' | 'vtt';

interface ExportDialogProps {
  isOpen: boolean;
  transcript: string;
  processedText?: string;
  confidence?: number;
  onClose: () => void;
  onExport: (format: ExportFormat, includeMetadata: boolean) => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  transcript,
  processedText,
  confidence = 0,
  onClose,
  onExport,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('txt');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeProcessed, setIncludeProcessed] = useState(true);

  if (!isOpen) return null;

  const formats: {
    id: ExportFormat;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      id: 'txt',
      label: 'Plain Text',
      icon: <FileText size={20} />,
      description: 'Simple text file',
    },
    {
      id: 'md',
      label: 'Markdown',
      icon: <File size={20} />,
      description: 'Formatted markdown',
    },
    {
      id: 'json',
      label: 'JSON',
      icon: <FileJson size={20} />,
      description: 'Structured data',
    },
    {
      id: 'srt',
      label: 'SRT Subtitles',
      icon: <File size={20} />,
      description: 'Subtitle format',
    },
    {
      id: 'vtt',
      label: 'WebVTT',
      icon: <File size={20} />,
      description: 'Web subtitle format',
    },
  ];

  const handleExport = () => {
    onExport(selectedFormat, includeMetadata);
    onClose();
  };

  const getPreview = () => {
    const text = includeProcessed && processedText ? processedText : transcript;
    const preview = text.slice(0, 200) + (text.length > 200 ? '...' : '');

    switch (selectedFormat) {
      case 'json':
        return JSON.stringify(
          {
            transcript: preview,
            ...(includeMetadata && {
              confidence,
              exportedAt: new Date().toISOString(),
            }),
          },
          null,
          2
        );
      case 'md':
        return `# Transcript\n\n${preview}${includeMetadata ? `\n\n---\n*Confidence: ${Math.round(confidence * 100)}%*` : ''}`;
      case 'srt':
        return `1\n00:00:00,000 --> 00:00:10,000\n${preview.slice(0, 100)}`;
      case 'vtt':
        return `WEBVTT\n\n00:00:00.000 --> 00:00:10.000\n${preview.slice(0, 100)}`;
      default:
        return preview;
    }
  };

  return (
    <div
      className="export-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
    >
      <div className="export-dialog">
        <div className="export-dialog-header">
          <h2 id="export-dialog-title">
            <Download size={20} />
            Export Transcript
          </h2>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="export-dialog-content">
          <div className="format-selection">
            <h3>Select Format</h3>
            <div className="format-grid">
              {formats.map((format) => (
                <button
                  key={format.id}
                  className={`format-option ${selectedFormat === format.id ? 'selected' : ''}`}
                  onClick={() => setSelectedFormat(format.id)}
                  aria-pressed={selectedFormat === format.id}
                >
                  {format.icon}
                  <span className="format-label">{format.label}</span>
                  <span className="format-desc">{format.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="export-options">
            <h3>Options</h3>
            <label className="checkbox-option">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
              />
              <span>Include metadata (date, confidence, etc.)</span>
            </label>
            {processedText && (
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={includeProcessed}
                  onChange={(e) => setIncludeProcessed(e.target.checked)}
                />
                <span>Use AI-enhanced text</span>
              </label>
            )}
          </div>

          <div className="export-preview">
            <h3>Preview</h3>
            <pre className="preview-content">{getPreview()}</pre>
          </div>
        </div>

        <div className="export-dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={!transcript}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export const exportTranscript = (
  transcript: string,
  processedText: string | undefined,
  format: ExportFormat,
  includeMetadata: boolean,
  confidence: number = 0
): void => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const text = processedText || transcript;

  let content: string;
  let mimeType: string;
  let extension: string;

  switch (format) {
    case 'json':
      content = JSON.stringify(
        {
          transcript,
          processedText,
          ...(includeMetadata && {
            confidence,
            wordCount: transcript.split(/\s+/).filter(Boolean).length,
            characterCount: transcript.length,
            exportedAt: now.toISOString(),
            version: '1.0.0',
          }),
        },
        null,
        2
      );
      mimeType = 'application/json';
      extension = 'json';
      break;

    case 'md':
      content = `# VoiceFlow Pro Transcript\n\n`;
      content += `## Original\n\n${transcript}\n\n`;
      if (processedText) {
        content += `## Enhanced\n\n${processedText}\n\n`;
      }
      if (includeMetadata) {
        content += `---\n\n`;
        content += `- **Confidence:** ${Math.round(confidence * 100)}%\n`;
        content += `- **Words:** ${transcript.split(/\s+/).filter(Boolean).length}\n`;
        content += `- **Exported:** ${now.toLocaleString()}\n`;
      }
      mimeType = 'text/markdown';
      extension = 'md';
      break;

    case 'srt': {
      const srtLines = text.match(/.{1,80}/g) || [text];
      content = srtLines
        .map((line, i) => {
          const start = i * 5;
          const end = (i + 1) * 5;
          return `${i + 1}\n${formatSRTTime(start)} --> ${formatSRTTime(end)}\n${line.trim()}\n`;
        })
        .join('\n');
      mimeType = 'text/plain';
      extension = 'srt';
      break;
    }

    case 'vtt': {
      const vttLines = text.match(/.{1,80}/g) || [text];
      content = 'WEBVTT\n\n';
      content += vttLines
        .map((line, i) => {
          const start = i * 5;
          const end = (i + 1) * 5;
          return `${formatVTTTime(start)} --> ${formatVTTTime(end)}\n${line.trim()}\n`;
        })
        .join('\n');
      mimeType = 'text/vtt';
      extension = 'vtt';
      break;
    }

    default: {
      content = `VoiceFlow Pro Transcript\n`;
      content += `${'='.repeat(40)}\n\n`;
      content += `Original:\n${transcript}\n\n`;
      if (processedText) {
        content += `Enhanced:\n${processedText}\n\n`;
      }
      if (includeMetadata) {
        content += `${'='.repeat(40)}\n`;
        content += `Confidence: ${Math.round(confidence * 100)}%\n`;
        content += `Words: ${transcript.split(/\s+/).filter(Boolean).length}\n`;
        content += `Exported: ${now.toLocaleString()}\n`;
      }
      mimeType = 'text/plain';
      extension = 'txt';
    }
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `voicecode-transcript-${timestamp}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const formatSRTTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},000`;
};

const formatVTTTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.000`;
};

export default ExportDialog;
