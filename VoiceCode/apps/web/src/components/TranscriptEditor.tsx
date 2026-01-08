/**
 * Transcript Editor Component
 * Phase 3.1: Transcript Editor & Export
 * 
 * Rich text editor for editing transcripts with export functionality
 */

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { Transcript } from '../services/supabase.service';
import { getExportService, ExportFormat, ExportOptions } from '../services/export.service';

export interface TranscriptEditorProps {
  transcript: Transcript;
  onSave?: (content: string) => void;
  onClose?: () => void;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
}

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  transcript,
  onSave,
  onClose,
  autoSave = true,
  autoSaveInterval = 5000,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeTimestamps: true,
    includeSpeakers: true,
    includeConfidence: false,
    includeMetadata: true,
  });

  const exportService = getExportService();

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Underline,
    ],
    content: transcript.content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !editor || !onSave) return;

    const interval = setInterval(() => {
      const content = editor.getHTML();
      if (content !== transcript.content) {
        handleSave();
      }
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [autoSave, autoSaveInterval, editor, onSave]);

  // Handle save
  const handleSave = async () => {
    if (!editor || !onSave) return;

    setIsSaving(true);
    try {
      const content = editor.getText();
      await onSave(content);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save transcript');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const updatedTranscript = {
        ...transcript,
        content: editor?.getText() || transcript.content,
      };
      await exportService.exportTranscript(updatedTranscript, exportFormat, exportOptions);
      setShowExportOptions(false);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export transcript');
    }
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ 
        padding: '15px 20px', 
        borderBottom: '1px solid #ddd',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>{transcript.title}</h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>
            {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
            {isSaving && ' • Saving...'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => setShowExportOptions(!showExportOptions)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Export
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ 
        padding: '10px 20px', 
        borderBottom: '1px solid #ddd',
        backgroundColor: '#fff',
        display: 'flex',
        gap: '5px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          style={{
            padding: '6px 12px',
            backgroundColor: editor.isActive('bold') ? '#007bff' : '#e9ecef',
            color: editor.isActive('bold') ? 'white' : '#000',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          style={{
            padding: '6px 12px',
            backgroundColor: editor.isActive('italic') ? '#007bff' : '#e9ecef',
            color: editor.isActive('italic') ? 'white' : '#000',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontStyle: 'italic'
          }}
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          style={{
            padding: '6px 12px',
            backgroundColor: editor.isActive('underline') ? '#007bff' : '#e9ecef',
            color: editor.isActive('underline') ? 'white' : '#000',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            textDecoration: 'underline'
          }}
        >
          U
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          disabled={!editor.can().chain().focus().toggleHighlight().run()}
          style={{
            padding: '6px 12px',
            backgroundColor: editor.isActive('highlight') ? '#ffc107' : '#e9ecef',
            color: '#000',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Highlight
        </button>
        <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 5px' }} />
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          style={{
            padding: '6px 12px',
            backgroundColor: editor.isActive('heading', { level: 1 }) ? '#007bff' : '#e9ecef',
            color: editor.isActive('heading', { level: 1 }) ? 'white' : '#000',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={{
            padding: '6px 12px',
            backgroundColor: editor.isActive('heading', { level: 2 }) ? '#007bff' : '#e9ecef',
            color: editor.isActive('heading', { level: 2 }) ? 'white' : '#000',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={{
            padding: '6px 12px',
            backgroundColor: editor.isActive('bulletList') ? '#007bff' : '#e9ecef',
            color: editor.isActive('bulletList') ? 'white' : '#000',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          • List
        </button>
        <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0 5px' }} />
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          style={{
            padding: '6px 12px',
            backgroundColor: '#e9ecef',
            color: '#000',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ↶ Undo
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          style={{
            padding: '6px 12px',
            backgroundColor: '#e9ecef',
            color: '#000',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ↷ Redo
        </button>
      </div>

      {/* Export Options Panel */}
      {showExportOptions && (
        <div style={{ 
          padding: '15px 20px', 
          borderBottom: '1px solid #ddd',
          backgroundColor: '#f8f9fa'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Export Options</h3>
          
          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                Format:
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                style={{ padding: '6px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="pdf">PDF</option>
                <option value="docx">DOCX (Word)</option>
                <option value="txt">TXT (Plain Text)</option>
                <option value="srt">SRT (Subtitles)</option>
                <option value="vtt">VTT (WebVTT)</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={exportOptions.includeTimestamps}
                onChange={(e) => setExportOptions({ ...exportOptions, includeTimestamps: e.target.checked })}
              />
              Include Timestamps
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={exportOptions.includeSpeakers}
                onChange={(e) => setExportOptions({ ...exportOptions, includeSpeakers: e.target.checked })}
              />
              Include Speakers
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={exportOptions.includeConfidence}
                onChange={(e) => setExportOptions({ ...exportOptions, includeConfidence: e.target.checked })}
              />
              Include Confidence
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={exportOptions.includeMetadata}
                onChange={(e) => setExportOptions({ ...exportOptions, includeMetadata: e.target.checked })}
              />
              Include Metadata
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExport}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Export {exportFormat.toUpperCase()}
            </button>
            <button
              onClick={() => setShowExportOptions(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        backgroundColor: '#fff',
        padding: '20px'
      }}>
        <EditorContent editor={editor} />
      </div>

      {/* Footer */}
      <div style={{ 
        padding: '10px 20px', 
        borderTop: '1px solid #ddd',
        backgroundColor: '#f8f9fa',
        fontSize: '12px',
        color: '#666'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>
            {editor.storage.characterCount?.characters() || 0} characters • {editor.storage.characterCount?.words() || transcript.word_count} words
          </span>
          <span>
            Language: {transcript.language.toUpperCase()} • Mode: {transcript.professional_mode}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TranscriptEditor;

