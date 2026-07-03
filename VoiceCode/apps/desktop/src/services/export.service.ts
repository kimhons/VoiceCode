/**
 * Export Service
 * Phase 3.1: Transcript Editor & Export
 * 
 * Provides export functionality for transcripts in multiple formats
 */

import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable'; // TODO: Use for advanced PDF tables
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
// import { AlignmentType } from 'docx'; // TODO: Use for text alignment
import { saveAs } from 'file-saver';
import { Transcript } from './supabase.service';
// import { Speaker } from './supabase.service'; // TODO: Use for speaker identification

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'srt' | 'vtt' | 'json';

export interface ExportOptions {
  includeTimestamps?: boolean;
  includeSpeakers?: boolean;
  includeConfidence?: boolean;
  includeMetadata?: boolean;
  watermark?: string;
  fontSize?: number;
  fontFamily?: string;
}

/**
 * Export Service Class
 */
export class ExportService {
  /**
   * Export transcript to specified format
   */
  async exportTranscript(
    transcript: Transcript,
    format: ExportFormat,
    options: ExportOptions = {}
  ): Promise<void> {
    // TODO: Use destructured options in format-specific exports
    // const {
    //   includeTimestamps = true,
    //   includeSpeakers = true,
    //   includeConfidence = false,
    //   includeMetadata = true,
    //   watermark,
    // } = options;

    switch (format) {
      case 'pdf':
        await this.exportToPDF(transcript, options);
        break;
      case 'docx':
        await this.exportToDOCX(transcript, options);
        break;
      case 'txt':
        await this.exportToTXT(transcript, options);
        break;
      case 'srt':
        await this.exportToSRT(transcript, options);
        break;
      case 'vtt':
        await this.exportToVTT(transcript, options);
        break;
      case 'json':
        await this.exportToJSON(transcript, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to PDF
   */
  private async exportToPDF(transcript: Transcript, options: ExportOptions): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(transcript.title, margin, yPosition);
    yPosition += 10;

    // Metadata
    if (options.includeMetadata) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date(transcript.created_at).toLocaleString()}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Language: ${transcript.language.toUpperCase()}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Mode: ${transcript.professional_mode}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Duration: ${this.formatDuration(transcript.duration)}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Words: ${transcript.word_count}`, margin, yPosition);
      yPosition += 6;
      if (options.includeConfidence) {
        doc.text(`Confidence: ${(transcript.confidence * 100).toFixed(1)}%`, margin, yPosition);
        yPosition += 6;
      }
      yPosition += 4;
    }

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Content
    doc.setFontSize(options.fontSize || 11);
    doc.setFont('helvetica', 'normal');

    const lines = this.formatContentForPDF(transcript, options);
    const lineHeight = 7;

    for (const line of lines) {
      // Check if we need a new page
      if (yPosition + lineHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      // Handle speaker labels
      if (line.startsWith('[Speaker')) {
        doc.setFont('helvetica', 'bold');
        doc.text(line, margin, yPosition);
        doc.setFont('helvetica', 'normal');
      } else {
        const splitLines = doc.splitTextToSize(line, pageWidth - 2 * margin);
        for (const splitLine of splitLines) {
          if (yPosition + lineHeight > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(splitLine, margin, yPosition);
          yPosition += lineHeight;
        }
      }
      yPosition += lineHeight;
    }

    // Watermark
    if (options.watermark) {
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(40);
        doc.setTextColor(200, 200, 200);
        doc.text(
          options.watermark,
          pageWidth / 2,
          pageHeight / 2,
          { align: 'center', angle: 45 }
        );
      }
    }

    // Save
    doc.save(`${this.sanitizeFilename(transcript.title)}.pdf`);
  }

  /**
   * Export to DOCX
   */
  private async exportToDOCX(transcript: Transcript, options: ExportOptions): Promise<void> {
    const paragraphs: Paragraph[] = [];

    // Title
    paragraphs.push(
      new Paragraph({
        text: transcript.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );

    // Metadata
    if (options.includeMetadata) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Date: ', bold: true }),
            new TextRun(new Date(transcript.created_at).toLocaleString()),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Language: ', bold: true }),
            new TextRun(transcript.language.toUpperCase()),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Mode: ', bold: true }),
            new TextRun(transcript.professional_mode),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Duration: ', bold: true }),
            new TextRun(this.formatDuration(transcript.duration)),
          ],
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Words: ', bold: true }),
            new TextRun(transcript.word_count.toString()),
          ],
          spacing: { after: 200 },
        })
      );

      if (options.includeConfidence) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Confidence: ', bold: true }),
              new TextRun(`${(transcript.confidence * 100).toFixed(1)}%`),
            ],
            spacing: { after: 200 },
          })
        );
      }
    }

    // Content
    const lines = this.formatContentForText(transcript, options);
    for (const line of lines) {
      if (line.startsWith('[Speaker')) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: line, bold: true })],
            spacing: { before: 200, after: 100 },
          })
        );
      } else {
        paragraphs.push(
          new Paragraph({
            text: line,
            spacing: { after: 100 },
          })
        );
      }
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    // Save
    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `${this.sanitizeFilename(transcript.title)}.docx`);
  }

  /**
   * Export to TXT
   */
  private async exportToTXT(transcript: Transcript, options: ExportOptions): Promise<void> {
    let content = '';

    // Title
    content += `${transcript.title}\n`;
    content += '='.repeat(transcript.title.length) + '\n\n';

    // Metadata
    if (options.includeMetadata) {
      content += `Date: ${new Date(transcript.created_at).toLocaleString()}\n`;
      content += `Language: ${transcript.language.toUpperCase()}\n`;
      content += `Mode: ${transcript.professional_mode}\n`;
      content += `Duration: ${this.formatDuration(transcript.duration)}\n`;
      content += `Words: ${transcript.word_count}\n`;
      if (options.includeConfidence) {
        content += `Confidence: ${(transcript.confidence * 100).toFixed(1)}%\n`;
      }
      content += '\n' + '-'.repeat(50) + '\n\n';
    }

    // Content
    const lines = this.formatContentForText(transcript, options);
    content += lines.join('\n');

    // Save
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${this.sanitizeFilename(transcript.title)}.txt`);
  }

  /**
   * Export to SRT (SubRip subtitle format)
   */
  private async exportToSRT(transcript: Transcript, options: ExportOptions): Promise<void> {
    let content = '';
    let index = 1;

    if (transcript.speakers && transcript.speakers.length > 0) {
      for (const speaker of transcript.speakers) {
        for (const segment of speaker.segments) {
          content += `${index}\n`;
          content += `${this.formatSRTTime(segment.start)} --> ${this.formatSRTTime(segment.end)}\n`;
          if (options.includeSpeakers && speaker.name) {
            content += `[${speaker.name}] `;
          }
          content += `${segment.text}\n\n`;
          index++;
        }
      }
    } else {
      // Fallback: split content into chunks
      const words = transcript.content.split(' ');
      const wordsPerSegment = 10;
      const segmentDuration = transcript.duration / Math.ceil(words.length / wordsPerSegment);

      for (let i = 0; i < words.length; i += wordsPerSegment) {
        const segmentWords = words.slice(i, i + wordsPerSegment);
        const start = (i / wordsPerSegment) * segmentDuration;
        const end = start + segmentDuration;

        content += `${index}\n`;
        content += `${this.formatSRTTime(start)} --> ${this.formatSRTTime(end)}\n`;
        content += `${segmentWords.join(' ')}\n\n`;
        index++;
      }
    }

    // Save
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${this.sanitizeFilename(transcript.title)}.srt`);
  }

  /**
   * Export to VTT (WebVTT subtitle format)
   */
  private async exportToVTT(transcript: Transcript, options: ExportOptions): Promise<void> {
    let content = 'WEBVTT\n\n';

    if (transcript.speakers && transcript.speakers.length > 0) {
      for (const speaker of transcript.speakers) {
        for (const segment of speaker.segments) {
          content += `${this.formatVTTTime(segment.start)} --> ${this.formatVTTTime(segment.end)}\n`;
          if (options.includeSpeakers && speaker.name) {
            content += `<v ${speaker.name}>`;
          }
          content += `${segment.text}\n\n`;
        }
      }
    } else {
      // Fallback: split content into chunks
      const words = transcript.content.split(' ');
      const wordsPerSegment = 10;
      const segmentDuration = transcript.duration / Math.ceil(words.length / wordsPerSegment);

      for (let i = 0; i < words.length; i += wordsPerSegment) {
        const segmentWords = words.slice(i, i + wordsPerSegment);
        const start = (i / wordsPerSegment) * segmentDuration;
        const end = start + segmentDuration;

        content += `${this.formatVTTTime(start)} --> ${this.formatVTTTime(end)}\n`;
        content += `${segmentWords.join(' ')}\n\n`;
      }
    }

    // Save
    const blob = new Blob([content], { type: 'text/vtt;charset=utf-8' });
    saveAs(blob, `${this.sanitizeFilename(transcript.title)}.vtt`);
  }

  /**
   * Export to JSON
   */
  private async exportToJSON(transcript: Transcript, options: ExportOptions): Promise<void> {
    const data = options.includeMetadata ? transcript : { content: transcript.content };
    const content = JSON.stringify(data, null, 2);

    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    saveAs(blob, `${this.sanitizeFilename(transcript.title)}.json`);
  }

  /**
   * Format content for PDF
   */
  private formatContentForPDF(transcript: Transcript, options: ExportOptions): string[] {
    return this.formatContentForText(transcript, options);
  }

  /**
   * Format content for text-based exports
   */
  private formatContentForText(transcript: Transcript, options: ExportOptions): string[] {
    const lines: string[] = [];

    if (transcript.speakers && transcript.speakers.length > 0 && options.includeSpeakers) {
      for (const speaker of transcript.speakers) {
        const speakerName = speaker.name || `Speaker ${speaker.id}`;
        lines.push(`[${speakerName}]`);
        
        for (const segment of speaker.segments) {
          let line = '';
          if (options.includeTimestamps) {
            line += `[${this.formatTimestamp(segment.start)}] `;
          }
          line += segment.text;
          lines.push(line);
        }
        lines.push(''); // Empty line between speakers
      }
    } else {
      lines.push(transcript.content);
    }

    return lines;
  }

  /**
   * Format duration (seconds to HH:MM:SS)
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format timestamp (seconds to MM:SS)
   */
  private formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format time for SRT (HH:MM:SS,mmm)
   */
  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  /**
   * Format time for VTT (HH:MM:SS.mmm)
   */
  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  /**
   * Sanitize filename
   */
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  }
}

// Export singleton instance
let exportInstance: ExportService | null = null;

export function getExportService(): ExportService {
  if (!exportInstance) {
    exportInstance = new ExportService();
  }
  return exportInstance;
}

export default getExportService;

