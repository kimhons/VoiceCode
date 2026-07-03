/**
 * Automation Builder Page
 * Create and manage automated workflows
 */

import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit3,
  Copy,
  Clock,
  Calendar,
  Mail,
  FileText,
  Upload,
  MessageSquare,
  Check,
  X,
  ChevronRight,
  Settings,
} from 'lucide-react';

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  status: 'active' | 'paused' | 'draft';
  runsToday: number;
  lastRun?: string;
}

const mockAutomations: Automation[] = [
  {
    id: '1',
    name: 'Meeting Transcription & Summary',
    description:
      'Automatically transcribe Zoom meetings and send AI summary to Slack',
    trigger: 'When Zoom meeting ends',
    actions: ['Transcribe audio', 'Generate AI summary', 'Send to Slack'],
    status: 'active',
    runsToday: 5,
    lastRun: '10 min ago',
  },
  {
    id: '2',
    name: 'Daily Report Generation',
    description: 'Compile daily transcription reports and email to team',
    trigger: 'Every day at 6:00 PM',
    actions: ['Compile report', 'Generate PDF', 'Send email'],
    status: 'active',
    runsToday: 1,
    lastRun: '6 hours ago',
  },
  {
    id: '3',
    name: 'Medical Note Auto-Export',
    description: 'Export completed SOAP notes to EHR system',
    trigger: 'When SOAP note is saved',
    actions: ['Format for EHR', 'Export to Epic', 'Update patient record'],
    status: 'paused',
    runsToday: 0,
    lastRun: '2 days ago',
  },
  {
    id: '4',
    name: 'Action Item Tracker',
    description: 'Extract action items and create tasks in Asana',
    trigger: 'When transcription contains action items',
    actions: ['Extract action items', 'Create Asana tasks', 'Notify assignees'],
    status: 'draft',
    runsToday: 0,
  },
];

const triggerOptions = [
  { id: 'meeting_end', label: 'When meeting ends', icon: Calendar },
  {
    id: 'transcription_complete',
    label: 'When transcription completes',
    icon: FileText,
  },
  { id: 'scheduled', label: 'On a schedule', icon: Clock },
  { id: 'file_upload', label: 'When file is uploaded', icon: Upload },
  {
    id: 'keyword_detected',
    label: 'When keyword is detected',
    icon: MessageSquare,
  },
];

const actionOptions = [
  { id: 'transcribe', label: 'Transcribe audio', category: 'Processing' },
  { id: 'summarize', label: 'Generate AI summary', category: 'AI' },
  { id: 'extract_actions', label: 'Extract action items', category: 'AI' },
  { id: 'extract_key_points', label: 'Extract key points', category: 'AI' },
  { id: 'send_email', label: 'Send email', category: 'Communication' },
  { id: 'send_slack', label: 'Send to Slack', category: 'Communication' },
  { id: 'create_task', label: 'Create task', category: 'Productivity' },
  { id: 'export_pdf', label: 'Export as PDF', category: 'Export' },
  { id: 'save_drive', label: 'Save to Google Drive', category: 'Storage' },
];

const AutomationBuilderPage: React.FC = () => {
  const [automations, setAutomations] = useState<Automation[]>(mockAutomations);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedAutomation, setSelectedAutomation] =
    useState<Automation | null>(null);

  const toggleStatus = (id: string) => {
    setAutomations(
      automations.map((a) => {
        if (a.id === id) {
          return { ...a, status: a.status === 'active' ? 'paused' : 'active' };
        }
        return a;
      })
    );
  };

  const deleteAutomation = (id: string) => {
    setAutomations(automations.filter((a) => a.id !== id));
  };

  const duplicateAutomation = (automation: Automation) => {
    const newAutomation = {
      ...automation,
      id: Date.now().toString(),
      name: `${automation.name} (Copy)`,
      status: 'draft' as const,
      runsToday: 0,
      lastRun: undefined,
    };
    setAutomations([...automations, newAutomation]);
  };

  const stats = {
    total: automations.length,
    active: automations.filter((a) => a.status === 'active').length,
    runsToday: automations.reduce((sum, a) => sum + a.runsToday, 0),
  };

  const getStatusStyle = (status: Automation['status']) => {
    switch (status) {
      case 'active':
        return { bg: '#dcfce7', color: '#16a34a' };
      case 'paused':
        return { bg: '#fef3c7', color: '#d97706' };
      case 'draft':
        return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
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
                <Zap size={32} />
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>
                  Automation Builder
                </h1>
              </div>
              <p style={{ fontSize: '15px', opacity: 0.9 }}>
                Create automated workflows to save time
              </p>
            </div>
            <button
              onClick={() => setShowBuilder(true)}
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
              <Plus size={18} /> Create Automation
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
                  padding: '12px',
                  background: '#fce7f3',
                  borderRadius: '10px',
                }}
              >
                <Zap size={24} color="#be185d" />
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
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Total Automations
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
                  padding: '12px',
                  background: '#dcfce7',
                  borderRadius: '10px',
                }}
              >
                <Play size={24} color="#16a34a" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#10b981',
                  }}
                >
                  {stats.active}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>Active</div>
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
                  padding: '12px',
                  background: '#e0e7ff',
                  borderRadius: '10px',
                }}
              >
                <Check size={24} color="#4f46e5" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#4f46e5',
                  }}
                >
                  {stats.runsToday}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Runs Today
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Automations List */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}
          >
            <h3
              style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}
            >
              Your Automations
            </h3>
          </div>

          {automations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Zap size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
              <h4
                style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#6b7280',
                  marginBottom: '8px',
                }}
              >
                No automations yet
              </h4>
              <p
                style={{
                  fontSize: '14px',
                  color: '#9ca3af',
                  marginBottom: '20px',
                }}
              >
                Create your first automation to get started
              </p>
              <button
                onClick={() => setShowBuilder(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: '#ec4899',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Create Automation
              </button>
            </div>
          ) : (
            <div>
              {automations.map((automation) => {
                const statusStyle = getStatusStyle(automation.status);
                return (
                  <div
                    key={automation.id}
                    style={{
                      padding: '20px',
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    {/* Toggle */}
                    <button
                      onClick={() => toggleStatus(automation.id)}
                      disabled={automation.status === 'draft'}
                      style={{
                        width: '48px',
                        height: '28px',
                        borderRadius: '14px',
                        border: 'none',
                        cursor:
                          automation.status === 'draft'
                            ? 'not-allowed'
                            : 'pointer',
                        background:
                          automation.status === 'active'
                            ? '#10b981'
                            : '#e5e7eb',
                        position: 'relative',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: 'white',
                          position: 'absolute',
                          top: '3px',
                          left: automation.status === 'active' ? '23px' : '3px',
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                      />
                    </button>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '4px',
                        }}
                      >
                        <h4
                          style={{
                            fontSize: '15px',
                            fontWeight: '600',
                            color: '#1f2937',
                          }}
                        >
                          {automation.name}
                        </h4>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          {automation.status}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#6b7280',
                          marginBottom: '8px',
                        }}
                      >
                        {automation.description}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          fontSize: '12px',
                          color: '#9ca3af',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Zap size={12} /> {automation.trigger}
                        </span>
                        {automation.lastRun && (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Clock size={12} /> Last run: {automation.lastRun}
                          </span>
                        )}
                        <span>{automation.runsToday} runs today</span>
                      </div>
                    </div>

                    {/* Actions Flow */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {automation.actions.map((action, index) => (
                        <React.Fragment key={index}>
                          <span
                            style={{
                              padding: '4px 8px',
                              background: '#f3f4f6',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: '#6b7280',
                            }}
                          >
                            {action}
                          </span>
                          {index < automation.actions.length - 1 && (
                            <ChevronRight size={14} color="#d1d5db" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => setSelectedAutomation(automation)}
                        style={{
                          padding: '8px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit3 size={16} color="#6b7280" />
                      </button>
                      <button
                        onClick={() => duplicateAutomation(automation)}
                        style={{
                          padding: '8px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Copy size={16} color="#6b7280" />
                      </button>
                      <button
                        onClick={() => deleteAutomation(automation.id)}
                        style={{
                          padding: '8px',
                          background: '#fef2f2',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={16} color="#dc2626" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Templates Section */}
        <div style={{ marginTop: '24px' }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '16px',
            }}
          >
            Quick Start Templates
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}
          >
            {[
              {
                name: 'Meeting Summary to Slack',
                desc: 'Send AI summaries after meetings',
                icon: MessageSquare,
                color: '#10b981',
              },
              {
                name: 'Daily Digest Email',
                desc: 'Daily email with transcription stats',
                icon: Mail,
                color: '#3b82f6',
              },
              {
                name: 'Auto-Export to Drive',
                desc: 'Save transcripts to Google Drive',
                icon: Upload,
                color: '#f59e0b',
              },
            ].map((template, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      padding: '10px',
                      background: `${template.color}15`,
                      borderRadius: '10px',
                    }}
                  >
                    <template.icon size={20} color={template.color} />
                  </div>
                  <h4
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1f2937',
                    }}
                  >
                    {template.name}
                  </h4>
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    marginBottom: '16px',
                  }}
                >
                  {template.desc}
                </p>
                <button
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationBuilderPage;
