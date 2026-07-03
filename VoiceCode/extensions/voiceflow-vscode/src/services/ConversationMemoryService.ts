/**
 * Conversation Memory Service
 * Provides persistent conversation memory with semantic search
 * Enables long-term context retention across sessions
 */

import * as vscode from 'vscode';
import { VectorStoreIndex, Document, ChatMemoryBuffer } from 'llamaindex';
import { v4 as uuidv4 } from 'uuid';
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
export class ConversationMemoryService implements vscode.Disposable {
  private shortTermMemory: ChatMemoryBuffer;
  private longTermIndex: VectorStoreIndex | null = null;
  private sessions: Map<string, ConversationSession> = new Map();
  private currentSessionId: string | null = null;
  private context: vscode.ExtensionContext;
  private config: vscode.WorkspaceConfiguration;
  private telemetry: TelemetryService;
  private disposables: vscode.Disposable[] = [];

  // Event emitters
  private readonly _onMessageAdded = new vscode.EventEmitter<ConversationMessage>();
  private readonly _onSessionStarted = new vscode.EventEmitter<ConversationSession>();
  private readonly _onSessionEnded = new vscode.EventEmitter<ConversationSession>();
  private readonly _onMemoryCleared = new vscode.EventEmitter<void>();

  public readonly onMessageAdded = this._onMessageAdded.event;
  public readonly onSessionStarted = this._onSessionStarted.event;
  public readonly onSessionEnded = this._onSessionEnded.event;
  public readonly onMemoryCleared = this._onMemoryCleared.event;

  constructor(
    context: vscode.ExtensionContext,
    config: vscode.WorkspaceConfiguration,
    telemetry: TelemetryService
  ) {
    this.context = context;
    this.config = config;
    this.telemetry = telemetry;

    // Initialize short-term memory
    const tokenLimit = this.config.get<number>('memoryTokenLimit', 4000);
    this.shortTermMemory = new ChatMemoryBuffer({ tokenLimit });

    // Load existing sessions
    this.loadSessions();

    // Start a new session
    this.startNewSession();
  }

  /**
   * Start a new conversation session
   */
  public startNewSession(): string {
    const session: ConversationSession = {
      id: uuidv4(),
      startTime: new Date(),
      messages: [],
      tags: [],
    };

    this.sessions.set(session.id, session);
    this.currentSessionId = session.id;
    this._onSessionStarted.fire(session);

    this.telemetry.recordEvent('conversation_session_started', {
      sessionId: session.id,
    });

    return session.id;
  }

  /**
   * End the current session
   */
  public async endCurrentSession(summary?: string): Promise<void> {
    if (!this.currentSessionId) {
      return;
    }

    const session = this.sessions.get(this.currentSessionId);
    if (!session) {
      return;
    }

    session.endTime = new Date();
    session.summary = summary;

    this._onSessionEnded.fire(session);

    // Save to persistent storage
    await this.saveSessions();

    // Index the session for semantic search
    await this.indexSession(session);

    this.telemetry.recordEvent('conversation_session_ended', {
      sessionId: this.currentSessionId || 'unknown',
      messageCount: session.messages.length,
      duration: session.endTime.getTime() - session.startTime.getTime(),
    });

    this.currentSessionId = null;
  }

  /**
   * Add a message to memory
   */
  public async addMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: ConversationMessage['metadata']
  ): Promise<ConversationMessage> {
    const message: ConversationMessage = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
      metadata,
    };

    // Add to short-term memory
    await this.shortTermMemory.put({ role, content });

    // Add to current session
    if (this.currentSessionId) {
      const session = this.sessions.get(this.currentSessionId);
      if (session) {
        session.messages.push(message);
      }
    }

    this._onMessageAdded.fire(message);

    // Periodically save to disk
    if (this.shouldSave()) {
      await this.saveSessions();
    }

    this.telemetry.recordEvent('conversation_message_added', {
      role,
      sessionId: this.currentSessionId || 'unknown',
      messageLength: content.length,
    });

    return message;
  }

  /**
   * Get short-term memory (current session)
   */
  public async getShortTermMemory(): Promise<ConversationMessage[]> {
    const messages = await this.shortTermMemory.get();
    return messages.map((msg: any) => ({
      id: uuidv4(),
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: new Date(),
    }));
  }

  /**
   * Get current session messages
   */
  public getCurrentSessionMessages(): ConversationMessage[] {
    if (!this.currentSessionId) {
      return [];
    }

    const session = this.sessions.get(this.currentSessionId);
    return session?.messages || [];
  }

  /**
   * Semantic search across all conversations
   */
  public async semanticSearch(query: string, topK: number = 5): Promise<MemorySearchResult[]> {
    if (!this.longTermIndex) {
      await this.buildLongTermIndex();
    }

    if (!this.longTermIndex) {
      console.log('[ConversationMemory] No long-term index available');
      return [];
    }

    try {
      const retriever = this.longTermIndex.asRetriever({ similarityTopK: topK });
      const nodes = await retriever.retrieve(query);

      const results: MemorySearchResult[] = [];

      for (const node of nodes) {
        const metadata = node.node.metadata;
        const messageId = metadata.messageId as string;
        const sessionId = metadata.sessionId as string;

        // Find the message
        const session = this.sessions.get(sessionId);
        const message = session?.messages.find(m => m.id === messageId);

        if (message) {
          results.push({
            message,
            score: node.score || 0,
            session: sessionId,
          });
        }
      }

      this.telemetry.recordEvent('conversation_memory_search', {
        query,
        resultCount: results.length,
      });

      return results;
    } catch (error) {
      console.error('[ConversationMemory] Semantic search failed:', error);
      return [];
    }
  }

  /**
   * Get relevant memory for a query
   */
  public async getRelevantMemory(query: string, maxMessages: number = 10): Promise<string> {
    const results = await this.semanticSearch(query, maxMessages);
    
    let memory = '';
    for (const result of results) {
      memory += `[${result.message.role}]: ${result.message.content}\n\n`;
    }

    return memory;
  }

  /**
   * Get conversation context (short-term + relevant long-term)
   */
  public async getConversationContext(query: string, maxTokens: number = 2000): Promise<string> {
    let context = '';
    let tokenCount = 0;

    // Add short-term memory first
    const shortTerm = await this.getShortTermMemory();
    for (const msg of shortTerm.slice(-10)) {
      const msgText = `${msg.role}: ${msg.content}\n`;
      const msgTokens = this.estimateTokens(msgText);

      if (tokenCount + msgTokens > maxTokens) {
        break;
      }

      context += msgText;
      tokenCount += msgTokens;
    }

    // Add relevant long-term memory
    if (tokenCount < maxTokens) {
      const relevantMemory = await this.getRelevantMemory(query, 5);
      const memoryTokens = this.estimateTokens(relevantMemory);

      if (tokenCount + memoryTokens <= maxTokens) {
        context += '\n--- Relevant Past Conversations ---\n' + relevantMemory;
      }
    }

    return context;
  }

  /**
   * Index a session for semantic search
   */
  private async indexSession(session: ConversationSession): Promise<void> {
    try {
      const documents = session.messages.map(msg => 
        new Document({
          text: `${msg.role}: ${msg.content}`,
          metadata: {
            messageId: msg.id,
            sessionId: session.id,
            role: msg.role,
            timestamp: msg.timestamp.toISOString(),
            provider: msg.metadata?.provider,
          },
        })
      );

      if (this.longTermIndex) {
        // Add to existing index
        for (const doc of documents) {
          await this.longTermIndex.insert(doc);
        }
      } else {
        // Create new index
        this.longTermIndex = await VectorStoreIndex.fromDocuments(documents);
      }

      console.log(`[ConversationMemory] Indexed session ${session.id} with ${documents.length} messages`);
    } catch (error) {
      console.error('[ConversationMemory] Failed to index session:', error);
    }
  }

  /**
   * Build long-term index from all sessions
   */
  private async buildLongTermIndex(): Promise<void> {
    try {
      const allDocuments: Document[] = [];

      for (const session of this.sessions.values()) {
        for (const msg of session.messages) {
          allDocuments.push(
            new Document({
              text: `${msg.role}: ${msg.content}`,
              metadata: {
                messageId: msg.id,
                sessionId: session.id,
                role: msg.role,
                timestamp: msg.timestamp.toISOString(),
              },
            })
          );
        }
      }

      if (allDocuments.length > 0) {
        this.longTermIndex = await VectorStoreIndex.fromDocuments(allDocuments);
        console.log(`[ConversationMemory] Built long-term index with ${allDocuments.length} messages`);
      }
    } catch (error) {
      console.error('[ConversationMemory] Failed to build long-term index:', error);
    }
  }

  /**
   * Load sessions from persistent storage
   */
  private async loadSessions(): Promise<void> {
    try {
      const savedSessions = this.context.globalState.get<Array<[string, ConversationSession]>>('conversationSessions');
      
      if (savedSessions) {
        this.sessions = new Map(savedSessions.map(([id, session]) => [
          id,
          {
            ...session,
            startTime: new Date(session.startTime),
            endTime: session.endTime ? new Date(session.endTime) : undefined,
            messages: session.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          },
        ]));

        console.log(`[ConversationMemory] Loaded ${this.sessions.size} sessions from storage`);

        // Rebuild long-term index
        await this.buildLongTermIndex();
      }
    } catch (error) {
      console.error('[ConversationMemory] Failed to load sessions:', error);
    }
  }

  /**
   * Save sessions to persistent storage
   */
  private async saveSessions(): Promise<void> {
    try {
      const sessionsArray = Array.from(this.sessions.entries());
      await this.context.globalState.update('conversationSessions', sessionsArray);
      console.log(`[ConversationMemory] Saved ${this.sessions.size} sessions to storage`);
    } catch (error) {
      console.error('[ConversationMemory] Failed to save sessions:', error);
    }
  }

  /**
   * Check if we should save (every 10 messages)
   */
  private shouldSave(): boolean {
    if (!this.currentSessionId) {
      return false;
    }

    const session = this.sessions.get(this.currentSessionId);
    return session ? session.messages.length % 10 === 0 : false;
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get memory statistics
   */
  public getStats(): MemoryStats {
    let totalMessages = 0;
    let totalTokens = 0;
    let oldestMessage: Date | null = null;
    let newestMessage: Date | null = null;
    let totalDuration = 0;

    for (const session of this.sessions.values()) {
      totalMessages += session.messages.length;

      for (const msg of session.messages) {
        totalTokens += this.estimateTokens(msg.content);

        if (!oldestMessage || msg.timestamp < oldestMessage) {
          oldestMessage = msg.timestamp;
        }
        if (!newestMessage || msg.timestamp > newestMessage) {
          newestMessage = msg.timestamp;
        }
      }

      if (session.endTime) {
        totalDuration += session.endTime.getTime() - session.startTime.getTime();
      }
    }

    return {
      totalSessions: this.sessions.size,
      totalMessages,
      totalTokens,
      oldestMessage: oldestMessage || new Date(),
      newestMessage: newestMessage || new Date(),
      averageSessionLength: this.sessions.size > 0 ? totalDuration / this.sessions.size : 0,
    };
  }

  /**
   * Clear all memory
   */
  public async clearMemory(): Promise<void> {
    this.sessions.clear();
    this.longTermIndex = null;
    this.currentSessionId = null;
    await this.shortTermMemory.clear();
    await this.context.globalState.update('conversationSessions', undefined);
    
    this._onMemoryCleared.fire();
    
    this.telemetry.recordEvent('conversation_memory_cleared');
    console.log('[ConversationMemory] All memory cleared');
  }

  /**
   * Export conversations
   */
  public exportConversations(): ConversationSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Import conversations
   */
  public async importConversations(sessions: ConversationSession[]): Promise<void> {
    for (const session of sessions) {
      this.sessions.set(session.id, session);
    }

    await this.saveSessions();
    await this.buildLongTermIndex();

    this.telemetry.recordEvent('conversation_memory_imported', {
      sessionCount: sessions.length,
    });
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this._onMessageAdded.dispose();
    this._onSessionStarted.dispose();
    this._onSessionEnded.dispose();
    this._onMemoryCleared.dispose();
  }
}

export default ConversationMemoryService;
