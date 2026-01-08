/**
 * Audio Uploader Demo Component
 * Phase 3.2: Audio File Upload & Processing
 * 
 * Demonstrates audio file upload and batch processing
 */

import React, { useState } from 'react';
import { AudioUploader } from './AudioUploader';

export const AudioUploaderDemo: React.FC = () => {
  const [language, setLanguage] = useState('en');
  const [professionalMode, setProfessionalMode] = useState('general');
  const [enableDiarization, setEnableDiarization] = useState(false);
  const [maxFiles, setMaxFiles] = useState(10);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎙️ Audio File Upload & Processing Demo</h1>

      {/* Info Section */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '5px',
      }}>
        <h3>✨ Features</h3>
        <ul style={{ marginBottom: 0 }}>
          <li><strong>Drag & Drop:</strong> Drag audio files directly into the upload area</li>
          <li><strong>Multiple Formats:</strong> MP3, WAV, M4A, OGG, FLAC, WEBM</li>
          <li><strong>Batch Processing:</strong> Upload and process multiple files at once</li>
          <li><strong>Progress Tracking:</strong> Real-time progress for each file</li>
          <li><strong>Auto Transcription:</strong> Automatic transcription after upload</li>
          <li><strong>Cloud Storage:</strong> Files stored in Supabase Storage</li>
          <li><strong>Error Handling:</strong> Retry failed uploads</li>
        </ul>
      </div>

      {/* Settings */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '5px',
      }}>
        <h3>⚙️ Settings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              Language:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
              <option value="ko">Korean</option>
              <option value="ar">Arabic</option>
              <option value="hi">Hindi</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              Professional Mode:
            </label>
            <select
              value={professionalMode}
              onChange={(e) => setProfessionalMode(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            >
              <option value="general">General</option>
              <option value="medical">Medical</option>
              <option value="developer">Developer</option>
              <option value="business">Business</option>
              <option value="legal">Legal</option>
              <option value="education">Education</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              Max Files:
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={maxFiles}
              onChange={(e) => setMaxFiles(parseInt(e.target.value) || 10)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginTop: '28px' }}>
              <input
                type="checkbox"
                checked={enableDiarization}
                onChange={(e) => setEnableDiarization(e.target.checked)}
              />
              <span>Enable Speaker Diarization</span>
            </label>
          </div>
        </div>
      </div>

      {/* Uploader */}
      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '5px',
        marginBottom: '20px',
      }}>
        <AudioUploader
          language={language}
          professionalMode={professionalMode}
          enableDiarization={enableDiarization}
          maxFiles={maxFiles}
        />
      </div>

      {/* Supported Formats */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '5px',
      }}>
        <h3>📄 Supported Audio Formats</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>MP3:</strong> Most common compressed format
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Good quality, small file size</span>
          </div>
          <div>
            <strong>WAV:</strong> Uncompressed audio format
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Best quality, large file size</span>
          </div>
          <div>
            <strong>M4A:</strong> Apple audio format
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Good quality, efficient compression</span>
          </div>
          <div>
            <strong>OGG:</strong> Open-source format
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Good quality, free format</span>
          </div>
          <div>
            <strong>FLAC:</strong> Lossless compression
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Perfect quality, medium file size</span>
          </div>
          <div>
            <strong>WEBM:</strong> Web-optimized format
            <br />
            <span style={{ fontSize: '12px', color: '#666' }}>Good for web, modern browsers</span>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '5px',
      }}>
        <h3>🔄 How It Works</h3>
        <ol style={{ marginBottom: 0 }}>
          <li><strong>Upload:</strong> Drag & drop or browse to select audio files</li>
          <li><strong>Validate:</strong> Files are validated for format and size (max 500MB)</li>
          <li><strong>Upload to Cloud:</strong> Files are uploaded to Supabase Storage</li>
          <li><strong>Convert:</strong> Audio is converted to 16kHz PCM format</li>
          <li><strong>Transcribe:</strong> Audio is sent to AIML API for transcription</li>
          <li><strong>Save:</strong> Transcript is saved to database with audio link</li>
          <li><strong>Complete:</strong> You can view and edit the transcript</li>
        </ol>
      </div>

      {/* Processing Pipeline */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #ddd',
        borderRadius: '5px',
      }}>
        <h3>⚙️ Processing Pipeline</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '14px' }}>
          <div style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', borderRadius: '5px' }}>
            ⏳ Pending
          </div>
          <span>→</span>
          <div style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', borderRadius: '5px' }}>
            ⬆️ Uploading
          </div>
          <span>→</span>
          <div style={{ padding: '10px 15px', backgroundColor: '#ffc107', color: '#000', borderRadius: '5px' }}>
            ⚙️ Processing
          </div>
          <span>→</span>
          <div style={{ padding: '10px 15px', backgroundColor: '#17a2b8', color: 'white', borderRadius: '5px' }}>
            🎙️ Transcribing
          </div>
          <span>→</span>
          <div style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', borderRadius: '5px' }}>
            ✅ Complete
          </div>
        </div>
      </div>

      {/* Tips */}
      <div style={{
        padding: '15px',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '5px',
      }}>
        <h3>💡 Tips</h3>
        <ul style={{ marginBottom: 0 }}>
          <li>For best results, use clear audio with minimal background noise</li>
          <li>WAV and FLAC formats provide the best transcription accuracy</li>
          <li>Enable speaker diarization for multi-speaker conversations</li>
          <li>Choose the appropriate professional mode for better vocabulary recognition</li>
          <li>Files are processed sequentially to ensure quality</li>
          <li>You can upload multiple files and they'll be queued automatically</li>
          <li>Failed uploads can be retried with the "Retry" button</li>
        </ul>
      </div>

      {/* Limitations */}
      <div style={{
        padding: '15px',
        marginTop: '20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '5px',
      }}>
        <h3>⚠️ Limitations</h3>
        <ul style={{ marginBottom: 0 }}>
          <li>Maximum file size: 500MB per file</li>
          <li>Maximum files: {maxFiles} files at once (configurable)</li>
          <li>Processing time depends on file duration (approximately 1:1 ratio)</li>
          <li>Very long files (&gt;2 hours) may be split into chunks</li>
          <li>Requires active internet connection for transcription</li>
        </ul>
      </div>
    </div>
  );
};

export default AudioUploaderDemo;

