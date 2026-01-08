/**
 * Report Export Service
 * Export monitoring data to CSV, JSON, and PDF formats
 */

export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeCharts?: boolean;
}

export interface ReportData {
  title: string;
  generatedAt: Date;
  timeRange: { start: Date; end: Date };
  summary: Record<string, any>;
  data: any[];
  charts?: Array<{
    title: string;
    type: 'bar' | 'line' | 'pie';
    data: any[];
  }>;
}

class ReportExportService {
  private static instance: ReportExportService;

  private constructor() {}

  public static getInstance(): ReportExportService {
    if (!ReportExportService.instance) {
      ReportExportService.instance = new ReportExportService();
    }
    return ReportExportService.instance;
  }

  /**
   * Export report in specified format
   */
  public async exportReport(data: ReportData, options: ExportOptions): Promise<void> {
    const filename = options.filename || this.generateFilename(data.title, options.format);

    switch (options.format) {
      case 'csv':
        await this.exportToCSV(data, filename);
        break;
      case 'json':
        await this.exportToJSON(data, filename);
        break;
      case 'pdf':
        await this.exportToPDF(data, filename, options.includeCharts);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Export to CSV
   */
  private async exportToCSV(data: ReportData, filename: string): Promise<void> {
    try {
      // Convert data to CSV format
      const csv = this.convertToCSV(data);

      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      this.downloadBlob(blob, filename);

      console.log('CSV export successful:', filename);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      throw error;
    }
  }

  /**
   * Export to JSON
   */
  private async exportToJSON(data: ReportData, filename: string): Promise<void> {
    try {
      // Convert to JSON with pretty formatting
      const json = JSON.stringify(data, null, 2);

      // Create blob and download
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      this.downloadBlob(blob, filename);

      console.log('JSON export successful:', filename);
    } catch (error) {
      console.error('Failed to export JSON:', error);
      throw error;
    }
  }

  /**
   * Export to PDF
   */
  private async exportToPDF(
    data: ReportData,
    filename: string,
    includeCharts?: boolean
  ): Promise<void> {
    try {
      // Generate HTML for PDF
      const html = this.generatePDFHtml(data, includeCharts);

      // In production, use a PDF generation library like jsPDF or pdfmake
      // For now, we'll use the browser's print functionality
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);

      console.log('PDF export initiated:', filename);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      throw error;
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: ReportData): string {
    const lines: string[] = [];

    // Add header
    lines.push(`"${data.title}"`);
    lines.push(`"Generated: ${data.generatedAt.toLocaleString()}"`);
    lines.push(
      `"Time Range: ${data.timeRange.start.toLocaleDateString()} - ${data.timeRange.end.toLocaleDateString()}"`
    );
    lines.push('');

    // Add summary
    lines.push('"Summary"');
    Object.entries(data.summary).forEach(([key, value]) => {
      lines.push(`"${key}","${value}"`);
    });
    lines.push('');

    // Add data table
    if (data.data.length > 0) {
      // Get headers from first row
      const headers = Object.keys(data.data[0]);
      lines.push(headers.map(h => `"${h}"`).join(','));

      // Add data rows
      data.data.forEach(row => {
        const values = headers.map(h => {
          const value = row[h];
          if (value === null || value === undefined) return '""';
          if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        lines.push(values.join(','));
      });
    }

    return lines.join('\n');
  }

  /**
   * Generate HTML for PDF
   */
  private generatePDFHtml(data: ReportData, includeCharts?: boolean): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${data.title}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #2563eb;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 10px;
            }
            h2 {
              color: #1e40af;
              margin-top: 30px;
              border-bottom: 2px solid #ddd;
              padding-bottom: 5px;
            }
            .metadata {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            .summary-item {
              background: white;
              border: 1px solid #e5e7eb;
              padding: 15px;
              border-radius: 8px;
            }
            .summary-item strong {
              display: block;
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .summary-item span {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background: #2563eb;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <h1>${data.title}</h1>
          
          <div class="metadata">
            <p><strong>Generated:</strong> ${data.generatedAt.toLocaleString()}</p>
            <p><strong>Time Range:</strong> ${data.timeRange.start.toLocaleDateString()} - ${data.timeRange.end.toLocaleDateString()}</p>
          </div>

          <h2>Summary</h2>
          <div class="summary">
            ${Object.entries(data.summary)
              .map(
                ([key, value]) => `
              <div class="summary-item">
                <strong>${key}</strong>
                <span>${value}</span>
              </div>
            `
              )
              .join('')}
          </div>

          ${
            data.data.length > 0
              ? `
            <h2>Detailed Data</h2>
            <table>
              <thead>
                <tr>
                  ${Object.keys(data.data[0])
                    .map(key => `<th>${key}</th>`)
                    .join('')}
                </tr>
              </thead>
              <tbody>
                ${data.data
                  .map(
                    row => `
                  <tr>
                    ${Object.values(row)
                      .map(value => `<td>${value}</td>`)
                      .join('')}
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          `
              : ''
          }

          <div class="footer">
            <p>VoiceFlow Pro - Monitoring Report</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate filename
   */
  private generateFilename(title: string, format: ExportFormat): string {
    const date = new Date().toISOString().split('T')[0];
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${sanitizedTitle}-${date}.${format}`;
  }

  /**
   * Export security report
   */
  public async exportSecurityReport(
    stats: any,
    incidents: any[],
    timeRange: { start: Date; end: Date },
    format: ExportFormat
  ): Promise<void> {
    const reportData: ReportData = {
      title: 'AI Security Report',
      generatedAt: new Date(),
      timeRange,
      summary: {
        'Total Operations': stats.totalOperations,
        'Success Rate': `${(stats.successRate * 100).toFixed(2)}%`,
        'Security Incidents': stats.securityIncidents,
        'Total Cost': `$${stats.totalCost.toFixed(2)}`,
        'Average Latency': `${stats.averageLatency.toFixed(0)}ms`,
      },
      data: incidents.map(incident => ({
        Timestamp: new Date(incident.timestamp).toLocaleString(),
        Operation: incident.operation,
        Severity: incident.severity,
        Type: incident.type,
      })),
    };

    await this.exportReport(reportData, { format });
  }

  /**
   * Export cost report
   */
  public async exportCostReport(
    dailyCosts: any[],
    summary: any,
    timeRange: { start: Date; end: Date },
    format: ExportFormat
  ): Promise<void> {
    const reportData: ReportData = {
      title: 'Cost Monitoring Report',
      generatedAt: new Date(),
      timeRange,
      summary: {
        'Total Spent': `$${summary.totalCost.toFixed(2)}`,
        'Average Daily Cost': `$${summary.avgDailyCost.toFixed(2)}`,
        'Projected Monthly': `$${summary.projectedMonthlyCost.toFixed(2)}`,
        'Budget': `$${summary.budget.toFixed(2)}`,
        'Budget Used': `${summary.budgetUsed.toFixed(1)}%`,
      },
      data: dailyCosts.map(day => ({
        Date: day.date,
        Cost: `$${day.cost.toFixed(4)}`,
        Operations: day.operations,
        Tokens: day.tokens.toLocaleString(),
        'Cost per Operation': `$${(day.cost / day.operations).toFixed(6)}`,
      })),
    };

    await this.exportReport(reportData, { format });
  }

  /**
   * Export performance report
   */
  public async exportPerformanceReport(
    metrics: any,
    timeRange: { start: Date; end: Date },
    format: ExportFormat
  ): Promise<void> {
    const reportData: ReportData = {
      title: 'Performance Monitoring Report',
      generatedAt: new Date(),
      timeRange,
      summary: {
        'Average Latency': `${metrics.averageLatency.toFixed(0)}ms`,
        'P50 Latency': `${metrics.p50Latency.toFixed(0)}ms`,
        'P95 Latency': `${metrics.p95Latency.toFixed(0)}ms`,
        'P99 Latency': `${metrics.p99Latency.toFixed(0)}ms`,
        'Throughput': `${metrics.throughput.toFixed(1)} ops/hour`,
        'Error Rate': `${(metrics.errorRate * 100).toFixed(2)}%`,
      },
      data: metrics.slowestOperations.map((op: any) => ({
        Operation: op.operation,
        'Average Latency': `${op.avgLatency.toFixed(0)}ms`,
        Count: op.count,
      })),
    };

    await this.exportReport(reportData, { format });
  }
}

// Export singleton
export const reportExportService = ReportExportService.getInstance();

