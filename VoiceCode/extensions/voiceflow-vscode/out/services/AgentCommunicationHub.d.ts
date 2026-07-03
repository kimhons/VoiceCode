/**
 * Agent Communication Hub
 * Central hub for routing messages between agents and orchestrating multi-agent workflows
 * Enables VoiceCode to act as universal AI agent coordinator
 */
import * as vscode from 'vscode';
import { AgentRegistry } from './AgentRegistry';
import { EnhancedAIBridgeService } from './EnhancedAIBridgeService';
import { TelemetryService } from './TelemetryService';
import { AgentFactory } from './SpecializedAgents';
/**
 * Agent message for inter-agent communication
 */
export interface AgentMessage {
    id: string;
    from: string;
    to: string | string[];
    type: 'request' | 'response' | 'broadcast' | 'delegate';
    task: string;
    context?: any;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    timeout?: number;
    requiresResponse: boolean;
    metadata?: Record<string, any>;
    timestamp: Date;
}
/**
 * Agent response
 */
export interface AgentResponse {
    id: string;
    requestId: string;
    from: string;
    success: boolean;
    content: string;
    code?: string;
    confidence: number;
    metadata: {
        tokensUsed?: number;
        duration: number;
        model?: string;
        cost?: number;
    };
    timestamp: Date;
}
/**
 * Multi-agent execution result
 */
export interface MultiAgentResult {
    success: boolean;
    responses: AgentResponse[];
    aggregated?: AgentResponse;
    consensus?: AgentResponse;
    best?: AgentResponse;
    duration: number;
    totalCost: number;
}
/**
 * Agent Communication Hub
 * Orchestrates communication between all agents (internal and external)
 */
export declare class AgentCommunicationHub implements vscode.Disposable {
    private registry;
    private aiBridge;
    private agentFactory;
    private telemetry;
    private config;
    private disposables;
    private messageQueue;
    private responseCache;
    private readonly _onMessageSent;
    private readonly _onResponseReceived;
    private readonly _onMultiAgentComplete;
    readonly onMessageSent: vscode.Event<AgentMessage>;
    readonly onResponseReceived: vscode.Event<AgentResponse>;
    readonly onMultiAgentComplete: vscode.Event<MultiAgentResult>;
    constructor(registry: AgentRegistry, aiBridge: EnhancedAIBridgeService, agentFactory: AgentFactory, config: vscode.WorkspaceConfiguration, telemetry: TelemetryService);
    /**
     * Route task to best agent
     */
    routeTask(task: string, context?: {
        language?: string;
        framework?: string;
        code?: string;
    }): Promise<AgentResponse>;
    /**
     * Route to multiple agents for comparison/consensus
     */
    routeToMultiple(task: string, count?: number, context?: any): Promise<AgentResponse[]>;
    /**
     * Send message to specific agent
     */
    sendToAgent(agentId: string, message: AgentMessage): Promise<AgentResponse>;
    /**
     * Send to internal agent (our specialized agents)
     */
    private sendToInternalAgent;
    /**
     * Send to external agent (Copilot, Cursor, etc.)
     */
    private sendToExternalAgent;
    /**
     * Broadcast message to all available agents
     */
    broadcast(message: AgentMessage): Promise<AgentResponse[]>;
    /**
     * Execute task in parallel across multiple agents
     */
    executeParallel(task: string, agentIds: string[], context?: any): Promise<MultiAgentResult>;
    /**
     * Execute task sequentially (pipeline)
     */
    executeSequential(tasks: Array<{
        task: string;
        agentId: string;
        context?: any;
    }>): Promise<MultiAgentResult>;
    /**
     * Execute with voting/consensus
     */
    executeWithConsensus(task: string, agentIds: string[], context?: any): Promise<MultiAgentResult>;
    /**
     * Competitive race - first to respond wins
     */
    executeRace(task: string, agentIds: string[], context?: any): Promise<AgentResponse>;
    /**
     * Select best response from multiple responses
     */
    private selectBestResponse;
    /**
     * Find consensus among responses
     */
    private findConsensus;
    /**
     * Aggregate multiple responses into one
     */
    aggregateResponses(responses: AgentResponse[]): AgentResponse;
    /**
     * Create error response
     */
    private createErrorResponse;
    /**
     * Estimate cost based on tokens and provider
     */
    private estimateCost;
    /**
     * Get agent communication statistics
     */
    getStats(): {
        totalMessages: number;
        totalResponses: number;
        averageResponseTime: number;
        successRate: number;
    };
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default AgentCommunicationHub;
//# sourceMappingURL=AgentCommunicationHub.d.ts.map