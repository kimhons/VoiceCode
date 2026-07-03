/**
 * Speaker Identification Page
 * Manage speaker profiles and voice recognition
 */

import React, { useState } from 'react';
import {
  Users,
  User,
  Mic,
  Plus,
  Edit3,
  Trash2,
  Volume2,
  CheckCircle,
  Clock,
  Settings,
  RefreshCw,
  Search,
} from 'lucide-react';

interface SpeakerProfile {
  id: string;
  name: string;
  role?: string;
  color: string;
  voiceSamples: number;
  recognitionAccuracy: number;
  lastActive: string;
  transcriptionCount: number;
}

const mockSpeakers: SpeakerProfile[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    role: 'Physician',
    color: '#3b82f6',
    voiceSamples: 12,
    recognitionAccuracy: 98,
    lastActive: '2 hours ago',
    transcriptionCount: 156,
  },
  {
    id: '2',
    name: 'John Smith',
    role: 'Patient',
    color: '#10b981',
    voiceSamples: 3,
    recognitionAccuracy: 85,
    lastActive: '1 day ago',
    transcriptionCount: 23,
  },
  {
    id: '3',
    name: 'Mike Chen',
    role: 'Nurse',
    color: '#f59e0b',
    voiceSamples: 8,
    recognitionAccuracy: 94,
    lastActive: '5 hours ago',
    transcriptionCount: 89,
  },
  {
    id: '4',
    name: 'Emily Davis',
    role: 'Admin',
    color: '#8b5cf6',
    voiceSamples: 5,
    recognitionAccuracy: 91,
    lastActive: '3 days ago',
    transcriptionCount: 45,
  },
  {
    id: '5',
    name: 'Unknown Speaker 1',
    color: '#6b7280',
    voiceSamples: 0,
    recognitionAccuracy: 0,
    lastActive: 'Never',
    transcriptionCount: 12,
  },
];

const SpeakerIdentificationPage: React.FC = () => {
  const [speakers, setSpeakers] = useState<SpeakerProfile[]>(mockSpeakers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<SpeakerProfile | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSpeaker, setNewSpeaker] = useState({ name: '', role: '' });

  const filteredSpeakers = speakers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addSpeaker = () => {
    if (!newSpeaker.name.trim()) return;
    const colors = [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
    ];
    const newProfile: SpeakerProfile = {
      id: Date.now().toString(),
      name: newSpeaker.name,
      role: newSpeaker.role,
      color: colors[speakers.length % colors.length],
      voiceSamples: 0,
      recognitionAccuracy: 0,
      lastActive: 'Never',
      transcriptionCount: 0,
    };
    setSpeakers([...speakers, newProfile]);
    setNewSpeaker({ name: '', role: '' });
    setShowAddModal(false);
  };

  const deleteSpeaker = (id: string) => {
    setSpeakers(speakers.filter((s) => s.id !== id));
    if (selectedSpeaker?.id === id) setSelectedSpeaker(null);
  };

  const trainVoice = async (id: string) => {
    setIsRecording(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setSpeakers(
      speakers.map((s) =>
        s.id === id
          ? {
              ...s,
              voiceSamples: s.voiceSamples + 1,
              recognitionAccuracy: Math.min(99, s.recognitionAccuracy + 3),
            }
          : s
      )
    );
    setIsRecording(false);
  };

  const stats = {
    total: speakers.length,
    trained: speakers.filter((s) => s.voiceSamples > 0).length,
    avgAccuracy:
      Math.round(
        speakers
          .filter((s) => s.recognitionAccuracy > 0)
          .reduce((sum, s) => sum + s.recognitionAccuracy, 0) /
          speakers.filter((s) => s.recognitionAccuracy > 0).length
      ) || 0,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          padding: '32px 24px',
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
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                }}
              >
                <Users size={32} />
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
                  Speaker Identification
                </h1>
              </div>
              <p style={{ fontSize: '15px', opacity: 0.9 }}>
                Train and manage speaker voice profiles for automatic
                recognition
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Plus size={18} /> Add Speaker
            </button>
          </div>
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
                  background: '#ede9fe',
                  borderRadius: '10px',
                }}
              >
                <Users size={20} color="#7c3aed" />
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
                  Total Speakers
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
                <Mic size={20} color="#16a34a" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#10b981',
                  }}
                >
                  {stats.trained}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Voice Trained
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
                <CheckCircle size={20} color="#d97706" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#f59e0b',
                  }}
                >
                  {stats.avgAccuracy}%
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  Avg. Accuracy
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: '24px',
          }}
        >
          {/* Speaker List */}
          <div>
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Search
                  size={18}
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
                  placeholder="Search speakers..."
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 42px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              {filteredSpeakers.map((speaker) => (
                <div
                  key={speaker.id}
                  onClick={() => setSelectedSpeaker(speaker)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    background:
                      selectedSpeaker?.id === speaker.id ? '#faf5ff' : 'white',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: `${speaker.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: speaker.color,
                      fontWeight: '600',
                      fontSize: '16px',
                    }}
                  >
                    {speaker.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#1f2937',
                      }}
                    >
                      {speaker.name}
                    </div>
                    {speaker.role && (
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {speaker.role}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {speaker.recognitionAccuracy > 0 ? (
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color:
                            speaker.recognitionAccuracy >= 90
                              ? '#10b981'
                              : speaker.recognitionAccuracy >= 70
                                ? '#f59e0b'
                                : '#ef4444',
                        }}
                      >
                        {speaker.recognitionAccuracy}%
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        Not trained
                      </span>
                    )}
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {speaker.voiceSamples} samples
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Speaker Details */}
          <div>
            {selectedSpeaker ? (
              <div
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: `${selectedSpeaker.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: selectedSpeaker.color,
                        fontWeight: '700',
                        fontSize: '20px',
                      }}
                    >
                      {selectedSpeaker.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h3
                        style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#1f2937',
                        }}
                      >
                        {selectedSpeaker.name}
                      </h3>
                      {selectedSpeaker.role && (
                        <p style={{ fontSize: '13px', color: '#6b7280' }}>
                          {selectedSpeaker.role}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSpeaker(selectedSpeaker.id)}
                    style={{
                      padding: '8px',
                      background: '#fef2f2',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={18} color="#dc2626" />
                  </button>
                </div>

                {/* Stats */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '4px',
                      }}
                    >
                      Recognition Accuracy
                    </div>
                    <div
                      style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#1f2937',
                      }}
                    >
                      {selectedSpeaker.recognitionAccuracy}%
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '4px',
                      }}
                    >
                      Voice Samples
                    </div>
                    <div
                      style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#1f2937',
                      }}
                    >
                      {selectedSpeaker.voiceSamples}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '4px',
                      }}
                    >
                      Transcriptions
                    </div>
                    <div
                      style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#1f2937',
                      }}
                    >
                      {selectedSpeaker.transcriptionCount}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '4px',
                      }}
                    >
                      Last Active
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#1f2937',
                      }}
                    >
                      {selectedSpeaker.lastActive}
                    </div>
                  </div>
                </div>

                {/* Voice Training */}
                <div
                  style={{
                    padding: '20px',
                    background: '#faf5ff',
                    borderRadius: '10px',
                    marginBottom: '16px',
                  }}
                >
                  <h4
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#7c3aed',
                      marginBottom: '12px',
                    }}
                  >
                    Voice Training
                  </h4>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      marginBottom: '16px',
                    }}
                  >
                    Record voice samples to improve recognition accuracy. More
                    samples = better accuracy.
                  </p>
                  <button
                    onClick={() => trainVoice(selectedSpeaker.id)}
                    disabled={isRecording}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '12px',
                      background: isRecording ? '#dc2626' : '#8b5cf6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {isRecording ? (
                      <>
                        <RefreshCw
                          size={18}
                          style={{ animation: 'spin 1s linear infinite' }}
                        />{' '}
                        Recording...
                      </>
                    ) : (
                      <>
                        <Mic size={18} /> Record Voice Sample
                      </>
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    <Edit3 size={16} /> Edit
                  </button>
                  <button
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    <Volume2 size={16} /> Test
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '60px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                }}
              >
                <User
                  size={48}
                  color="#d1d5db"
                  style={{ marginBottom: '16px' }}
                />
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#6b7280',
                    marginBottom: '8px',
                  }}
                >
                  Select a Speaker
                </h4>
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                  Click on a speaker to view details and train voice recognition
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Speaker Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '400px',
              maxWidth: '90%',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '20px',
              }}
            >
              Add New Speaker
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={newSpeaker.name}
                onChange={(e) =>
                  setNewSpeaker({ ...newSpeaker, name: e.target.value })
                }
                placeholder="Speaker name"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Role (optional)
              </label>
              <input
                type="text"
                value={newSpeaker.role}
                onChange={(e) =>
                  setNewSpeaker({ ...newSpeaker, role: e.target.value })
                }
                placeholder="e.g., Doctor, Patient, Interviewer"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={addSpeaker}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Add Speaker
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SpeakerIdentificationPage;
