/**
 * Keyboard Shortcuts Page
 * View and customize keyboard shortcuts
 */

import React, { useState } from 'react';
import {
  Keyboard,
  Search,
  Edit3,
  RotateCcw,
  Save,
  CheckCircle,
  Command,
  Info,
} from 'lucide-react';

interface Shortcut {
  id: string;
  action: string;
  keys: string[];
  category: string;
  customizable: boolean;
}

const defaultShortcuts: Shortcut[] = [
  // Recording
  {
    id: 'r1',
    action: 'Start/Stop Recording',
    keys: ['Ctrl', 'Shift', 'R'],
    category: 'Recording',
    customizable: true,
  },
  {
    id: 'r2',
    action: 'Pause Recording',
    keys: ['Ctrl', 'Shift', 'P'],
    category: 'Recording',
    customizable: true,
  },
  {
    id: 'r3',
    action: 'New Recording',
    keys: ['Ctrl', 'N'],
    category: 'Recording',
    customizable: true,
  },

  // Playback
  {
    id: 'p1',
    action: 'Play/Pause',
    keys: ['Space'],
    category: 'Playback',
    customizable: true,
  },
  {
    id: 'p2',
    action: 'Skip Forward 5s',
    keys: ['→'],
    category: 'Playback',
    customizable: true,
  },
  {
    id: 'p3',
    action: 'Skip Back 5s',
    keys: ['←'],
    category: 'Playback',
    customizable: true,
  },
  {
    id: 'p4',
    action: 'Increase Speed',
    keys: ['Ctrl', '↑'],
    category: 'Playback',
    customizable: true,
  },
  {
    id: 'p5',
    action: 'Decrease Speed',
    keys: ['Ctrl', '↓'],
    category: 'Playback',
    customizable: true,
  },

  // Editing
  {
    id: 'e1',
    action: 'Save',
    keys: ['Ctrl', 'S'],
    category: 'Editing',
    customizable: false,
  },
  {
    id: 'e2',
    action: 'Undo',
    keys: ['Ctrl', 'Z'],
    category: 'Editing',
    customizable: false,
  },
  {
    id: 'e3',
    action: 'Redo',
    keys: ['Ctrl', 'Shift', 'Z'],
    category: 'Editing',
    customizable: false,
  },
  {
    id: 'e4',
    action: 'Find',
    keys: ['Ctrl', 'F'],
    category: 'Editing',
    customizable: false,
  },
  {
    id: 'e5',
    action: 'Find & Replace',
    keys: ['Ctrl', 'H'],
    category: 'Editing',
    customizable: true,
  },
  {
    id: 'e6',
    action: 'Select All',
    keys: ['Ctrl', 'A'],
    category: 'Editing',
    customizable: false,
  },

  // Navigation
  {
    id: 'n1',
    action: 'Go to Dashboard',
    keys: ['G', 'D'],
    category: 'Navigation',
    customizable: true,
  },
  {
    id: 'n2',
    action: 'Go to Recordings',
    keys: ['G', 'R'],
    category: 'Navigation',
    customizable: true,
  },
  {
    id: 'n3',
    action: 'Go to Search',
    keys: ['Ctrl', 'K'],
    category: 'Navigation',
    customizable: true,
  },
  {
    id: 'n4',
    action: 'Go to Settings',
    keys: ['G', 'S'],
    category: 'Navigation',
    customizable: true,
  },

  // AI Features
  {
    id: 'a1',
    action: 'Generate Summary',
    keys: ['Ctrl', 'Shift', 'S'],
    category: 'AI',
    customizable: true,
  },
  {
    id: 'a2',
    action: 'Extract Key Points',
    keys: ['Ctrl', 'Shift', 'K'],
    category: 'AI',
    customizable: true,
  },
  {
    id: 'a3',
    action: 'Extract Action Items',
    keys: ['Ctrl', 'Shift', 'A'],
    category: 'AI',
    customizable: true,
  },
];

const categories = [
  'All',
  'Recording',
  'Playback',
  'Editing',
  'Navigation',
  'AI',
];

const KeyboardShortcutsPage: React.FC = () => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(defaultShortcuts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const filteredShortcuts = shortcuts.filter((s) => {
    const matchesSearch = s.action
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetToDefaults = () => {
    setShortcuts(defaultShortcuts);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Recording: '#dc2626',
      Playback: '#3b82f6',
      Editing: '#10b981',
      Navigation: '#f59e0b',
      AI: '#8b5cf6',
    };
    return colors[category] || '#6b7280';
  };

  const KeyBadge: React.FC<{ keyName: string }> = ({ keyName }) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '28px',
        height: '28px',
        padding: '0 8px',
        background: '#1f2937',
        color: 'white',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: 'monospace',
        boxShadow: '0 2px 0 #0f172a',
      }}
    >
      {keyName === 'Ctrl' && (
        <Command size={12} style={{ marginRight: '2px' }} />
      )}
      {keyName}
    </span>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          color: 'white',
          padding: '32px 24px',
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
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                }}
              >
                <Keyboard size={32} />
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
                  Keyboard Shortcuts
                </h1>
              </div>
              <p style={{ fontSize: '15px', opacity: 0.9 }}>
                Master the keyboard to work faster
              </p>
            </div>
            <button
              onClick={resetToDefaults}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={16} /> Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        {/* Info Banner */}
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Info size={20} color="#3b82f6" />
          <div>
            <div
              style={{ fontSize: '14px', fontWeight: '500', color: '#1e40af' }}
            >
              Pro Tip
            </div>
            <div style={{ fontSize: '13px', color: '#3b82f6' }}>
              Use keyboard shortcuts to navigate and control the app without
              touching your mouse. Press <KeyBadge keyName="?" /> anywhere to
              show this reference.
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
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
              placeholder="Search shortcuts..."
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: selectedCategory === cat ? '#1f2937' : '#f3f4f6',
                  color: selectedCategory === cat ? 'white' : '#6b7280',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts List */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {categories
            .filter((c) => c !== 'All')
            .map((category) => {
              const categoryShortcuts = filteredShortcuts.filter(
                (s) => s.category === category
              );
              if (categoryShortcuts.length === 0) return null;

              return (
                <div key={category}>
                  <div
                    style={{
                      padding: '14px 20px',
                      background: '#f9fafb',
                      borderBottom: '1px solid #e5e7eb',
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
                          background: getCategoryColor(category),
                        }}
                      />
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#374151',
                        }}
                      >
                        {category}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        ({categoryShortcuts.length})
                      </span>
                    </div>
                  </div>
                  {categoryShortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#1f2937',
                          }}
                        >
                          {shortcut.action}
                        </div>
                        {!shortcut.customizable && (
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            System shortcut
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {shortcut.keys.map((key, idx) => (
                            <React.Fragment key={idx}>
                              <KeyBadge keyName={key} />
                              {idx < shortcut.keys.length - 1 && (
                                <span style={{ color: '#9ca3af' }}>+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        {shortcut.customizable && (
                          <button
                            onClick={() => setEditingId(shortcut.id)}
                            style={{
                              padding: '6px',
                              background: '#f3f4f6',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              marginLeft: '8px',
                            }}
                          >
                            <Edit3 size={14} color="#6b7280" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
        </div>

        {/* Save Status */}
        {saveStatus === 'saved' && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: '#10b981',
              color: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            }}
          >
            <CheckCircle size={18} /> Shortcuts reset to defaults
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyboardShortcutsPage;
