/**
 * Audio Uploader Component
 * Phase 3.2: Audio File Upload & Processing
 * 
 * Drag-and-drop audio file uploader with batch processing
 */

import React, { useRef } from 'react';
import { useAudioUpload } from '../hooks/useAudioUpload';
import { AudioProcessingService } from '../services/audio-processing.service';

export interface AudioUploaderProps {
  language?: string;
  professionalMode?: string;
  enableDiarization?: boolean;
  maxFiles?: number;
  onComplete?: () => void;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  language = 'en',
  professionalMode = 'general',
  enableDiarization = false,
  maxFiles = 10,
  onComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    files,
    addFiles,
    removeFile,
    retryFile,
    clearAll,
    queueStatus,
    isProcessing,
    isDragging,
    error,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    supportedFormats,
  } = useAudioUpload({
    autoProcess: true,
    maxFiles,
    language,
    professionalMode,
    enableDiarization,
  });

  // Handle file input change
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await addFiles(e.target.files);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle browse button click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#6c757d';
      case 'uploading': return '#007bff';
      case 'processing': return '#ffc107';
      case 'transcribing': return '#17a2b8';
      case 'complete': return '#28a745';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending': return '⏳';
      case 'uploading': return '⬆️';
      case 'processing': return '⚙️';
      case 'transcribing': return '🎙️';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          border: `3px dashed ${isDragging ? '#007bff' : '#ddd'}`,
          borderRadius: '10px',
          padding: '40px',
          textAlign: 'center',
          backgroundColor: isDragging ? '#e7f3ff' : '#f8f9fa',
          cursor: 'pointer',
          transition: 'all 0.3s',
          marginBottom: '20px',
        }}
        onClick={handleBrowseClick}
      >
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>
          {isDragging ? '📥' : '🎵'}
        </div>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
          {isDragging ? 'Drop files here' : 'Drag & Drop Audio Files'}
        </h3>
        <p style={{ margin: '0 0 15px 0', color: '#666' }}>
          or click to browse
        </p>
        <p style={{ margin: 0, fontSize: '14px', color: '#999' }}>
          Supported formats: {supportedFormats.map(f => f.toUpperCase()).join(', ')}
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#999' }}>
          Max file size: 500MB • Max files: {maxFiles}
        </p>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={supportedFormats.map(f => `.${f}`).join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '5px',
          color: '#721c24',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Queue Status */}
      {files.length > 0 && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#e7f3ff',
          border: '1px solid #b3d9ff',
          borderRadius: '5px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 10px 0' }}>Queue Status</h4>
              <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                <span>📊 Total: {queueStatus.total}</span>
                <span>⏳ Pending: {queueStatus.pending}</span>
                <span>⚙️ Processing: {queueStatus.processing}</span>
                <span>✅ Complete: {queueStatus.complete}</span>
                <span>❌ Error: {queueStatus.error}</span>
              </div>
            </div>
            <button
              onClick={clearAll}
              disabled={isProcessing}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '15px' }}>Files ({files.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {files.map(file => (
              <div
                key={file.id}
                style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <span style={{ fontSize: '24px' }}>{getStatusIcon(file.status)}</span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px' }}>{file.name}</h4>
                        <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#666' }}>
                          {AudioProcessingService.formatFileSize(file.size)} • {file.format.toUpperCase()}
                          {file.duration && ` • ${AudioProcessingService.formatDuration(file.duration)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {file.status === 'error' && (
                      <button
                        onClick={() => retryFile(file.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#ffc107',
                          color: '#000',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Retry
                      </button>
                    )}
                    {file.status !== 'complete' && file.status !== 'error' && (
                      <button
                        onClick={() => removeFile(file.id)}
                        disabled={['uploading', 'processing', 'transcribing'].includes(file.status)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: ['uploading', 'processing', 'transcribing'].includes(file.status) ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {file.status !== 'complete' && file.status !== 'error' && (
                  <div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '5px',
                    }}>
                      <div style={{
                        width: `${file.progress}%`,
                        height: '100%',
                        backgroundColor: getStatusColor(file.status),
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      {file.status.charAt(0).toUpperCase() + file.status.slice(1)} - {file.progress}%
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {file.status === 'error' && file.error && (
                  <div style={{
                    padding: '10px',
                    marginTop: '10px',
                    backgroundColor: '#f8d7da',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#721c24',
                  }}>
                    <strong>Error:</strong> {file.error}
                  </div>
                )}

                {/* Complete Status */}
                {file.status === 'complete' && file.transcript && (
                  <div style={{
                    padding: '10px',
                    marginTop: '10px',
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#155724',
                  }}>
                    <strong>✅ Transcription Complete!</strong>
                    <p style={{ margin: '5px 0 0 0' }}>
                      {file.transcript.word_count} words • {(file.transcript.confidence * 100).toFixed(1)}% confidence
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#999',
          fontSize: '14px',
        }}>
          <p>No files uploaded yet. Drag and drop or click to browse.</p>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;

