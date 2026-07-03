/**
 * VoiceCode Agent SDK - TypeScript Types
 */

export interface AgentConfig {
  baseUrl: string;
  wsUrl: string;
  apiVersion: string;
  authToken?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp?: Date;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ChatResponse {
  sessionId: string;
  message: string;
  intent: string;
  toolCalls: ToolCall[];
  suggestions: string[];
  metadata: Record<string, any>;
}

export interface ToolCall {
  toolName: string;
  toolId: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolId: string;
  toolName: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTimeMs?: number;
}

export interface AgentSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, any>;
}

export interface StreamChunk {
  type: 'text' | 'tool_start' | 'tool_end' | 'thinking' | 'complete';
  content: string;
  toolName?: string;
  toolResult?: any;
  isFinal: boolean;
}

export interface SearchResult {
  transcriptId: string;
  title: string;
  relevanceScore: number;
  matchedText: string;
  date: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
}

export interface Suggestion {
  type: 'action' | 'insight' | 'tip';
  text: string;
  command?: string;
  params?: Record<string, any>;
}

export interface SuggestionsResponse {
  suggestions: Suggestion[];
  context: Record<string, any>;
}

// Intent types
export type Intent =
  | 'transcribe'
  | 'summarize'
  | 'extract_actions'
  | 'search'
  | 'generate_medical_doc'
  | 'export'
  | 'automate'
  | 'chat'
  | 'help'
  | 'unknown';

// Professional modes
export type ProfessionalMode = 'general' | 'medical' | 'legal' | 'business';

// Event types
export interface AgentEvents {
  connected: { sessionId: string };
  disconnected: { code: number; reason: string };
  message: ChatResponse;
  stream: StreamChunk;
  thinking: { sessionId: string };
  error: { error: Error };
  toolStart: { toolName: string; toolId: string };
  toolEnd: { toolName: string; toolId: string; result: any };
}

// Command types
export interface CommandRequest {
  command: string;
  parameters: Record<string, any>;
}

export interface CommandResponse {
  sessionId: string;
  command: string;
  result: ToolResult;
}

// Medical-specific types
export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  patientId?: string;
  encounterDate?: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export interface KeyPoint {
  id: string;
  text: string;
  importance: number;
  category?: string;
}

export interface MeetingMinutes {
  title: string;
  date: string;
  attendees: string[];
  duration: string;
  agendaItems: string[];
  discussionSummary: string;
  decisions: string[];
  actionItems: string[];
  nextMeeting?: string;
}
