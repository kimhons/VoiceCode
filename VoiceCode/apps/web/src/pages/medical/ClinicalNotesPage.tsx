/**
 * Clinical Notes Page
 * General clinical documentation with template support
 */

import React, { useState, useCallback } from 'react';
import {
  FileText,
  Save,
  Copy,
  Download,
  Trash2,
  CheckCircle,
  Mic,
  MicOff,
  Sparkles,
  User,
  Calendar,
  Clock,
  FolderOpen,
  Plus,
  Search,
  Tag,
} from 'lucide-react';

interface NoteTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
}

const defaultTemplates: NoteTemplate[] = [
  {
    id: '1',
    name: 'General Visit',
    category: 'Primary Care',
    content:
      'Chief Complaint:\n\nHistory:\n\nExamination:\n\nAssessment:\n\nPlan:',
  },
  {
    id: '2',
    name: 'Follow-up Visit',
    category: 'Primary Care',
    content:
      'Follow-up for:\n\nInterval History:\n\nCurrent Medications:\n\nAssessment:\n\nPlan:',
  },
  {
    id: '3',
    name: 'Procedure Note',
    category: 'Procedures',
    content:
      'Procedure:\n\nIndication:\n\nConsent:\n\nAnesthesia:\n\nFindings:\n\nComplications:\n\nPost-procedure Plan:',
  },
  {
    id: '4',
    name: 'Consultation',
    category: 'Specialty',
    content:
      'Reason for Consultation:\n\nHistory:\n\nReview of Records:\n\nExamination:\n\nAssessment:\n\nRecommendations:',
  },
  {
    id: '5',
    name: 'Telephone Encounter',
    category: 'Communication',
    content:
      'Patient Called Regarding:\n\nDetails:\n\nAdvice Given:\n\nFollow-up Plan:',
  },
  {
    id: '6',
    name: 'Nursing Note',
    category: 'Nursing',
    content:
      'Assessment:\n\nVital Signs:\n\nInterventions:\n\nPatient Response:\n\nPlan:',
  },
];

const ClinicalNotesPage: React.FC = () => {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [encounterDate, setEncounterDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const categories = [...new Set(defaultTemplates.map((t) => t.category))];

  const filteredTemplates = defaultTemplates.filter((template) => {
    const matchesSearch = template.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const applyTemplate = (template: NoteTemplate) => {
    setSelectedTemplate(template);
    setNoteTitle(template.name);
    setNoteContent(template.content);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // Simulate voice input
      setTimeout(() => {
        setNoteContent(
          (prev) => prev + '\n[Dictated content would appear here...]'
        );
        setIsRecording(false);
      }, 3000);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const saveNote = useCallback(async () => {
    setSaveStatus('saving');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, []);

  const copyNote = useCallback(() => {
    const fullNote = `${noteTitle}\nDate: ${encounterDate}\nPatient: ${patientName} (${patientId})\nTags: ${tags.join(', ')}\n\n${noteContent}`;
    navigator.clipboard.writeText(fullNote);
  }, [noteTitle, encounterDate, patientName, patientId, tags, noteContent]);

  const downloadNote = useCallback(() => {
    const fullNote = `${noteTitle}\nDate: ${encounterDate}\nPatient: ${patientName}\n\n${noteContent}`;
    const blob = new Blob([fullNote], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical-note-${patientId || 'draft'}-${encounterDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [noteTitle, encounterDate, patientName, patientId, noteContent]);

  const clearNote = () => {
    setNoteTitle('');
    setNoteContent('');
    setSelectedTemplate(null);
    setTags([]);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
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
            <FileText size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
              Clinical Notes
            </h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Create and manage clinical documentation with templates
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '300px 1fr',
            gap: '24px',
          }}
        >
          {/* Templates Sidebar */}
          <div>
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
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FolderOpen size={16} />
                Templates
              </h3>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 34px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Category Filter */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '16px',
                }}
              >
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '500',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: !selectedCategory ? '#0891b2' : '#f3f4f6',
                    color: !selectedCategory ? 'white' : '#6b7280',
                  }}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '500',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background:
                        selectedCategory === cat ? '#0891b2' : '#f3f4f6',
                      color: selectedCategory === cat ? 'white' : '#6b7280',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Template List */}
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      border:
                        selectedTemplate?.id === template.id
                          ? '2px solid #0891b2'
                          : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      background:
                        selectedTemplate?.id === template.id
                          ? '#f0fdfa'
                          : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#1f2937',
                      }}
                    >
                      {template.name}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        marginTop: '2px',
                      }}
                    >
                      {template.category}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Editor */}
          <div>
            {/* Patient Info */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '1', minWidth: '120px' }}>
                <label
                  style={{
                    fontSize: '11px',
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
                  placeholder="MRN"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div style={{ flex: '2', minWidth: '200px' }}>
                <label
                  style={{
                    fontSize: '11px',
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
                  placeholder="Full name"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div style={{ flex: '1', minWidth: '140px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Date
                </label>
                <input
                  type="date"
                  value={encounterDate}
                  onChange={(e) => setEncounterDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            {/* Note Editor */}
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              {/* Title */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Note Title
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Enter note title..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                  }}
                />
              </div>

              {/* Tags */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151',
                    display: 'block',
                    marginBottom: '6px',
                  }}
                >
                  Tags
                </label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'center',
                  }}
                >
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    >
                      <Tag size={12} />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#0369a1',
                          padding: '0',
                          marginLeft: '2px',
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add tag..."
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '12px',
                        width: '100px',
                      }}
                    />
                    <button
                      onClick={addTag}
                      style={{
                        padding: '4px 8px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recording Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                }}
              >
                <button
                  onClick={toggleRecording}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: isRecording ? '#dc2626' : '#f3f4f6',
                    color: isRecording ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  {isRecording ? 'Stop Recording' : 'Start Dictation'}
                </button>
                {isRecording && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#dc2626',
                      fontSize: '13px',
                    }}
                  >
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#dc2626',
                        animation: 'pulse 1.5s infinite',
                      }}
                    />
                    Recording...
                  </span>
                )}
              </div>

              {/* Content */}
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Start typing or use dictation..."
                style={{
                  width: '100%',
                  minHeight: '350px',
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  lineHeight: '1.7',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  onClick={saveNote}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: saveStatus === 'saved' ? '#059669' : '#0891b2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
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
                      <Save size={16} /> Save Note
                    </>
                  )}
                </button>
                <button
                  onClick={copyNote}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  <Copy size={16} /> Copy
                </button>
                <button
                  onClick={downloadNote}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={16} /> Download
                </button>
                <button
                  onClick={clearNote}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: 'none',
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

export default ClinicalNotesPage;
