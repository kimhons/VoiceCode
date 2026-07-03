/**
 * Agent Registry
 * Central registry for all AI agents (internal and external)
 * Manages agent discovery, capabilities, and metadata
 */
import * as vscode from 'vscode';
import { TelemetryService } from './TelemetryService';
/**
 * Agent capability definition
 */
export interface AgentCapability {
    name: string;
    description: string;
    strength: number;
    examples: string[];
    tags: string[];
}
/**
 * Agent metadata
 */
export interface AgentMetadata {
    id: string;
    name: string;
    displayName: string;
    type: 'internal' | 'external';
    provider: string;
    version: string;
    capabilities: AgentCapability[];
    responseCapture: boolean;
    costPerRequest?: number;
    averageLatency?: number;
    successRate?: number;
    specializations: string[];
    extensionId?: string;
    commandPrefix?: string;
    apiEndpoint?: string;
    requiresAuth?: boolean;
    status: 'available' | 'unavailable' | 'error';
    lastChecked?: Date;
    error?: string;
}
/**
 * Agent status
 */
export interface AgentStatus {
    agentId: string;
    available: boolean;
    configured: boolean;
    healthy: boolean;
    lastResponse?: Date;
    errorCount: number;
    successCount: number;
    averageResponseTime: number;
}
/**
 * Agent performance metrics
 */
export interface AgentPerformance {
    agentId: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    totalCost: number;
    lastUsed: Date;
    taskSuccessRate: Record<string, number>;
}
/**
 * Agent Registry Service
 * Manages registration, discovery, and metadata for all agents
 */
export declare class AgentRegistry implements vscode.Disposable {
    private agents;
    private agentStatus;
    private agentPerformance;
    private config;
    private telemetry;
    private context;
    private disposables;
    private readonly _onAgentRegistered;
    private readonly _onAgentStatusChanged;
    private readonly _onAgentDiscovered;
    readonly onAgentRegistered: vscode.Event<AgentMetadata>;
    readonly onAgentStatusChanged: vscode.Event<{
        agentId: string;
        status: AgentStatus;
    }>;
    readonly onAgentDiscovered: vscode.Event<AgentMetadata[]>;
    constructor(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration, telemetry: TelemetryService);
    /**
     * Register a new agent
     */
    register(agent: AgentMetadata): void;
    /**
     * Discover all available agents
     */
    discover(): Promise<AgentMetadata[]>;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): AgentMetadata | undefined;
    /**
     * Get all agents
     */
    getAllAgents(): AgentMetadata[];
    /**
     * Get available agents
     */
    getAvailableAgents(): AgentMetadata[];
    /**
     * Find agents by capability
     */
    findByCapability(capability: string): AgentMetadata[];
    /**
     * Find agents by specialization
     */
    findBySpecialization(specialization: string): AgentMetadata[];
    /**
     * Find best agent for a task
     */
    findBestFor(task: string, context?: {
        language?: string;
        framework?: string;
    }): AgentMetadata | null;
    /**
     * Calculate agent score for a task
     */
    private calculateAgentScore;
    /**
     * Get agent status
     */
    getStatus(agentId: string): AgentStatus | undefined;
    /**
     * Update agent status
     */
    updateStatus(agentId: string, updates: Partial<AgentStatus>): void;
    /**
     * Record agent usage
     */
    recordUsage(agentId: string, success: boolean, latency: number, cost?: number, taskType?: string): void;
    /**
     * Get agent performance metrics
     */
    getPerformance(agentId: string): AgentPerformance | undefined;
    /**
     * Get top performing agents
     */
    getTopPerformers(limit?: number): AgentMetadata[];
    /**
     * Register built-in internal agents
     */
    private registerBuiltInAgents;
    /**
     * Discover external agents (VS Code extensions, APIs, etc.)
     */
    private discoverExternalAgents;
    /**
     * Load data from storage
     */
    private loadFromStorage;
    /**
     * Save data to storage
     */
    private saveToStorage;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default AgentRegistry;
//# sourceMappingURL=AgentRegistry.d.ts.map