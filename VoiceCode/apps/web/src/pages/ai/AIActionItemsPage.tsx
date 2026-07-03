/**
 * AI Action Items Page
 * Extract and manage action items from transcriptions
 */

import React, { useState, useCallback } from 'react';
import {
  CheckSquare,
  Sparkles,
  Copy,
  Download,
  RefreshCw,
  CheckCircle,
  Circle,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  Flag,
  MoreVertical,
  Trash2,
  Edit3,
} from 'lucide-react';

interface ActionItem {
  id: string;
  task: string;
  assignee?: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  context?: string;
}

const AIActionItemsPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [copied, setCopied] = useState(false);

  const generateActionItems = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsGenerating(true);
    setActionItems([]);

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const mockItems: ActionItem[] = [
      {
        id: '1',
        task: 'Finalize technical specifications document',
        assignee: 'John',
        dueDate: '2026-01-24',
        priority: 'high',
        status: 'pending',
        context: 'Required before development can begin',
      },
      {
        id: '2',
        task: 'Schedule client review meeting for next week',
        assignee: 'Sarah',
        dueDate: '2026-01-22',
        priority: 'high',
        status: 'pending',
        context: 'Client requested by end of month',
      },
      {
        id: '3',
        task: 'Complete code review backlog',
        assignee: 'Dev Team',
        dueDate: '2026-01-25',
        priority: 'medium',
        status: 'in_progress',
        context: '12 PRs pending review',
      },
      {
        id: '4',
        task: 'Update project timeline in Jira',
        assignee: 'PM',
        dueDate: '2026-01-21',
        priority: 'medium',
        status: 'pending',
      },
      {
        id: '5',
        task: 'Research competitor pricing models',
        assignee: 'Marketing',
        dueDate: '2026-01-28',
        priority: 'low',
        status: 'pending',
      },
      {
        id: '6',
        task: 'Prepare Q1 budget presentation',
        assignee: 'Finance',
        dueDate: '2026-01-30',
        priority: 'medium',
        status: 'pending',
      },
      {
        id: '7',
        task: 'Fix authentication bug in mobile app',
        assignee: 'Mike',
        dueDate: '2026-01-23',
        priority: 'high',
        status: 'in_progress',
        context: 'Blocking release',
      },
      {
        id: '8',
        task: 'Send meeting summary to stakeholders',
        assignee: 'Sarah',
        dueDate: '2026-01-20',
        priority: 'low',
        status: 'completed',
      },
    ];

    for (const item of mockItems) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      setActionItems((prev) => [...prev, item]);
    }

    setIsGenerating(false);
  }, [inputText]);

  const toggleStatus = (id: string) => {
    setActionItems((items) =>
      items.map((item) => {
        if (item.id === id) {
          const newStatus =
            item.status === 'completed' ? 'pending' : 'completed';
          return { ...item, status: newStatus };
        }
        return item;
      })
    );
  };

  const deleteItem = (id: string) => {
    setActionItems((items) => items.filter((item) => item.id !== id));
  };

  const filteredItems = actionItems.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return item.status !== 'completed';
    if (filter === 'completed') return item.status === 'completed';
    return true;
  });

  const copyActionItems = useCallback(() => {
    const text = filteredItems
      .map(
        (item) =>
          `${item.status === 'completed' ? '[x]' : '[ ]'} ${item.task}${item.assignee ? ` (@${item.assignee})` : ''}${item.dueDate ? ` - Due: ${item.dueDate}` : ''}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [filteredItems]);

  const downloadActionItems = useCallback(() => {
    const text =
      `Action Items\nGenerated: ${new Date().toLocaleDateString()}\n\n` +
      filteredItems
        .map(
          (item) =>
            `${item.status === 'completed' ? '[x]' : '[ ]'} ${item.task}\n   Assignee: ${item.assignee || 'Unassigned'}\n   Due: ${item.dueDate || 'No date'}\n   Priority: ${item.priority}\n`
        )
        .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `action-items-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredItems]);

  const getPriorityColor = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
    }
  };

  const stats = {
    total: actionItems.length,
    pending: actionItems.filter((i) => i.status === 'pending').length,
    inProgress: actionItems.filter((i) => i.status === 'in_progress').length,
    completed: actionItems.filter((i) => i.status === 'completed').length,
    highPriority: actionItems.filter(
      (i) => i.priority === 'high' && i.status !== 'completed'
    ).length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
            <CheckSquare size={32} />
            <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
              AI Action Items
            </h1>
          </div>
          <p style={{ fontSize: '15px', opacity: 0.9 }}>
            Automatically extract tasks and action items from your content
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
              placeholder="Paste your meeting notes, transcription, or document here. The AI will extract all action items, tasks, and follow-ups..."
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
              onClick={generateActionItems}
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
                  ? '#059669'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
                  Extracting Action Items...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Extract Action Items
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
                Action Items
              </h2>
              {actionItems.length > 0 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={copyActionItems}
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
                    onClick={downloadActionItems}
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

            {/* Stats */}
            {actionItems.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#1f2937',
                    }}
                  >
                    {stats.total}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    Total
                  </div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    background: '#fef2f2',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#ef4444',
                    }}
                  >
                    {stats.highPriority}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    High Priority
                  </div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    background: '#fffbeb',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#f59e0b',
                    }}
                  >
                    {stats.inProgress}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    In Progress
                  </div>
                </div>
                <div
                  style={{
                    padding: '12px',
                    background: '#ecfdf5',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#10b981',
                    }}
                  >
                    {stats.completed}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    Completed
                  </div>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            {actionItems.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '16px',
                  padding: '4px',
                  background: '#f3f4f6',
                  borderRadius: '8px',
                }}
              >
                {(['all', 'pending', 'completed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      background: filter === f ? 'white' : 'transparent',
                      color: filter === f ? '#1f2937' : '#6b7280',
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* Action Items List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {actionItems.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#9ca3af',
                  }}
                >
                  <CheckSquare
                    size={48}
                    style={{ marginBottom: '16px', opacity: 0.3 }}
                  />
                  <p>Action items will appear here after extraction</p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        background:
                          item.status === 'completed' ? '#f9fafb' : 'white',
                        opacity: item.status === 'completed' ? 0.7 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                        }}
                      >
                        <button
                          onClick={() => toggleStatus(item.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                        >
                          {item.status === 'completed' ? (
                            <CheckCircle size={20} color="#10b981" />
                          ) : (
                            <Circle size={20} color="#d1d5db" />
                          )}
                        </button>
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontSize: '14px',
                              color: '#1f2937',
                              textDecoration:
                                item.status === 'completed'
                                  ? 'line-through'
                                  : 'none',
                              marginBottom: '8px',
                            }}
                          >
                            {item.task}
                          </p>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '12px',
                              fontSize: '12px',
                              color: '#6b7280',
                            }}
                          >
                            {item.assignee && (
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <User size={12} /> {item.assignee}
                              </span>
                            )}
                            {item.dueDate && (
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Calendar size={12} /> {item.dueDate}
                              </span>
                            )}
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: getPriorityColor(item.priority),
                              }}
                            >
                              <Flag size={12} /> {item.priority}
                            </span>
                          </div>
                          {item.context && (
                            <p
                              style={{
                                fontSize: '12px',
                                color: '#9ca3af',
                                marginTop: '6px',
                                fontStyle: 'italic',
                              }}
                            >
                              {item.context}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: '#d1d5db',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
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

export default AIActionItemsPage;
