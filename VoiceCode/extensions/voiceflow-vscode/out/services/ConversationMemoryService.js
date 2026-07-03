"use strict";
/**
 * Conversation Memory Service
 * Provides persistent conversation memory with semantic search
 * Enables long-term context retention across sessions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationMemoryService = void 0;
const vscode = __importStar(require("vscode"));
const llamaindex_1 = require("llamaindex");
const uuid_1 = require("uuid");
/**
 * Conversation Memory Service
 * Manages short-term and long-term conversation memory with semantic search
 */
class ConversationMemoryService {
    shortTermMemory;
    longTermIndex = null;
    sessions = new Map();
    currentSessionId = null;
    context;
    config;
    telemetry;
    disposables = [];
    // Event emitters
    _onMessageAdded = new vscode.EventEmitter();
    _onSessionStarted = new vscode.EventEmitter();
    _onSessionEnded = new vscode.EventEmitter();
    _onMemoryCleared = new vscode.EventEmitter();
    onMessageAdded = this._onMessageAdded.event;
    onSessionStarted = this._onSessionStarted.event;
    onSessionEnded = this._onSessionEnded.event;
    onMemoryCleared = this._onMemoryCleared.event;
    constructor(context, config, telemetry) {
        this.context = context;
        this.config = config;
        this.telemetry = telemetry;
        // Initialize short-term memory
        const tokenLimit = this.config.get('memoryTokenLimit', 4000);
        this.shortTermMemory = new llamaindex_1.ChatMemoryBuffer({ tokenLimit });
        // Load existing sessions
        this.loadSessions();
        // Start a new session
        this.startNewSession();
    }
    /**
     * Start a new conversation session
     */
    startNewSession() {
        const session = {
            id: (0, uuid_1.v4)(),
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
    async endCurrentSession(summary) {
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
    async addMessage(role, content, metadata) {
        const message = {
            id: (0, uuid_1.v4)(),
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
    async getShortTermMemory() {
        const messages = await this.shortTermMemory.get();
        return messages.map((msg) => ({
            id: (0, uuid_1.v4)(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(),
        }));
    }
    /**
     * Get current session messages
     */
    getCurrentSessionMessages() {
        if (!this.currentSessionId) {
            return [];
        }
        const session = this.sessions.get(this.currentSessionId);
        return session?.messages || [];
    }
    /**
     * Semantic search across all conversations
     */
    async semanticSearch(query, topK = 5) {
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
            const results = [];
            for (const node of nodes) {
                const metadata = node.node.metadata;
                const messageId = metadata.messageId;
                const sessionId = metadata.sessionId;
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
        }
        catch (error) {
            console.error('[ConversationMemory] Semantic search failed:', error);
            return [];
        }
    }
    /**
     * Get relevant memory for a query
     */
    async getRelevantMemory(query, maxMessages = 10) {
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
    async getConversationContext(query, maxTokens = 2000) {
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
    async indexSession(session) {
        try {
            const documents = session.messages.map(msg => new llamaindex_1.Document({
                text: `${msg.role}: ${msg.content}`,
                metadata: {
                    messageId: msg.id,
                    sessionId: session.id,
                    role: msg.role,
                    timestamp: msg.timestamp.toISOString(),
                    provider: msg.metadata?.provider,
                },
            }));
            if (this.longTermIndex) {
                // Add to existing index
                for (const doc of documents) {
                    await this.longTermIndex.insert(doc);
                }
            }
            else {
                // Create new index
                this.longTermIndex = await llamaindex_1.VectorStoreIndex.fromDocuments(documents);
            }
            console.log(`[ConversationMemory] Indexed session ${session.id} with ${documents.length} messages`);
        }
        catch (error) {
            console.error('[ConversationMemory] Failed to index session:', error);
        }
    }
    /**
     * Build long-term index from all sessions
     */
    async buildLongTermIndex() {
        try {
            const allDocuments = [];
            for (const session of this.sessions.values()) {
                for (const msg of session.messages) {
                    allDocuments.push(new llamaindex_1.Document({
                        text: `${msg.role}: ${msg.content}`,
                        metadata: {
                            messageId: msg.id,
                            sessionId: session.id,
                            role: msg.role,
                            timestamp: msg.timestamp.toISOString(),
                        },
                    }));
                }
            }
            if (allDocuments.length > 0) {
                this.longTermIndex = await llamaindex_1.VectorStoreIndex.fromDocuments(allDocuments);
                console.log(`[ConversationMemory] Built long-term index with ${allDocuments.length} messages`);
            }
        }
        catch (error) {
            console.error('[ConversationMemory] Failed to build long-term index:', error);
        }
    }
    /**
     * Load sessions from persistent storage
     */
    async loadSessions() {
        try {
            const savedSessions = this.context.globalState.get('conversationSessions');
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
        }
        catch (error) {
            console.error('[ConversationMemory] Failed to load sessions:', error);
        }
    }
    /**
     * Save sessions to persistent storage
     */
    async saveSessions() {
        try {
            const sessionsArray = Array.from(this.sessions.entries());
            await this.context.globalState.update('conversationSessions', sessionsArray);
            console.log(`[ConversationMemory] Saved ${this.sessions.size} sessions to storage`);
        }
        catch (error) {
            console.error('[ConversationMemory] Failed to save sessions:', error);
        }
    }
    /**
     * Check if we should save (every 10 messages)
     */
    shouldSave() {
        if (!this.currentSessionId) {
            return false;
        }
        const session = this.sessions.get(this.currentSessionId);
        return session ? session.messages.length % 10 === 0 : false;
    }
    /**
     * Estimate token count
     */
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
    /**
     * Get memory statistics
     */
    getStats() {
        let totalMessages = 0;
        let totalTokens = 0;
        let oldestMessage = null;
        let newestMessage = null;
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
    async clearMemory() {
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
    exportConversations() {
        return Array.from(this.sessions.values());
    }
    /**
     * Import conversations
     */
    async importConversations(sessions) {
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
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this._onMessageAdded.dispose();
        this._onSessionStarted.dispose();
        this._onSessionEnded.dispose();
        this._onMemoryCleared.dispose();
    }
}
exports.ConversationMemoryService = ConversationMemoryService;
exports.default = ConversationMemoryService;
//# sourceMappingURL=ConversationMemoryService.js.map