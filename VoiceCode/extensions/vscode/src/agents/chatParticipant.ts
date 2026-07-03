/**
 * VoiceCode Chat Participant
 * Implements VS Code's Chat Participant API for @voicecode integration
 */

import * as vscode from 'vscode';
import { InternalAgentBridge } from './internalAgentBridge';
import { VoiceAgentRouter } from './voiceAgentRouter';
import {
    SubagentType,
    OrchestrationStrategy,
    CodeContext,
    AgentResult
} from '../types/agents';

/**
 * Chat command types
 */
type ChatCommand =
    | 'plan'
    | 'explore'
    | 'code'
    | 'review'
    | 'test'
    | 'debug'
    | 'document'
    | 'refactor'
    | 'security'
    | 'pipeline'
    | 'strategy';

/**
 * Chat command metadata
 */
interface ChatCommandMeta {
    agent?: SubagentType;
    pipeline?: string;
    strategy?: OrchestrationStrategy;
    description: string;
    examples: string[];
}

/**
 * Chat participant ID
 */
const PARTICIPANT_ID = 'voicecode';

/**
 * Chat commands configuration
 */
const CHAT_COMMANDS: Record<ChatCommand, ChatCommandMeta> = {
    plan: {
        agent: SubagentType.PLANNER,
        description: 'Create an implementation plan for a task',
        examples: [
            '@voicecode /plan implement user authentication',
            '@voicecode /plan refactor the data layer'
        ]
    },
    explore: {
        agent: SubagentType.EXPLORER,
        description: 'Explore and search the codebase',
        examples: [
            '@voicecode /explore find all API endpoints',
            '@voicecode /explore where is authentication handled'
        ]
    },
    code: {
        agent: SubagentType.CODER,
        description: 'Generate code for a task',
        examples: [
            '@voicecode /code create a React component for user profile',
            '@voicecode /code implement a binary search function'
        ]
    },
    review: {
        agent: SubagentType.REVIEWER,
        description: 'Review code for issues and improvements',
        examples: [
            '@voicecode /review check this function for edge cases',
            '@voicecode /review analyze the selected code'
        ]
    },
    test: {
        agent: SubagentType.TESTER,
        description: 'Generate tests for code',
        examples: [
            '@voicecode /test create unit tests for the auth module',
            '@voicecode /test generate integration tests'
        ]
    },
    debug: {
        agent: SubagentType.DEBUGGER,
        description: 'Debug issues and find root causes',
        examples: [
            '@voicecode /debug why is this function returning null',
            '@voicecode /debug investigate the memory leak'
        ]
    },
    document: {
        agent: SubagentType.DOCUMENTER,
        description: 'Generate documentation for code',
        examples: [
            '@voicecode /document add JSDoc to this module',
            '@voicecode /document create API documentation'
        ]
    },
    refactor: {
        agent: SubagentType.REFACTORER,
        description: 'Refactor and improve code quality',
        examples: [
            '@voicecode /refactor simplify this complex function',
            '@voicecode /refactor extract common logic into a utility'
        ]
    },
    security: {
        agent: SubagentType.SECURITY,
        description: 'Perform security audit and find vulnerabilities',
        examples: [
            '@voicecode /security audit this authentication flow',
            '@voicecode /security check for SQL injection vulnerabilities'
        ]
    },
    pipeline: {
        description: 'Execute a multi-agent pipeline',
        examples: [
            '@voicecode /pipeline plan_implement_review add dark mode',
            '@voicecode /pipeline debug_fix_test resolve login issue'
        ]
    },
    strategy: {
        description: 'Execute with a specific orchestration strategy',
        examples: [
            '@voicecode /strategy consensus review this code',
            '@voicecode /strategy race optimize this algorithm'
        ]
    }
};

/**
 * VoiceCode Chat Participant Handler
 */
export class VoiceCodeChatParticipant {
    private bridge: InternalAgentBridge;
    private router: VoiceAgentRouter;
    private participant: vscode.ChatParticipant | undefined;

    constructor(bridge: InternalAgentBridge, router: VoiceAgentRouter) {
        this.bridge = bridge;
        this.router = router;
    }

    /**
     * Register the chat participant
     */
    register(context: vscode.ExtensionContext): void {
        // Create chat participant
        this.participant = vscode.chat.createChatParticipant(PARTICIPANT_ID, this.handleRequest.bind(this));

        // Set metadata
        this.participant.iconPath = new vscode.ThemeIcon('robot');

        // Register followup provider
        this.participant.followupProvider = {
            provideFollowups: this.provideFollowups.bind(this)
        };

        context.subscriptions.push(this.participant);

        // Register commands for each chat command
        this.registerChatCommands(context);
    }

    /**
     * Register chat commands
     */
    private registerChatCommands(context: vscode.ExtensionContext): void {
        for (const [command, meta] of Object.entries(CHAT_COMMANDS)) {
            context.subscriptions.push(
                vscode.commands.registerCommand(`voicecode.chat.${command}`, async () => {
                    // Open chat with the command pre-filled
                    await vscode.commands.executeCommand('workbench.action.chat.open', {
                        query: `@voicecode /${command} `
                    });
                })
            );
        }
    }

    /**
     * Handle chat request
     */
    private async handleRequest(
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatResult> {
        try {
            // Check for cancellation
            if (token.isCancellationRequested) {
                return { metadata: { cancelled: true } };
            }

            // Get code context
            const codeContext = await this.getCodeContext();

            // Handle based on command or auto-route
            if (request.command) {
                return await this.handleCommand(
                    request.command as ChatCommand,
                    request.prompt,
                    codeContext,
                    stream,
                    token
                );
            } else {
                // Auto-route based on input
                return await this.handleAutoRoute(
                    request.prompt,
                    codeContext,
                    context,
                    stream,
                    token
                );
            }
        } catch (error) {
            stream.markdown(`**Error:** ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\n`);
            stream.markdown('Please try again or use `/help` for available commands.');

            return {
                metadata: {
                    error: true,
                    errorMessage: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    /**
     * Handle specific command
     */
    private async handleCommand(
        command: ChatCommand,
        prompt: string,
        context: CodeContext | undefined,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatResult> {
        const meta = CHAT_COMMANDS[command];

        if (!meta) {
            stream.markdown(`Unknown command: \`/${command}\`\n\n`);
            stream.markdown('Available commands:\n');
            for (const [cmd, cmdMeta] of Object.entries(CHAT_COMMANDS)) {
                stream.markdown(`- \`/${cmd}\`: ${cmdMeta.description}\n`);
            }
            return { metadata: { error: true, unknownCommand: command } };
        }

        // Handle pipeline command
        if (command === 'pipeline') {
            return await this.handlePipelineCommand(prompt, context, stream, token);
        }

        // Handle strategy command
        if (command === 'strategy') {
            return await this.handleStrategyCommand(prompt, context, stream, token);
        }

        // Handle agent command
        if (meta.agent) {
            return await this.handleAgentCommand(meta.agent, prompt, context, stream, token);
        }

        return { metadata: { command } };
    }

    /**
     * Handle agent command
     */
    private async handleAgentCommand(
        agent: SubagentType,
        task: string,
        context: CodeContext | undefined,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatResult> {
        const agentName = agent.charAt(0).toUpperCase() + agent.slice(1);
        const icon = InternalAgentBridge.AGENT_ICONS[agent];

        stream.markdown(`### $(${icon}) ${agentName} Agent\n\n`);
        stream.progress(`Executing ${agentName} agent...`);

        // Check cancellation
        if (token.isCancellationRequested) {
            stream.markdown('*Cancelled*');
            return { metadata: { cancelled: true } };
        }

        // Execute with agent
        const result = await this.bridge.executeWithAgent(agent, task, context);

        if (result.success) {
            // Stream the response
            if (result.content) {
                stream.markdown(result.content);
            }

            // Add code blocks if present
            if (result.code_blocks) {
                for (const block of result.code_blocks) {
                    stream.markdown(`\n\`\`\`${block.language}\n${block.code}\n\`\`\`\n`);
                }
            }

            // Add file references
            if (result.files_modified && result.files_modified.length > 0) {
                stream.markdown('\n**Files Modified:**\n');
                for (const file of result.files_modified) {
                    const uri = vscode.Uri.file(file);
                    stream.anchor(uri, file);
                    stream.markdown('\n');
                }
            }

            // Add suggestions if available
            if (result.suggestions && result.suggestions.length > 0) {
                stream.markdown('\n**Suggestions:**\n');
                for (const suggestion of result.suggestions) {
                    stream.markdown(`- ${suggestion}\n`);
                }
            }

            return {
                metadata: {
                    agent,
                    success: true,
                    executionTime: result.execution_time_ms
                }
            };
        } else {
            stream.markdown(`\n**Error:** ${result.error || 'Unknown error'}\n`);
            return {
                metadata: {
                    agent,
                    success: false,
                    error: result.error
                }
            };
        }
    }

    /**
     * Handle pipeline command
     */
    private async handlePipelineCommand(
        prompt: string,
        context: CodeContext | undefined,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatResult> {
        // Parse pipeline type and task from prompt
        const parts = prompt.trim().split(/\s+/);
        const pipelineType = parts[0];
        const task = parts.slice(1).join(' ');

        const validPipelines = [
            'plan_implement_review',
            'explore_plan_implement',
            'debug_fix_test',
            'security_audit_fix',
            'refactor_review_test'
        ];

        if (!validPipelines.includes(pipelineType)) {
            stream.markdown('**Available Pipelines:**\n\n');
            for (const pipeline of validPipelines) {
                stream.markdown(`- \`${pipeline}\`\n`);
            }
            stream.markdown('\n**Usage:** `/pipeline <pipeline_name> <task>`\n');
            return { metadata: { error: true, invalidPipeline: pipelineType } };
        }

        stream.markdown(`### $(git-merge) Pipeline: ${pipelineType}\n\n`);
        stream.progress('Executing pipeline...');

        // Execute pipeline
        const result = await this.bridge.executePipeline(
            pipelineType as 'plan_implement_review' | 'explore_plan_implement' | 'debug_fix_test' | 'security_audit_fix' | 'refactor_review_test',
            task,
            context
        );

        // Stream results from each stage
        for (const stageResult of result.stage_results) {
            const icon = InternalAgentBridge.AGENT_ICONS[stageResult.agent];
            stream.markdown(`\n#### $(${icon}) ${stageResult.agent}\n\n`);

            if (stageResult.result.success && stageResult.result.content) {
                stream.markdown(stageResult.result.content);
            } else if (stageResult.result.error) {
                stream.markdown(`*Error: ${stageResult.result.error}*`);
            }
        }

        return {
            metadata: {
                pipeline: pipelineType,
                success: result.success,
                totalTime: result.total_execution_time_ms
            }
        };
    }

    /**
     * Handle strategy command
     */
    private async handleStrategyCommand(
        prompt: string,
        context: CodeContext | undefined,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatResult> {
        // Parse strategy type and task from prompt
        const parts = prompt.trim().split(/\s+/);
        const strategyName = parts[0]?.toLowerCase();
        const task = parts.slice(1).join(' ');

        const strategyMap: Record<string, OrchestrationStrategy> = {
            'single': OrchestrationStrategy.SINGLE_AGENT,
            'single_agent': OrchestrationStrategy.SINGLE_AGENT,
            'race': OrchestrationStrategy.RACE_EXECUTION,
            'race_execution': OrchestrationStrategy.RACE_EXECUTION,
            'consensus': OrchestrationStrategy.CONSENSUS,
            'pipeline': OrchestrationStrategy.PIPELINE,
            'decomposition': OrchestrationStrategy.DECOMPOSITION,
            'decompose': OrchestrationStrategy.DECOMPOSITION
        };

        const strategy = strategyMap[strategyName];

        if (!strategy) {
            stream.markdown('**Available Strategies:**\n\n');
            stream.markdown('- `single` - Route to the best agent\n');
            stream.markdown('- `race` - Run agents in parallel, take first result\n');
            stream.markdown('- `consensus` - Run agents in parallel, aggregate results\n');
            stream.markdown('- `decomposition` - Split task across specialized agents\n');
            stream.markdown('\n**Usage:** `/strategy <strategy_name> <task>`\n');
            return { metadata: { error: true, invalidStrategy: strategyName } };
        }

        stream.markdown(`### $(symbol-misc) Strategy: ${strategy}\n\n`);
        stream.progress('Executing strategy...');

        // Execute with strategy
        const result = await this.bridge.executeWithStrategy(strategy, task, context);

        if (result.strategy === OrchestrationStrategy.CONSENSUS && result.individual_results) {
            // Show individual results for consensus
            stream.markdown('**Individual Agent Results:**\n\n');
            for (const agentResult of result.individual_results) {
                const icon = InternalAgentBridge.AGENT_ICONS[agentResult.agent_type];
                stream.markdown(`#### $(${icon}) ${agentResult.agent_type}\n`);
                if (agentResult.success && agentResult.content) {
                    stream.markdown(agentResult.content.substring(0, 500));
                    if (agentResult.content.length > 500) {
                        stream.markdown('...\n');
                    }
                }
                stream.markdown('\n\n');
            }

            // Show merged result
            if (result.merged_result) {
                stream.markdown('**Consensus Result:**\n\n');
                stream.markdown(result.merged_result.content || '');
            }
        } else if (result.selected_result) {
            // Show selected result
            stream.markdown(result.selected_result.content || '');
        }

        return {
            metadata: {
                strategy,
                success: result.success,
                executionTime: result.execution_time_ms
            }
        };
    }

    /**
     * Handle auto-routed request (no command)
     */
    private async handleAutoRoute(
        prompt: string,
        context: CodeContext | undefined,
        chatContext: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<vscode.ChatResult> {
        // Use router to determine best agent
        const route = await this.router.route(prompt);

        if (route.type === 'unknown' || route.confidence < 0.5) {
            // Low confidence - show suggestions
            stream.markdown('I\'m not sure which agent would be best for this task.\n\n');
            stream.markdown('**Suggested commands:**\n');
            stream.markdown('- `/plan` - Create an implementation plan\n');
            stream.markdown('- `/explore` - Search the codebase\n');
            stream.markdown('- `/code` - Generate code\n');
            stream.markdown('- `/review` - Review code quality\n');
            stream.markdown('- `/debug` - Debug issues\n');
            stream.markdown('\nOr try being more specific with your request.\n');

            return {
                metadata: {
                    autoRouted: true,
                    lowConfidence: true,
                    confidence: route.confidence
                }
            };
        }

        // High confidence - execute with selected agent
        if (route.type === 'internal' && route.agent) {
            stream.markdown(`*Auto-selected ${route.agent} agent (${(route.confidence * 100).toFixed(0)}% confidence)*\n\n`);
            return await this.handleAgentCommand(route.agent, route.extractedTask, context, stream, token);
        }

        if (route.type === 'pipeline' && route.pipeline) {
            stream.markdown(`*Auto-selected ${route.pipeline} pipeline*\n\n`);
            return await this.handlePipelineCommand(`${route.pipeline} ${route.extractedTask}`, context, stream, token);
        }

        if (route.type === 'strategy' && route.strategy) {
            stream.markdown(`*Auto-selected ${route.strategy} strategy*\n\n`);
            return await this.handleStrategyCommand(`${route.strategy} ${route.extractedTask}`, context, stream, token);
        }

        // External agent - redirect
        if (route.type === 'external' && route.externalAgent) {
            stream.markdown(`*This request is for ${route.externalAgent}. Redirecting...*\n\n`);
            await this.router.execute(route, context);
            return {
                metadata: {
                    redirected: true,
                    externalAgent: route.externalAgent
                }
            };
        }

        return { metadata: { autoRouted: true } };
    }

    /**
     * Provide follow-up suggestions
     */
    private provideFollowups(
        result: vscode.ChatResult,
        context: vscode.ChatContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.ChatFollowup[]> {
        const followups: vscode.ChatFollowup[] = [];
        const metadata = result.metadata as Record<string, unknown> | undefined;

        if (!metadata) {
            return followups;
        }

        // Suggest next steps based on what was done
        if (metadata.agent === SubagentType.PLANNER) {
            followups.push({
                prompt: '/code implement the plan',
                label: '$(code) Implement the plan',
                command: 'code'
            });
            followups.push({
                prompt: '/review check the plan for issues',
                label: '$(checklist) Review the plan',
                command: 'review'
            });
        }

        if (metadata.agent === SubagentType.CODER) {
            followups.push({
                prompt: '/test create tests for this code',
                label: '$(beaker) Generate tests',
                command: 'test'
            });
            followups.push({
                prompt: '/review check this code',
                label: '$(eye) Review code',
                command: 'review'
            });
            followups.push({
                prompt: '/document add documentation',
                label: '$(book) Add documentation',
                command: 'document'
            });
        }

        if (metadata.agent === SubagentType.REVIEWER) {
            followups.push({
                prompt: '/refactor improve based on review',
                label: '$(wrench) Apply improvements',
                command: 'refactor'
            });
            followups.push({
                prompt: '/security audit for vulnerabilities',
                label: '$(shield) Security audit',
                command: 'security'
            });
        }

        if (metadata.agent === SubagentType.DEBUGGER) {
            followups.push({
                prompt: '/code fix the identified issue',
                label: '$(tools) Fix the issue',
                command: 'code'
            });
            followups.push({
                prompt: '/test verify the fix',
                label: '$(beaker) Test the fix',
                command: 'test'
            });
        }

        if (metadata.agent === SubagentType.SECURITY) {
            followups.push({
                prompt: '/code fix security vulnerabilities',
                label: '$(shield) Fix vulnerabilities',
                command: 'code'
            });
            followups.push({
                prompt: '/review double-check fixes',
                label: '$(checklist) Verify fixes',
                command: 'review'
            });
        }

        if (metadata.pipeline) {
            followups.push({
                prompt: '/review verify pipeline results',
                label: '$(checklist) Verify results',
                command: 'review'
            });
        }

        // Always offer help
        if (followups.length === 0) {
            followups.push({
                prompt: 'What else can you help me with?',
                label: '$(question) Show capabilities'
            });
        }

        return followups;
    }

    /**
     * Get current code context from editor
     */
    private async getCodeContext(): Promise<CodeContext | undefined> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return undefined;
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
}

/**
 * Register chat participant
 */
export function registerChatParticipant(
    context: vscode.ExtensionContext,
    bridge: InternalAgentBridge,
    router: VoiceAgentRouter
): VoiceCodeChatParticipant {
    const participant = new VoiceCodeChatParticipant(bridge, router);
    participant.register(context);
    return participant;
}
