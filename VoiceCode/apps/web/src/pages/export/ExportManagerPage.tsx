/**
 * Export Manager Page
 * Manage exports, formats, and batch operations
 */

import React, { useState } from 'react';
import {
  Download,
  FileText,
  File,
  FileAudio,
  Table,
  Code,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Folder,
  Filter,
  Search,
} from 'lucide-react';

interface ExportJob {
  id: string;
  fileName: string;
  format: string;
  status: 'completed' | 'processing' | 'failed' | 'queued';
  size?: string;
  createdAt: string;
  downloadUrl?: string;
}

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  icon: React.ElementType;
  description: string;
  options?: string[];
}

const exportFormats: ExportFormat[] = [
  {
    id: 'txt',
    name: 'Plain Text',
    extension: '.txt',
    icon: FileText,
    description: 'Simple text format, universal compatibility',
  },
  {
    id: 'docx',
    name: 'Word Document',
    extension: '.docx',
    icon: File,
    description: 'Microsoft Word format with formatting',
  },
  {
    id: 'pdf',
    name: 'PDF Document',
    extension: '.pdf',
    icon: File,
    description: 'Portable document format, print-ready',
  },
  {
    id: 'srt',
    name: 'SRT Subtitles',
    extension: '.srt',
    icon: FileAudio,
    description: 'Subtitle format with timestamps',
  },
  {
    id: 'vtt',
    name: 'WebVTT',
    extension: '.vtt',
    icon: FileAudio,
    description: 'Web video text tracks format',
  },
  {
    id: 'csv',
    name: 'CSV Spreadsheet',
    extension: '.csv',
    icon: Table,
    description: 'Comma-separated values for analysis',
  },
  {
    id: 'json',
    name: 'JSON Data',
    extension: '.json',
    icon: Code,
    description: 'Structured data format for developers',
  },
  {
    id: 'xml',
    name: 'XML Data',
    extension: '.xml',
    icon: Code,
    description: 'Extensible markup language format',
  },
];

const mockExportJobs: ExportJob[] = [
  {
    id: '1',
    fileName: 'Team Meeting Transcript',
    format: 'PDF',
    status: 'completed',
    size: '245 KB',
    createdAt: '10 min ago',
    downloadUrl: '#',
  },
  {
    id: '2',
    fileName: 'Patient Consultation Notes',
    format: 'DOCX',
    status: 'completed',
    size: '128 KB',
    createdAt: '1 hour ago',
    downloadUrl: '#',
  },
  {
    id: '3',
    fileName: 'Interview Recording',
    format: 'SRT',
    status: 'processing',
    createdAt: '5 min ago',
  },
  {
    id: '4',
    fileName: 'Lecture Transcription',
    format: 'TXT',
    status: 'queued',
    createdAt: '2 min ago',
  },
  {
    id: '5',
    fileName: 'Conference Call Summary',
    format: 'PDF',
    status: 'failed',
    createdAt: '30 min ago',
  },
];

const ExportManagerPage: React.FC = () => {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>(mockExportJobs);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const [exportSettings, setExportSettings] = useState({
    includeTimestamps: true,
    includeSpeakerLabels: true,
    includeConfidence: false,
    paragraphBreaks: true,
    maxLineLength: 80,
  });

  const filteredJobs = exportJobs.filter((job) => {
    const matchesSearch = job.fileName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || job.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="#10b981" />;
      case 'processing':
        return (
          <RefreshCw
            size={16}
            color="#f59e0b"
            style={{ animation: 'spin 1s linear infinite' }}
          />
        );
      case 'queued':
        return <Clock size={16} color="#6b7280" />;
      case 'failed':
        return <AlertCircle size={16} color="#ef4444" />;
    }
  };

  const getStatusStyle = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return { bg: '#dcfce7', color: '#166534' };
      case 'processing':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'queued':
        return { bg: '#f3f4f6', color: '#4b5563' };
      case 'failed':
        return { bg: '#fef2f2', color: '#991b1b' };
    }
  };

  const retryExport = (id: string) => {
    setExportJobs((jobs) =>
      jobs.map((j) => (j.id === id ? { ...j, status: 'queued' as const } : j))
    );
  };

  const stats = {
    total: exportJobs.length,
    completed: exportJobs.filter((j) => j.status === 'completed').length,
    processing: exportJobs.filter(
      (j) => j.status === 'processing' || j.status === 'queued'
    ).length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
          color: 'white',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <Download size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
              Export Manager
            </h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Export transcriptions in multiple formats
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '10px',
                  background: '#e0f2fe',
                  borderRadius: '10px',
                }}
              >
                <Download size={20} color="#0891b2" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1f2937',
                  }}
                >
                  {stats.total}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Total Exports
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '10px',
                  background: '#dcfce7',
                  borderRadius: '10px',
                }}
              >
                <CheckCircle size={20} color="#16a34a" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#10b981',
                  }}
                >
                  {stats.completed}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Completed
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '10px',
                  background: '#fef3c7',
                  borderRadius: '10px',
                }}
              >
                <Clock size={20} color="#d97706" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#f59e0b',
                  }}
                >
                  {stats.processing}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  In Progress
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 350px',
            gap: '24px',
          }}
        >
          {/* Export History */}
          <div>
            {/* Filters */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1, position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search exports..."
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 38px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <select
                value={filterStatus || ''}
                onChange={(e) => setFilterStatus(e.target.value || null)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: 'white',
                }}
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="queued">Queued</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Export List */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1f2937',
                  }}
                >
                  Export History
                </h3>
              </div>
              {filteredJobs.map((job) => {
                const statusStyle = getStatusStyle(job.status);
                return (
                  <div
                    key={job.id}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px',
                        background: '#f3f4f6',
                        borderRadius: '8px',
                      }}
                    >
                      <File size={20} color="#6b7280" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#1f2937',
                          marginBottom: '4px',
                        }}
                      >
                        {job.fileName}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          fontSize: '12px',
                          color: '#6b7280',
                        }}
                      >
                        <span>{job.format}</span>
                        {job.size && <span>• {job.size}</span>}
                        <span>• {job.createdAt}</span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          textTransform: 'capitalize',
                        }}
                      >
                        {getStatusIcon(job.status)}
                        {job.status}
                      </span>
                      {job.status === 'completed' && (
                        <button
                          style={{
                            padding: '6px 12px',
                            background: '#0891b2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          Download
                        </button>
                      )}
                      {job.status === 'failed' && (
                        <button
                          onClick={() => retryExport(job.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Formats & Settings */}
          <div>
            {/* Formats */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '16px',
                }}
              >
                Export Formats
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                }}
              >
                {exportFormats.map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      style={{
                        padding: '12px',
                        background:
                          selectedFormat === format.id ? '#e0f2fe' : '#f9fafb',
                        border:
                          selectedFormat === format.id
                            ? '2px solid #0891b2'
                            : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                        }}
                      >
                        <Icon
                          size={16}
                          color={
                            selectedFormat === format.id ? '#0891b2' : '#6b7280'
                          }
                        />
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#1f2937',
                          }}
                        >
                          {format.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {format.extension}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Export Settings */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Settings size={16} /> Export Settings
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {[
                  { key: 'includeTimestamps', label: 'Include timestamps' },
                  {
                    key: 'includeSpeakerLabels',
                    label: 'Include speaker labels',
                  },
                  {
                    key: 'includeConfidence',
                    label: 'Include confidence scores',
                  },
                  { key: 'paragraphBreaks', label: 'Add paragraph breaks' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '13px',
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(exportSettings as any)[key]}
                      onChange={(e) =>
                        setExportSettings({
                          ...exportSettings,
                          [key]: e.target.checked,
                        })
                      }
                      style={{ width: '16px', height: '16px' }}
                    />
                    {label}
                  </label>
                ))}
              </div>

              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  marginTop: '20px',
                  background: '#0891b2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <Download size={18} /> Export Selected
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ExportManagerPage;
