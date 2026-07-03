/**
 * Internal Agents Tree View Provider
 * Provides a tree view of VoiceCode's internal agents, pipelines, and strategies
 */

import * as vscode from 'vscode';
import { InternalAgentBridge, PipelineType } from './internalAgentBridge';
import {
    SubagentType,
    OrchestrationStrategy,
    AgentInfo,
    AgentStatus,
    ModelTier
} from '../types/agents';

/**
 * Tree item types
 */
type TreeItemType =
    | 'category'
    | 'agent'
    | 'pipeline'
    | 'strategy'
    | 'session'
    | 'info';

/**
 * Pipeline definition
 */
interface PipelineDefinition {
    type: PipelineType;
    name: string;
    description: string;
    stages: SubagentType[];
    icon: string;
}

/**
 * Strategy definition
 */
interface StrategyDefinition {
    type: OrchestrationStrategy;
    name: string;
    description: string;
    icon: string;
}

/**
 * Predefined pipelines
 */
const PIPELINES: PipelineDefinition[] = [
    {
        type: 'plan_implement_review',
        name: 'Plan → Implement → Review',
        description: 'Full development cycle with planning, coding, and review',
        stages: [SubagentType.PLANNER, SubagentType.CODER, SubagentType.REVIEWER],
        icon: 'checklist'
    },
    {
        type: 'explore_plan_implement',
        name: 'Explore → Plan → Implement',
        description: 'Discovery-first development approach',
        stages: [SubagentType.EXPLORER, SubagentType.PLANNER, SubagentType.CODER],
        icon: 'search'
    },
    {
        type: 'debug_fix_test',
        name: 'Debug → Fix → Test',
        description: 'Bug diagnosis, fix, and validation',
        stages: [SubagentType.DEBUGGER, SubagentType.CODER, SubagentType.TESTER],
        icon: 'bug'
    },
    {
        type: 'security_audit_fix',
        name: 'Security Audit → Fix',
        description: 'Security vulnerability detection and remediation',
        stages: [SubagentType.SECURITY, SubagentType.CODER],
        icon: 'shield'
    },
    {
        type: 'refactor_review_test',
        name: 'Refactor → Review → Test',
        description: 'Safe code improvement with validation',
        stages: [SubagentType.REFACTORER, SubagentType.REVIEWER, SubagentType.TESTER],
        icon: 'wrench'
    }
];

/**
 * Predefined strategies
 */
const STRATEGIES: StrategyDefinition[] = [
    {
        type: OrchestrationStrategy.SINGLE_AGENT,
        name: 'Single Agent',
        description: 'Route to the best agent for the task',
        icon: 'zap'
    },
    {
        type: OrchestrationStrategy.RACE_EXECUTION,
        name: 'Race Execution',
        description: 'Run agents in parallel, take first result',
        icon: 'flame'
    },
    {
        type: OrchestrationStrategy.CONSENSUS,
        name: 'Consensus',
        description: 'Run agents in parallel, aggregate results',
        icon: 'law'
    },
    {
        type: OrchestrationStrategy.PIPELINE,
        name: 'Pipeline',
        description: 'Execute through sequential stages',
        icon: 'git-merge'
    },
    {
        type: OrchestrationStrategy.DECOMPOSITION,
        name: 'Decomposition',
        description: 'Split task across specialized agents',
        icon: 'split-horizontal'
    }
];

/**
 * Agent Tree Item
 */
class AgentTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly itemType: TreeItemType,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly data?: AgentInfo | PipelineDefinition | StrategyDefinition | Record<string, unknown>
    ) {
        super(label, collapsibleState);
    }

    // Make the icon configurable
    public setIcon(icon: string): void {
        this.iconPath = new vscode.ThemeIcon(icon);
    }
}

/**
 * Internal Agents Tree Data Provider
 */
export class InternalAgentsProvider implements vscode.TreeDataProvider<AgentTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<AgentTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private bridge: InternalAgentBridge;
    private showModelInfo: boolean = true;

    constructor(bridge: InternalAgentBridge) {
        this.bridge = bridge;

        // Listen for agent events to refresh
        this.bridge.on('agent_event', () => {
            this.refresh();
        });
    }

    /**
     * Refresh the tree view
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Toggle model info display
     */
    toggleModelInfo(): void {
        this.showModelInfo = !this.showModelInfo;
        this.refresh();
    }

    getTreeItem(element: AgentTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: AgentTreeItem): Promise<AgentTreeItem[]> {
        if (!element) {
            // Root level - show categories
            return this.getRootItems();
        }

        // Handle category children
        if (element.itemType === 'category') {
            switch (element.label) {
                case 'Internal Agents':
                    return this.getAgentItems();
                case 'Pipelines':
                    return this.getPipelineItems();
                case 'Strategies':
                    return this.getStrategyItems();
                case 'Active Sessions':
                    return this.getSessionItems();
            }
        }

        // Handle pipeline stages
        if (element.itemType === 'pipeline' && element.data) {
            const pipeline = element.data as PipelineDefinition;
            return this.getPipelineStageItems(pipeline);
        }

        return [];
    }

    /**
     * Get root category items
     */
    private getRootItems(): AgentTreeItem[] {
        const items: AgentTreeItem[] = [];

        // Internal Agents category
        const agentsItem = new AgentTreeItem(
            'Internal Agents',
            'category',
            vscode.TreeItemCollapsibleState.Expanded
        );
        agentsItem.setIcon('robot');
        agentsItem.tooltip = '9 specialized AI agents for coding tasks';
        agentsItem.contextValue = 'category-agents';
        items.push(agentsItem);

        // Pipelines category
        const pipelinesItem = new AgentTreeItem(
            'Pipelines',
            'category',
            vscode.TreeItemCollapsibleState.Collapsed
        );
        pipelinesItem.setIcon('git-merge');
        pipelinesItem.tooltip = 'Multi-agent workflows';
        pipelinesItem.contextValue = 'category-pipelines';
        items.push(pipelinesItem);

        // Strategies category
        const strategiesItem = new AgentTreeItem(
            'Strategies',
            'category',
            vscode.TreeItemCollapsibleState.Collapsed
        );
        strategiesItem.setIcon('symbol-misc');
        strategiesItem.tooltip = 'Orchestration strategies for multi-agent execution';
        strategiesItem.contextValue = 'category-strategies';
        items.push(strategiesItem);

        // Active Sessions (only show if there are active sessions)
        const activeSessions = this.bridge.getActiveSessions();
        if (activeSessions.length > 0) {
            const sessionsItem = new AgentTreeItem(
                'Active Sessions',
                'category',
                vscode.TreeItemCollapsibleState.Expanded
            );
            sessionsItem.setIcon('pulse');
            sessionsItem.tooltip = `${activeSessions.length} active agent session(s)`;
            sessionsItem.contextValue = 'category-sessions';
            items.push(sessionsItem);
        }

        return items;
    }

    /**
     * Get agent tree items
     */
    private async getAgentItems(): Promise<AgentTreeItem[]> {
        const agents = await this.bridge.getAvailableAgents();
        const modelConfig = await this.bridge.getModelConfig();

        return agents.map(agent => {
            const agentType = agent.id as SubagentType;
            const icon = InternalAgentBridge.AGENT_ICONS[agentType] || 'robot';
            const modelTier = modelConfig.tier_overrides[agentType] || modelConfig.default_tier;
            const modelName = this.getModelDisplayName(modelTier);

            const item = new AgentTreeItem(
                agent.name,
                'agent',
                vscode.TreeItemCollapsibleState.None,
                agent
            );

            item.setIcon(icon);
            item.description = this.showModelInfo ? modelName : undefined;
            item.tooltip = this.createAgentTooltip(agent, modelTier);
            item.contextValue = `agent-${agentType}`;

            // Add status indicator
            if (agent.status !== AgentStatus.AVAILABLE) {
                item.description = `${modelName} (${agent.status})`;
            }

            // Command to use this agent
            item.command = {
                command: 'voicecode.useInternalAgent',
                title: 'Use Agent',
                arguments: [agent]
            };

            return item;
        });
    }

    /**
     * Get pipeline tree items
     */
    private getPipelineItems(): AgentTreeItem[] {
        return PIPELINES.map(pipeline => {
            const item = new AgentTreeItem(
                pipeline.name,
                'pipeline',
                vscode.TreeItemCollapsibleState.Collapsed,
                pipeline
            );

            item.setIcon(pipeline.icon);
            item.description = `${pipeline.stages.length} stages`;
            item.tooltip = pipeline.description;
            item.contextValue = `pipeline-${pipeline.type}`;

            return item;
        });
    }

    /**
     * Get pipeline stage items
     */
    private getPipelineStageItems(pipeline: PipelineDefinition): AgentTreeItem[] {
        return pipeline.stages.map((stage, index) => {
            const icon = InternalAgentBridge.AGENT_ICONS[stage] || 'robot';
            const stageName = stage.charAt(0).toUpperCase() + stage.slice(1);

            const item = new AgentTreeItem(
                `${index + 1}. ${stageName}`,
                'info',
                vscode.TreeItemCollapsibleState.None
            );

            item.setIcon(icon);
            item.tooltip = InternalAgentBridge.AGENT_DESCRIPTIONS[stage];
            item.contextValue = 'pipeline-stage';

            return item;
        });
    }

    /**
     * Get strategy tree items
     */
    private getStrategyItems(): AgentTreeItem[] {
        return STRATEGIES.map(strategy => {
            const item = new AgentTreeItem(
                strategy.name,
                'strategy',
                vscode.TreeItemCollapsibleState.None,
                strategy
            );

            item.setIcon(strategy.icon);
            item.tooltip = strategy.description;
            item.contextValue = `strategy-${strategy.type}`;

            // Command to use this strategy
            item.command = {
                command: 'voicecode.executeWithStrategy',
                title: 'Execute with Strategy',
                arguments: [strategy.type]
            };

            return item;
        });
    }

    /**
     * Get active session items
     */
    private getSessionItems(): AgentTreeItem[] {
        const sessions = this.bridge.getActiveSessions();

        return sessions.map(session => {
            const icon = InternalAgentBridge.AGENT_ICONS[session.agentType] || 'robot';
            const durationSec = (session.duration / 1000).toFixed(1);

            const item = new AgentTreeItem(
                `${session.agentType}`,
                'session',
                vscode.TreeItemCollapsibleState.None,
                { sessionId: session.id, agentType: session.agentType }
            );

            item.setIcon(icon);
            item.description = `${durationSec}s`;
            item.tooltip = `Session ID: ${session.id}\nDuration: ${durationSec}s`;
            item.contextValue = 'active-session';

            return item;
        });
    }

    /**
     * Get display name for model tier
     */
    private getModelDisplayName(tier: ModelTier): string {
        const names: Record<ModelTier, string> = {
            [ModelTier.FAST]: 'Haiku',
            [ModelTier.BALANCED]: 'Sonnet',
            [ModelTier.ADVANCED]: 'Opus',
            [ModelTier.CODE]: 'Sonnet'
        };
        return names[tier] || tier;
    }

    /**
     * Create tooltip for agent
     */
    private createAgentTooltip(agent: AgentInfo, modelTier: ModelTier): vscode.MarkdownString {
        const md = new vscode.MarkdownString();
        md.isTrusted = true;

        const agentType = agent.id as SubagentType;
        const description = InternalAgentBridge.AGENT_DESCRIPTIONS[agentType] || '';

        md.appendMarkdown(`### ${agent.name}\n\n`);
        md.appendMarkdown(`${description}\n\n`);
        md.appendMarkdown(`---\n\n`);
        md.appendMarkdown(`**Model:** ${this.getModelDisplayName(modelTier)}\n\n`);
        md.appendMarkdown(`**Status:** ${agent.status}\n\n`);

        if (agent.tasks_completed > 0) {
            md.appendMarkdown(`**Tasks Completed:** ${agent.tasks_completed}\n\n`);
            md.appendMarkdown(`**Avg Response:** ${agent.avg_response_time_ms}ms\n\n`);
        }

        if (agent.capabilities.length > 0) {
            md.appendMarkdown(`**Capabilities:**\n`);
            agent.capabilities.slice(0, 5).forEach(cap => {
                md.appendMarkdown(`- ${cap}\n`);
            });
        }

        return md;
    }
}

/**
 * Register tree view and related commands
 */
export function registerInternalAgentsTreeView(
    context: vscode.ExtensionContext,
    bridge: InternalAgentBridge
): InternalAgentsProvider {
    const provider = new InternalAgentsProvider(bridge);

    // Register tree data provider
    const treeView = vscode.window.createTreeView('voicecode.agents', {
        treeDataProvider: provider,
        showCollapseAll: true
    });

    context.subscriptions.push(treeView);

    // Register refresh command
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.refreshAgents', () => {
            provider.refresh();
        })
    );

    // Register toggle model info command
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.toggleModelInfo', () => {
            provider.toggleModelInfo();
        })
    );

    // Register run pipeline command from tree
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.runPipelineFromTree', async (item: AgentTreeItem) => {
            if (item.itemType === 'pipeline' && item.data) {
                const pipeline = item.data as PipelineDefinition;
                await vscode.commands.executeCommand('voicecode.runPipeline', pipeline.type);
            }
        })
    );

    // Register cancel session command
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.cancelSession', async (item: AgentTreeItem) => {
            if (item.itemType === 'session' && item.data) {
                const sessionData = item.data as { sessionId: string };
                const cancelled = await bridge.cancelSession(sessionData.sessionId);
                if (cancelled) {
                    vscode.window.showInformationMessage('Session cancelled');
                    provider.refresh();
                } else {
                    vscode.window.showWarningMessage('Could not cancel session');
                }
            }
        })
    );

    return provider;
}
