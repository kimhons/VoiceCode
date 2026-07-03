/**
 * AI Summary Page
 * Generate AI-powered summaries from transcriptions
 */

import React, { useState, useCallback } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
  Sliders,
  ChevronDown,
} from 'lucide-react';

interface SummaryOptions {
  length: 'brief' | 'standard' | 'detailed';
  style: 'bullet' | 'paragraph' | 'executive';
  includeKeyPoints: boolean;
  includeActionItems: boolean;
  includeDecisions: boolean;
}

const AISummaryPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<SummaryOptions>({
    length: 'standard',
    style: 'bullet',
    includeKeyPoints: true,
    includeActionItems: true,
    includeDecisions: true,
  });
  const [showOptions, setShowOptions] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateSummary = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsGenerating(true);
    setSummary('');

    // Simulate AI generation with streaming effect
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockSummary =
      options.style === 'bullet'
        ? `## Meeting Summary

### Overview
This meeting covered project updates, timeline discussions, and resource allocation for Q1 2026.

### Key Points
${
  options.includeKeyPoints
    ? `- Project Alpha is on track for February delivery
- Budget approved for additional developer resources
- Client feedback has been positive on recent demos
- Technical debt items prioritized for next sprint`
    : ''
}

${
  options.includeDecisions
    ? `### Decisions Made
- Approved hiring of 2 additional engineers
- Selected vendor B for cloud infrastructure
- Moved launch date to February 15th`
    : ''
}

${
  options.includeActionItems
    ? `### Action Items
- [ ] John to finalize technical specifications by Friday
- [ ] Sarah to schedule client review meeting
- [ ] Team to complete code review backlog
- [ ] PM to update project timeline in Jira`
    : ''
}

### Next Steps
Follow-up meeting scheduled for next Tuesday to review progress.`
        : options.style === 'executive'
          ? `**Executive Summary**

The team met to discuss Q1 2026 project deliverables. Key outcomes include approval of additional resources, vendor selection for infrastructure, and a confirmed launch date of February 15th. All stakeholders aligned on priorities and next steps have been assigned.

**Bottom Line:** Project is on track with strong client feedback. Recommend proceeding with current timeline.`
          : `The meeting focused on reviewing the current project status and planning for the upcoming quarter. The team discussed several important topics including resource allocation, technical requirements, and client feedback.

Overall, the project is progressing well with positive momentum. The team has addressed previous blockers and is now focused on the final stretch of development before the February launch.

Key decisions were made regarding vendor selection and additional hiring, which will help accelerate the timeline and ensure quality delivery.`;

    // Simulate streaming
    let displayed = '';
    for (let i = 0; i < mockSummary.length; i += 5) {
      displayed = mockSummary.slice(0, i + 5);
      setSummary(displayed);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    setSummary(mockSummary);
    setIsGenerating(false);
  }, [inputText, options]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [summary]);

  const downloadSummary = useCallback(() => {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [summary]);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
          color: 'white',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <Sparkles size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>AI Summary</h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Generate intelligent summaries from your transcriptions
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
          }}
        >
          {/* Input Panel */}
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
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                }}
              >
                Input Text
              </h2>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                {inputText.length} characters
              </span>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your transcription or meeting notes here..."
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />

            {/* Options */}
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#374151',
                  width: '100%',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Sliders size={16} /> Summary Options
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    transform: showOptions ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>

              {showOptions && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Length
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(['brief', 'standard', 'detailed'] as const).map(
                        (len) => (
                          <button
                            key={len}
                            onClick={() =>
                              setOptions({ ...options, length: len })
                            }
                            style={{
                              flex: 1,
                              padding: '8px',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              background:
                                options.length === len ? '#8b5cf6' : 'white',
                              color:
                                options.length === len ? 'white' : '#6b7280',
                            }}
                          >
                            {len.charAt(0).toUpperCase() + len.slice(1)}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Style
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(['bullet', 'paragraph', 'executive'] as const).map(
                        (style) => (
                          <button
                            key={style}
                            onClick={() => setOptions({ ...options, style })}
                            style={{
                              flex: 1,
                              padding: '8px',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              background:
                                options.style === style ? '#8b5cf6' : 'white',
                              color:
                                options.style === style ? 'white' : '#6b7280',
                            }}
                          >
                            {style.charAt(0).toUpperCase() + style.slice(1)}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {[
                      { key: 'includeKeyPoints', label: 'Include Key Points' },
                      {
                        key: 'includeActionItems',
                        label: 'Include Action Items',
                      },
                      { key: 'includeDecisions', label: 'Include Decisions' },
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '13px',
                          color: '#374151',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={(options as any)[key]}
                          onChange={(e) =>
                            setOptions({ ...options, [key]: e.target.checked })
                          }
                          style={{ width: '16px', height: '16px' }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={generateSummary}
              disabled={isGenerating || !inputText.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px',
                marginTop: '16px',
                background: isGenerating
                  ? '#a855f7'
                  : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                opacity: inputText.trim() ? 1 : 0.5,
              }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw
                    size={18}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  Generating Summary...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Summary
                </>
              )}
            </button>
          </div>

          {/* Output Panel */}
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
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                }}
              >
                Generated Summary
              </h2>
              {summary && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={copyToClipboard}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: copied ? '#10b981' : '#f3f4f6',
                      color: copied ? 'white' : '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={downloadSummary}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              )}
            </div>

            <div
              style={{
                minHeight: '400px',
                padding: '16px',
                background: summary ? 'white' : '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap',
                color: summary ? '#1f2937' : '#9ca3af',
              }}
            >
              {summary || 'Your AI-generated summary will appear here...'}
              {isGenerating && (
                <span style={{ animation: 'blink 1s infinite' }}>▊</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default AISummaryPage;
