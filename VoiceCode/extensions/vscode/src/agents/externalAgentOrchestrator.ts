/**
 * External Agent Orchestrator
 * Coordinates between VoiceCode's internal agents and external AI coding agents
 * Provides unified interface for multi-agent collaboration
 */

import * as vscode from 'vscode';
import { InternalAgentBridge } from './internalAgentBridge';
import { VoiceAgentRouter } from './voiceAgentRouter';
import {
    SubagentType,
    OrchestrationStrategy,
    ExternalAgentType,
    AgentResult,
    CodeContext,
    AgentStatus
} from '../types/agents';

/**
 * External agent execution result
 */
interface ExternalAgentResult {
    agent: ExternalAgentType;
    success: boolean;
    content?: string;
    error?: string;
    executionTime: number;
}

/**
 * Hybrid execution result
 */
interface HybridExecutionResult {
    internalResults: AgentResult[];
    externalResults: ExternalAgentResult[];
    mergedContent?: string;
    success: boolean;
    totalExecutionTime: number;
}

/**
 * Agent collaboration mode
 */
type CollaborationMode =
    | 'internal_only'      // Only use VoiceCode internal agents
    | 'external_only'      // Only use external agents
    | 'internal_first'     // Try internal first, fallback to external
    | 'external_first'     // Try external first, fallback to internal
    | 'parallel'           // Run both in parallel
    | 'consensus'          // Run both and merge results
    | 'best_match';        // Route to best agent based on task

/**
 * External agent adapter interface
 */
interface ExternalAgentAdapter {
    type: ExternalAgentType;
    name: string;
    isAvailable(): Promise<boolean>;
    execute(task: string, context?: CodeContext): Promise<ExternalAgentResult>;
    capabilities: string[];
}

/**
 * Claude Code adapter
 */
class ClaudeCodeAdapter implements ExternalAgentAdapter {
    type = ExternalAgentType.CLAUDE_CODE;
    name = 'Claude Code';
    capabilities = ['code_generation', 'debugging', 'explanation', 'refactoring', 'review'];

    async isAvailable(): Promise<boolean> {
        const commands = await vscode.commands.getCommands();
        return commands.some(cmd =>
            cmd.toLowerCase().includes('claude') ||
            cmd.toLowerCase().includes('anthropic')
        );
    }

    async execute(task: string, context?: CodeContext): Promise<ExternalAgentResult> {
        const startTime = Date.now();

        try {
            // Try to invoke Claude Code chat
            const commands = await vscode.commands.getCommands();
            const claudeCommand = commands.find(cmd =>
                cmd.toLowerCase().includes('claude') &&
                cmd.toLowerCase().includes('chat')
            );

            if (claudeCommand) {
                await vscode.commands.executeCommand(claudeCommand, task);
                return {
                    agent: this.type,
                    success: true,
                    content: 'Task sent to Claude Code',
                    executionTime: Date.now() - startTime
                };
            }

            // Copy to clipboard as fallback
            await vscode.env.clipboard.writeText(task);
            return {
                agent: this.type,
                success: true,
                content: 'Task copied to clipboard for Claude Code',
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                agent: this.type,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime: Date.now() - startTime
            };
        }
    }
}

/**
 * GitHub Copilot adapter
 */
class CopilotAdapter implements ExternalAgentAdapter {
    type = ExternalAgentType.COPILOT;
    name = 'GitHub Copilot';
    capabilities = ['code_completion', 'inline_suggestions', 'chat', 'explanation'];

    async isAvailable(): Promise<boolean> {
        const extensions = vscode.extensions.all;
        return extensions.some(ext =>
            ext.id.toLowerCase() === 'github.copilot' ||
            ext.id.toLowerCase() === 'github.copilot-chat'
        );
    }

    async execute(task: string, context?: CodeContext): Promise<ExternalAgentResult> {
        const startTime = Date.now();

        try {
            // Try Copilot Chat
            const commands = await vscode.commands.getCommands();
            const chatCommand = commands.find(cmd =>
                cmd.includes('github.copilot') && cmd.includes('chat')
            );

            if (chatCommand) {
                await vscode.commands.executeCommand(chatCommand);
                // Copilot chat doesn't have a direct API, so we just open it
                return {
                    agent: this.type,
                    success: true,
                    content: 'Opened Copilot Chat - please enter your request',
                    executionTime: Date.now() - startTime
                };
            }

            return {
                agent: this.type,
                success: false,
                error: 'Copilot Chat command not found',
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                agent: this.type,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime: Date.now() - startTime
            };
        }
    }
}

/**
 * Augment Code adapter
 */
class AugmentAdapter implements ExternalAgentAdapter {
    type = ExternalAgentType.AUGMENT;
    name = 'Augment Code';
    capabilities = ['code_generation', 'explanation', 'context_aware'];

    async isAvailable(): Promise<boolean> {
        const extensions = vscode.extensions.all;
        return extensions.some(ext =>
            ext.id.toLowerCase().includes('augment')
        );
    }

    async execute(task: string, context?: CodeContext): Promise<ExternalAgentResult> {
        const startTime = Date.now();

        try {
            const commands = await vscode.commands.getCommands();
            const augmentCommand = commands.find(cmd =>
                cmd.toLowerCase().includes('augment')
            );

            if (augmentCommand) {
                await vscode.commands.executeCommand(augmentCommand, task);
                return {
                    agent: this.type,
                    success: true,
                    content: 'Task sent to Augment',
                    executionTime: Date.now() - startTime
                };
            }

            return {
                agent: this.type,
                success: false,
                error: 'Augment command not found',
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                agent: this.type,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime: Date.now() - startTime
            };
        }
    }
}

/**
 * External Agent Orchestrator
 * Manages coordination between internal and external agents
 */
export class ExternalAgentOrchestrator implements vscode.Disposable {
    private bridge: InternalAgentBridge;
    private router: VoiceAgentRouter;
    private adapters: Map<ExternalAgentType, ExternalAgentAdapter> = new Map();
    private collaborationMode: CollaborationMode = 'best_match';
    private outputChannel: vscode.OutputChannel;
    private statusBarItem: vscode.StatusBarItem;
    private executionHistory: HybridExecutionResult[] = [];
    private maxHistorySize = 50;

    constructor(bridge: InternalAgentBridge, router: VoiceAgentRouter) {
        this.bridge = bridge;
        this.router = router;
        this.outputChannel = vscode.window.createOutputChannel('VoiceCode Orchestrator');
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);

        this.initializeAdapters();
        this.updateStatusBar();
    }

    /**
     * Initialize external agent adapters
     */
    private initializeAdapters(): void {
        this.adapters.set(ExternalAgentType.CLAUDE_CODE, new ClaudeCodeAdapter());
        this.adapters.set(ExternalAgentType.COPILOT, new CopilotAdapter());
        this.adapters.set(ExternalAgentType.AUGMENT, new AugmentAdapter());
    }

    /**
     * Get available external agents
     */
    async getAvailableExternalAgents(): Promise<ExternalAgentType[]> {
        const available: ExternalAgentType[] = [];

        for (const [type, adapter] of this.adapters) {
            if (await adapter.isAvailable()) {
                available.push(type);
            }
        }

        return available;
    }

    /**
     * Set collaboration mode
     */
    setCollaborationMode(mode: CollaborationMode): void {
        this.collaborationMode = mode;
        this.updateStatusBar();
        this.log(`Collaboration mode set to: ${mode}`);
    }

    /**
     * Get current collaboration mode
     */
    getCollaborationMode(): CollaborationMode {
        return this.collaborationMode;
    }

    /**
     * Execute task with current collaboration mode
     */
    async execute(task: string, context?: CodeContext): Promise<HybridExecutionResult> {
        const startTime = Date.now();

        switch (this.collaborationMode) {
            case 'internal_only':
                return this.executeInternalOnly(task, context, startTime);

            case 'external_only':
                return this.executeExternalOnly(task, context, startTime);

            case 'internal_first':
                return this.executeInternalFirst(task, context, startTime);

            case 'external_first':
                return this.executeExternalFirst(task, context, startTime);

            case 'parallel':
                return this.executeParallel(task, context, startTime);

            case 'consensus':
                return this.executeConsensus(task, context, startTime);

            case 'best_match':
            default:
                return this.executeBestMatch(task, context, startTime);
        }
    }

    /**
     * Execute with internal agents only
     */
    private async executeInternalOnly(
        task: string,
        context: CodeContext | undefined,
        startTime: number
    ): Promise<HybridExecutionResult> {
        const route = await this.router.route(task);
        const internalResults: AgentResult[] = [];

        if (route.type === 'internal' && route.agent) {
            const result = await this.bridge.executeWithAgent(route.agent, route.extractedTask, context);
            internalResults.push(result);
        } else {
            // Default to coder agent
            const result = await this.bridge.code(task, context);
            internalResults.push(result);
        }

        const hybridResult: HybridExecutionResult = {
            internalResults,
            externalResults: [],
            success: internalResults.some(r => r.success),
            mergedContent: internalResults.find(r => r.success)?.content,
            totalExecutionTime: Date.now() - startTime
        };

        this.addToHistory(hybridResult);
        return hybridResult;
    }

    /**
     * Execute with external agents only
     */
    private async executeExternalOnly(
        task: string,
        context: CodeContext | undefined,
        startTime: number
    ): Promise<HybridExecutionResult> {
        const available = await this.getAvailableExternalAgents();
        const externalResults: ExternalAgentResult[] = [];

        if (available.length === 0) {
            return {
                internalResults: [],
                externalResults: [],
                success: false,
                totalExecutionTime: Date.now() - startTime
            };
        }

        // Use first available external agent
        const adapter = this.adapters.get(available[0]);
        if (adapter) {
            const result = await adapter.execute(task, context);
            externalResults.push(result);
        }

        const hybridResult: HybridExecutionResult = {
            internalResults: [],
            externalResults,
            success: externalResults.some(r => r.success),
            mergedContent: externalResults.find(r => r.success)?.content,
            totalExecutionTime: Date.now() - startTime
        };

        this.addToHistory(hybridResult);
        return hybridResult;
    }

    /**
     * Execute internal first, fallback to external
     */
    private async executeInternalFirst(
        task: string,
        context: CodeContext | undefined,
        startTime: number
    ): Promise<HybridExecutionResult> {
        // Try internal first
        const internalResult = await this.executeInternalOnly(task, context, startTime);

        if (internalResult.success) {
            return internalResult;
        }

        // Fallback to external
        this.log('Internal execution failed, falling back to external agents');
        const externalResult = await this.executeExternalOnly(task, context, startTime);

        return {
            internalResults: internalResult.internalResults,
            externalResults: externalResult.externalResults,
            success: externalResult.success,
            mergedContent: externalResult.mergedContent,
            totalExecutionTime: Date.now() - startTime
        };
    }

    /**
     * Execute external first, fallback to internal
     */
    private async executeExternalFirst(
        task: string,
        context: CodeContext | undefined,
        startTime: number
    ): Promise<HybridExecutionResult> {
        const available = await this.getAvailableExternalAgents();

        // Try external first if available
        if (available.length > 0) {
            const externalResult = await this.executeExternalOnly(task, context, startTime);
            if (externalResult.success) {
                return externalResult;
            }
        }

        // Fallback to internal
        this.log('External execution failed or unavailable, falling back to internal agents');
        return this.executeInternalOnly(task, context, startTime);
    }

    /**
     * Execute both internal and external in parallel
     */
    private async executeParallel(
        task: string,
        context: CodeContext | undefined,
        startTime: number
    ): Promise<HybridExecutionResult> {
        const [internalResult, externalResult] = await Promise.all([
            this.executeInternalOnly(task, context, startTime),
            this.executeExternalOnly(task, context, startTime)
        ]);

        const hybridResult: HybridExecutionResult = {
            internalResults: internalResult.internalResults,
            externalResults: externalResult.externalResults,
            success: internalResult.success || externalResult.success,
            totalExecutionTime: Date.now() - startTime
        };

        // Prefer internal result if successful
        if (internalResult.success) {
            hybridResult.mergedContent = internalResult.mergedContent;
        } else if (externalResult.success) {
            hybridResult.mergedContent = externalResult.mergedContent;
        }

        this.addToHistory(hybridResult);
        return hybridResult;
    }

    /**
     * Execute both and merge results
     */
    private async executeConsensus(
        task: string,
        context: CodeContext | undefined,
        startTime: number
    ): Promise<HybridExecutionResult> {
        const parallelResult = await this.executeParallel(task, context, startTime);

        // Merge results if both successful
        if (parallelResult.internalResults.some(r => r.success) &&
            parallelResult.externalResults.some(r => r.success)) {
            const internalContent = parallelResult.internalResults.find(r => r.success)?.content || '';
            const externalContent = parallelResult.externalResults.find(r => r.success)?.content || '';

            parallelResult.mergedContent = `## Internal Agent Result\n\n${internalContent}\n\n## External Agent Result\n\n${externalContent}`;
        }

        this.addToHistory(parallelResult);
        return parallelResult;
    }

    /**
     * Route to best agent based on task
     */
    private async executeBestMatch(
        task: string,
        context: CodeContext | undefined,
        startTime: number
    ): Promise<HybridExecutionResult> {
        const route = await this.router.route(task);

        if (route.type === 'external' && route.externalAgent) {
            const adapter = this.adapters.get(route.externalAgent);
            if (adapter && await adapter.isAvailable()) {
                const result = await adapter.execute(route.extractedTask, context);
                const hybridResult: HybridExecutionResult = {
                    internalResults: [],
                    externalResults: [result],
                    success: result.success,
                    mergedContent: result.content,
                    totalExecutionTime: Date.now() - startTime
                };
                this.addToHistory(hybridResult);
                return hybridResult;
            }
        }

        // Default to internal
        return this.executeInternalOnly(task, context, startTime);
    }

    /**
     * Execute with specific external agent
     */
    async executeWithExternalAgent(
        agentType: ExternalAgentType,
        task: string,
        context?: CodeContext
    ): Promise<ExternalAgentResult> {
        const adapter = this.adapters.get(agentType);

        if (!adapter) {
            return {
                agent: agentType,
                success: false,
                error: `No adapter for ${agentType}`,
                executionTime: 0
            };
        }

        if (!await adapter.isAvailable()) {
            return {
                agent: agentType,
                success: false,
                error: `${adapter.name} is not available`,
                executionTime: 0
            };
        }

        return adapter.execute(task, context);
    }

    /**
     * Execute hybrid task with specific internal and external agents
     */
    async executeHybrid(
        task: string,
        internalAgent: SubagentType,
        externalAgent: ExternalAgentType,
        context?: CodeContext
    ): Promise<HybridExecutionResult> {
        const startTime = Date.now();

        const [internalResult, externalResult] = await Promise.all([
            this.bridge.executeWithAgent(internalAgent, task, context),
            this.executeWithExternalAgent(externalAgent, task, context)
        ]);

        const hybridResult: HybridExecutionResult = {
            internalResults: [internalResult],
            externalResults: [externalResult],
            success: internalResult.success || externalResult.success,
            totalExecutionTime: Date.now() - startTime
        };

        if (internalResult.success && externalResult.success) {
            hybridResult.mergedContent = `## ${internalAgent} (Internal)\n\n${internalResult.content}\n\n## ${externalAgent} (External)\n\n${externalResult.content}`;
        } else if (internalResult.success) {
            hybridResult.mergedContent = internalResult.content;
        } else if (externalResult.success) {
            hybridResult.mergedContent = externalResult.content;
        }

        this.addToHistory(hybridResult);
        return hybridResult;
    }

    /**
     * Get agent capabilities comparison
     */
    async getAgentCapabilities(): Promise<Map<string, string[]>> {
        const capabilities = new Map<string, string[]>();

        // Internal agents
        const agents = await this.bridge.getAvailableAgents();
        for (const agent of agents) {
            capabilities.set(`internal:${agent.id}`, agent.capabilities);
        }

        // External agents
        for (const [type, adapter] of this.adapters) {
            if (await adapter.isAvailable()) {
                capabilities.set(`external:${type}`, adapter.capabilities);
            }
        }

        return capabilities;
    }

    /**
     * Suggest best agent for task
     */
    async suggestAgent(task: string): Promise<{
        internal?: SubagentType;
        external?: ExternalAgentType;
        confidence: number;
        reason: string;
    }> {
        const route = await this.router.route(task);
        const available = await this.getAvailableExternalAgents();

        if (route.type === 'internal' && route.agent) {
            return {
                internal: route.agent,
                confidence: route.confidence,
                reason: `Best match for "${task.substring(0, 50)}..." based on task analysis`
            };
        }

        if (route.type === 'external' && route.externalAgent && available.includes(route.externalAgent)) {
            return {
                external: route.externalAgent,
                confidence: route.confidence,
                reason: `Explicitly requested ${route.externalAgent}`
            };
        }

        // Default suggestion
        return {
            internal: SubagentType.CODER,
            confidence: 0.5,
            reason: 'Default agent for general coding tasks'
        };
    }

    /**
     * Get execution history
     */
    getHistory(): HybridExecutionResult[] {
        return [...this.executionHistory];
    }

    /**
     * Get execution statistics
     */
    getStatistics(): Record<string, unknown> {
        const stats = {
            totalExecutions: this.executionHistory.length,
            successRate: 0,
            averageExecutionTime: 0,
            internalOnlySuccess: 0,
            externalOnlySuccess: 0,
            hybridSuccess: 0
        };

        if (this.executionHistory.length > 0) {
            const successCount = this.executionHistory.filter(r => r.success).length;
            stats.successRate = successCount / this.executionHistory.length;

            const totalTime = this.executionHistory.reduce((sum, r) => sum + r.totalExecutionTime, 0);
            stats.averageExecutionTime = totalTime / this.executionHistory.length;

            stats.internalOnlySuccess = this.executionHistory.filter(
                r => r.internalResults.length > 0 && r.externalResults.length === 0 && r.success
            ).length;

            stats.externalOnlySuccess = this.executionHistory.filter(
                r => r.externalResults.length > 0 && r.internalResults.length === 0 && r.success
            ).length;

            stats.hybridSuccess = this.executionHistory.filter(
                r => r.internalResults.length > 0 && r.externalResults.length > 0 && r.success
            ).length;
        }

        return stats;
    }

    /**
     * Add result to history
     */
    private addToHistory(result: HybridExecutionResult): void {
        this.executionHistory.unshift(result);
        if (this.executionHistory.length > this.maxHistorySize) {
            this.executionHistory.pop();
        }
    }

    /**
     * Update status bar
     */
    private updateStatusBar(): void {
        const modeLabels: Record<CollaborationMode, string> = {
            'internal_only': 'Internal',
            'external_only': 'External',
            'internal_first': 'Int→Ext',
            'external_first': 'Ext→Int',
            'parallel': 'Parallel',
            'consensus': 'Consensus',
            'best_match': 'Auto'
        };

        this.statusBarItem.text = `$(hubot) ${modeLabels[this.collaborationMode]}`;
        this.statusBarItem.tooltip = `VoiceCode Orchestrator: ${this.collaborationMode}\nClick to change mode`;
        this.statusBarItem.command = 'voicecode.selectCollaborationMode';
        this.statusBarItem.show();
    }

    /**
     * Log message
     */
    private log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.outputChannel.dispose();
        this.statusBarItem.dispose();
    }
}

/**
 * Register External Agent Orchestrator commands
 */
export function registerExternalAgentOrchestratorCommands(
    context: vscode.ExtensionContext,
    bridge: InternalAgentBridge,
    router: VoiceAgentRouter
): ExternalAgentOrchestrator {
    const orchestrator = new ExternalAgentOrchestrator(bridge, router);
    context.subscriptions.push(orchestrator);

    // Execute with orchestrator
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.executeWithOrchestrator', async (task?: string) => {
            if (!task) {
                task = await vscode.window.showInputBox({
                    prompt: 'Enter task to execute',
                    placeHolder: 'e.g., "implement user authentication"'
                });
            }

            if (!task) return;

            const result = await orchestrator.execute(task);

            // Show result in output channel
            const outputChannel = vscode.window.createOutputChannel('VoiceCode Result');
            outputChannel.clear();
            outputChannel.appendLine('=== Execution Result ===\n');
            outputChannel.appendLine(`Success: ${result.success}`);
            outputChannel.appendLine(`Execution Time: ${result.totalExecutionTime}ms`);

            if (result.mergedContent) {
                outputChannel.appendLine('\n--- Content ---\n');
                outputChannel.appendLine(result.mergedContent);
            }

            outputChannel.show();
        })
    );

    // Select collaboration mode
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.selectCollaborationMode', async () => {
            const modes: { label: string; mode: CollaborationMode; description: string }[] = [
                { label: '$(robot) Internal Only', mode: 'internal_only', description: 'Use only VoiceCode internal agents' },
                { label: '$(cloud) External Only', mode: 'external_only', description: 'Use only external agents (Claude Code, Copilot, etc.)' },
                { label: '$(arrow-right) Internal First', mode: 'internal_first', description: 'Try internal first, fallback to external' },
                { label: '$(arrow-left) External First', mode: 'external_first', description: 'Try external first, fallback to internal' },
                { label: '$(git-compare) Parallel', mode: 'parallel', description: 'Run both in parallel' },
                { label: '$(law) Consensus', mode: 'consensus', description: 'Run both and merge results' },
                { label: '$(zap) Best Match', mode: 'best_match', description: 'Auto-route to best agent (Recommended)' }
            ];

            const current = orchestrator.getCollaborationMode();
            const selected = await vscode.window.showQuickPick(
                modes.map(m => ({
                    ...m,
                    picked: m.mode === current
                })),
                {
                    placeHolder: 'Select collaboration mode',
                    title: 'VoiceCode Orchestrator Mode'
                }
            );

            if (selected) {
                orchestrator.setCollaborationMode(selected.mode);
                vscode.window.showInformationMessage(`Collaboration mode: ${selected.mode}`);
            }
        })
    );

    // Show available agents
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.showAvailableAgents', async () => {
            const internalAgents = await bridge.getAvailableAgents();
            const externalAgents = await orchestrator.getAvailableExternalAgents();

            const items: vscode.QuickPickItem[] = [];

            items.push({ label: '--- Internal Agents ---', kind: vscode.QuickPickItemKind.Separator });
            for (const agent of internalAgents) {
                const icon = InternalAgentBridge.AGENT_ICONS[agent.id as SubagentType];
                items.push({
                    label: `$(${icon}) ${agent.name}`,
                    description: agent.status,
                    detail: InternalAgentBridge.AGENT_DESCRIPTIONS[agent.id as SubagentType]
                });
            }

            items.push({ label: '--- External Agents ---', kind: vscode.QuickPickItemKind.Separator });
            for (const agentType of externalAgents) {
                items.push({
                    label: `$(cloud) ${agentType}`,
                    description: 'Available'
                });
            }

            if (externalAgents.length === 0) {
                items.push({
                    label: '$(warning) No external agents available',
                    description: 'Install Claude Code, Copilot, or other extensions'
                });
            }

            await vscode.window.showQuickPick(items, {
                placeHolder: 'Available AI Agents',
                title: 'VoiceCode Agent Overview'
            });
        })
    );

    // Suggest agent for task
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.suggestAgentForTask', async (task?: string) => {
            if (!task) {
                task = await vscode.window.showInputBox({
                    prompt: 'Enter task to analyze',
                    placeHolder: 'e.g., "find all authentication bugs"'
                });
            }

            if (!task) return;

            const suggestion = await orchestrator.suggestAgent(task);

            let message = `Suggested: `;
            if (suggestion.internal) {
                message += `${suggestion.internal} (internal)`;
            } else if (suggestion.external) {
                message += `${suggestion.external} (external)`;
            }
            message += ` - ${(suggestion.confidence * 100).toFixed(0)}% confidence`;

            const action = await vscode.window.showInformationMessage(
                message,
                'Execute',
                'Change'
            );

            if (action === 'Execute') {
                if (suggestion.internal) {
                    await vscode.commands.executeCommand('voicecode.useInternalAgent', {
                        id: suggestion.internal,
                        task
                    });
                } else if (suggestion.external) {
                    await orchestrator.executeWithExternalAgent(suggestion.external, task);
                }
            } else if (action === 'Change') {
                await vscode.commands.executeCommand('voicecode.selectInternalAgent');
            }
        })
    );

    // Show orchestrator statistics
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.showOrchestratorStats', async () => {
            const stats = orchestrator.getStatistics();

            const message = `Orchestrator Statistics:
• Total Executions: ${stats.totalExecutions}
• Success Rate: ${((stats.successRate as number) * 100).toFixed(1)}%
• Avg Execution Time: ${(stats.averageExecutionTime as number).toFixed(0)}ms
• Internal Only Success: ${stats.internalOnlySuccess}
• External Only Success: ${stats.externalOnlySuccess}
• Hybrid Success: ${stats.hybridSuccess}`;

            vscode.window.showInformationMessage(message, { modal: true });
        })
    );

    // Execute hybrid with selected agents
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.executeHybrid', async () => {
            // Select internal agent
            const internalAgents = await bridge.getAvailableAgents();
            const internalItems = internalAgents.map(agent => ({
                label: agent.name,
                agent: agent.id as SubagentType
            }));

            const internalSelection = await vscode.window.showQuickPick(internalItems, {
                placeHolder: 'Select internal agent'
            });

            if (!internalSelection) return;

            // Select external agent
            const externalAgents = await orchestrator.getAvailableExternalAgents();
            if (externalAgents.length === 0) {
                vscode.window.showWarningMessage('No external agents available');
                return;
            }

            const externalItems = externalAgents.map(agent => ({
                label: agent,
                agent
            }));

            const externalSelection = await vscode.window.showQuickPick(externalItems, {
                placeHolder: 'Select external agent'
            });

            if (!externalSelection) return;

            // Get task
            const task = await vscode.window.showInputBox({
                prompt: 'Enter task to execute',
                placeHolder: 'e.g., "implement user login"'
            });

            if (!task) return;

            // Execute hybrid
            const result = await orchestrator.executeHybrid(
                task,
                internalSelection.agent,
                externalSelection.agent
            );

            // Show result
            if (result.success) {
                vscode.window.showInformationMessage(
                    `Hybrid execution complete (${result.totalExecutionTime}ms)`
                );
            } else {
                vscode.window.showErrorMessage('Hybrid execution failed');
            }
        })
    );

    return orchestrator;
}
