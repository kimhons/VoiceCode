/**
 * AIML-Powered Transcription Component
 * Enhanced transcription with professional-specific models and AI features
 */

import React, { useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  FileText,
  CheckSquare,
  Volume2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAIMLAPI } from '@/hooks/useAIMLAPI';
import { ProfessionalMode, STTResult } from '@/services/aiml-api.service';
import { useProfessionalMode } from '@/contexts/ProfessionalModeContext';

interface AIMLTranscriptionProps {
  onTranscriptionComplete?: (result: STTResult) => void;
  onFormattedText?: (formatted: string) => void;
  className?: string;
}

export const AIMLTranscription: React.FC<AIMLTranscriptionProps> = ({
  onTranscriptionComplete,
  onFormattedText,
  className = '',
}) => {
  const { currentMode } = useProfessionalMode();
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  // Recording buffer is handled locally in start/stop; no need to keep in state
  const [transcriptionResult, setTranscriptionResult] = useState<STTResult | null>(null);
  const [formattedText, setFormattedText] = useState<string>('');
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<string>('');

  const {
    isTranscribing,
    isProcessing,
    progress,
    error,
    transcribeAudio,
    formatTranscript,
    extractActionItems,
    summarizeTranscript,
    textToSpeech,
  } = useAIMLAPI({
  professionalMode: currentMode as ProfessionalMode,
    onTranscriptionComplete: (result) => {
      setTranscriptionResult(result);
      onTranscriptionComplete?.(result);
    },
    onError: (err) => {
      console.error('AIML Error:', err);
    },
    onProgress: (prog, msg) => {
      console.log(`Progress: ${prog}% - ${msg}`);
    },
  });

  // Transcribe audio
  const handleTranscribe = useCallback(
    async (audioBlob: Blob) => {
      try {
        const result = await transcribeAudio(audioBlob, {
          diarize: true,
          punctuate: true,
          detectEntities: currentMode === 'medical',
          sentiment: currentMode === 'business',
          summarize: true,
        });

        setTranscriptionResult(result);
      } catch (err) {
        console.error('Transcription failed:', err);
      }
    },
    [transcribeAudio, currentMode]
  );

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        // Transcribe using AIML API
        await handleTranscribe(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [handleTranscribe]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      for (const track of mediaRecorder.stream.getTracks()) {
        track.stop();
      }
      setIsRecording(false);
    }
  }, [mediaRecorder, isRecording]);

  

  // Format transcript
  const handleFormat = useCallback(async () => {
    if (!transcriptionResult?.transcript) return;

    try {
      const formatted = await formatTranscript(transcriptionResult.transcript);
      setFormattedText(formatted);
      onFormattedText?.(formatted);
    } catch (err) {
      console.error('Formatting failed:', err);
    }
  }, [transcriptionResult, formatTranscript, onFormattedText]);

  // Extract action items
  const handleExtractActionItems = useCallback(async () => {
    if (!transcriptionResult?.transcript) return;

    try {
      const items = await extractActionItems(transcriptionResult.transcript);
      setActionItems(items);
    } catch (err) {
      console.error('Action item extraction failed:', err);
    }
  }, [transcriptionResult, extractActionItems]);

  // Summarize
  const handleSummarize = useCallback(async () => {
    if (!transcriptionResult?.transcript) return;

    try {
      const summaryText = await summarizeTranscript(transcriptionResult.transcript);
      setSummary(summaryText);
    } catch (err) {
      console.error('Summarization failed:', err);
    }
  }, [transcriptionResult, summarizeTranscript]);

  // Read aloud
  const handleReadAloud = useCallback(
    async (text: string) => {
      try {
        const audioBlob = await textToSpeech(text);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      } catch (err) {
        console.error('TTS failed:', err);
      }
    },
    [textToSpeech]
  );

  return (
    <div className={`aiml-transcription ${className}`}>
      {/* Recording Controls */}
      <div className="recording-controls">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing || isProcessing}
          className={`record-button ${isRecording ? 'recording' : ''}`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-6 h-6" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <Mic className="w-6 h-6" />
              <span>Start Recording</span>
            </>
          )}
        </button>

        {(isTranscribing || isProcessing) && (
          <div className="processing-indicator">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{progress}%</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <AlertCircle className="w-5 h-5" />
          <span>{error.message}</span>
        </div>
      )}

      {/* Transcription Result */}
      {transcriptionResult && (
        <div className="transcription-result">
          <div className="result-header">
            <h3>Transcription</h3>
            <span className="confidence">
              Confidence: {(transcriptionResult.confidence * 100).toFixed(1)}%
            </span>
          </div>

          <div className="transcript-text">
            {transcriptionResult.transcript}
          </div>

          {/* Speaker Diarization */}
          {transcriptionResult.speakers && transcriptionResult.speakers.length > 0 && (
            <div className="speakers">
              <h4>Speakers</h4>
              {transcriptionResult.speakers.map((speaker, idx) => (
                <div key={`${speaker.speaker}-${speaker.text?.slice(0,20) || idx}`} className="speaker-segment">
                  <strong>Speaker {speaker.speaker}:</strong> {speaker.text}
                </div>
              ))}
            </div>
          )}

          {/* Entities (Medical Mode) */}
          {transcriptionResult.entities && transcriptionResult.entities.length > 0 && (
            <div className="entities">
              <h4>Detected Entities</h4>
              {transcriptionResult.entities.map((entity) => (
                <span key={`${entity.text}-${entity.type}`} className="entity-tag">
                  {entity.text} ({entity.type})
                </span>
              ))}
            </div>
          )}

          {/* Sentiment (Business Mode) */}
          {transcriptionResult.sentiment && (
            <div className="sentiment">
              <h4>Sentiment</h4>
              <span>
                {transcriptionResult.sentiment.overall} (
                {(transcriptionResult.sentiment.score * 100).toFixed(1)}%)
              </span>
            </div>
          )}

          {/* AI Actions */}
          <div className="ai-actions">
            <button onClick={handleFormat} disabled={isProcessing}>
              <Sparkles className="w-4 h-4" />
              <span>Format</span>
            </button>

            <button onClick={handleExtractActionItems} disabled={isProcessing}>
              <CheckSquare className="w-4 h-4" />
              <span>Extract Action Items</span>
            </button>

            <button onClick={handleSummarize} disabled={isProcessing}>
              <FileText className="w-4 h-4" />
              <span>Summarize</span>
            </button>

            <button
              onClick={() => handleReadAloud(transcriptionResult.transcript)}
              disabled={isProcessing}
            >
              <Volume2 className="w-4 h-4" />
              <span>Read Aloud</span>
            </button>
          </div>
        </div>
      )}

      {/* Formatted Text */}
      {formattedText && (
        <div className="formatted-text">
          <h3>Formatted Output</h3>
          <div className="formatted-content">{formattedText}</div>
        </div>
      )}

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div className="action-items">
          <h3>Action Items</h3>
          <ul>
            {actionItems.map((item) => (
              <li key={`${item.task}-${item.owner || 'na'}-${item.deadline || 'na'}`}>
                <strong>{item.task}</strong>
                {item.owner && <span> - Owner: {item.owner}</span>}
                {item.deadline && <span> - Due: {item.deadline}</span>}
                {item.priority && (
                  <span className={`priority priority-${item.priority}`}>
                    {item.priority}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="summary">
          <h3>Summary</h3>
          <p>{summary}</p>
        </div>
      )}

  <style>{`
        .aiml-transcription {
          padding: 1.5rem;
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .recording-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .record-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .record-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .record-button.recording {
          background: #ef4444;
          animation: pulse 2s infinite;
        }

        .record-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .processing-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
        }

        .transcription-result {
          margin-top: 1.5rem;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .result-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .confidence {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .transcript-text {
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.375rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .ai-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .ai-actions button {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ai-actions button:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .ai-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .formatted-text,
        .action-items,
        .summary {
          margin-top: 1.5rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.375rem;
        }

        .formatted-text h3,
        .action-items h3,
        .summary h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #111827;
        }

        .action-items ul {
          list-style: none;
          padding: 0;
        }

        .action-items li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .action-items li:last-child {
          border-bottom: none;
        }

        .priority {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
          margin-left: 0.5rem;
        }

        .priority-high {
          background: #fee2e2;
          color: #991b1b;
        }

        .priority-medium {
          background: #fef3c7;
          color: #92400e;
        }

        .priority-low {
          background: #dbeafe;
          color: #1e40af;
        }

        .entity-tag {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .speaker-segment {
          padding: 0.5rem 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .speaker-segment:last-child {
          border-bottom: none;
        }
  `}</style>
    </div>
  );
};

export default AIMLTranscription;

