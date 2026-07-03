/**
 * Folder Management Page
 * Organize transcripts into folders and collections
 */

import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  FileText,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  Move,
  Star,
  StarOff,
  Clock,
  ChevronRight,
  Plus,
  X,
  Check,
} from 'lucide-react';

interface FolderItem {
  id: string;
  name: string;
  color: string;
  itemCount: number;
  isFavorite: boolean;
  createdAt: string;
  lastModified: string;
}

interface TranscriptItem {
  id: string;
  title: string;
  duration: string;
  date: string;
  folderId: string | null;
}

const mockFolders: FolderItem[] = [
  {
    id: '1',
    name: 'Patient Consultations',
    color: '#3b82f6',
    itemCount: 45,
    isFavorite: true,
    createdAt: '2026-01-01',
    lastModified: '2 hours ago',
  },
  {
    id: '2',
    name: 'Team Meetings',
    color: '#10b981',
    itemCount: 32,
    isFavorite: true,
    createdAt: '2026-01-05',
    lastModified: '1 day ago',
  },
  {
    id: '3',
    name: 'Interviews',
    color: '#f59e0b',
    itemCount: 18,
    isFavorite: false,
    createdAt: '2026-01-10',
    lastModified: '3 days ago',
  },
  {
    id: '4',
    name: 'Client Calls',
    color: '#8b5cf6',
    itemCount: 27,
    isFavorite: false,
    createdAt: '2026-01-08',
    lastModified: '1 week ago',
  },
  {
    id: '5',
    name: 'Training Sessions',
    color: '#ec4899',
    itemCount: 12,
    isFavorite: false,
    createdAt: '2026-01-12',
    lastModified: '2 weeks ago',
  },
  {
    id: '6',
    name: 'Archive',
    color: '#6b7280',
    itemCount: 89,
    isFavorite: false,
    createdAt: '2025-12-01',
    lastModified: '1 month ago',
  },
];

const mockTranscripts: TranscriptItem[] = [
  {
    id: 't1',
    title: 'Morning Standup - Jan 19',
    duration: '15:30',
    date: '2026-01-19',
    folderId: '2',
  },
  {
    id: 't2',
    title: 'Patient: John D. - Follow-up',
    duration: '22:45',
    date: '2026-01-19',
    folderId: '1',
  },
  {
    id: 't3',
    title: 'Interview - Software Engineer',
    duration: '45:20',
    date: '2026-01-18',
    folderId: '3',
  },
  {
    id: 't4',
    title: 'Weekly Review Meeting',
    duration: '55:10',
    date: '2026-01-18',
    folderId: '2',
  },
  {
    id: 't5',
    title: 'New Feature Demo',
    duration: '30:00',
    date: '2026-01-17',
    folderId: null,
  },
];

const colorOptions = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#ef4444',
  '#6b7280',
];

const FolderManagementPage: React.FC = () => {
  const [folders, setFolders] = useState<FolderItem[]>(mockFolders);
  const [transcripts] = useState<TranscriptItem[]>(mockTranscripts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolder, setNewFolder] = useState({ name: '', color: '#3b82f6' });
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteFolders = filteredFolders.filter((f) => f.isFavorite);
  const regularFolders = filteredFolders.filter((f) => !f.isFavorite);

  const createFolder = () => {
    if (!newFolder.name.trim()) return;
    const folder: FolderItem = {
      id: Date.now().toString(),
      name: newFolder.name,
      color: newFolder.color,
      itemCount: 0,
      isFavorite: false,
      createdAt: new Date().toISOString().split('T')[0],
      lastModified: 'Just now',
    };
    setFolders([folder, ...folders]);
    setNewFolder({ name: '', color: '#3b82f6' });
    setShowCreateModal(false);
  };

  const toggleFavorite = (id: string) => {
    setFolders(
      folders.map((f) =>
        f.id === id ? { ...f, isFavorite: !f.isFavorite } : f
      )
    );
  };

  const deleteFolder = (id: string) => {
    setFolders(folders.filter((f) => f.id !== id));
    setShowDropdown(null);
  };

  const folderTranscripts = selectedFolder
    ? transcripts.filter((t) => t.folderId === selectedFolder.id)
    : transcripts.filter((t) => !t.folderId);

  const stats = {
    total: folders.length,
    totalItems: folders.reduce((sum, f) => sum + f.itemCount, 0),
    favorites: folders.filter((f) => f.isFavorite).length,
  };

  const FolderCard: React.FC<{ folder: FolderItem }> = ({ folder }) => (
    <div
      onClick={() => setSelectedFolder(folder)}
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        border:
          selectedFolder?.id === folder.id
            ? `2px solid ${folder.color}`
            : '2px solid transparent',
        transition: 'all 0.2s',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '10px',
              background: `${folder.color}15`,
              borderRadius: '10px',
            }}
          >
            <Folder size={24} color={folder.color} />
          </div>
          <div>
            <h3
              style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}
            >
              {folder.name}
            </h3>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {folder.itemCount} items
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(folder.id);
            }}
            style={{
              padding: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {folder.isFavorite ? (
              <Star size={16} color="#f59e0b" fill="#f59e0b" />
            ) : (
              <StarOff size={16} color="#d1d5db" />
            )}
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(showDropdown === folder.id ? null : folder.id);
              }}
              style={{
                padding: '6px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <MoreVertical size={16} color="#6b7280" />
            </button>
            {showDropdown === folder.id && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 10,
                  minWidth: '140px',
                }}
              >
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    fontSize: '13px',
                    color: '#374151',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Edit3 size={14} /> Rename
                </button>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    fontSize: '13px',
                    color: '#374151',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Move size={14} /> Move
                </button>
                <button
                  onClick={() => deleteFolder(folder.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    fontSize: '13px',
                    color: '#dc2626',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: '#9ca3af',
        }}
      >
        <Clock size={12} /> Modified {folder.lastModified}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
                <Folder size={32} />
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Folders</h1>
              </div>
              <p style={{ fontSize: '15px', opacity: 0.9 }}>
                Organize your transcripts into collections
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: 'white',
                color: '#d97706',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <FolderPlus size={18} /> New Folder
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
            <div
              style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}
            >
              {stats.total}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Total Folders
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
            <div
              style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}
            >
              {stats.totalItems}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Total Items
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
            <div
              style={{ fontSize: '24px', fontWeight: '700', color: '#8b5cf6' }}
            >
              {stats.favorites}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Favorites</div>
          </div>
        </div>

        {/* Search */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search folders..."
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: '24px',
          }}
        >
          {/* Folders */}
          <div>
            {favoriteFolders.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Star size={14} color="#f59e0b" /> Favorites
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                  }}
                >
                  {favoriteFolders.map((folder) => (
                    <FolderCard key={folder.id} folder={folder} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '12px',
                }}
              >
                All Folders
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}
              >
                {regularFolders.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} />
                ))}
              </div>
            </div>
          </div>

          {/* Folder Contents */}
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
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {selectedFolder ? (
                <>
                  <div
                    style={{
                      padding: '8px',
                      background: `${selectedFolder.color}15`,
                      borderRadius: '8px',
                    }}
                  >
                    <Folder size={18} color={selectedFolder.color} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#1f2937',
                      }}
                    >
                      {selectedFolder.name}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {selectedFolder.itemCount} items
                    </span>
                  </div>
                </>
              ) : (
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1f2937',
                  }}
                >
                  Unfiled Items
                </h3>
              )}
            </div>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {folderTranscripts.length > 0 ? (
                folderTranscripts.map((transcript) => (
                  <div
                    key={transcript.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <FileText size={18} color="#6b7280" />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#1f2937',
                        }}
                      >
                        {transcript.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {transcript.date} • {transcript.duration}
                      </div>
                    </div>
                    <ChevronRight size={16} color="#d1d5db" />
                  </div>
                ))
              ) : (
                <div style={{ padding: '60px', textAlign: 'center' }}>
                  <FileText
                    size={40}
                    color="#d1d5db"
                    style={{ marginBottom: '12px' }}
                  />
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    No items in this folder
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateModal && (
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
                Create New Folder
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Folder Name
              </label>
              <input
                type="text"
                value={newFolder.name}
                onChange={(e) =>
                  setNewFolder({ ...newFolder, name: e.target.value })
                }
                placeholder="Enter folder name"
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
                  marginBottom: '8px',
                }}
              >
                Color
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewFolder({ ...newFolder, color })}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: color,
                      border:
                        newFolder.color === color
                          ? '3px solid #1f2937'
                          : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {newFolder.color === color && (
                      <Check size={16} color="white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowCreateModal(false)}
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
                onClick={createFolder}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderManagementPage;
