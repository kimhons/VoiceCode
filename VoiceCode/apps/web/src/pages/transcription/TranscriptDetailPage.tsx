/**
 * TranscriptDetailPage - Example integration of agent features
 * Demonstrates how to use AgentContext and AgentQuickActionsBar
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText,
  Clock,
  User,
  Calendar,
  Download,
  Share2,
  MoreVertical,
  Play,
  Pause,
  Volume2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  useAgentContext,
  useAgentPageContext,
} from '../../contexts/AgentContext';
import { AgentQuickActionsBar } from '../../components/agent';

interface TranscriptSegment {
  id: string;
  speaker: string;
  speakerColor: string;
  startTime: number;
  endTime: number;
  text: string;
}

interface AIResult {
  type: string;
  content: any;
  timestamp: Date;
}

const mockTranscript = {
  id: 'trans_001',
  title: 'Product Planning Meeting',
  date: '2024-01-15',
  duration: 2520,
  speakers: ['John Smith', 'Sarah Johnson', 'Mike Chen'],
  segments: [
    {
      id: '1',
      speaker: 'John Smith',
      speakerColor: '#3b82f6',
      startTime: 0,
      endTime: 45,
      text: "Good morning everyone. Let's start with our product planning session for Q2. We have a lot to cover today, including the new feature roadmap and resource allocation.",
    },
    {
      id: '2',
      speaker: 'Sarah Johnson',
      speakerColor: '#10b981',
      startTime: 46,
      endTime: 90,
      text: "Thanks John. I've prepared the feature prioritization list based on customer feedback and our strategic goals. The top three items are the AI assistant integration, improved search functionality, and the mobile app redesign.",
    },
    {
      id: '3',
      speaker: 'Mike Chen',
      speakerColor: '#f59e0b',
      startTime: 91,
      endTime: 140,
      text: "For the AI assistant, I've scoped the technical requirements. We'll need approximately 6 weeks for the core implementation, with additional 2 weeks for testing and refinement. The main dependency is the new API infrastructure.",
    },
    {
      id: '4',
      speaker: 'John Smith',
      speakerColor: '#3b82f6',
      startTime: 141,
      endTime: 185,
      text: "That timeline works. Let's make sure we have the API infrastructure ready by mid-February. Sarah, can you coordinate with the backend team on that?",
    },
    {
      id: '5',
      speaker: 'Sarah Johnson',
      speakerColor: '#10b981',
      startTime: 186,
      endTime: 230,
      text: "Absolutely. I'll schedule a meeting with them this week. We should also decide on the budget for the mobile redesign. The UX team is requesting additional resources.",
    },
    {
      id: '6',
      speaker: 'Mike Chen',
      speakerColor: '#f59e0b',
      startTime: 231,
      endTime: 280,
      text: 'I can share some resources from my team during the initial phase. We have two developers who have mobile experience and could help with the transition.',
    },
  ],
};

const TranscriptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [aiResults, setAiResults] = useState<AIResult[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const { openCommandPalette, isLoading } = useAgentContext();

  // Set page context for the agent
  useAgentPageContext({
    currentPage: 'transcript-detail',
    transcriptId: id || mockTranscript.id,
    transcriptTitle: mockTranscript.title,
  });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  // Handle AI action results
  const handleAIResult = useCallback((command: string, result: any) => {
    setAiResults((prev) => [
      { type: command, content: result, timestamp: new Date() },
      ...prev,
    ]);
    setShowAIPanel(true);
  }, []);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: '#e5e7eb',
    },
    header: {
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      padding: '24px',
      borderBottom: '1px solid #374151',
    },
    headerContent: {
      maxWidth: '1400px',
      margin: '0 auto',
    },
    titleRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#fff',
      marginBottom: '8px',
    },
    meta: {
      display: 'flex',
      gap: '24px',
      fontSize: '14px',
      color: '#9ca3af',
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    actions: {
      display: 'flex',
      gap: '8px',
    },
    actionButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: 500,
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
    primaryButton: {
      backgroundColor: '#6366f1',
      color: '#fff',
    },
    secondaryButton: {
      backgroundColor: '#374151',
      color: '#e5e7eb',
    },
    mainContent: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px',
      display: 'grid',
      gridTemplateColumns: showAIPanel ? '1fr 400px' : '1fr',
      gap: '24px',
    },
    transcriptPanel: {
      backgroundColor: '#1f2937',
      borderRadius: '12px',
      border: '1px solid #374151',
      overflow: 'hidden',
    },
    playerBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px 20px',
      backgroundColor: '#111827',
      borderBottom: '1px solid #374151',
    },
    playButton: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#6366f1',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    timeline: {
      flex: 1,
      height: '4px',
      backgroundColor: '#374151',
      borderRadius: '2px',
      position: 'relative' as const,
    },
    timelineProgress: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      height: '100%',
      backgroundColor: '#6366f1',
      borderRadius: '2px',
      width: `${(currentTime / mockTranscript.duration) * 100}%`,
    },
    timeDisplay: {
      fontSize: '13px',
      color: '#9ca3af',
      fontFamily: 'monospace',
    },
    segmentList: {
      padding: '20px',
    },
    segment: {
      display: 'flex',
      gap: '16px',
      padding: '16px 0',
      borderBottom: '1px solid #374151',
    },
    speakerBadge: {
      padding: '4px 10px',
      borderRadius: '16px',
      fontSize: '12px',
      fontWeight: 600,
      whiteSpace: 'nowrap' as const,
    },
    segmentContent: {
      flex: 1,
    },
    segmentMeta: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px',
    },
    speakerName: {
      fontWeight: 600,
      color: '#fff',
    },
    timestamp: {
      fontSize: '12px',
      color: '#6b7280',
      fontFamily: 'monospace',
    },
    segmentText: {
      fontSize: '15px',
      lineHeight: 1.6,
      color: '#d1d5db',
    },
    aiPanel: {
      backgroundColor: '#1f2937',
      borderRadius: '12px',
      border: '1px solid #374151',
      overflow: 'hidden',
    },
    aiPanelHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderBottom: '1px solid #374151',
      backgroundColor: '#111827',
    },
    aiPanelTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '16px',
      fontWeight: 600,
      color: '#fff',
    },
    aiResultsList: {
      padding: '16px',
      maxHeight: '600px',
      overflowY: 'auto' as const,
    },
    aiResult: {
      padding: '16px',
      backgroundColor: '#111827',
      borderRadius: '8px',
      marginBottom: '12px',
      border: '1px solid #374151',
    },
    aiResultHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px',
    },
    aiResultType: {
      fontSize: '13px',
      fontWeight: 600,
      color: '#a78bfa',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    aiResultTime: {
      fontSize: '12px',
      color: '#6b7280',
    },
    aiResultContent: {
      fontSize: '14px',
      lineHeight: 1.6,
      color: '#d1d5db',
    },
    commandHint: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px',
      backgroundColor: '#111827',
      borderTop: '1px solid #374151',
      fontSize: '13px',
      color: '#6b7280',
      cursor: 'pointer',
    },
    kbd: {
      padding: '2px 6px',
      backgroundColor: '#374151',
      borderRadius: '4px',
      fontSize: '11px',
      fontFamily: 'monospace',
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.titleRow}>
            <div>
              <h1 style={styles.title}>
                <FileText
                  size={28}
                  style={{ marginRight: '12px', verticalAlign: 'middle' }}
                />
                {mockTranscript.title}
              </h1>
              <div style={styles.meta}>
                <span style={styles.metaItem}>
                  <Calendar size={16} />
                  {mockTranscript.date}
                </span>
                <span style={styles.metaItem}>
                  <Clock size={16} />
                  {formatDuration(mockTranscript.duration)}
                </span>
                <span style={styles.metaItem}>
                  <User size={16} />
                  {mockTranscript.speakers.length} speakers
                </span>
              </div>
            </div>
            <div style={styles.actions}>
              <button
                style={{ ...styles.actionButton, ...styles.primaryButton }}
                onClick={openCommandPalette}
              >
                <Sparkles size={16} />
                AI Actions
                <span style={styles.kbd}>⌘K</span>
              </button>
              <button
                style={{ ...styles.actionButton, ...styles.secondaryButton }}
              >
                <Download size={16} />
                Export
              </button>
              <button
                style={{ ...styles.actionButton, ...styles.secondaryButton }}
              >
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>

          {/* AI Quick Actions Bar */}
          <AgentQuickActionsBar
            transcriptId={mockTranscript.id}
            onResultReady={handleAIResult}
            showChatButton={true}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Transcript Panel */}
        <div style={styles.transcriptPanel}>
          {/* Audio Player Bar */}
          <div style={styles.playerBar}>
            <button
              style={styles.playButton}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause size={18} color="#fff" />
              ) : (
                <Play size={18} color="#fff" style={{ marginLeft: '2px' }} />
              )}
            </button>
            <div style={styles.timeline}>
              <div style={styles.timelineProgress} />
            </div>
            <span style={styles.timeDisplay}>
              {formatTime(currentTime)} / {formatTime(mockTranscript.duration)}
            </span>
            <Volume2 size={18} color="#9ca3af" />
          </div>

          {/* Transcript Segments */}
          <div style={styles.segmentList}>
            {mockTranscript.segments.map((segment) => (
              <div key={segment.id} style={styles.segment}>
                <div style={styles.segmentContent}>
                  <div style={styles.segmentMeta}>
                    <span
                      style={{
                        ...styles.speakerBadge,
                        backgroundColor: `${segment.speakerColor}20`,
                        color: segment.speakerColor,
                      }}
                    >
                      {segment.speaker}
                    </span>
                    <span style={styles.timestamp}>
                      {formatTime(segment.startTime)} -{' '}
                      {formatTime(segment.endTime)}
                    </span>
                  </div>
                  <p style={styles.segmentText}>{segment.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Command Palette Hint */}
          <button
            style={{ ...styles.commandHint, border: 'none', width: '100%' }}
            onClick={openCommandPalette}
            type="button"
          >
            <Sparkles size={14} />
            Press <span style={styles.kbd}>⌘K</span> for AI commands
          </button>
        </div>

        {/* AI Results Panel */}
        {showAIPanel && (
          <div style={styles.aiPanel}>
            <div style={styles.aiPanelHeader}>
              <span style={styles.aiPanelTitle}>
                <Sparkles size={18} color="#a78bfa" />
                AI Insights
              </span>
              <button
                onClick={() => setShowAIPanel(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                }}
              >
                <ChevronDown size={18} />
              </button>
            </div>
            <div style={styles.aiResultsList}>
              {aiResults.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#6b7280',
                  }}
                >
                  <Sparkles
                    size={32}
                    style={{ marginBottom: '12px', opacity: 0.5 }}
                  />
                  <p>
                    Use the quick actions above or press ⌘K to generate AI
                    insights
                  </p>
                </div>
              ) : (
                aiResults.map((result) => (
                  <div
                    key={`${result.type}-${result.timestamp.getTime()}`}
                    style={styles.aiResult}
                  >
                    <div style={styles.aiResultHeader}>
                      <span style={styles.aiResultType}>
                        {result.type.replaceAll('_', ' ')}
                      </span>
                      <span style={styles.aiResultTime}>
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={styles.aiResultContent}>
                      {typeof result.content === 'string'
                        ? result.content
                        : JSON.stringify(result.content, null, 2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptDetailPage;
