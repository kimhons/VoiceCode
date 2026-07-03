/**
 * Recording Library Page
 * Browse, search, and manage all recordings
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  Play,
  Pause,
  MoreVertical,
  Download,
  Trash2,
  Share2,
  Clock,
  Calendar,
  Mic,
  FileText,
  FolderOpen,
  Star,
  StarOff,
  Tag,
  ChevronDown,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';

interface Recording {
  id: string;
  title: string;
  duration: number;
  date: string;
  size: number;
  transcriptionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  isFavorite: boolean;
  tags: string[];
  folder?: string;
  speakerCount: number;
}

const mockRecordings: Recording[] = [
  {
    id: '1',
    title: 'Team Meeting - Project Review',
    duration: 3542,
    date: '2026-01-19T10:30:00',
    size: 45000000,
    transcriptionStatus: 'completed',
    isFavorite: true,
    tags: ['meeting', 'project'],
    folder: 'Work',
    speakerCount: 4,
  },
  {
    id: '2',
    title: 'Patient Consultation - John Smith',
    duration: 1823,
    date: '2026-01-18T14:15:00',
    size: 23000000,
    transcriptionStatus: 'completed',
    isFavorite: false,
    tags: ['medical', 'consultation'],
    folder: 'Medical',
    speakerCount: 2,
  },
  {
    id: '3',
    title: 'Lecture Notes - Advanced Programming',
    duration: 5400,
    date: '2026-01-17T09:00:00',
    size: 68000000,
    transcriptionStatus: 'completed',
    isFavorite: true,
    tags: ['education', 'programming'],
    folder: 'Education',
    speakerCount: 1,
  },
  {
    id: '4',
    title: 'Client Call - ABC Corp',
    duration: 2156,
    date: '2026-01-16T16:45:00',
    size: 27000000,
    transcriptionStatus: 'processing',
    isFavorite: false,
    tags: ['client', 'sales'],
    folder: 'Work',
    speakerCount: 3,
  },
  {
    id: '5',
    title: 'Interview - Senior Developer',
    duration: 4200,
    date: '2026-01-15T11:00:00',
    size: 52000000,
    transcriptionStatus: 'completed',
    isFavorite: false,
    tags: ['interview', 'hiring'],
    folder: 'HR',
    speakerCount: 2,
  },
  {
    id: '6',
    title: 'Quick Voice Note',
    duration: 125,
    date: '2026-01-15T08:30:00',
    size: 1500000,
    transcriptionStatus: 'completed',
    isFavorite: false,
    tags: ['note'],
    speakerCount: 1,
  },
  {
    id: '7',
    title: 'Brainstorming Session',
    duration: 2890,
    date: '2026-01-14T15:00:00',
    size: 36000000,
    transcriptionStatus: 'completed',
    isFavorite: true,
    tags: ['meeting', 'ideas'],
    folder: 'Work',
    speakerCount: 5,
  },
  {
    id: '8',
    title: 'Training Webinar',
    duration: 7200,
    date: '2026-01-13T13:00:00',
    size: 90000000,
    transcriptionStatus: 'pending',
    isFavorite: false,
    tags: ['training', 'webinar'],
    folder: 'Education',
    speakerCount: 2,
  },
];

const RecordingLibraryPage: React.FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'duration'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedRecordings, setSelectedRecordings] = useState<Set<string>>(
    new Set()
  );

  // Simulate async data fetching
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setRecordings(mockRecordings);
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const folders = [
    ...new Set(recordings.filter((r) => r.folder).map((r) => r.folder!)),
  ];
  const allTags = [...new Set(recordings.flatMap((r) => r.tags))];

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number): string => {
    if (bytes >= 1000000000) return `${(bytes / 1000000000).toFixed(1)} GB`;
    if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
    return `${(bytes / 1000).toFixed(1)} KB`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredRecordings = recordings
    .filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFolder = !selectedFolder || r.folder === selectedFolder;
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((t) => r.tags.includes(t));
      return matchesSearch && matchesFolder && matchesTags;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date')
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortBy === 'title') comparison = a.title.localeCompare(b.title);
      else if (sortBy === 'duration') comparison = a.duration - b.duration;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleFavorite = (id: string) => {
    setRecordings(
      recordings.map((r) =>
        r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
      )
    );
  };

  const togglePlay = (id: string) => {
    setPlayingId(playingId === id ? null : id);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedRecordings);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedRecordings(newSelected);
  };

  const getStatusColor = (status: Recording['transcriptionStatus']) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'processing':
        return '#f59e0b';
      case 'pending':
        return '#6b7280';
      case 'failed':
        return '#ef4444';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
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
            <Mic size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
              Recording Library
            </h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            {recordings.length} recordings •{' '}
            {formatSize(recordings.reduce((sum, r) => sum + r.size, 0))} total
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '240px 1fr',
            gap: '24px',
          }}
        >
          {/* Sidebar */}
          <div>
            {/* Folders */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                }}
              >
                Folders
              </h3>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <button
                  onClick={() => setSelectedFolder(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: !selectedFolder ? '#eff6ff' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: !selectedFolder ? '600' : '400',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#374151',
                  }}
                >
                  <FolderOpen size={16} color="#3b82f6" /> All Recordings
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      color: '#9ca3af',
                    }}
                  >
                    {recordings.length}
                  </span>
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      background:
                        selectedFolder === folder ? '#eff6ff' : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: selectedFolder === folder ? '600' : '400',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: '#374151',
                    }}
                  >
                    <FolderOpen size={16} /> {folder}
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '11px',
                        color: '#9ca3af',
                      }}
                    >
                      {recordings.filter((r) => r.folder === folder).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                }}
              >
                Tags
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : [...prev, tag]
                      )
                    }
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '500',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: selectedTags.includes(tag)
                        ? '#3b82f6'
                        : '#f3f4f6',
                      color: selectedTags.includes(tag) ? 'white' : '#6b7280',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div>
            {/* Toolbar */}
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
                  placeholder="Search recordings..."
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 40px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px',
                  background: '#f3f4f6',
                  borderRadius: '8px',
                }}
              >
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '6px',
                    background: viewMode === 'list' ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <List
                    size={18}
                    color={viewMode === 'list' ? '#3b82f6' : '#6b7280'}
                  />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '6px',
                    background: viewMode === 'grid' ? 'white' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Grid
                    size={18}
                    color={viewMode === 'grid' ? '#3b82f6' : '#6b7280'}
                  />
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: 'white',
                }}
              >
                <option value="date">Date</option>
                <option value="title">Title</option>
                <option value="duration">Duration</option>
              </select>

              <button
                onClick={() =>
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                }
                style={{
                  padding: '10px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {sortOrder === 'asc' ? (
                  <SortAsc size={18} />
                ) : (
                  <SortDesc size={18} />
                )}
              </button>
            </div>

            {/* Recording List */}
            {isLoading ? (
              <LoadingSkeleton variant="list" count={6} />
            ) : filteredRecordings.length === 0 ? (
              <div
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <EmptyState
                  icon={Mic}
                  title="No recordings yet"
                  description="Start a new voice recording to see it appear here. Your recordings will be transcribed automatically."
                  actionLabel="Start Recording"
                  onAction={() => {
                    // Navigate to recording page or trigger recording
                  }}
                />
              </div>
            ) : (
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              {viewMode === 'list' ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr
                      style={{
                        background: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                        }}
                      >
                        Title
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                        }}
                      >
                        Duration
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'right',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6b7280',
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecordings.map((recording) => (
                      <tr
                        key={recording.id}
                        style={{ borderBottom: '1px solid #f3f4f6' }}
                      >
                        <td style={{ padding: '16px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            <button
                              onClick={() => togglePlay(recording.id)}
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                border: 'none',
                                cursor: 'pointer',
                                background:
                                  playingId === recording.id
                                    ? '#3b82f6'
                                    : '#f3f4f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {playingId === recording.id ? (
                                <Pause size={16} color="white" />
                              ) : (
                                <Play size={16} color="#6b7280" />
                              )}
                            </button>
                            <div>
                              <div
                                style={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: '#1f2937',
                                }}
                              >
                                {recording.title}
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: '4px',
                                  marginTop: '4px',
                                }}
                              >
                                {recording.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    style={{
                                      padding: '2px 6px',
                                      background: '#f3f4f6',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      color: '#6b7280',
                                    }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            fontSize: '13px',
                            color: '#6b7280',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Clock size={14} />{' '}
                            {formatDuration(recording.duration)}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            fontSize: '13px',
                            color: '#6b7280',
                          }}
                        >
                          {formatDate(recording.date)}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '500',
                              background: `${getStatusColor(recording.transcriptionStatus)}20`,
                              color: getStatusColor(
                                recording.transcriptionStatus
                              ),
                            }}
                          >
                            {recording.transcriptionStatus}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              gap: '4px',
                            }}
                          >
                            <button
                              onClick={() => toggleFavorite(recording.id)}
                              style={{
                                padding: '6px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              {recording.isFavorite ? (
                                <Star
                                  size={16}
                                  fill="#f59e0b"
                                  color="#f59e0b"
                                />
                              ) : (
                                <StarOff size={16} color="#d1d5db" />
                              )}
                            </button>
                            <button
                              style={{
                                padding: '6px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <Download size={16} color="#6b7280" />
                            </button>
                            <button
                              style={{
                                padding: '6px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <Share2 size={16} color="#6b7280" />
                            </button>
                            <button
                              style={{
                                padding: '6px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={16} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    padding: '16px',
                  }}
                >
                  {filteredRecordings.map((recording) => (
                    <div
                      key={recording.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '16px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px',
                        }}
                      >
                        <button
                          onClick={() => togglePlay(recording.id)}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            background:
                              playingId === recording.id
                                ? '#3b82f6'
                                : '#f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {playingId === recording.id ? (
                            <Pause size={20} color="white" />
                          ) : (
                            <Play size={20} color="#6b7280" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleFavorite(recording.id)}
                          style={{
                            padding: '4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {recording.isFavorite ? (
                            <Star size={18} fill="#f59e0b" color="#f59e0b" />
                          ) : (
                            <StarOff size={18} color="#d1d5db" />
                          )}
                        </button>
                      </div>
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#1f2937',
                          marginBottom: '8px',
                        }}
                      >
                        {recording.title}
                      </h4>
                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          fontSize: '12px',
                          color: '#6b7280',
                          marginBottom: '12px',
                        }}
                      >
                        <span>{formatDuration(recording.duration)}</span>
                        <span>•</span>
                        <span>{formatDate(recording.date)}</span>
                      </div>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '500',
                          background: `${getStatusColor(recording.transcriptionStatus)}20`,
                          color: getStatusColor(recording.transcriptionStatus),
                        }}
                      >
                        {recording.transcriptionStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingLibraryPage;
