/**
 * Vocabulary Page
 * Manage custom words, medical terms, and abbreviations
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  Upload,
  Download,
  Tag,
  CheckCircle,
  X,
  Filter,
} from 'lucide-react';

interface VocabularyWord {
  id: string;
  word: string;
  pronunciation?: string;
  category: string;
  definition?: string;
  usageCount: number;
  createdAt: string;
}

const mockVocabulary: VocabularyWord[] = [
  {
    id: '1',
    word: 'Acetaminophen',
    pronunciation: 'ah-SEE-tah-MIN-oh-fen',
    category: 'Medication',
    definition: 'Pain reliever and fever reducer',
    usageCount: 45,
    createdAt: '2026-01-15',
  },
  {
    id: '2',
    word: 'Hypertension',
    pronunciation: 'HY-per-TEN-shun',
    category: 'Medical Term',
    definition: 'High blood pressure',
    usageCount: 78,
    createdAt: '2026-01-10',
  },
  {
    id: '3',
    word: 'HIPAA',
    pronunciation: 'HIP-ah',
    category: 'Acronym',
    definition: 'Health Insurance Portability and Accountability Act',
    usageCount: 32,
    createdAt: '2026-01-12',
  },
  {
    id: '4',
    word: 'Myocardial Infarction',
    pronunciation: 'MY-oh-KAR-dee-al in-FARK-shun',
    category: 'Medical Term',
    definition: 'Heart attack',
    usageCount: 23,
    createdAt: '2026-01-08',
  },
  {
    id: '5',
    word: 'NPO',
    pronunciation: 'en-pee-oh',
    category: 'Acronym',
    definition: 'Nothing by mouth (nil per os)',
    usageCount: 56,
    createdAt: '2026-01-05',
  },
  {
    id: '6',
    word: 'Lisinopril',
    pronunciation: 'ly-SIN-oh-pril',
    category: 'Medication',
    definition: 'ACE inhibitor for blood pressure',
    usageCount: 34,
    createdAt: '2026-01-14',
  },
  {
    id: '7',
    word: 'Metformin',
    pronunciation: 'met-FOR-min',
    category: 'Medication',
    definition: 'Diabetes medication',
    usageCount: 67,
    createdAt: '2026-01-11',
  },
  {
    id: '8',
    word: 'Dyspnea',
    pronunciation: 'DISP-nee-ah',
    category: 'Medical Term',
    definition: 'Difficulty breathing',
    usageCount: 41,
    createdAt: '2026-01-09',
  },
];

const categories = [
  'All',
  'Medication',
  'Medical Term',
  'Acronym',
  'Custom',
  'Name',
];

const VocabularyPage: React.FC = () => {
  const [vocabulary, setVocabulary] =
    useState<VocabularyWord[]>(mockVocabulary);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [newWord, setNewWord] = useState({
    word: '',
    pronunciation: '',
    category: 'Custom',
    definition: '',
  });

  const filteredVocabulary = vocabulary.filter((w) => {
    const matchesSearch =
      w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.definition?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || w.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addWord = () => {
    if (!newWord.word.trim()) return;
    const word: VocabularyWord = {
      id: Date.now().toString(),
      word: newWord.word,
      pronunciation: newWord.pronunciation,
      category: newWord.category,
      definition: newWord.definition,
      usageCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setVocabulary([word, ...vocabulary]);
    setNewWord({
      word: '',
      pronunciation: '',
      category: 'Custom',
      definition: '',
    });
    setShowAddModal(false);
  };

  const deleteWord = (id: string) => {
    setVocabulary(vocabulary.filter((w) => w.id !== id));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Medication: '#3b82f6',
      'Medical Term': '#10b981',
      Acronym: '#f59e0b',
      Custom: '#8b5cf6',
      Name: '#ec4899',
    };
    return colors[category] || '#6b7280';
  };

  const stats = {
    total: vocabulary.length,
    medical: vocabulary.filter((w) => w.category === 'Medical Term').length,
    medications: vocabulary.filter((w) => w.category === 'Medication').length,
    custom: vocabulary.filter((w) => w.category === 'Custom').length,
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
                <BookOpen size={32} />
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
                  Custom Vocabulary
                </h1>
              </div>
              <p style={{ fontSize: '15px', opacity: 0.9 }}>
                Manage custom words, medical terms, and abbreviations for better
                recognition
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Upload size={16} /> Import
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Download size={16} /> Export
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'white',
                  color: '#7c3aed',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Add Word
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
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
              Total Words
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
              style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}
            >
              {stats.medical}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Medical Terms
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
              style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}
            >
              {stats.medications}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Medications
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
              {stats.custom}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Custom Words
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
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
              placeholder="Search vocabulary..."
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
                  background: selectedCategory === cat ? '#8b5cf6' : '#f3f4f6',
                  color: selectedCategory === cat ? 'white' : '#6b7280',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Vocabulary List */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
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
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                  }}
                >
                  Word
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                  }}
                >
                  Pronunciation
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                  }}
                >
                  Definition
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                  }}
                >
                  Usage
                </th>
                <th
                  style={{
                    padding: '14px 20px',
                    textAlign: 'right',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVocabulary.map((word) => (
                <tr key={word.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#1f2937',
                      }}
                    >
                      {word.word}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        fontStyle: 'italic',
                      }}
                    >
                      {word.pronunciation || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        background: `${getCategoryColor(word.category)}15`,
                        color: getCategoryColor(word.category),
                      }}
                    >
                      {word.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {word.definition || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      {word.usageCount}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        onClick={() => setEditingWord(word)}
                        style={{
                          padding: '6px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit3 size={14} color="#6b7280" />
                      </button>
                      <button
                        onClick={() => deleteWord(word.id)}
                        style={{
                          padding: '6px',
                          background: '#fef2f2',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} color="#dc2626" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVocabulary.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <BookOpen
                size={48}
                color="#d1d5db"
                style={{ marginBottom: '16px' }}
              />
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                No words found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Word Modal */}
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
              width: '480px',
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
                Add New Word
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
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
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Word *
                </label>
                <input
                  type="text"
                  value={newWord.word}
                  onChange={(e) =>
                    setNewWord({ ...newWord, word: e.target.value })
                  }
                  placeholder="Enter word or phrase"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Pronunciation
                </label>
                <input
                  type="text"
                  value={newWord.pronunciation}
                  onChange={(e) =>
                    setNewWord({ ...newWord, pronunciation: e.target.value })
                  }
                  placeholder="How it sounds (e.g., ah-SEE-tah-MIN-oh-fen)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Category
                </label>
                <select
                  value={newWord.category}
                  onChange={(e) =>
                    setNewWord({ ...newWord, category: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                >
                  {categories
                    .filter((c) => c !== 'All')
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Definition
                </label>
                <textarea
                  value={newWord.definition}
                  onChange={(e) =>
                    setNewWord({ ...newWord, definition: e.target.value })
                  }
                  placeholder="Brief description or meaning"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'none',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
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
                onClick={addWord}
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
                Add Word
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyPage;
