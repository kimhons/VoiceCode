/**
 * Live Transcription Page
 * Real-time speech-to-text transcription
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Copy,
  Download,
  Save,
  Clock,
  Volume2,
  Settings,
  RefreshCw,
  CheckCircle,
  Languages,
  Zap,
} from 'lucide-react';

const LiveTranscriptionPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<NodeJS.Timeout | null>(null);

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'zh-CN', name: 'Chinese (Mandarin)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
  ];

  const samplePhrases = [
    'The patient presents with mild symptoms of...',
    "During today's meeting, we discussed the quarterly projections...",
    'The key findings from the analysis indicate that...',
    'Based on the examination, I recommend...',
    'The next steps for the project include...',
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) clearInterval(audioRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);

    // Timer
    timerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);

    // Audio level simulation
    audioRef.current = setInterval(() => {
      setAudioLevel(Math.random() * 100);
    }, 100);

    // Simulated transcription
    const phraseIndex = Math.floor(Math.random() * samplePhrases.length);
    const phrase = samplePhrases[phraseIndex];
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      if (charIndex < phrase.length) {
        setInterimText(phrase.substring(0, charIndex + 1));
        charIndex++;
      } else {
        setTranscript((prev) => prev + (prev ? ' ' : '') + phrase);
        setInterimText('');
        charIndex = 0;
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setIsPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioRef.current) clearInterval(audioRef.current);
    setAudioLevel(0);
    if (interimText) {
      setTranscript((prev) => prev + (prev ? ' ' : '') + interimText);
      setInterimText('');
    }
  }, [interimText]);

  const togglePause = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyTranscript = () => {
    navigator.clipboard.writeText(transcript);
  };

  const saveTranscript = async () => {
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimText('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderBottom: '1px solid #334155',
          padding: '20px 24px',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '10px',
                  background: isRecording ? '#dc2626' : '#3b82f6',
                  borderRadius: '12px',
                }}
              >
                <Mic size={24} color="white" />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'white',
                  }}
                >
                  Live Transcription
                </h1>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Real-time speech to text
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                disabled={isRecording}
                style={{
                  padding: '10px 14px',
                  background: '#1e293b',
                  color: 'white',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <button
                style={{
                  padding: '10px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <Settings size={18} color="#94a3b8" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        {/* Recording Controls */}
        <div
          style={{
            background: '#1e293b',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          {/* Timer */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: '700',
              color: isRecording ? '#f87171' : '#64748b',
              fontFamily: 'monospace',
              marginBottom: '8px',
            }}
          >
            {formatTime(recordingTime)}
          </div>
          <div
            style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}
          >
            {isRecording
              ? isPaused
                ? 'Paused'
                : 'Recording...'
              : 'Ready to record'}
          </div>

          {/* Audio Level */}
          {isRecording && !isPaused && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '24px',
              }}
            >
              <Volume2 size={16} color="#64748b" />
              <div
                style={{
                  width: '200px',
                  height: '6px',
                  background: '#334155',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${audioLevel}%`,
                    height: '100%',
                    background:
                      audioLevel > 80
                        ? '#f87171'
                        : audioLevel > 50
                          ? '#fbbf24'
                          : '#22c55e',
                    transition: 'width 0.1s',
                  }}
                />
              </div>
            </div>
          )}

          {/* Controls */}
          <div
            style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}
          >
            {!isRecording ? (
              <button
                onClick={startRecording}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '16px 40px',
                  background:
                    'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)',
                }}
              >
                <Mic size={22} /> Start Recording
              </button>
            ) : (
              <>
                <button
                  onClick={togglePause}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '56px',
                    height: '56px',
                    background: '#334155',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                  }}
                >
                  {isPaused ? (
                    <Play size={24} color="white" />
                  ) : (
                    <Pause size={24} color="white" />
                  )}
                </button>
                <button
                  onClick={stopRecording}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '56px',
                    height: '56px',
                    background: '#dc2626',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                  }}
                >
                  <Square size={24} color="white" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div
          style={{
            background: '#1e293b',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>
              Transcript
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={copyTranscript}
                disabled={!transcript}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  opacity: transcript ? 1 : 0.5,
                }}
              >
                <Copy size={14} /> Copy
              </button>
              <button
                onClick={saveTranscript}
                disabled={!transcript}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: saveStatus === 'saved' ? '#16a34a' : '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  opacity: transcript ? 1 : 0.5,
                }}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <RefreshCw
                      size={14}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />{' '}
                    Saving
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <CheckCircle size={14} /> Saved
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save
                  </>
                )}
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: '#334155',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <Download size={14} /> Export
              </button>
            </div>
          </div>
          <div style={{ padding: '24px', minHeight: '300px' }}>
            {transcript || interimText ? (
              <div
                style={{
                  fontSize: '16px',
                  lineHeight: '1.8',
                  color: '#e2e8f0',
                }}
              >
                {transcript}
                {interimText && (
                  <span style={{ color: '#64748b', fontStyle: 'italic' }}>
                    {' '}
                    {interimText}
                  </span>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Mic
                  size={48}
                  color="#334155"
                  style={{ marginBottom: '16px' }}
                />
                <p
                  style={{
                    fontSize: '16px',
                    color: '#64748b',
                    marginBottom: '8px',
                  }}
                >
                  Start recording to see transcription
                </p>
                <p style={{ fontSize: '13px', color: '#475569' }}>
                  Your speech will appear here in real-time
                </p>
              </div>
            )}
          </div>
          {transcript && (
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {transcript.split(' ').length} words
              </span>
              <button
                onClick={clearTranscript}
                style={{
                  fontSize: '12px',
                  color: '#f87171',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Clear transcript
              </button>
            </div>
          )}
        </div>

        {/* Features */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginTop: '24px',
          }}
        >
          <div
            style={{
              background: '#1e293b',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
              }}
            >
              <Zap size={18} color="#fbbf24" />
              <span
                style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}
              >
                Real-time
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              See words appear as you speak with minimal latency
            </p>
          </div>
          <div
            style={{
              background: '#1e293b',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
              }}
            >
              <Languages size={18} color="#22c55e" />
              <span
                style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}
              >
                Multi-language
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Support for 8+ languages with automatic detection
            </p>
          </div>
          <div
            style={{
              background: '#1e293b',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
              }}
            >
              <Clock size={18} color="#3b82f6" />
              <span
                style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}
              >
                Timestamps
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Automatic timestamps for easy navigation
            </p>
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

export default LiveTranscriptionPage;
