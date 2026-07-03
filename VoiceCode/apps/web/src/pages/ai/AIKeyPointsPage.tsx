/**
 * AI Key Points Page
 * Extract and highlight important points from transcriptions
 */

import React, { useState, useCallback } from 'react';
import {
  Key,
  Sparkles,
  Copy,
  Download,
  RefreshCw,
  CheckCircle,
  Star,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Lightbulb,
} from 'lucide-react';

interface KeyPoint {
  id: string;
  text: string;
  category: 'insight' | 'decision' | 'concern' | 'opportunity' | 'quote';
  importance: 'high' | 'medium' | 'low';
  timestamp?: string;
}

const AIKeyPointsPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(['insight', 'decision', 'concern', 'opportunity', 'quote'])
  );
  const [copied, setCopied] = useState(false);

  const categoryConfig = {
    insight: { icon: Lightbulb, color: '#8b5cf6', label: 'Insights' },
    decision: { icon: CheckCircle, color: '#10b981', label: 'Decisions' },
    concern: { icon: AlertCircle, color: '#ef4444', label: 'Concerns' },
    opportunity: { icon: TrendingUp, color: '#3b82f6', label: 'Opportunities' },
    quote: { icon: MessageSquare, color: '#f59e0b', label: 'Key Quotes' },
  };

  const generateKeyPoints = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsGenerating(true);
    setKeyPoints([]);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockKeyPoints: KeyPoint[] = [
      {
        id: '1',
        text: 'Project timeline has been accelerated by 2 weeks due to client demand',
        category: 'decision',
        importance: 'high',
        timestamp: '2:34',
      },
      {
        id: '2',
        text: 'Team expressed concerns about resource constraints for the new sprint',
        category: 'concern',
        importance: 'high',
        timestamp: '5:12',
      },
      {
        id: '3',
        text: 'New market opportunity identified in healthcare vertical worth $2M ARR',
        category: 'opportunity',
        importance: 'high',
        timestamp: '8:45',
      },
      {
        id: '4',
        text: '"We need to prioritize user experience over feature quantity" - Product Lead',
        category: 'quote',
        importance: 'medium',
        timestamp: '12:30',
      },
      {
        id: '5',
        text: 'Customer satisfaction scores improved 15% after latest release',
        category: 'insight',
        importance: 'medium',
        timestamp: '15:20',
      },
      {
        id: '6',
        text: 'Budget approved for hiring two additional engineers',
        category: 'decision',
        importance: 'medium',
        timestamp: '18:05',
      },
      {
        id: '7',
        text: 'Integration with third-party APIs may cause security vulnerabilities',
        category: 'concern',
        importance: 'medium',
        timestamp: '22:10',
      },
      {
        id: '8',
        text: 'Competitor analysis shows gap in mobile-first solutions',
        category: 'opportunity',
        importance: 'low',
        timestamp: '25:45',
      },
      {
        id: '9',
        text: 'User retention improved after implementing onboarding flow changes',
        category: 'insight',
        importance: 'low',
        timestamp: '28:30',
      },
    ];

    // Simulate streaming effect
    for (const point of mockKeyPoints) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setKeyPoints((prev) => [...prev, point]);
    }

    setIsGenerating(false);
  }, [inputText]);

  const toggleCategory = (category: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) newSelected.delete(category);
    else newSelected.add(category);
    setSelectedCategories(newSelected);
  };

  const filteredKeyPoints = keyPoints.filter((p) =>
    selectedCategories.has(p.category)
  );

  const copyKeyPoints = useCallback(() => {
    const text = filteredKeyPoints
      .map((p) => `[${p.category.toUpperCase()}] ${p.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [filteredKeyPoints]);

  const downloadKeyPoints = useCallback(() => {
    const text = filteredKeyPoints
      .map(
        (p) =>
          `[${p.category.toUpperCase()}] ${p.text}${p.timestamp ? ` (${p.timestamp})` : ''}`
      )
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `key-points-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredKeyPoints]);

  const getImportanceStyle = (importance: KeyPoint['importance']) => {
    switch (importance) {
      case 'high':
        return { background: '#fef2f2', borderColor: '#fecaca' };
      case 'medium':
        return { background: '#fffbeb', borderColor: '#fed7aa' };
      case 'low':
        return { background: '#f9fafb', borderColor: '#e5e7eb' };
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
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
            }}
          >
            <Key size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
              AI Key Points
            </h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Extract and categorize important points from your content
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
            <h2
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '16px',
              }}
            >
              Input Text
            </h2>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your transcription, meeting notes, or document here..."
              style={{
                width: '100%',
                minHeight: '350px',
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />

            <button
              onClick={generateKeyPoints}
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
                  ? '#1d4ed8'
                  : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
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
                  Extracting Key Points...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Extract Key Points
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
                Key Points{' '}
                {keyPoints.length > 0 && `(${filteredKeyPoints.length})`}
              </h2>
              {keyPoints.length > 0 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={copyKeyPoints}
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
                    onClick={downloadKeyPoints}
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

            {/* Category Filters */}
            {keyPoints.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const count = keyPoints.filter(
                    (p) => p.category === key
                  ).length;
                  return (
                    <button
                      key={key}
                      onClick={() => toggleCategory(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        background: selectedCategories.has(key)
                          ? `${config.color}15`
                          : '#f3f4f6',
                        color: selectedCategories.has(key)
                          ? config.color
                          : '#9ca3af',
                      }}
                    >
                      <Icon size={14} />
                      {config.label} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Key Points List */}
            <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
              {keyPoints.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#9ca3af',
                  }}
                >
                  <Key
                    size={48}
                    style={{ marginBottom: '16px', opacity: 0.3 }}
                  />
                  <p>Key points will appear here after extraction</p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {filteredKeyPoints.map((point) => {
                    const config = categoryConfig[point.category];
                    const Icon = config.icon;
                    const importanceStyle = getImportanceStyle(
                      point.importance
                    );

                    return (
                      <div
                        key={point.id}
                        style={{
                          padding: '14px',
                          borderRadius: '8px',
                          borderLeft: `4px solid ${config.color}`,
                          ...importanceStyle,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                          }}
                        >
                          <div
                            style={{
                              padding: '6px',
                              background: `${config.color}20`,
                              borderRadius: '6px',
                            }}
                          >
                            <Icon size={16} color={config.color} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                fontSize: '14px',
                                color: '#1f2937',
                                lineHeight: '1.5',
                                marginBottom: '8px',
                              }}
                            >
                              {point.text}
                            </p>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: config.color,
                                  fontWeight: '500',
                                }}
                              >
                                {config.label}
                              </span>
                              {point.timestamp && (
                                <span
                                  style={{ fontSize: '11px', color: '#9ca3af' }}
                                >
                                  @ {point.timestamp}
                                </span>
                              )}
                              {point.importance === 'high' && (
                                <span
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    fontSize: '11px',
                                    color: '#ef4444',
                                  }}
                                >
                                  <Star size={10} fill="#ef4444" /> High
                                  Priority
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIKeyPointsPage;
