/**
 * Conversation Memory Service
 * Provides persistent conversation memory with semantic search
 * Enables long-term context retention across sessions
 */
import * as vscode from 'vscode';
import { TelemetryService } from './TelemetryService';
/**
 * Conversation message
 */
export interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: {
        provider?: string;
        model?: string;
        tokens?: number;
        toolCalls?: string[];
        context?: string;
    };
}
/**
 * Conversation session
 */
export interface ConversationSession {
    id: string;
    startTime: Date;
    endTime?: Date;
    messages: ConversationMessage[];
    summary?: string;
    tags?: string[];
}
/**
 * Memory search result
 */
export interface MemorySearchResult {
    message: ConversationMessage;
    score: number;
    session: string;
}
/**
 * Memory statistics
 */
export interface MemoryStats {
    totalSessions: number;
    totalMessages: number;
    totalTokens: number;
    oldestMessage: Date;
    newestMessage: Date;
    averageSessionLength: number;
}
/**
 * Conversation Memory Service
 * Manages short-term and long-term conversation memory with semantic search
 */
export declare class ConversationMemoryService implements vscode.Disposable {
    private shortTermMemory;
    private longTermIndex;
    private sessions;
    private currentSessionId;
    private context;
    private config;
    private telemetry;
    private disposables;
    private readonly _onMessageAdded;
    private readonly _onSessionStarted;
    private readonly _onSessionEnded;
    private readonly _onMemoryCleared;
    readonly onMessageAdded: vscode.Event<ConversationMessage>;
    readonly onSessionStarted: vscode.Event<ConversationSession>;
    readonly onSessionEnded: vscode.Event<ConversationSession>;
    readonly onMemoryCleared: vscode.Event<void>;
    constructor(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration, telemetry: TelemetryService);
    /**
     * Start a new conversation session
     */
    startNewSession(): string;
    /**
     * End the current session
     */
    endCurrentSession(summary?: string): Promise<void>;
    /**
     * Add a message to memory
     */
    addMessage(role: 'user' | 'assistant' | 'system', content: string, metadata?: ConversationMessage['metadata']): Promise<ConversationMessage>;
    /**
     * Get short-term memory (current session)
     */
    getShortTermMemory(): Promise<ConversationMessage[]>;
    /**
     * Get current session messages
     */
    getCurrentSessionMessages(): ConversationMessage[];
    /**
     * Semantic search across all conversations
     */
    semanticSearch(query: string, topK?: number): Promise<MemorySearchResult[]>;
    /**
     * Get relevant memory for a query
     */
    getRelevantMemory(query: string, maxMessages?: number): Promise<string>;
    /**
     * Get conversation context (short-term + relevant long-term)
     */
    getConversationContext(query: string, maxTokens?: number): Promise<string>;
    /**
     * Index a session for semantic search
     */
    private indexSession;
    /**
     * Build long-term index from all sessions
     */
    private buildLongTermIndex;
    /**
     * Load sessions from persistent storage
     */
    private loadSessions;
    /**
     * Save sessions to persistent storage
     */
    private saveSessions;
    /**
     * Check if we should save (every 10 messages)
     */
    private shouldSave;
    /**
     * Estimate token count
     */
    private estimateTokens;
    /**
     * Get memory statistics
     */
    getStats(): MemoryStats;
    /**
     * Clear all memory
     */
    clearMemory(): Promise<void>;
    /**
     * Export conversations
     */
    exportConversations(): ConversationSession[];
    /**
     * Import conversations
     */
    importConversations(sessions: ConversationSession[]): Promise<void>;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default ConversationMemoryService;
//# sourceMappingURL=ConversationMemoryService.d.ts.map