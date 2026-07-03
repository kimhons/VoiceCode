/**
 * Agent-to-Agent Communication Protocol
 * Enables direct communication between internal agents and external agents
 * Implements message passing, shared context, and collaborative workflows
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { SubagentType, AgentResult, CodeContext, OrchestrationStrategy } from '../types/agents';

/**
 * Message types for agent communication
 */
export enum MessageType {
    REQUEST = 'request',
    RESPONSE = 'response',
    BROADCAST = 'broadcast',
    HANDOFF = 'handoff',
    QUERY = 'query',
    UPDATE = 'update',
    ERROR = 'error',
    ACK = 'ack'
}

/**
 * Message priority levels
 */
export enum MessagePriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}

/**
 * Agent message structure
 */
export interface AgentMessage {
    id: string;
    type: MessageType;
    from: string;
    to: string | string[];  // Single agent or broadcast
    priority: MessagePriority;
    timestamp: number;
    payload: {
        task?: string;
        context?: CodeContext;
        result?: AgentResult;
        data?: Record<string, unknown>;
        requestId?: string;
    };
    metadata: {
        correlationId?: string;
        conversationId?: string;
        ttl?: number;
        requiresAck?: boolean;
    };
}

/**
 * Agent subscription for message filtering
 */
interface AgentSubscription {
    agentId: string;
    filter?: {
        types?: MessageType[];
        from?: string[];
        priority?: MessagePriority;
    };
    callback: (message: AgentMessage) => void | Promise<void>;
}

/**
 * Shared context for multi-agent collaboration
 */
export interface SharedAgentContext {
    sessionId: string;
    participants: string[];
    goal: string;
    currentPhase: string;
    sharedState: Map<string, unknown>;
    artifacts: Array<{
        type: 'code' | 'document' | 'analysis' | 'plan' | 'test';
        content: string;
        creator: string;
        timestamp: number;
    }>;
    conversationHistory: AgentMessage[];
    constraints: string[];
}

/**
 * Agent Communication Hub
 * Central message broker for agent-to-agent communication
 */
export class AgentCommunicationHub extends EventEmitter implements vscode.Disposable {
    private subscriptions: Map<string, AgentSubscription[]> = new Map();
    private messageQueue: AgentMessage[] = [];
    private sharedContexts: Map<string, SharedAgentContext> = new Map();
    private pendingResponses: Map<string, {
        resolve: (value: AgentMessage) => void;
        reject: (reason: Error) => void;
        timeout: NodeJS.Timeout;
    }> = new Map();
    private messageHistory: AgentMessage[] = [];
    private maxHistorySize = 1000;
    private outputChannel: vscode.OutputChannel;

    constructor() {
        super();
        this.outputChannel = vscode.window.createOutputChannel('VoiceCode Agent Communication');
    }

    /**
     * Register an agent with the communication hub
     */
    registerAgent(agentId: string, callback: (message: AgentMessage) => void | Promise<void>, filter?: AgentSubscription['filter']): void {
        if (!this.subscriptions.has(agentId)) {
            this.subscriptions.set(agentId, []);
        }

        this.subscriptions.get(agentId)!.push({
            agentId,
            filter,
            callback
        });

        this.log(`Agent registered: ${agentId}`);
    }

    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string): void {
        this.subscriptions.delete(agentId);
        this.log(`Agent unregistered: ${agentId}`);
    }

    /**
     * Send a message to an agent
     */
    async send(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void> {
        const fullMessage: AgentMessage = {
            ...message,
            id: this.generateMessageId(),
            timestamp: Date.now()
        };

        this.addToHistory(fullMessage);
        this.log(`Message sent: ${fullMessage.from} -> ${fullMessage.to} [${fullMessage.type}]`);

        // Handle broadcast
        if (Array.isArray(fullMessage.to)) {
            for (const recipient of fullMessage.to) {
                await this.deliverToAgent(recipient, fullMessage);
            }
        } else if (fullMessage.to === '*') {
            // Broadcast to all agents
            for (const agentId of this.subscriptions.keys()) {
                if (agentId !== fullMessage.from) {
                    await this.deliverToAgent(agentId, fullMessage);
                }
            }
        } else {
            await this.deliverToAgent(fullMessage.to, fullMessage);
        }

        this.emit('messageSent', fullMessage);
    }

    /**
     * Send a request and wait for response
     */
    async request(
        from: string,
        to: string,
        payload: AgentMessage['payload'],
        timeout: number = 30000
    ): Promise<AgentMessage> {
        const requestId = this.generateMessageId();

        const responsePromise = new Promise<AgentMessage>((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                this.pendingResponses.delete(requestId);
                reject(new Error(`Request timeout: ${requestId}`));
            }, timeout);

            this.pendingResponses.set(requestId, { resolve, reject, timeout: timeoutHandle });
        });

        await this.send({
            type: MessageType.REQUEST,
            from,
            to,
            priority: MessagePriority.NORMAL,
            payload: { ...payload, requestId },
            metadata: { requiresAck: true }
        });

        return responsePromise;
    }

    /**
     * Respond to a request
     */
    async respond(originalMessage: AgentMessage, result: AgentResult): Promise<void> {
        const requestId = originalMessage.payload.requestId || originalMessage.id;

        await this.send({
            type: MessageType.RESPONSE,
            from: Array.isArray(originalMessage.to) ? originalMessage.to[0] : originalMessage.to,
            to: originalMessage.from,
            priority: originalMessage.priority,
            payload: {
                result,
                requestId
            },
            metadata: {
                correlationId: originalMessage.id
            }
        });

        // Resolve pending response if exists
        const pending = this.pendingResponses.get(requestId);
        if (pending) {
            clearTimeout(pending.timeout);
            pending.resolve({
                id: requestId,
                type: MessageType.RESPONSE,
                from: Array.isArray(originalMessage.to) ? originalMessage.to[0] : originalMessage.to,
                to: originalMessage.from,
                priority: originalMessage.priority,
                timestamp: Date.now(),
                payload: { result, requestId },
                metadata: { correlationId: originalMessage.id }
            });
            this.pendingResponses.delete(requestId);
        }
    }

    /**
     * Broadcast a message to all agents
     */
    async broadcast(from: string, payload: AgentMessage['payload'], priority: MessagePriority = MessagePriority.NORMAL): Promise<void> {
        await this.send({
            type: MessageType.BROADCAST,
            from,
            to: '*',
            priority,
            payload,
            metadata: {}
        });
    }

    /**
     * Handoff task from one agent to another
     */
    async handoff(
        from: string,
        to: string,
        task: string,
        context: CodeContext,
        partialResult?: AgentResult
    ): Promise<void> {
        await this.send({
            type: MessageType.HANDOFF,
            from,
            to,
            priority: MessagePriority.HIGH,
            payload: {
                task,
                context,
                result: partialResult,
                data: { handoffType: 'task_continuation' }
            },
            metadata: { requiresAck: true }
        });
    }

    /**
     * Create a shared context for multi-agent collaboration
     */
    createSharedContext(sessionId: string, goal: string, participants: string[]): SharedAgentContext {
        const context: SharedAgentContext = {
            sessionId,
            participants,
            goal,
            currentPhase: 'initialization',
            sharedState: new Map(),
            artifacts: [],
            conversationHistory: [],
            constraints: []
        };

        this.sharedContexts.set(sessionId, context);
        this.log(`Shared context created: ${sessionId} with participants: ${participants.join(', ')}`);

        // Notify participants
        this.broadcast('system', {
            data: {
                event: 'context_created',
                sessionId,
                goal,
                participants
            }
        });

        return context;
    }

    /**
     * Get shared context
     */
    getSharedContext(sessionId: string): SharedAgentContext | undefined {
        return this.sharedContexts.get(sessionId);
    }

    /**
     * Update shared context state
     */
    updateSharedState(sessionId: string, key: string, value: unknown, updater: string): void {
        const context = this.sharedContexts.get(sessionId);
        if (!context) {
            throw new Error(`Shared context not found: ${sessionId}`);
        }

        context.sharedState.set(key, value);

        // Notify participants
        for (const participant of context.participants) {
            if (participant !== updater) {
                this.send({
                    type: MessageType.UPDATE,
                    from: updater,
                    to: participant,
                    priority: MessagePriority.NORMAL,
                    payload: {
                        data: {
                            event: 'state_update',
                            sessionId,
                            key,
                            value
                        }
                    },
                    metadata: { conversationId: sessionId }
                });
            }
        }
    }

    /**
     * Add artifact to shared context
     */
    addArtifact(
        sessionId: string,
        type: 'code' | 'document' | 'analysis' | 'plan' | 'test',
        content: string,
        creator: string
    ): void {
        const context = this.sharedContexts.get(sessionId);
        if (!context) {
            throw new Error(`Shared context not found: ${sessionId}`);
        }

        context.artifacts.push({
            type,
            content,
            creator,
            timestamp: Date.now()
        });

        // Notify participants
        this.broadcast(creator, {
            data: {
                event: 'artifact_added',
                sessionId,
                type,
                creator
            }
        });
    }

    /**
     * Update phase in shared context
     */
    updatePhase(sessionId: string, phase: string, updater: string): void {
        const context = this.sharedContexts.get(sessionId);
        if (!context) {
            throw new Error(`Shared context not found: ${sessionId}`);
        }

        context.currentPhase = phase;

        this.broadcast(updater, {
            data: {
                event: 'phase_changed',
                sessionId,
                phase
            }
        });
    }

    /**
     * Close shared context
     */
    closeSharedContext(sessionId: string): void {
        const context = this.sharedContexts.get(sessionId);
        if (context) {
            this.broadcast('system', {
                data: {
                    event: 'context_closed',
                    sessionId
                }
            });
            this.sharedContexts.delete(sessionId);
        }
    }

    /**
     * Deliver message to specific agent
     */
    private async deliverToAgent(agentId: string, message: AgentMessage): Promise<void> {
        const subscriptions = this.subscriptions.get(agentId);
        if (!subscriptions || subscriptions.length === 0) {
            this.log(`No subscriptions for agent: ${agentId}`, 'warn');
            return;
        }

        for (const sub of subscriptions) {
            // Check filter
            if (sub.filter) {
                if (sub.filter.types && !sub.filter.types.includes(message.type)) {
                    continue;
                }
                if (sub.filter.from && !sub.filter.from.includes(message.from)) {
                    continue;
                }
                if (sub.filter.priority !== undefined && message.priority < sub.filter.priority) {
                    continue;
                }
            }

            try {
                await sub.callback(message);
            } catch (error) {
                this.log(`Error delivering message to ${agentId}: ${error}`, 'error');
            }
        }
    }

    /**
     * Add message to history
     */
    private addToHistory(message: AgentMessage): void {
        this.messageHistory.unshift(message);
        if (this.messageHistory.length > this.maxHistorySize) {
            this.messageHistory.pop();
        }

        // Also add to shared context if applicable
        if (message.metadata.conversationId) {
            const context = this.sharedContexts.get(message.metadata.conversationId);
            if (context) {
                context.conversationHistory.push(message);
            }
        }
    }

    /**
     * Get message history
     */
    getMessageHistory(filter?: {
        from?: string;
        to?: string;
        type?: MessageType;
        limit?: number;
    }): AgentMessage[] {
        let messages = [...this.messageHistory];

        if (filter) {
            if (filter.from) {
                messages = messages.filter(m => m.from === filter.from);
            }
            if (filter.to) {
                messages = messages.filter(m =>
                    m.to === filter.to ||
                    (Array.isArray(m.to) && m.to.includes(filter.to!))
                );
            }
            if (filter.type) {
                messages = messages.filter(m => m.type === filter.type);
            }
            if (filter.limit) {
                messages = messages.slice(0, filter.limit);
            }
        }

        return messages;
    }

    /**
     * Generate unique message ID
     */
    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Log message
     */
    private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        this.outputChannel.appendLine(logMessage);

        if (level === 'error') {
            console.error(logMessage);
        }
    }

    /**
     * Get statistics
     */
    getStatistics(): Record<string, unknown> {
        return {
            registeredAgents: this.subscriptions.size,
            activeContexts: this.sharedContexts.size,
            pendingResponses: this.pendingResponses.size,
            messageHistorySize: this.messageHistory.length,
            queueSize: this.messageQueue.length
        };
    }

    /**
     * Dispose
     */
    dispose(): void {
        // Clear all pending responses
        for (const [id, pending] of this.pendingResponses) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Hub disposed'));
        }
        this.pendingResponses.clear();

        // Clear contexts
        this.sharedContexts.clear();

        // Clear subscriptions
        this.subscriptions.clear();

        this.outputChannel.dispose();
    }
}

/**
 * Agent Collaboration Session
 * Manages a multi-agent collaboration session
 */
export class AgentCollaborationSession {
    private hub: AgentCommunicationHub;
    private context: SharedAgentContext;
    private phaseHandlers: Map<string, (context: SharedAgentContext) => Promise<void>> = new Map();

    constructor(hub: AgentCommunicationHub, sessionId: string, goal: string, participants: string[]) {
        this.hub = hub;
        this.context = hub.createSharedContext(sessionId, goal, participants);
    }

    /**
     * Define phase handler
     */
    onPhase(phase: string, handler: (context: SharedAgentContext) => Promise<void>): void {
        this.phaseHandlers.set(phase, handler);
    }

    /**
     * Execute phase
     */
    async executePhase(phase: string): Promise<void> {
        this.hub.updatePhase(this.context.sessionId, phase, 'session_manager');

        const handler = this.phaseHandlers.get(phase);
        if (handler) {
            await handler(this.context);
        }
    }

    /**
     * Get context
     */
    getContext(): SharedAgentContext {
        return this.context;
    }

    /**
     * End session
     */
    end(): void {
        this.hub.closeSharedContext(this.context.sessionId);
    }
}

/**
 * Create global communication hub instance
 */
let globalHub: AgentCommunicationHub | null = null;

export function getAgentCommunicationHub(): AgentCommunicationHub {
    if (!globalHub) {
        globalHub = new AgentCommunicationHub();
    }
    return globalHub;
}

export function disposeAgentCommunicationHub(): void {
    if (globalHub) {
        globalHub.dispose();
        globalHub = null;
    }
}
