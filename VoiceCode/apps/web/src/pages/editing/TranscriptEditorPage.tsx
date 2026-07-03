/**
 * Transcript Editor Page
 * Advanced editing tools for transcriptions
 */

import React, { useState, useCallback } from 'react';
import {
  Edit3,
  Save,
  Undo,
  Redo,
  Search,
  Replace,
  Scissors,
  Copy,
  Trash2,
  Clock,
  User,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  CheckCircle,
  Type,
  AlignLeft,
  MessageSquare,
} from 'lucide-react';

interface TranscriptSegment {
  id: string;
  speaker: string;
  speakerColor: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
}

const mockTranscript: TranscriptSegment[] = [
  {
    id: '1',
    speaker: 'Dr. Smith',
    speakerColor: '#3b82f6',
    startTime: 0,
    endTime: 15,
    text: 'Good morning. How are you feeling today?',
    confidence: 0.98,
  },
  {
    id: '2',
    speaker: 'Patient',
    speakerColor: '#10b981',
    startTime: 16,
    endTime: 35,
    text: "I've been having some headaches for the past few days. They usually come in the afternoon and last for a couple of hours.",
    confidence: 0.95,
  },
  {
    id: '3',
    speaker: 'Dr. Smith',
    speakerColor: '#3b82f6',
    startTime: 36,
    endTime: 55,
    text: 'I see. Can you describe the type of pain? Is it throbbing, sharp, or more of a dull ache?',
    confidence: 0.97,
  },
  {
    id: '4',
    speaker: 'Patient',
    speakerColor: '#10b981',
    startTime: 56,
    endTime: 75,
    text: "It's more of a throbbing pain, usually on one side of my head. Sometimes I feel a bit nauseous too.",
    confidence: 0.94,
  },
  {
    id: '5',
    speaker: 'Dr. Smith',
    speakerColor: '#3b82f6',
    startTime: 76,
    endTime: 100,
    text: 'Those symptoms could suggest migraines. Have you noticed any triggers, like stress, certain foods, or changes in sleep patterns?',
    confidence: 0.96,
  },
  {
    id: '6',
    speaker: 'Patient',
    speakerColor: '#10b981',
    startTime: 101,
    endTime: 120,
    text: "Now that you mention it, I have been under a lot of stress at work lately, and I haven't been sleeping well.",
    confidence: 0.93,
  },
];

const TranscriptEditorPage: React.FC = () => {
  const [segments, setSegments] = useState<TranscriptSegment[]>(mockTranscript);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [editHistory, setEditHistory] = useState<TranscriptSegment[][]>([
    mockTranscript,
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateSegment = (id: string, newText: string) => {
    const newSegments = segments.map((s) =>
      s.id === id ? { ...s, text: newText } : s
    );
    setSegments(newSegments);
    // Add to history
    const newHistory = editHistory.slice(0, historyIndex + 1);
    newHistory.push(newSegments);
    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSegments(editHistory[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < editHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSegments(editHistory[historyIndex + 1]);
    }
  };

  const findAndReplace = () => {
    if (!searchQuery) return;
    const newSegments = segments.map((s) => ({
      ...s,
      text: s.text.replace(new RegExp(searchQuery, 'gi'), replaceText),
    }));
    setSegments(newSegments);
    const newHistory = editHistory.slice(0, historyIndex + 1);
    newHistory.push(newSegments);
    setEditHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const deleteSegment = (id: string) => {
    const newSegments = segments.filter((s) => s.id !== id);
    setSegments(newSegments);
  };

  const mergeWithPrevious = (id: string) => {
    const index = segments.findIndex((s) => s.id === id);
    if (index > 0) {
      const newSegments = [...segments];
      newSegments[index - 1] = {
        ...newSegments[index - 1],
        text: newSegments[index - 1].text + ' ' + newSegments[index].text,
        endTime: newSegments[index].endTime,
      };
      newSegments.splice(index, 1);
      setSegments(newSegments);
    }
  };

  const saveTranscript = useCallback(async () => {
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, []);

  const highlightSearch = (text: string): React.ReactNode => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={i} style={{ background: '#fef08a', padding: '0 2px' }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: 'white',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Edit3 size={28} />
              <h1 style={{ fontSize: '24px', fontWeight: '700' }}>
                Transcript Editor
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={undo}
                disabled={historyIndex === 0}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  opacity: historyIndex === 0 ? 0.5 : 1,
                }}
              >
                <Undo size={18} color="white" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex === editHistory.length - 1}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  opacity: historyIndex === editHistory.length - 1 ? 0.5 : 1,
                }}
              >
                <Redo size={18} color="white" />
              </button>
              <button
                onClick={() => setShowFindReplace(!showFindReplace)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Search size={16} /> Find & Replace
              </button>
              <button
                onClick={saveTranscript}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: saveStatus === 'saved' ? '#10b981' : 'white',
                  color: saveStatus === 'saved' ? 'white' : '#4f46e5',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {saveStatus === 'saving' ? (
                  'Saving...'
                ) : saveStatus === 'saved' ? (
                  <>
                    <CheckCircle size={16} /> Saved
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Find & Replace */}
        {showFindReplace && (
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1, display: 'flex', gap: '12px' }}>
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
                  placeholder="Find text..."
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 38px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <Replace
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
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Replace with..."
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 38px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
            <button
              onClick={findAndReplace}
              style={{
                padding: '10px 20px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Replace All
            </button>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 300px',
            gap: '24px',
          }}
        >
          {/* Transcript */}
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#1f2937',
                }}
              >
                Transcript
              </h3>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {segments.length} segments
              </span>
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {segments.map((segment, index) => (
                <div
                  key={segment.id}
                  onClick={() => setSelectedSegment(segment.id)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    background:
                      selectedSegment === segment.id ? '#f0f9ff' : 'white',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: segment.speakerColor,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: segment.speakerColor,
                        }}
                      >
                        {segment.speaker}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {formatTime(segment.startTime)} -{' '}
                        {formatTime(segment.endTime)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          mergeWithPrevious(segment.id);
                        }}
                        disabled={index === 0}
                        style={{
                          padding: '4px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          opacity: index === 0 ? 0.3 : 1,
                        }}
                        title="Merge with previous"
                      >
                        <AlignLeft size={14} color="#6b7280" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSegment(segment.id);
                        }}
                        style={{
                          padding: '4px',
                          background: '#fef2f2',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        title="Delete segment"
                      >
                        <Trash2 size={14} color="#dc2626" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={segment.text}
                    onChange={(e) => updateSegment(segment.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid transparent',
                      borderRadius: '6px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      resize: 'none',
                      background:
                        selectedSegment === segment.id
                          ? 'white'
                          : 'transparent',
                      minHeight: '60px',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: '4px',
                    }}
                  >
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                      Confidence: {Math.round(segment.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audio Player & Tools */}
          <div>
            {/* Audio Player */}
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
                Audio Playback
              </h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <button
                  style={{
                    padding: '8px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <SkipBack size={18} color="#6b7280" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    padding: '12px',
                    background: '#4f46e5',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                  }}
                >
                  {isPlaying ? (
                    <Pause size={20} color="white" />
                  ) : (
                    <Play size={20} color="white" />
                  )}
                </button>
                <button
                  style={{
                    padding: '8px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <SkipForward size={18} color="#6b7280" />
                </button>
                <span
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '13px',
                    color: '#374151',
                    fontFamily: 'monospace',
                  }}
                >
                  {formatTime(currentTime)} / 2:00
                </span>
                <button
                  style={{
                    padding: '8px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Volume2 size={18} color="#6b7280" />
                </button>
              </div>
              <div
                style={{
                  height: '4px',
                  background: '#e5e7eb',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: `${(currentTime / 120) * 100}%`,
                    height: '100%',
                    background: '#4f46e5',
                    borderRadius: '2px',
                  }}
                />
              </div>
            </div>

            {/* Speakers */}
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
                  marginBottom: '12px',
                }}
              >
                Speakers
              </h3>
              {[...new Set(segments.map((s) => s.speaker))].map((speaker) => {
                const segment = segments.find((s) => s.speaker === speaker);
                return (
                  <div
                    key={speaker}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 0',
                    }}
                  >
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: segment?.speakerColor,
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#374151' }}>
                      {speaker}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
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
                }}
              >
                Quick Actions
              </h3>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#374151',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Type size={16} /> Fix Capitalization
                </button>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#374151',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <MessageSquare size={16} /> Remove Filler Words
                </button>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#374151',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Copy size={16} /> Copy All Text
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptEditorPage;
