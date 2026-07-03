/**
 * Language Model Tools Registration
 * Exposes VoiceCode's internal agents as tools for VS Code's Language Model API
 */

import * as vscode from 'vscode';
import { InternalAgentBridge } from './internalAgentBridge';
import {
    SubagentType,
    OrchestrationStrategy,
    CodeContext,
    LMToolDefinition,
    LMToolCall,
    LMToolResult
} from '../types/agents';

/**
 * Tool input schemas
 */
interface PlanToolInput {
    task: string;
    context?: string;
}

interface ExploreToolInput {
    query: string;
    scope?: 'file' | 'directory' | 'workspace';
    filePattern?: string;
}

interface CodeToolInput {
    task: string;
    language?: string;
    context?: string;
}

interface ReviewToolInput {
    code?: string;
    filePath?: string;
    focusAreas?: string[];
}

interface TestToolInput {
    target: string;
    framework?: string;
    coverage?: 'unit' | 'integration' | 'e2e';
}

interface DebugToolInput {
    issue: string;
    errorMessage?: string;
    stackTrace?: string;
}

interface DocumentToolInput {
    target: string;
    style?: 'jsdoc' | 'docstring' | 'markdown' | 'inline';
}

interface RefactorToolInput {
    target: string;
    type?: 'extract' | 'rename' | 'simplify' | 'optimize';
    newName?: string;
}

interface SecurityToolInput {
    target: string;
    scanType?: 'quick' | 'full' | 'owasp';
}

interface PipelineToolInput {
    pipeline: string;
    task: string;
}

interface StrategyToolInput {
    strategy: string;
    task: string;
}

/**
 * Language Model Tools Provider
 * Registers VoiceCode agents as Language Model Tools
 */
export class LanguageModelToolsProvider implements vscode.Disposable {
    private bridge: InternalAgentBridge;
    private disposables: vscode.Disposable[] = [];
    private registeredTools: Map<string, vscode.Disposable> = new Map();

    constructor(bridge: InternalAgentBridge) {
        this.bridge = bridge;
    }

    /**
     * Register all tools
     */
    register(context: vscode.ExtensionContext): void {
        // Register individual agent tools
        this.registerPlanTool(context);
        this.registerExploreTool(context);
        this.registerCodeTool(context);
        this.registerReviewTool(context);
        this.registerTestTool(context);
        this.registerDebugTool(context);
        this.registerDocumentTool(context);
        this.registerRefactorTool(context);
        this.registerSecurityTool(context);

        // Register orchestration tools
        this.registerPipelineTool(context);
        this.registerStrategyTool(context);

        // Register utility tools
        this.registerAgentInfoTool(context);
        this.registerContextTool(context);
    }

    /**
     * Register Plan tool
     */
    private registerPlanTool(context: vscode.ExtensionContext): void {
        const tool = vscode.lm.registerTool('voicecode_plan', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Creating implementation plan...'
                };
            },
            invoke: async (options, token) => {
                const input = options.input as PlanToolInput;
                const codeContext = await this.getCodeContext();

                const result = await this.bridge.plan(input.task, codeContext);

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        result.success
                            ? result.content || 'Plan created successfully'
                            : `Error: ${result.error}`
                    )
                ]);
            }
        });

        this.registeredTools.set('voicecode_plan', tool);
        context.subscriptions.push(tool);
    }

    /**
     * Register Explore tool
     */
    private registerExploreTool(context: vscode.ExtensionContext): void {
        const tool = vscode.lm.registerTool('voicecode_explore', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Exploring codebase...'
                };
            },
            invoke: async (options, token) => {
                const input = options.input as ExploreToolInput;
                const codeContext = await this.getCodeContext();

                const result = await this.bridge.explore(input.query, codeContext);

                let content = result.success
                    ? result.content || 'Exploration complete'
                    : `Error: ${result.error}`;

                // Add file references if available
                if (result.files_modified && result.files_modified.length > 0) {
                    content += '\n\nRelevant files:\n' + result.files_modified.map(f => `- ${f}`).join('\n');
                }

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(content)
                ]);
            }
        });

        this.registeredTools.set('voicecode_explore', tool);
        context.subscriptions.push(tool);
    }

    /**
     * Register Code tool
     */
    private registerCodeTool(context: vscode.ExtensionContext): void {
        const tool = vscode.lm.registerTool('voicecode_code', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Generating code...'
                };
            },
            invoke: async (options, token) => {
                const input = options.input as CodeToolInput;
                const codeContext = await this.getCodeContext();

                if (input.language) {
                    codeContext.language = input.language;
                }

                const result = await this.bridge.code(input.task, codeContext);

                const parts: vscode.LanguageModelContentPart[] = [];

                if (result.success) {
                    if (result.content) {
                        parts.push(new vscode.LanguageModelTextPart(result.content));
                    }

                    // Include code blocks
                    if (result.code_blocks) {
                        for (const block of result.code_blocks) {
                            parts.push(new vscode.LanguageModelTextPart(
                                `\n\`\`\`${block.language}\n${block.code}\n\`\`\`\n`
                            ));
                        }
                    }
                } else {
                    parts.push(new vscode.LanguageModelTextPart(`Error: ${result.error}`));
                }

                return new vscode.LanguageModelToolResult(parts);
            }
        });

        this.registeredTools.set('voicecode_code', tool);
        context.subscriptions.push(tool);
    }

    /**
     * Register Review tool
     */
    private registerReviewTool(context: vscode.ExtensionContext): void {
        const tool = vscode.lm.registerTool('voicecode_review', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Reviewing code...'
                };
            },
            invoke: async (options, token) => {
                const input = options.input as ReviewToolInput;
                let codeContext = await this.getCodeContext();

                // Override with provided code or file
                if (input.code) {
                    codeContext.selected_text = input.code;
                }
                if (input.filePath) {
                    codeContext.file_path = input.filePath;
                }

                const result = await this.bridge.review(
                    input.focusAreas?.join(', ') || 'general code quality',
                    codeContext
                );

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        result.success
                            ? result.content || 'Review complete'
                            : `Error: ${result.error}`
                    )
                ]);
            }
        });

        this.registeredTools.set('voicecode_review', tool);
        context.subscriptions.push(tool);
    }

    /**
     * Register Test tool
     */
    private registerTestTool(context: vscode.ExtensionContext): void {
        const tool = vscode.lm.registerTool('voicecode_test', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Generating tests...'
                };
            },
            invoke: async (options, token) => {
                const input = options.input as TestToolInput;
                const codeContext = await this.getCodeContext();

                let task = input.target;
                if (input.framework) {
                    task += ` using ${input.framework}`;
                }
                if (input.coverage) {
                    task += ` (${input.coverage} tests)`;
                }

                const result = await this.bridge.test(task, codeContext);

                const parts: vscode.LanguageModelContentPart[] = [];

                if (result.success) {
                    if (result.content) {
                        parts.push(new vscode.LanguageModelTextPart(result.content));
                    }

                    // Include test code blocks
                    if (result.code_blocks) {
                        for (const block of result.code_blocks) {
                            parts.push(new vscode.LanguageModelTextPart(
                                `\n\`\`\`${block.language}\n${block.code}\n\`\`\`\n`
                            ));
                        }
                    }
                } else {
                    parts.push(new vscode.LanguageModelTextPart(`Error: ${result.error}`));
                }

                return new vscode.LanguageModelToolResult(parts);
            }
        });

        this.registeredTools.set('voicecode_test', tool);
        context.subscriptions.push(tool);
    }

    /**
     * Register Debug tool
     */
    private registerDebugTool(context: vscode.ExtensionContext): void {
        const tool = vscode.lm.registerTool('voicecode_debug', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Debugging issue...'
                };
            },
            invoke: async (options, token) => {
                const input = options.input as DebugToolInput;
                const codeContext = await this.getCodeContext();

                let task = input.issue;
                if (input.errorMessage) {
                    task += `\n\nError message: ${input.errorMessage}`;
                }
                if (input.stackTrace) {
                    task += `\n\nStack trace:\n${input.stackTrace}`;
                }

                const result = await this.bridge.debug(task, codeContext);

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        result.success
                            ? result.content || 'Debug analysis complete'
                            : `Error: ${result.error}`
                    )
                ]);
            }
        });

        this.registeredTools.set('voicecode_debug', tool);
        context.subscriptions.push(tool);
    }

    /**
     * Register Document tool
     */
    private registerDocumentTool(context: vscode.ExtensionContext): void {
        const tool = vscode.lm.registerTool('voicecode_document', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Generating documentation...'
                };
            },
            invoke: async (options, token) => {
                const input = options.input as DocumentToolInput;
                const codeContext = await this.getCodeContext();

                let task = input.target;
                if (input.style) {
                    task += ` in ${input.style} style`;
                }

                const result = await this.bridge.document(task, codeContext);

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        result.success
                            ? result.content || 'Documentation generated'
                            : `Error: ${result.error}`
                    )
                ]);
            }
        });

        this.registeredTools.set('voicecode_document', tool);
        context.subscriptions.push(tool);
    }

    /**
     * Register Refactor tool
     */
    private registerRefactorTool(context: vscode.ExtensionContext): void {
        const tool = vscode.lm.registerTool('voicecode_refactor', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Refactoring code...'
                };
            },
            invoke: async (options, token) => {
                const input = options.input as RefactorToolInput;
                const codeContext = await this.getCodeContext();

                let task = input.target;
                if (input.type) {
                    task = `${input.type} ${task}`;
                }
                if (input.newName) {
                    task += ` to ${input.newName}`;
                }

                const result = await this.bridge.refactor(task, codeContext);

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        result.success
                            ? result.content || 'Refactoring complete'
                            : `Error: ${result.error}`
                    )
                ]);
            }
        });

        this.registeredTools.set('voicecode_refactor', tool);
        context.subscriptions.push(tool);
    }

    /**
     * Register Security tool
     */
    private registerSecurityTool(context: vscode.ExtensionContext): void {
        const tool = vscode.lm.registerTool('voicecode_security', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Performing security audit...'
                };
            },
            invoke: async (options, token) => {
                const input = options.input as SecurityToolInput;
                const codeContext = await this.getCodeContext();

                let task = input.target;
                if (input.scanType) {
                    task += ` (${input.scanType} scan)`;
                }

                const result = await this.bridge.securityAudit(task, codeContext);

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        result.success
                            ? result.content || 'Security audit complete'
                            : `Error: ${result.error}`
                    )
                ]);
            }
        });

        this.registeredTools.set('voicecode_security', tool);
        context.subscriptions.push(tool);
    }

    /**
     * Register Pipeline tool
     */
    private registerPipelineTool(context: vscode.ExtensionContext): void {
        const tool = vscode.lm.registerTool('voicecode_pipeline', {
            prepareInvocation: async (options, token) => {
                const input = options.input as PipelineToolInput;
                return {
                    invocationMessage: `Executing ${input.pipeline} pipeline...`
                };
            },
            invoke: async (options, token) => {
                const input = options.input as PipelineToolInput;
                const codeContext = await this.getCodeContext();

                const validPipelines = [
                    'plan_implement_review',
                    'explore_plan_implement',
                    'debug_fix_test',
                    'security_audit_fix',
                    'refactor_review_test'
                ] as const;

                if (!validPipelines.includes(input.pipeline as typeof validPipelines[number])) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(
                            `Invalid pipeline. Available: ${validPipelines.join(', ')}`
                        )
                    ]);
                }

                const result = await this.bridge.executePipeline(
                    input.pipeline as typeof validPipelines[number],
                    input.task,
                    codeContext
                );

                const parts: vscode.LanguageModelContentPart[] = [];

                parts.push(new vscode.LanguageModelTextPart(
                    `Pipeline: ${input.pipeline}\nStatus: ${result.success ? 'Success' : 'Failed'}\nExecution Time: ${result.total_execution_time_ms}ms\n\n`
                ));

                for (const stageResult of result.stage_results) {
                    parts.push(new vscode.LanguageModelTextPart(
                        `## ${stageResult.agent}\n${stageResult.result.content || 'No output'}\n\n`
                    ));
                }

                return new vscode.LanguageModelToolResult(parts);
            }
        });

        this.registeredTools.set('voicecode_pipeline', tool);
        context.subscriptions.push(tool);
    }

    /**
     * Register Strategy tool
     */
    private registerStrategyTool(context: vscode.ExtensionContext): void {
        const tool = vscode.lm.registerTool('voicecode_strategy', {
            prepareInvocation: async (options, token) => {
                const input = options.input as StrategyToolInput;
                return {
                    invocationMessage: `Executing with ${input.strategy} strategy...`
                };
            },
            invoke: async (options, token) => {
                const input = options.input as StrategyToolInput;
                const codeContext = await this.getCodeContext();

                const strategyMap: Record<string, OrchestrationStrategy> = {
                    'single_agent': OrchestrationStrategy.SINGLE_AGENT,
                    'race_execution': OrchestrationStrategy.RACE_EXECUTION,
                    'consensus': OrchestrationStrategy.CONSENSUS,
                    'pipeline': OrchestrationStrategy.PIPELINE,
                    'decomposition': OrchestrationStrategy.DECOMPOSITION
                };

                const strategy = strategyMap[input.strategy];
                if (!strategy) {
                    return new vscode.LanguageModelToolResult([
                        new vscode.LanguageModelTextPart(
                            `Invalid strategy. Available: ${Object.keys(strategyMap).join(', ')}`
                        )
                    ]);
                }

                const result = await this.bridge.executeWithStrategy(strategy, input.task, codeContext);

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        result.success
                            ? result.merged_result?.content || result.selected_result?.content || 'Execution complete'
                            : `Error: ${result.error}`
                    )
                ]);
            }
        });

        this.registeredTools.set('voicecode_strategy', tool);
        context.subscriptions.push(tool);
    }

    /**
     * Register Agent Info tool
     */
    private registerAgentInfoTool(context: vscode.ExtensionContext): void {
        const tool = vscode.lm.registerTool('voicecode_agent_info', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Getting agent information...'
                };
            },
            invoke: async (options, token) => {
                const agents = await this.bridge.getAvailableAgents();
                const modelConfig = await this.bridge.getModelConfig();

                let content = '# VoiceCode Internal Agents\n\n';

                for (const agent of agents) {
                    const agentType = agent.id as SubagentType;
                    const tier = modelConfig.tier_overrides[agentType] || modelConfig.default_tier;
                    const description = InternalAgentBridge.AGENT_DESCRIPTIONS[agentType];

                    content += `## ${agent.name}\n`;
                    content += `- **Model:** ${tier}\n`;
                    content += `- **Status:** ${agent.status}\n`;
                    content += `- **Description:** ${description}\n`;
                    content += `- **Capabilities:** ${agent.capabilities.join(', ')}\n\n`;
                }

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(content)
                ]);
            }
        });

        this.registeredTools.set('voicecode_agent_info', tool);
        context.subscriptions.push(tool);
    }

    /**
     * Register Context tool
     */
    private registerContextTool(context: vscode.ExtensionContext): void {
        const tool = vscode.lm.registerTool('voicecode_get_context', {
            prepareInvocation: async (options, token) => {
                return {
                    invocationMessage: 'Getting code context...'
                };
            },
            invoke: async (options, token) => {
                const codeContext = await this.getCodeContext();

                let content = '# Current Code Context\n\n';
                content += `- **File:** ${codeContext.file_path || 'No file open'}\n`;
                content += `- **Language:** ${codeContext.language || 'Unknown'}\n`;
                content += `- **Cursor Position:** Line ${codeContext.cursor_position.line + 1}, Column ${codeContext.cursor_position.character + 1}\n`;

                if (codeContext.selected_text) {
                    content += `\n## Selected Text\n\`\`\`${codeContext.language}\n${codeContext.selected_text}\n\`\`\`\n`;
                }

                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(content)
                ]);
            }
        });

        this.registeredTools.set('voicecode_get_context', tool);
        context.subscriptions.push(tool);
    }

    /**
     * Get current code context from editor
     */
    private async getCodeContext(): Promise<CodeContext> {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            return {
                file_path: '',
                language: '',
                cursor_position: { line: 0, character: 0 },
                visible_range: { start: 0, end: 0 }
            };
        }

        const document = editor.document;
        const selection = editor.selection;

        return {
            file_path: document.uri.fsPath,
            language: document.languageId,
            selected_text: selection.isEmpty ? undefined : document.getText(selection),
            cursor_position: {
                line: selection.active.line,
                character: selection.active.character
            },
            visible_range: {
                start: editor.visibleRanges[0]?.start.line || 0,
                end: editor.visibleRanges[0]?.end.line || 0
            }
        };
    }

    /**
     * Get tool definitions for documentation
     */
    getToolDefinitions(): LMToolDefinition[] {
        return [
            {
                name: 'voicecode_plan',
                description: 'Create an implementation plan for a coding task using the Planner agent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        task: { type: 'string', description: 'The task to plan' },
                        context: { type: 'string', description: 'Additional context' }
                    },
                    required: ['task']
                }
            },
            {
                name: 'voicecode_explore',
                description: 'Search and explore the codebase using the Explorer agent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Search query' },
                        scope: { type: 'string', enum: ['file', 'directory', 'workspace'], description: 'Search scope' },
                        filePattern: { type: 'string', description: 'File pattern to match' }
                    },
                    required: ['query']
                }
            },
            {
                name: 'voicecode_code',
                description: 'Generate code using the Coder agent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        task: { type: 'string', description: 'Code generation task' },
                        language: { type: 'string', description: 'Programming language' },
                        context: { type: 'string', description: 'Additional context' }
                    },
                    required: ['task']
                }
            },
            {
                name: 'voicecode_review',
                description: 'Review code quality using the Reviewer agent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        code: { type: 'string', description: 'Code to review' },
                        filePath: { type: 'string', description: 'File path to review' },
                        focusAreas: { type: 'array', items: { type: 'string' }, description: 'Areas to focus on' }
                    }
                }
            },
            {
                name: 'voicecode_test',
                description: 'Generate tests using the Tester agent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: { type: 'string', description: 'Code to test' },
                        framework: { type: 'string', description: 'Test framework' },
                        coverage: { type: 'string', enum: ['unit', 'integration', 'e2e'], description: 'Test type' }
                    },
                    required: ['target']
                }
            },
            {
                name: 'voicecode_debug',
                description: 'Debug issues using the Debugger agent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue: { type: 'string', description: 'Issue description' },
                        errorMessage: { type: 'string', description: 'Error message' },
                        stackTrace: { type: 'string', description: 'Stack trace' }
                    },
                    required: ['issue']
                }
            },
            {
                name: 'voicecode_document',
                description: 'Generate documentation using the Documenter agent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: { type: 'string', description: 'Code to document' },
                        style: { type: 'string', enum: ['jsdoc', 'docstring', 'markdown', 'inline'], description: 'Documentation style' }
                    },
                    required: ['target']
                }
            },
            {
                name: 'voicecode_refactor',
                description: 'Refactor code using the Refactorer agent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: { type: 'string', description: 'Code to refactor' },
                        type: { type: 'string', enum: ['extract', 'rename', 'simplify', 'optimize'], description: 'Refactoring type' },
                        newName: { type: 'string', description: 'New name for rename refactoring' }
                    },
                    required: ['target']
                }
            },
            {
                name: 'voicecode_security',
                description: 'Perform security audit using the Security agent',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: { type: 'string', description: 'Code to audit' },
                        scanType: { type: 'string', enum: ['quick', 'full', 'owasp'], description: 'Scan type' }
                    },
                    required: ['target']
                }
            },
            {
                name: 'voicecode_pipeline',
                description: 'Execute a multi-agent pipeline',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pipeline: {
                            type: 'string',
                            enum: ['plan_implement_review', 'explore_plan_implement', 'debug_fix_test', 'security_audit_fix', 'refactor_review_test'],
                            description: 'Pipeline to execute'
                        },
                        task: { type: 'string', description: 'Task for the pipeline' }
                    },
                    required: ['pipeline', 'task']
                }
            },
            {
                name: 'voicecode_strategy',
                description: 'Execute with a specific orchestration strategy',
                inputSchema: {
                    type: 'object',
                    properties: {
                        strategy: {
                            type: 'string',
                            enum: ['single_agent', 'race_execution', 'consensus', 'pipeline', 'decomposition'],
                            description: 'Orchestration strategy'
                        },
                        task: { type: 'string', description: 'Task to execute' }
                    },
                    required: ['strategy', 'task']
                }
            },
            {
                name: 'voicecode_agent_info',
                description: 'Get information about available VoiceCode agents',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'voicecode_get_context',
                description: 'Get the current code context from the editor',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            }
        ];
    }

    /**
     * Dispose of registered tools
     */
    dispose(): void {
        for (const disposable of this.registeredTools.values()) {
            disposable.dispose();
        }
        this.registeredTools.clear();

        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}

/**
 * Register Language Model Tools
 */
export function registerLanguageModelTools(
    context: vscode.ExtensionContext,
    bridge: InternalAgentBridge
): LanguageModelToolsProvider {
    const provider = new LanguageModelToolsProvider(bridge);
    provider.register(context);
    context.subscriptions.push(provider);
    return provider;
}
