/**
 * Medical Dictation Page
 * Voice-to-text transcription optimized for clinical documentation
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Save,
  FileText,
  Clock,
  Volume2,
  Settings,
  Copy,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  User,
  Calendar,
} from 'lucide-react';

interface DictationSession {
  id: string;
  patientId?: string;
  patientName?: string;
  encounterDate: string;
  transcription: string;
  duration: number;
  status: 'recording' | 'paused' | 'completed' | 'saved';
  createdAt: string;
}

const MedicalDictationPage: React.FC = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [duration, setDuration] = useState(0);
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [encounterDate, setEncounterDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [recentSessions, setRecentSessions] = useState<DictationSession[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        // In a real implementation, send audio chunks to speech-to-text API
        console.log('Audio data available:', event.data.size);
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Start audio level monitoring
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(
            analyserRef.current.frequencyBinCount
          );
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
        }
        if (isRecording && !isPaused) {
          requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();

      // Simulate real-time transcription (replace with actual API call)
      simulateTranscription();
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [isRecording, isPaused]);

  // Simulate transcription (replace with actual speech-to-text API)
  const simulateTranscription = () => {
    const medicalPhrases = [
      'Patient presents with chief complaint of ',
      'Physical examination reveals ',
      'Vital signs are within normal limits. ',
      'Assessment: ',
      'Plan: ',
      'Will order labs including CBC and BMP. ',
      'Follow up in two weeks. ',
    ];

    let phraseIndex = 0;
    const interval = setInterval(() => {
      if (phraseIndex < medicalPhrases.length) {
        setTranscription((prev) => prev + medicalPhrases[phraseIndex]);
        phraseIndex++;
      } else {
        clearInterval(interval);
      }
    }, 3000);
  };

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  }, [isPaused]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  // Save session
  const saveSession = useCallback(async () => {
    setSaveStatus('saving');

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newSession: DictationSession = {
      id: Date.now().toString(),
      patientId,
      patientName,
      encounterDate,
      transcription,
      duration,
      status: 'saved',
      createdAt: new Date().toISOString(),
    };

    setRecentSessions((prev) => [newSession, ...prev].slice(0, 5));
    setSaveStatus('saved');

    // Reset after save
    setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  }, [patientId, patientName, encounterDate, transcription, duration]);

  // Clear current session
  const clearSession = useCallback(() => {
    setTranscription('');
    setDuration(0);
    setPatientId('');
    setPatientName('');
    setEncounterDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(transcription);
  }, [transcription]);

  // Download as text file
  const downloadTranscription = useCallback(() => {
    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dictation-${patientId || 'unknown'}-${encounterDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transcription, patientId, encounterDate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: 'white',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <Stethoscope size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
              Medical Dictation
            </h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Voice-to-text transcription optimized for clinical documentation
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: '24px',
          }}
        >
          {/* Main Recording Area */}
          <div>
            {/* Patient Info Card */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
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
                <User size={16} />
                Patient Information
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '16px',
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Patient ID
                  </label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    placeholder="Enter ID"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    Encounter Date
                  </label>
                  <input
                    type="date"
                    value={encounterDate}
                    onChange={(e) => setEncounterDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Recording Controls */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                >
                  {/* Main Record Button */}
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background:
                          'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                        transition: 'transform 0.2s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = 'scale(1.05)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = 'scale(1)')
                      }
                    >
                      <Mic size={28} color="white" />
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {/* Pause/Resume */}
                      <button
                        onClick={isPaused ? resumeRecording : pauseRecording}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: isPaused ? '#059669' : '#f59e0b',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isPaused ? (
                          <Play size={20} color="white" />
                        ) : (
                          <Pause size={20} color="white" />
                        )}
                      </button>
                      {/* Stop */}
                      <button
                        onClick={stopRecording}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: '#dc2626',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Square size={20} color="white" />
                      </button>
                    </div>
                  )}

                  {/* Status & Timer */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      {isRecording && !isPaused && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#dc2626',
                            animation: 'pulse 1.5s infinite',
                          }}
                        />
                      )}
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                        }}
                      >
                        {isRecording
                          ? isPaused
                            ? 'Paused'
                            : 'Recording'
                          : 'Ready'}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#6b7280',
                      }}
                    >
                      <Clock size={14} />
                      <span
                        style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          fontFamily: 'monospace',
                        }}
                      >
                        {formatDuration(duration)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audio Level Indicator */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Volume2 size={16} color="#6b7280" />
                  <div
                    style={{
                      width: '100px',
                      height: '8px',
                      background: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${audioLevel * 100}%`,
                        height: '100%',
                        background:
                          audioLevel > 0.7
                            ? '#dc2626'
                            : audioLevel > 0.4
                              ? '#f59e0b'
                              : '#059669',
                        transition: 'width 0.1s',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Transcription Area */}
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                >
                  Live Transcription
                </label>
                <textarea
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  placeholder="Transcription will appear here as you speak..."
                  style={{
                    width: '100%',
                    minHeight: '250px',
                    padding: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={saveSession}
                  disabled={!transcription || saveStatus === 'saving'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: saveStatus === 'saved' ? '#059669' : '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: transcription ? 'pointer' : 'not-allowed',
                    opacity: transcription ? 1 : 0.5,
                  }}
                >
                  {saveStatus === 'saving' ? (
                    <>Saving...</>
                  ) : saveStatus === 'saved' ? (
                    <>
                      <CheckCircle size={16} /> Saved
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save Session
                    </>
                  )}
                </button>
                <button
                  onClick={copyToClipboard}
                  disabled={!transcription}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: transcription ? 'pointer' : 'not-allowed',
                    opacity: transcription ? 1 : 0.5,
                  }}
                >
                  <Copy size={16} /> Copy
                </button>
                <button
                  onClick={downloadTranscription}
                  disabled={!transcription}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: transcription ? 'pointer' : 'not-allowed',
                    opacity: transcription ? 1 : 0.5,
                  }}
                >
                  <Download size={16} /> Download
                </button>
                <button
                  onClick={clearSession}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'white',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                >
                  <Trash2 size={16} /> Clear
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Quick Templates */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FileText size={16} />
                Quick Templates
              </h3>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {[
                  'SOAP Note',
                  'Progress Note',
                  'H&P',
                  'Discharge Summary',
                  'Consult Note',
                ].map((template) => (
                  <button
                    key={template}
                    onClick={() =>
                      setTranscription((prev) => prev + `\n\n[${template}]\n`)
                    }
                    style={{
                      padding: '10px 14px',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = '#e5e7eb')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = '#f3f4f6')
                    }
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Sessions */}
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
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Clock size={16} />
                Recent Sessions
              </h3>
              {recentSessions.length === 0 ? (
                <p
                  style={{
                    fontSize: '13px',
                    color: '#9ca3af',
                    textAlign: 'center',
                    padding: '20px 0',
                  }}
                >
                  No recent sessions
                </p>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      style={{
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setTranscription(session.transcription);
                        setPatientId(session.patientId || '');
                        setPatientName(session.patientName || '');
                        setEncounterDate(session.encounterDate);
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#374151',
                        }}
                      >
                        {session.patientName || 'Unknown Patient'}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '2px',
                        }}
                      >
                        {session.encounterDate} •{' '}
                        {formatDuration(session.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default MedicalDictationPage;
