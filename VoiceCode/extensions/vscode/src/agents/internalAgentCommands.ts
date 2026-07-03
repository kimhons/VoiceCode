/**
 * Internal Agent Commands
 * Registers VS Code commands for interacting with VoiceCode's internal agent system
 */

import * as vscode from 'vscode';
import { InternalAgentBridge, PipelineType } from './internalAgentBridge';
import {
    SubagentType,
    OrchestrationStrategy,
    CodeContext,
    AgentResult,
    OrchestratedResult,
    PipelineResult,
    AgentInfo
} from '../types/agents';

/**
 * Output channels for agent results
 */
let agentOutputChannel: vscode.OutputChannel | undefined;
let orchestratorOutputChannel: vscode.OutputChannel | undefined;
let pipelineOutputChannel: vscode.OutputChannel | undefined;

/**
 * Get or create the agent output channel
 */
function getAgentOutput(): vscode.OutputChannel {
    if (!agentOutputChannel) {
        agentOutputChannel = vscode.window.createOutputChannel('VoiceCode Agent');
    }
    return agentOutputChannel;
}

/**
 * Get or create the orchestrator output channel
 */
function getOrchestratorOutput(): vscode.OutputChannel {
    if (!orchestratorOutputChannel) {
        orchestratorOutputChannel = vscode.window.createOutputChannel('VoiceCode Orchestrator');
    }
    return orchestratorOutputChannel;
}

/**
 * Get or create the pipeline output channel
 */
function getPipelineOutput(): vscode.OutputChannel {
    if (!pipelineOutputChannel) {
        pipelineOutputChannel = vscode.window.createOutputChannel('VoiceCode Pipeline');
    }
    return pipelineOutputChannel;
}

/**
 * Get current code context from the active editor
 */
async function getCurrentContext(): Promise<CodeContext> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return {};
    }

    const document = editor.document;
    const selection = editor.selection;

    return {
        file_path: document.uri.fsPath,
        code_content: document.getText(),
        language: document.languageId,
        cursor_position: [selection.active.line, selection.active.character],
        selection: selection.isEmpty ? undefined : document.getText(selection),
        selection_range: selection.isEmpty ? undefined : {
            start: [selection.start.line, selection.start.character],
            end: [selection.end.line, selection.end.character]
        },
        project_root: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    };
}

/**
 * Display agent result in output channel
 */
function showAgentResult(result: AgentResult, title?: string): void {
    const output = getAgentOutput();
    output.clear();

    const displayTitle = title || `${result.agent_type.toUpperCase()} Agent`;
    const divider = '='.repeat(displayTitle.length + 8);

    output.appendLine(divider);
    output.appendLine(`    ${displayTitle}`);
    output.appendLine(divider);
    output.appendLine('');
    output.appendLine(`Model: ${result.model}`);
    output.appendLine(`Execution Time: ${result.execution_time_ms}ms`);
    output.appendLine(`Tokens: ${result.tokens_used?.total_tokens || 'N/A'}`);

    if (result.validation_issues.length > 0) {
        output.appendLine('');
        output.appendLine('Validation Issues:');
        result.validation_issues.forEach(issue => {
            output.appendLine(`  - ${issue}`);
        });
    }

    output.appendLine('');
    output.appendLine('─'.repeat(60));
    output.appendLine('');
    output.appendLine(result.content);

    if (result.artifacts.length > 0) {
        output.appendLine('');
        output.appendLine('─'.repeat(60));
        output.appendLine('Artifacts:');
        result.artifacts.forEach((artifact, i) => {
            output.appendLine(`  ${i + 1}. [${artifact.type}] ${artifact.path || ''}`);
        });
    }

    output.show();
}

/**
 * Display orchestrated result in output channel
 */
function showOrchestratedResult(result: OrchestratedResult): void {
    const output = getOrchestratorOutput();
    output.clear();

    output.appendLine('════════════════════════════════════════════════════════════');
    output.appendLine(`    ${result.strategy} Orchestration`);
    output.appendLine('════════════════════════════════════════════════════════════');
    output.appendLine('');
    output.appendLine(`Task ID: ${result.task_id}`);
    output.appendLine(`Duration: ${result.total_duration_ms}ms`);
    output.appendLine(`Agents Used: ${result.agents_used.join(', ')}`);
    output.appendLine(`Success: ${result.success ? 'Yes' : 'No'}`);
    output.appendLine('');

    if (result.consensus_result) {
        output.appendLine('────────────────────────────────────────────────────────────');
        output.appendLine('    Consensus Result');
        output.appendLine('────────────────────────────────────────────────────────────');
        output.appendLine('');
        output.appendLine(result.consensus_result.content);
    }

    if (result.results.length > 1) {
        output.appendLine('');
        output.appendLine('────────────────────────────────────────────────────────────');
        output.appendLine('    Individual Results');
        output.appendLine('────────────────────────────────────────────────────────────');

        result.results.forEach((r, i) => {
            output.appendLine('');
            output.appendLine(`[${i + 1}] ${r.agent_type} (${r.execution_time_ms}ms)`);
            output.appendLine('─'.repeat(40));
            output.appendLine(r.content.substring(0, 500) + (r.content.length > 500 ? '...' : ''));
        });
    }

    output.show();
}

/**
 * Display pipeline result in output channel
 */
function showPipelineResult(result: PipelineResult): void {
    const output = getPipelineOutput();
    output.clear();

    output.appendLine('════════════════════════════════════════════════════════════');
    output.appendLine(`    Pipeline: ${result.pipeline_type}`);
    output.appendLine('════════════════════════════════════════════════════════════');
    output.appendLine('');
    output.appendLine(`Total Duration: ${result.total_duration_ms}ms`);
    output.appendLine(`Success: ${result.success ? 'Yes' : 'No'}`);
    output.appendLine(`Stages: ${result.stages.length}`);
    output.appendLine('');

    result.stages.forEach((stage, i) => {
        const stageIcon = stage.result.success ? '✓' : '✗';
        output.appendLine('────────────────────────────────────────────────────────────');
        output.appendLine(`    Stage ${i + 1}: ${stage.name} [${stageIcon}]`);
        output.appendLine('────────────────────────────────────────────────────────────');
        output.appendLine(`Agent: ${stage.agent_type}`);
        output.appendLine(`Duration: ${stage.duration_ms}ms`);
        output.appendLine('');
        output.appendLine(stage.result.content);
        output.appendLine('');
    });

    if (result.final_output) {
        output.appendLine('════════════════════════════════════════════════════════════');
        output.appendLine('    Final Output');
        output.appendLine('════════════════════════════════════════════════════════════');
        output.appendLine('');
        output.appendLine(result.final_output);
    }

    output.show();
}

/**
 * Agent quick pick item
 */
interface AgentQuickPickItem extends vscode.QuickPickItem {
    agentType: SubagentType;
    agentInfo?: AgentInfo;
}

/**
 * Strategy quick pick item
 */
interface StrategyQuickPickItem extends vscode.QuickPickItem {
    strategy: OrchestrationStrategy;
}

/**
 * Pipeline quick pick item
 */
interface PipelineQuickPickItem extends vscode.QuickPickItem {
    pipelineType: PipelineType;
}

/**
 * Get icon for agent type
 */
function getAgentIcon(agentType: SubagentType): string {
    return InternalAgentBridge.AGENT_ICONS[agentType] || 'robot';
}

/**
 * Create agent quick pick items
 */
async function createAgentQuickPick(bridge: InternalAgentBridge): Promise<AgentQuickPickItem[]> {
    const agents = await bridge.getAvailableAgents();

    return agents.map(agent => ({
        label: `$(${getAgentIcon(agent.id as SubagentType)}) ${agent.name}`,
        description: agent.model_tier,
        detail: bridge.getAgentDescription(agent.id as SubagentType),
        agentType: agent.id as SubagentType,
        agentInfo: agent
    }));
}

/**
 * Register all internal agent commands
 */
export function registerInternalAgentCommands(
    context: vscode.ExtensionContext,
    bridge: InternalAgentBridge
): void {
    // =========================================================================
    // AGENT SELECTION COMMAND
    // =========================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.selectInternalAgent', async () => {
            const items = await createAgentQuickPick(bridge);

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select an internal agent to use',
                title: 'VoiceCode Internal Agents'
            });

            if (selected) {
                vscode.window.showInformationMessage(
                    `Selected ${selected.agentInfo?.name || selected.agentType} agent`
                );
                return selected.agentType;
            }
        })
    );

    // =========================================================================
    // INDIVIDUAL AGENT COMMANDS
    // =========================================================================

    // Plan Task - Planner Agent
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.planTask', async () => {
            const task = await vscode.window.showInputBox({
                prompt: 'What would you like to plan?',
                placeHolder: 'Describe the feature, task, or architecture...',
                title: 'VoiceCode Planner'
            });

            if (!task) { return; }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Planning with Planner agent...',
                cancellable: false
            }, async () => {
                const ctx = await getCurrentContext();
                const result = await bridge.plan(task, ctx);
                showAgentResult(result, 'Implementation Plan');
            });
        })
    );

    // Explore Codebase - Explorer Agent
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.exploreCode', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'What are you looking for?',
                placeHolder: 'Search for symbols, patterns, files, or concepts...',
                title: 'VoiceCode Explorer'
            });

            if (!query) { return; }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Searching with Explorer agent...',
                cancellable: false
            }, async () => {
                const ctx = await getCurrentContext();
                const result = await bridge.explore(query, ctx);
                showAgentResult(result, 'Exploration Results');
            });
        })
    );

    // Generate Code - Coder Agent
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.generateWithCoder', async () => {
            const task = await vscode.window.showInputBox({
                prompt: 'What code do you want to generate?',
                placeHolder: 'Describe the function, class, or feature...',
                title: 'VoiceCode Coder'
            });

            if (!task) { return; }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Generating with Coder agent...',
                cancellable: false
            }, async () => {
                const ctx = await getCurrentContext();
                const result = await bridge.code(task, ctx);
                showAgentResult(result, 'Generated Code');

                // Offer to insert the code
                const insertAction = await vscode.window.showInformationMessage(
                    'Code generated. Insert at cursor?',
                    'Insert',
                    'Copy to Clipboard'
                );

                if (insertAction === 'Insert') {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        await editor.edit(editBuilder => {
                            editBuilder.insert(editor.selection.active, result.content);
                        });
                    }
                } else if (insertAction === 'Copy to Clipboard') {
                    await vscode.env.clipboard.writeText(result.content);
                    vscode.window.showInformationMessage('Code copied to clipboard');
                }
            });
        })
    );

    // Review Code - Reviewer Agent
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.reviewCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor');
                return;
            }

            const focusAreas = await vscode.window.showQuickPick([
                { label: 'All aspects', value: undefined },
                { label: 'Performance', value: 'performance' },
                { label: 'Security', value: 'security' },
                { label: 'Maintainability', value: 'maintainability' },
                { label: 'Best practices', value: 'best practices' },
                { label: 'Error handling', value: 'error handling' }
            ], {
                placeHolder: 'What should the review focus on?',
                title: 'VoiceCode Reviewer',
                canPickMany: true
            });

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Reviewing with Reviewer agent...',
                cancellable: false
            }, async () => {
                const ctx = await getCurrentContext();
                const areas = focusAreas
                    ?.filter(f => f.value !== undefined)
                    .map(f => f.value as string);
                const result = await bridge.review(ctx, areas);
                showAgentResult(result, 'Code Review');
            });
        })
    );

    // Generate Tests - Tester Agent
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.generateTests', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor');
                return;
            }

            const testType = await vscode.window.showQuickPick([
                { label: '$(beaker) Unit Tests', value: 'unit' as const },
                { label: '$(layers) Integration Tests', value: 'integration' as const },
                { label: '$(browser) End-to-End Tests', value: 'e2e' as const }
            ], {
                placeHolder: 'What type of tests?',
                title: 'VoiceCode Tester'
            });

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Generating tests with Tester agent...',
                cancellable: false
            }, async () => {
                const ctx = await getCurrentContext();
                const result = await bridge.test(ctx, testType?.value);
                showAgentResult(result, 'Generated Tests');
            });
        })
    );

    // Debug Issue - Debugger Agent
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.debugIssue', async () => {
            const issue = await vscode.window.showInputBox({
                prompt: 'Describe the issue or error',
                placeHolder: 'e.g., "TypeError: cannot read property..." or "Function returns wrong value when..."',
                title: 'VoiceCode Debugger'
            });

            if (!issue) { return; }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Debugging with Debugger agent...',
                cancellable: false
            }, async () => {
                const ctx = await getCurrentContext();
                const result = await bridge.debug(issue, ctx);
                showAgentResult(result, 'Debug Analysis');
            });
        })
    );

    // Add Documentation - Documenter Agent
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.addDocumentation', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor');
                return;
            }

            const docStyle = await vscode.window.showQuickPick([
                { label: '$(book) JSDoc/TSDoc', value: 'jsdoc' as const },
                { label: '$(comment) Inline Comments', value: 'inline' as const },
                { label: '$(markdown) README', value: 'readme' as const }
            ], {
                placeHolder: 'What documentation style?',
                title: 'VoiceCode Documenter'
            });

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Documenting with Documenter agent...',
                cancellable: false
            }, async () => {
                const ctx = await getCurrentContext();
                const result = await bridge.document(ctx, docStyle?.value);
                showAgentResult(result, 'Documentation');
            });
        })
    );

    // Refactor Code - Refactorer Agent
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.refactorWithAgent', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor');
                return;
            }

            const instructions = await vscode.window.showInputBox({
                prompt: 'How should the code be refactored?',
                placeHolder: 'e.g., "extract to separate function", "use async/await", "add error handling"',
                title: 'VoiceCode Refactorer'
            });

            if (!instructions) { return; }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Refactoring with Refactorer agent...',
                cancellable: false
            }, async () => {
                const ctx = await getCurrentContext();
                const result = await bridge.refactor(instructions, ctx);
                showAgentResult(result, 'Refactored Code');
            });
        })
    );

    // Security Audit - Security Agent
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.securityAudit', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor');
                return;
            }

            const checks = await vscode.window.showQuickPick([
                { label: 'All OWASP Top 10', value: undefined },
                { label: 'Injection vulnerabilities', value: 'injection' },
                { label: 'Authentication issues', value: 'authentication' },
                { label: 'Data exposure', value: 'data exposure' },
                { label: 'XSS vulnerabilities', value: 'xss' },
                { label: 'CSRF vulnerabilities', value: 'csrf' }
            ], {
                placeHolder: 'What security checks?',
                title: 'VoiceCode Security',
                canPickMany: true
            });

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Auditing with Security agent...',
                cancellable: false
            }, async () => {
                const ctx = await getCurrentContext();
                const checkList = checks
                    ?.filter(c => c.value !== undefined)
                    .map(c => c.value as string);
                const result = await bridge.securityAudit(ctx, checkList);
                showAgentResult(result, 'Security Audit');
            });
        })
    );

    // =========================================================================
    // ORCHESTRATION COMMANDS
    // =========================================================================

    // Execute with Strategy
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.executeWithStrategy', async () => {
            const strategies: StrategyQuickPickItem[] = [
                {
                    label: '$(zap) Single Agent',
                    description: 'Best agent for the task',
                    detail: 'Routes to the most suitable agent based on task analysis',
                    strategy: OrchestrationStrategy.SINGLE_AGENT
                },
                {
                    label: '$(flame) Race Execution',
                    description: 'Parallel, first wins',
                    detail: 'Multiple agents race in parallel, first result is used',
                    strategy: OrchestrationStrategy.RACE_EXECUTION
                },
                {
                    label: '$(law) Consensus',
                    description: 'Multiple agents agree',
                    detail: 'Multiple agents work in parallel, results are aggregated',
                    strategy: OrchestrationStrategy.CONSENSUS
                },
                {
                    label: '$(git-merge) Pipeline',
                    description: 'Sequential stages',
                    detail: 'Work flows through multiple agents in sequence',
                    strategy: OrchestrationStrategy.PIPELINE
                },
                {
                    label: '$(split-horizontal) Decomposition',
                    description: 'Split across agents',
                    detail: 'Task is broken down and distributed to specialized agents',
                    strategy: OrchestrationStrategy.DECOMPOSITION
                }
            ];

            const selectedStrategy = await vscode.window.showQuickPick(strategies, {
                placeHolder: 'Select orchestration strategy',
                title: 'VoiceCode Orchestrator'
            });

            if (!selectedStrategy) { return; }

            const task = await vscode.window.showInputBox({
                prompt: 'Describe the task',
                placeHolder: 'What do you want to accomplish?',
                title: `${selectedStrategy.label} Orchestration`
            });

            if (!task) { return; }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Executing with ${selectedStrategy.description}...`,
                cancellable: false
            }, async () => {
                const ctx = await getCurrentContext();
                const result = await bridge.executeWithStrategy(
                    selectedStrategy.strategy,
                    { type: 'CodeGeneration', params: { description: task } },
                    ctx
                );
                showOrchestratedResult(result);
            });
        })
    );

    // =========================================================================
    // PIPELINE COMMANDS
    // =========================================================================

    // Run Pipeline
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.runPipeline', async () => {
            const pipelines: PipelineQuickPickItem[] = [
                {
                    label: '$(checklist) Plan → Implement → Review',
                    description: 'Full development cycle',
                    detail: 'Planner creates plan, Coder implements, Reviewer checks',
                    pipelineType: 'plan_implement_review'
                },
                {
                    label: '$(search) Explore → Plan → Implement',
                    description: 'Discovery-first approach',
                    detail: 'Explorer analyzes codebase, then plan and implement',
                    pipelineType: 'explore_plan_implement'
                },
                {
                    label: '$(bug) Debug → Fix → Test',
                    description: 'Bug fix cycle',
                    detail: 'Debugger diagnoses, Coder fixes, Tester validates',
                    pipelineType: 'debug_fix_test'
                },
                {
                    label: '$(shield) Security Audit → Fix',
                    description: 'Security remediation',
                    detail: 'Security agent audits, then fixes are applied',
                    pipelineType: 'security_audit_fix'
                },
                {
                    label: '$(wrench) Refactor → Review → Test',
                    description: 'Safe refactoring',
                    detail: 'Refactorer improves, Reviewer validates, Tester confirms',
                    pipelineType: 'refactor_review_test'
                }
            ];

            const selectedPipeline = await vscode.window.showQuickPick(pipelines, {
                placeHolder: 'Select a pipeline',
                title: 'VoiceCode Pipelines'
            });

            if (!selectedPipeline) { return; }

            const task = await vscode.window.showInputBox({
                prompt: 'Describe what you want to build or fix',
                placeHolder: 'The pipeline will process this through multiple agents...',
                title: selectedPipeline.label
            });

            if (!task) { return; }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Running ${selectedPipeline.description}...`,
                cancellable: true
            }, async (progress) => {
                // Track pipeline stages
                bridge.on('agent_event', (event) => {
                    if (event.type === 'pipeline_stage_completed') {
                        progress.report({ message: `${event.message}` });
                    }
                });

                const ctx = await getCurrentContext();
                const result = await bridge.executePipeline(
                    selectedPipeline.pipelineType,
                    task,
                    ctx
                );
                showPipelineResult(result);
            });
        })
    );

    // =========================================================================
    // QUICK AGENT SELECTION WITH TASK
    // =========================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.useInternalAgent', async (agentInfo?: AgentInfo) => {
            let agentType: SubagentType;

            if (agentInfo) {
                agentType = agentInfo.id as SubagentType;
            } else {
                const items = await createAgentQuickPick(bridge);
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select an agent',
                    title: 'VoiceCode Agents'
                });
                if (!selected) { return; }
                agentType = selected.agentType;
            }

            const task = await vscode.window.showInputBox({
                prompt: `What task for ${agentType}?`,
                placeHolder: 'Describe what you want the agent to do...',
                title: `VoiceCode ${agentType.charAt(0).toUpperCase() + agentType.slice(1)}`
            });

            if (!task) { return; }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Executing with ${agentType} agent...`,
                cancellable: false
            }, async () => {
                const ctx = await getCurrentContext();
                const result = await bridge.executeWithAgent(agentType, task, ctx);
                showAgentResult(result);
            });
        })
    );

    // =========================================================================
    // AUTO-SELECT AGENT BASED ON INPUT
    // =========================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.autoSelectAgent', async () => {
            const task = await vscode.window.showInputBox({
                prompt: 'Describe what you need help with',
                placeHolder: 'VoiceCode will automatically select the best agent...',
                title: 'VoiceCode Smart Agent'
            });

            if (!task) { return; }

            const selectedAgent = bridge.selectAgentForTask(task);

            const confirmation = await vscode.window.showInformationMessage(
                `Suggested: ${selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)} agent`,
                'Use This Agent',
                'Choose Different'
            );

            if (confirmation === 'Choose Different') {
                const items = await createAgentQuickPick(bridge);
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select a different agent'
                });
                if (!selected) { return; }
                await vscode.commands.executeCommand('voicecode.useInternalAgent', selected.agentInfo);
            } else if (confirmation === 'Use This Agent') {
                await vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: `Executing with ${selectedAgent} agent...`,
                    cancellable: false
                }, async () => {
                    const ctx = await getCurrentContext();
                    const result = await bridge.executeWithAgent(selectedAgent, task, ctx);
                    showAgentResult(result);
                });
            }
        })
    );

    // =========================================================================
    // AGENT STATUS COMMAND
    // =========================================================================

    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.showAgentStatus', async () => {
            const agents = await bridge.getAvailableAgents(true);
            const modelConfig = await bridge.getModelConfig();

            const output = getAgentOutput();
            output.clear();

            output.appendLine('════════════════════════════════════════════════════════════');
            output.appendLine('    VoiceCode Internal Agents Status');
            output.appendLine('════════════════════════════════════════════════════════════');
            output.appendLine('');

            agents.forEach(agent => {
                const icon = getAgentIcon(agent.id as SubagentType);
                const modelTier = modelConfig.tier_overrides[agent.id as SubagentType] || modelConfig.default_tier;

                output.appendLine(`[$(${icon})] ${agent.name}`);
                output.appendLine(`    Status: ${agent.status}`);
                output.appendLine(`    Model Tier: ${modelTier}`);
                output.appendLine(`    Tasks Completed: ${agent.tasks_completed}`);
                output.appendLine(`    Avg Response Time: ${agent.avg_response_time_ms}ms`);
                output.appendLine('');
            });

            const activeSessions = bridge.getActiveSessions();
            if (activeSessions.length > 0) {
                output.appendLine('────────────────────────────────────────────────────────────');
                output.appendLine('    Active Sessions');
                output.appendLine('────────────────────────────────────────────────────────────');
                output.appendLine('');

                activeSessions.forEach(session => {
                    output.appendLine(`  - ${session.agentType}: ${(session.duration / 1000).toFixed(1)}s`);
                });
            }

            output.show();
        })
    );
}

/**
 * Dispose of output channels
 */
export function disposeInternalAgentCommands(): void {
    agentOutputChannel?.dispose();
    orchestratorOutputChannel?.dispose();
    pipelineOutputChannel?.dispose();
}
