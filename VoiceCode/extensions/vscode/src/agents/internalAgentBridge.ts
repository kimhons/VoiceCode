/**
 * Internal Agent Bridge
 * Bridges VS Code extension to VoiceCode's internal agent system (Rust backend)
 *
 * This class provides access to the 9 internal subagents:
 * - Planner (Opus) - Creates implementation plans
 * - Explorer (Haiku) - Searches and analyzes codebase
 * - Coder (Sonnet) - Writes and modifies code
 * - Reviewer (Sonnet) - Reviews code for issues
 * - Tester (Sonnet) - Generates tests
 * - Debugger (Sonnet) - Diagnoses and fixes bugs
 * - Documenter (Sonnet) - Writes documentation
 * - Refactorer (Sonnet) - Improves code structure
 * - Security (Opus) - Audits for vulnerabilities
 *
 * Extended capabilities (Phase 3):
 * - Agent-to-Agent Communication
 * - VS Code Voice Control
 * - Computer Vision
 * - Web Browsing
 * - Developer Tools Integration
 * - Multi-Modal Context
 *
 * Enhanced capabilities (Phase 4):
 * - Human-in-the-Loop Approval
 * - Checkpoint/Rewind System
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { VoiceCodeClient } from '../voicecodeClient';
import {
    SubagentType,
    OrchestrationStrategy,
    AgentStatus,
    AgentCapability,
    ModelTier,
    CodeContext,
    TaskType,
    AgentResult,
    AgentInfo,
    OrchestratedResult,
    PipelineResult,
    ModelRouterConfig,
    SubagentConfig,
    AgentEvent,
    AgentEventType
} from '../types/agents';
import {
    ApprovalManager,
    ApprovalStatus,
    ApprovalDecision,
    getApprovalManager
} from './approvalManager';
import {
    CheckpointManager,
    getCheckpointManager
} from './checkpointManager';

/**
 * Predefined pipeline types
 */
export type PipelineType =
    | 'plan_implement_review'
    | 'explore_plan_implement'
    | 'debug_fix_test'
    | 'security_audit_fix'
    | 'refactor_review_test'
    | 'custom';

/**
 * Options for executing with approval
 */
export interface ExecutionOptions {
    /** Skip approval even if normally required */
    skipApproval?: boolean;
    /** Skip checkpoint creation */
    skipCheckpoint?: boolean;
    /** Custom timeout for this execution */
    timeoutMs?: number;
}

/**
 * Internal Agent Bridge - Main interface to VoiceCode's internal agent system
 */
export class InternalAgentBridge extends EventEmitter {
    private client: VoiceCodeClient;
    private cachedAgents: AgentInfo[] | null = null;
    private cachedModelConfig: ModelRouterConfig | null = null;
    private activeSessions: Map<string, { agentType: SubagentType; startTime: number }> = new Map();
    private approvalManager: ApprovalManager | null = null;
    private checkpointManager: CheckpointManager | null = null;

    /**
     * Subagent type constants for easy access
     */
    static readonly SubagentTypes = SubagentType;

    /**
     * Orchestration strategy constants
     */
    static readonly Strategies = OrchestrationStrategy;

    /**
     * Model tier constants
     */
    static readonly ModelTiers = ModelTier;

    /**
     * Default model assignments for each agent type
     */
    static readonly DEFAULT_MODEL_ASSIGNMENTS: Record<SubagentType, ModelTier> = {
        [SubagentType.PLANNER]: ModelTier.ADVANCED,
        [SubagentType.EXPLORER]: ModelTier.FAST,
        [SubagentType.CODER]: ModelTier.CODE,
        [SubagentType.REVIEWER]: ModelTier.BALANCED,
        [SubagentType.TESTER]: ModelTier.BALANCED,
        [SubagentType.DEBUGGER]: ModelTier.BALANCED,
        [SubagentType.DOCUMENTER]: ModelTier.BALANCED,
        [SubagentType.REFACTORER]: ModelTier.BALANCED,
        [SubagentType.SECURITY]: ModelTier.ADVANCED,
        [SubagentType.GENERAL]: ModelTier.BALANCED
    };

    /**
     * Agent icons for UI display
     */
    static readonly AGENT_ICONS: Record<SubagentType, string> = {
        [SubagentType.PLANNER]: 'checklist',
        [SubagentType.EXPLORER]: 'search',
        [SubagentType.CODER]: 'code',
        [SubagentType.REVIEWER]: 'eye',
        [SubagentType.TESTER]: 'beaker',
        [SubagentType.DEBUGGER]: 'bug',
        [SubagentType.DOCUMENTER]: 'book',
        [SubagentType.REFACTORER]: 'wrench',
        [SubagentType.SECURITY]: 'shield',
        [SubagentType.GENERAL]: 'robot'
    };

    /**
     * Agent descriptions for UI display
     */
    static readonly AGENT_DESCRIPTIONS: Record<SubagentType, string> = {
        [SubagentType.PLANNER]: 'Creates detailed implementation plans and designs architecture',
        [SubagentType.EXPLORER]: 'Searches code, finds symbols, and analyzes codebase structure',
        [SubagentType.CODER]: 'Writes and modifies code, implements features',
        [SubagentType.REVIEWER]: 'Reviews code for issues, suggests improvements',
        [SubagentType.TESTER]: 'Generates comprehensive tests and runs test suites',
        [SubagentType.DEBUGGER]: 'Diagnoses bugs, traces errors, and proposes fixes',
        [SubagentType.DOCUMENTER]: 'Writes documentation, adds comments, explains code',
        [SubagentType.REFACTORER]: 'Improves code structure, cleans up code',
        [SubagentType.SECURITY]: 'Audits for OWASP vulnerabilities, performs security scans',
        [SubagentType.GENERAL]: 'General purpose agent for miscellaneous tasks'
    };

    constructor(client: VoiceCodeClient) {
        super();
        this.client = client;
    }

    /**
     * Set the ApprovalManager instance for human-in-the-loop approval
     */
    setApprovalManager(manager: ApprovalManager): void {
        this.approvalManager = manager;
    }

    /**
     * Set the CheckpointManager instance for state rewind
     */
    setCheckpointManager(manager: CheckpointManager): void {
        this.checkpointManager = manager;
    }

    // =========================================================================
    // SINGLE AGENT EXECUTION
    // =========================================================================

    /**
     * Execute a task with a specific internal agent
     *
     * @param agentType - The subagent to use
     * @param task - Description of the task
     * @param context - Code context for execution
     * @param options - Execution options (approval, checkpoint settings)
     * @returns Promise<AgentResult>
     */
    async executeWithAgent(
        agentType: SubagentType,
        task: string,
        context: CodeContext,
        options: ExecutionOptions = {}
    ): Promise<AgentResult> {
        const sessionId = this.startSession(agentType);

        try {
            this.emitEvent('agent_started', {
                agent_id: sessionId,
                agent_type: agentType,
                message: `Starting ${agentType} agent`
            });

            // Create pre-execution checkpoint if checkpoint manager is available
            let preCheckpointId: string | undefined;
            if (this.checkpointManager && !options.skipCheckpoint) {
                try {
                    const checkpoint = await this.checkpointManager.createCheckpoint({
                        trigger: 'auto-pre-change',
                        name: `Before: ${agentType} - ${task.substring(0, 50)}`,
                        agentType,
                        task,
                        context
                    });
                    preCheckpointId = checkpoint.id;
                } catch (error) {
                    console.warn('[InternalAgentBridge] Failed to create pre-checkpoint:', error);
                }
            }

            // Execute the agent
            const result = await this.sendRequest<AgentResult>('internal_agent/execute', {
                agent_type: agentType,
                task,
                context
            });

            // Check if approval is required
            if (this.approvalManager && !options.skipApproval) {
                const requiresApproval = this.approvalManager.requiresApproval(agentType);

                if (requiresApproval && result.success && result.code_blocks && result.code_blocks.length > 0) {
                    // Create approval request
                    const approvalRequest = await this.approvalManager.createApprovalRequest(
                        agentType,
                        task,
                        result,
                        context
                    );

                    // Wait for approval decision
                    const decision = await this.approvalManager.requestApproval(approvalRequest);

                    // Handle decision
                    if (decision.status === ApprovalStatus.REJECTED) {
                        // Revert to pre-checkpoint if available
                        if (preCheckpointId && this.checkpointManager) {
                            try {
                                await this.checkpointManager.revertToCheckpoint(preCheckpointId);
                            } catch (err) {
                                console.warn('[InternalAgentBridge] Failed to revert checkpoint:', err);
                            }
                        }

                        this.emitEvent('agent_rejected', {
                            agent_id: sessionId,
                            agent_type: agentType,
                            message: `${agentType} agent result rejected by user`
                        });

                        return {
                            ...result,
                            success: false,
                            error: 'Changes rejected by user'
                        };
                    }

                    if (decision.status === ApprovalStatus.EDITED && decision.editedChanges) {
                        // Apply edited changes
                        result.code_blocks = decision.editedChanges.map(change => ({
                            code: change.proposedContent,
                            language: change.language,
                            file_path: change.filePath
                        }));
                    }

                    this.emitEvent('agent_approved', {
                        agent_id: sessionId,
                        agent_type: agentType,
                        decision,
                        message: `${agentType} agent result ${decision.status}`
                    });
                }
            }

            // Create post-execution checkpoint
            if (this.checkpointManager && !options.skipCheckpoint && result.success) {
                try {
                    await this.checkpointManager.createCheckpoint({
                        trigger: 'auto-post-change',
                        name: `After: ${agentType} - ${task.substring(0, 50)}`,
                        agentType,
                        task,
                        context,
                        parentId: preCheckpointId,
                        agentResult: result
                    });
                } catch (err) {
                    console.warn('[InternalAgentBridge] Failed to create post-checkpoint:', err);
                }
            }

            this.emitEvent('agent_completed', {
                agent_id: sessionId,
                agent_type: agentType,
                result,
                message: `${agentType} agent completed`
            });

            return result;
        } catch (error) {
            this.emitEvent('agent_failed', {
                agent_id: sessionId,
                agent_type: agentType,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        } finally {
            this.endSession(sessionId);
        }
    }

    /**
     * Execute with the Planner agent
     */
    async plan(task: string, context: CodeContext): Promise<AgentResult> {
        return this.executeWithAgent(SubagentType.PLANNER, task, context);
    }

    /**
     * Execute with the Explorer agent
     */
    async explore(query: string, context: CodeContext): Promise<AgentResult> {
        return this.executeWithAgent(SubagentType.EXPLORER, query, context);
    }

    /**
     * Execute with the Coder agent
     */
    async code(task: string, context: CodeContext): Promise<AgentResult> {
        return this.executeWithAgent(SubagentType.CODER, task, context);
    }

    /**
     * Execute with the Reviewer agent
     */
    async review(context: CodeContext, focusAreas?: string[]): Promise<AgentResult> {
        const task = focusAreas && focusAreas.length > 0
            ? `Review this code focusing on: ${focusAreas.join(', ')}`
            : 'Review this code for issues and improvements';
        return this.executeWithAgent(SubagentType.REVIEWER, task, context);
    }

    /**
     * Execute with the Tester agent
     */
    async test(context: CodeContext, testType?: 'unit' | 'integration' | 'e2e'): Promise<AgentResult> {
        const task = testType
            ? `Generate ${testType} tests for this code`
            : 'Generate comprehensive tests for this code';
        return this.executeWithAgent(SubagentType.TESTER, task, context);
    }

    /**
     * Execute with the Debugger agent
     */
    async debug(issue: string, context: CodeContext): Promise<AgentResult> {
        return this.executeWithAgent(SubagentType.DEBUGGER, issue, context);
    }

    /**
     * Execute with the Documenter agent
     */
    async document(context: CodeContext, style?: 'jsdoc' | 'inline' | 'readme'): Promise<AgentResult> {
        const task = style
            ? `Add ${style} documentation to this code`
            : 'Add documentation to this code';
        return this.executeWithAgent(SubagentType.DOCUMENTER, task, context);
    }

    /**
     * Execute with the Refactorer agent
     */
    async refactor(instructions: string, context: CodeContext): Promise<AgentResult> {
        return this.executeWithAgent(SubagentType.REFACTORER, instructions, context);
    }

    /**
     * Execute with the Security agent
     */
    async securityAudit(context: CodeContext, checks?: string[]): Promise<AgentResult> {
        const task = checks && checks.length > 0
            ? `Security audit focusing on: ${checks.join(', ')}`
            : 'Perform OWASP Top 10 security audit';
        return this.executeWithAgent(SubagentType.SECURITY, task, context);
    }

    // =========================================================================
    // ORCHESTRATED EXECUTION
    // =========================================================================

    /**
     * Execute a task with an orchestration strategy
     *
     * @param strategy - The orchestration strategy to use
     * @param taskType - Type and parameters of the task
     * @param context - Code context for execution
     * @returns Promise<OrchestratedResult>
     */
    async executeWithStrategy(
        strategy: OrchestrationStrategy,
        taskType: TaskType,
        context: CodeContext
    ): Promise<OrchestratedResult> {
        this.emitEvent('orchestration_started', {
            agent_id: 'orchestrator',
            message: `Starting ${strategy} orchestration`
        });

        try {
            const result = await this.sendRequest<OrchestratedResult>('orchestrator/execute', {
                strategy,
                task_type: taskType,
                context
            });

            this.emitEvent('orchestration_completed', {
                agent_id: 'orchestrator',
                message: `${strategy} orchestration completed with ${result.agents_used.length} agents`
            });

            return result;
        } catch (error) {
            this.emitEvent('agent_failed', {
                agent_id: 'orchestrator',
                message: error instanceof Error ? error.message : 'Orchestration failed'
            });
            throw error;
        }
    }

    /**
     * Execute with Single Agent strategy (best agent for task)
     */
    async executeSingleAgent(taskType: TaskType, context: CodeContext): Promise<OrchestratedResult> {
        return this.executeWithStrategy(OrchestrationStrategy.SINGLE_AGENT, taskType, context);
    }

    /**
     * Execute with Race strategy (parallel, first wins)
     */
    async executeRace(taskType: TaskType, context: CodeContext): Promise<OrchestratedResult> {
        return this.executeWithStrategy(OrchestrationStrategy.RACE_EXECUTION, taskType, context);
    }

    /**
     * Execute with Consensus strategy (parallel, aggregate)
     */
    async executeConsensus(taskType: TaskType, context: CodeContext): Promise<OrchestratedResult> {
        return this.executeWithStrategy(OrchestrationStrategy.CONSENSUS, taskType, context);
    }

    /**
     * Execute with Decomposition strategy (split across agents)
     */
    async executeDecomposed(taskType: TaskType, context: CodeContext): Promise<OrchestratedResult> {
        return this.executeWithStrategy(OrchestrationStrategy.DECOMPOSITION, taskType, context);
    }

    // =========================================================================
    // PIPELINE EXECUTION
    // =========================================================================

    /**
     * Execute a predefined agent pipeline
     *
     * @param pipelineType - The type of pipeline to execute
     * @param task - Description of the task
     * @param context - Code context for execution
     * @returns Promise<PipelineResult>
     */
    async executePipeline(
        pipelineType: PipelineType,
        task: string,
        context: CodeContext
    ): Promise<PipelineResult> {
        const result = await this.sendRequest<PipelineResult>('pipeline/execute', {
            pipeline_type: pipelineType,
            task,
            context
        });

        return result;
    }

    /**
     * Execute Plan -> Implement -> Review pipeline
     */
    async planImplementReview(task: string, context: CodeContext): Promise<PipelineResult> {
        return this.executePipeline('plan_implement_review', task, context);
    }

    /**
     * Execute Explore -> Plan -> Implement pipeline
     */
    async explorePlanImplement(task: string, context: CodeContext): Promise<PipelineResult> {
        return this.executePipeline('explore_plan_implement', task, context);
    }

    /**
     * Execute Debug -> Fix -> Test pipeline
     */
    async debugFixTest(issue: string, context: CodeContext): Promise<PipelineResult> {
        return this.executePipeline('debug_fix_test', issue, context);
    }

    /**
     * Execute Security Audit -> Fix pipeline
     */
    async securityAuditFix(context: CodeContext): Promise<PipelineResult> {
        return this.executePipeline('security_audit_fix', 'Audit and fix security issues', context);
    }

    /**
     * Execute Refactor -> Review -> Test pipeline
     */
    async refactorReviewTest(instructions: string, context: CodeContext): Promise<PipelineResult> {
        return this.executePipeline('refactor_review_test', instructions, context);
    }

    /**
     * Execute a custom pipeline with specified stages
     */
    async executeCustomPipeline(
        stages: SubagentType[],
        task: string,
        context: CodeContext
    ): Promise<PipelineResult> {
        return this.sendRequest<PipelineResult>('pipeline/execute_custom', {
            stages,
            task,
            context
        });
    }

    // =========================================================================
    // AGENT INFORMATION
    // =========================================================================

    /**
     * Get list of available internal agents
     */
    async getAvailableAgents(forceRefresh = false): Promise<AgentInfo[]> {
        if (this.cachedAgents && !forceRefresh) {
            return this.cachedAgents;
        }

        try {
            this.cachedAgents = await this.sendRequest<AgentInfo[]>('agents/list', {
                type: 'internal'
            });
            return this.cachedAgents;
        } catch {
            // Return static list if backend unavailable
            return this.getStaticAgentList();
        }
    }

    /**
     * Get agent by type
     */
    async getAgent(agentType: SubagentType): Promise<AgentInfo | undefined> {
        const agents = await this.getAvailableAgents();
        return agents.find(a => a.name.toLowerCase() === agentType.toLowerCase());
    }

    /**
     * Get agents with a specific capability
     */
    async getAgentsByCapability(capability: AgentCapability): Promise<AgentInfo[]> {
        const agents = await this.getAvailableAgents();
        return agents.filter(a => a.capabilities.includes(capability));
    }

    /**
     * Get the model configuration for agents
     */
    async getModelConfig(forceRefresh = false): Promise<ModelRouterConfig> {
        if (this.cachedModelConfig && !forceRefresh) {
            return this.cachedModelConfig;
        }

        try {
            this.cachedModelConfig = await this.sendRequest<ModelRouterConfig>('agents/model_config', {});
            return this.cachedModelConfig;
        } catch {
            // Return default config if backend unavailable
            return this.getDefaultModelConfig();
        }
    }

    /**
     * Get configuration for a specific subagent
     */
    async getSubagentConfig(agentType: SubagentType): Promise<SubagentConfig> {
        return this.sendRequest<SubagentConfig>('agents/config', {
            agent_type: agentType
        });
    }

    /**
     * Check if the internal agent system is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const agents = await this.getAvailableAgents(true);
            return agents.length > 0;
        } catch {
            return false;
        }
    }

    // =========================================================================
    // SESSION MANAGEMENT
    // =========================================================================

    /**
     * Get active agent sessions
     */
    getActiveSessions(): Array<{ id: string; agentType: SubagentType; duration: number }> {
        const now = Date.now();
        return Array.from(this.activeSessions.entries()).map(([id, session]) => ({
            id,
            agentType: session.agentType,
            duration: now - session.startTime
        }));
    }

    /**
     * Cancel an active session
     */
    async cancelSession(sessionId: string): Promise<boolean> {
        if (!this.activeSessions.has(sessionId)) {
            return false;
        }

        try {
            await this.sendRequest('agents/cancel', { session_id: sessionId });
            this.endSession(sessionId);
            return true;
        } catch {
            return false;
        }
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Select the best agent for a given task description
     */
    selectAgentForTask(taskDescription: string): SubagentType {
        const lower = taskDescription.toLowerCase();

        if (/\b(plan|design|architect|strategy)\b/.test(lower)) {
            return SubagentType.PLANNER;
        }
        if (/\b(search|find|where|look for|locate)\b/.test(lower)) {
            return SubagentType.EXPLORER;
        }
        if (/\b(review|check|audit)(?!.*security)\b/.test(lower)) {
            return SubagentType.REVIEWER;
        }
        if (/\b(test|spec|coverage)\b/.test(lower)) {
            return SubagentType.TESTER;
        }
        if (/\b(debug|fix|error|bug|issue|failing|broken)\b/.test(lower)) {
            return SubagentType.DEBUGGER;
        }
        if (/\b(document|comment|explain|describe)\b/.test(lower)) {
            return SubagentType.DOCUMENTER;
        }
        if (/\b(refactor|improve|clean|optimize)\b/.test(lower)) {
            return SubagentType.REFACTORER;
        }
        if (/\b(security|vulnerab|owasp|injection|xss)\b/.test(lower)) {
            return SubagentType.SECURITY;
        }
        if (/\b(create|generate|write|implement|add|make)\b/.test(lower)) {
            return SubagentType.CODER;
        }

        return SubagentType.GENERAL;
    }

    /**
     * Get icon for an agent type
     */
    getAgentIcon(agentType: SubagentType): string {
        return InternalAgentBridge.AGENT_ICONS[agentType] || 'robot';
    }

    /**
     * Get description for an agent type
     */
    getAgentDescription(agentType: SubagentType): string {
        return InternalAgentBridge.AGENT_DESCRIPTIONS[agentType] || 'VoiceCode internal agent';
    }

    /**
     * Get model tier for an agent type
     */
    getModelTier(agentType: SubagentType): ModelTier {
        return InternalAgentBridge.DEFAULT_MODEL_ASSIGNMENTS[agentType] || ModelTier.BALANCED;
    }

    // =========================================================================
    // PRIVATE METHODS
    // =========================================================================

    private async sendRequest<T>(method: string, params: unknown): Promise<T> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Request timeout: ${method}`));
            }, 60000);

            const handler = (message: { type: string; payload: T; error?: string }) => {
                if (message.type === method.replace('/', '_') + '_result') {
                    clearTimeout(timeout);
                    if (message.error) {
                        reject(new Error(message.error));
                    } else {
                        resolve(message.payload);
                    }
                }
            };

            // Add listener for response
            this.client.on('message' as never, handler as never);

            // Send request
            this.client.send(method, params).catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    private startSession(agentType: SubagentType): string {
        const sessionId = `${agentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.activeSessions.set(sessionId, {
            agentType,
            startTime: Date.now()
        });
        return sessionId;
    }

    private endSession(sessionId: string): void {
        this.activeSessions.delete(sessionId);
    }

    private emitEvent(type: AgentEventType, data: Partial<AgentEvent>): void {
        this.emit('agent_event', {
            type,
            timestamp: Date.now(),
            ...data
        } as AgentEvent);
    }

    private getStaticAgentList(): AgentInfo[] {
        return Object.values(SubagentType).map(type => ({
            id: type,
            name: type.charAt(0).toUpperCase() + type.slice(1),
            agent_type: 'internal' as const,
            version: '1.0.0',
            capabilities: this.getCapabilitiesForAgent(type),
            status: AgentStatus.AVAILABLE,
            priority: 50,
            last_seen: Date.now(),
            tasks_completed: 0,
            avg_response_time_ms: 0,
            metadata: {},
            model_tier: InternalAgentBridge.DEFAULT_MODEL_ASSIGNMENTS[type]
        }));
    }

    private getCapabilitiesForAgent(agentType: SubagentType): AgentCapability[] {
        const capabilityMap: Record<SubagentType, AgentCapability[]> = {
            [SubagentType.PLANNER]: [AgentCapability.TASK_PLANNING, AgentCapability.CONTEXT_UNDERSTANDING],
            [SubagentType.EXPLORER]: [AgentCapability.SEARCH, AgentCapability.CONTEXT_UNDERSTANDING],
            [SubagentType.CODER]: [AgentCapability.CODE_GENERATION, AgentCapability.MULTI_FILE_EDIT],
            [SubagentType.REVIEWER]: [AgentCapability.CODE_REVIEW],
            [SubagentType.TESTER]: [AgentCapability.TEST_GENERATION],
            [SubagentType.DEBUGGER]: [AgentCapability.BUG_FIX],
            [SubagentType.DOCUMENTER]: [AgentCapability.DOCUMENTATION, AgentCapability.EXPLANATION],
            [SubagentType.REFACTORER]: [AgentCapability.REFACTORING],
            [SubagentType.SECURITY]: [AgentCapability.CODE_REVIEW],
            [SubagentType.GENERAL]: [AgentCapability.CODE_GENERATION, AgentCapability.EXPLANATION]
        };
        return capabilityMap[agentType] || [];
    }

    private getDefaultModelConfig(): ModelRouterConfig {
        return {
            default_tier: ModelTier.BALANCED,
            tier_overrides: InternalAgentBridge.DEFAULT_MODEL_ASSIGNMENTS as Record<SubagentType, ModelTier>,
            models: {
                [ModelTier.FAST]: 'claude-3-haiku',
                [ModelTier.BALANCED]: 'claude-3-5-sonnet',
                [ModelTier.ADVANCED]: 'claude-opus-4',
                [ModelTier.CODE]: 'claude-3-5-sonnet'
            }
        };
    }

    // =========================================================================
    // ENHANCED AGENT METHODS (Phase 3)
    // =========================================================================

    /**
     * Execute with the Documenter agent (enhanced version accepting task string)
     */
    async document(task: string, context: CodeContext): Promise<AgentResult> {
        return this.executeWithAgent(SubagentType.DOCUMENTER, task, context);
    }

    /**
     * Execute with the Tester agent (enhanced version accepting task string)
     */
    async test(task: string, context: CodeContext): Promise<AgentResult> {
        return this.executeWithAgent(SubagentType.TESTER, task, context);
    }

    /**
     * Execute with the Security agent (task-based)
     */
    async security(task: string, context: CodeContext): Promise<AgentResult> {
        return this.executeWithAgent(SubagentType.SECURITY, task, context);
    }

    /**
     * Auto-select and execute with the best agent for a task
     */
    async autoExecute(task: string, context: CodeContext): Promise<AgentResult> {
        const selectedAgent = this.selectAgentForTask(task);
        return this.executeWithAgent(selectedAgent, task, context);
    }

    /**
     * Execute a task with streaming response
     */
    async executeWithStreaming(
        agentType: SubagentType,
        task: string,
        context: CodeContext,
        onChunk: (chunk: string) => void
    ): Promise<AgentResult> {
        const sessionId = this.startSession(agentType);

        try {
            this.emitEvent('agent_started', {
                agent_id: sessionId,
                agent_type: agentType,
                message: `Starting ${agentType} agent (streaming)`
            });

            // Request streaming execution
            const result = await this.sendStreamingRequest(
                'internal_agent/execute_stream',
                { agent_type: agentType, task, context },
                onChunk
            );

            this.emitEvent('agent_completed', {
                agent_id: sessionId,
                agent_type: agentType,
                result,
                message: `${agentType} agent completed (streaming)`
            });

            return result;
        } catch (error) {
            this.emitEvent('agent_failed', {
                agent_id: sessionId,
                agent_type: agentType,
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        } finally {
            this.endSession(sessionId);
        }
    }

    /**
     * Execute multiple agents in parallel
     */
    async executeParallel(
        agents: Array<{ type: SubagentType; task: string }>,
        context: CodeContext
    ): Promise<Map<SubagentType, AgentResult>> {
        const results = new Map<SubagentType, AgentResult>();

        const promises = agents.map(async ({ type, task }) => {
            try {
                const result = await this.executeWithAgent(type, task, context);
                results.set(type, result);
            } catch (error) {
                results.set(type, {
                    success: false,
                    content: '',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });

        await Promise.all(promises);
        return results;
    }

    /**
     * Execute agents in sequence, passing context between them
     */
    async executeSequence(
        agents: Array<{ type: SubagentType; task: string }>,
        context: CodeContext
    ): Promise<AgentResult[]> {
        const results: AgentResult[] = [];
        let currentContext = { ...context };

        for (const { type, task } of agents) {
            const result = await this.executeWithAgent(type, task, currentContext);
            results.push(result);

            // Update context with result for next agent
            if (result.success && result.code_blocks && result.code_blocks.length > 0) {
                currentContext = {
                    ...currentContext,
                    selected_text: result.code_blocks[0].code
                };
            }
        }

        return results;
    }

    /**
     * Get recommendations for agents based on current context
     */
    async getRecommendedAgents(context: CodeContext): Promise<Array<{
        agent: SubagentType;
        reason: string;
        confidence: number;
    }>> {
        const recommendations: Array<{ agent: SubagentType; reason: string; confidence: number }> = [];

        // Analyze context to recommend agents
        if (context.selected_text) {
            const text = context.selected_text.toLowerCase();

            // Check for patterns that suggest specific agents
            if (/todo|fixme|hack|bug/.test(text)) {
                recommendations.push({
                    agent: SubagentType.DEBUGGER,
                    reason: 'Code contains TODO/FIXME comments suggesting bugs',
                    confidence: 0.8
                });
            }

            if (/function|class|const|let|var/.test(text)) {
                recommendations.push({
                    agent: SubagentType.DOCUMENTER,
                    reason: 'Code contains definitions that could use documentation',
                    confidence: 0.7
                });
            }

            if (text.length > 500) {
                recommendations.push({
                    agent: SubagentType.REFACTORER,
                    reason: 'Large code block that might benefit from refactoring',
                    confidence: 0.6
                });
            }
        }

        // Always recommend Explorer for context gathering
        recommendations.push({
            agent: SubagentType.EXPLORER,
            reason: 'Can help understand codebase context',
            confidence: 0.5
        });

        return recommendations.sort((a, b) => b.confidence - a.confidence);
    }

    // =========================================================================
    // STREAMING REQUEST HANDLER
    // =========================================================================

    private async sendStreamingRequest(
        method: string,
        params: unknown,
        onChunk: (chunk: string) => void
    ): Promise<AgentResult> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Streaming request timeout: ${method}`));
            }, 300000); // 5 minute timeout for streaming

            let fullContent = '';

            const chunkHandler = (message: { type: string; chunk?: string; done?: boolean; result?: AgentResult }) => {
                if (message.type === method.replace('/', '_') + '_chunk') {
                    if (message.chunk) {
                        fullContent += message.chunk;
                        onChunk(message.chunk);
                    }
                    if (message.done && message.result) {
                        clearTimeout(timeout);
                        resolve(message.result);
                    }
                }
            };

            const errorHandler = (message: { type: string; error: string }) => {
                if (message.type === method.replace('/', '_') + '_error') {
                    clearTimeout(timeout);
                    reject(new Error(message.error));
                }
            };

            this.client.on('message' as never, chunkHandler as never);
            this.client.on('message' as never, errorHandler as never);

            this.client.send(method, params).catch(error => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    /**
     * Initialize the bridge (called after client connects)
     */
    async initialize(): Promise<void> {
        try {
            // Pre-fetch agent list and model config
            await Promise.all([
                this.getAvailableAgents(true),
                this.getModelConfig(true)
            ]);

            console.log('[InternalAgentBridge] Initialized successfully');
        } catch (error) {
            console.warn('[InternalAgentBridge] Initialization warning:', error);
            // Non-fatal - bridge can still work with static data
        }
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.activeSessions.clear();
        this.cachedAgents = null;
        this.cachedModelConfig = null;
        this.removeAllListeners();
    }
}
