/**
 * MCP Server for External Agents
 * Exposes VoiceCode's internal agents via Model Context Protocol (MCP)
 * Allows external tools like Claude Code, Codex, etc. to access VoiceCode's capabilities
 */

import * as vscode from 'vscode';
import * as http from 'http';
import * as https from 'https';
import { InternalAgentBridge } from './internalAgentBridge';
import {
    SubagentType,
    OrchestrationStrategy,
    CodeContext,
    MCPServerInfo,
    MCPToolInfo,
    MCPResourceInfo
} from '../types/agents';

/**
 * MCP JSON-RPC Request
 */
interface MCPRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: Record<string, unknown>;
}

/**
 * MCP JSON-RPC Response
 */
interface MCPResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}

/**
 * MCP Tool Call
 */
interface MCPToolCall {
    name: string;
    arguments: Record<string, unknown>;
}

/**
 * MCP Server Configuration
 */
interface MCPServerConfig {
    port: number;
    host: string;
    enableSSL: boolean;
    authToken?: string;
    allowedOrigins: string[];
}

/**
 * MCP Server for VoiceCode
 * Implements the Model Context Protocol to expose internal agents
 */
export class VoiceCodeMCPServer implements vscode.Disposable {
    private bridge: InternalAgentBridge;
    private server: http.Server | https.Server | null = null;
    private config: MCPServerConfig;
    private isRunning = false;
    private requestCount = 0;
    private statusBarItem: vscode.StatusBarItem;
    private outputChannel: vscode.OutputChannel;

    constructor(bridge: InternalAgentBridge) {
        this.bridge = bridge;
        this.config = this.getDefaultConfig();
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.outputChannel = vscode.window.createOutputChannel('VoiceCode MCP Server');
    }

    /**
     * Get default configuration
     */
    private getDefaultConfig(): MCPServerConfig {
        const config = vscode.workspace.getConfiguration('voicecode.mcp');
        return {
            port: config.get('port', 8765),
            host: config.get('host', 'localhost'),
            enableSSL: config.get('enableSSL', false),
            authToken: config.get('authToken'),
            allowedOrigins: config.get('allowedOrigins', ['*'])
        };
    }

    /**
     * Start the MCP server
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            vscode.window.showWarningMessage('MCP Server is already running');
            return;
        }

        try {
            this.server = http.createServer((req, res) => this.handleRequest(req, res));

            await new Promise<void>((resolve, reject) => {
                this.server!.listen(this.config.port, this.config.host, () => {
                    resolve();
                });
                this.server!.on('error', reject);
            });

            this.isRunning = true;
            this.updateStatusBar();
            this.log(`MCP Server started on ${this.config.host}:${this.config.port}`);

            vscode.window.showInformationMessage(
                `VoiceCode MCP Server running on ${this.config.host}:${this.config.port}`
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.log(`Failed to start MCP Server: ${message}`, 'error');
            vscode.window.showErrorMessage(`Failed to start MCP Server: ${message}`);
        }
    }

    /**
     * Stop the MCP server
     */
    async stop(): Promise<void> {
        if (!this.isRunning || !this.server) {
            return;
        }

        return new Promise((resolve) => {
            this.server!.close(() => {
                this.isRunning = false;
                this.server = null;
                this.updateStatusBar();
                this.log('MCP Server stopped');
                vscode.window.showInformationMessage('VoiceCode MCP Server stopped');
                resolve();
            });
        });
    }

    /**
     * Restart the MCP server
     */
    async restart(): Promise<void> {
        await this.stop();
        this.config = this.getDefaultConfig();
        await this.start();
    }

    /**
     * Handle incoming HTTP request
     */
    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        // Set CORS headers
        this.setCORSHeaders(req, res);

        // Handle OPTIONS preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Only accept POST requests
        if (req.method !== 'POST') {
            this.sendError(res, -32600, 'Only POST method is allowed');
            return;
        }

        // Validate auth token if configured
        if (this.config.authToken) {
            const authHeader = req.headers.authorization;
            if (!authHeader || authHeader !== `Bearer ${this.config.authToken}`) {
                this.sendError(res, -32001, 'Unauthorized');
                return;
            }
        }

        // Parse request body
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const request = JSON.parse(body) as MCPRequest;
                this.requestCount++;
                this.updateStatusBar();

                this.log(`Received request: ${request.method}`);

                const response = await this.handleMCPRequest(request);
                this.sendResponse(res, response);
            } catch (error) {
                this.log(`Request parsing error: ${error}`, 'error');
                this.sendError(res, -32700, 'Parse error');
            }
        });
    }

    /**
     * Set CORS headers
     */
    private setCORSHeaders(req: http.IncomingMessage, res: http.ServerResponse): void {
        const origin = req.headers.origin || '*';
        const allowedOrigin = this.config.allowedOrigins.includes('*')
            ? origin
            : this.config.allowedOrigins.includes(origin as string) ? origin : '';

        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Content-Type', 'application/json');
    }

    /**
     * Handle MCP JSON-RPC request
     */
    private async handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
        try {
            let result: unknown;

            switch (request.method) {
                // Server info methods
                case 'initialize':
                    result = this.handleInitialize();
                    break;

                case 'server/info':
                    result = this.handleServerInfo();
                    break;

                // Tool methods
                case 'tools/list':
                    result = await this.handleToolsList();
                    break;

                case 'tools/call':
                    result = await this.handleToolsCall(request.params as MCPToolCall);
                    break;

                // Resource methods
                case 'resources/list':
                    result = await this.handleResourcesList();
                    break;

                case 'resources/read':
                    result = await this.handleResourcesRead(request.params as { uri: string });
                    break;

                // Capability methods
                case 'capabilities/list':
                    result = this.handleCapabilitiesList();
                    break;

                default:
                    return {
                        jsonrpc: '2.0',
                        id: request.id,
                        error: {
                            code: -32601,
                            message: `Method not found: ${request.method}`
                        }
                    };
            }

            return {
                jsonrpc: '2.0',
                id: request.id,
                result
            };
        } catch (error) {
            this.log(`Error handling request: ${error}`, 'error');
            return {
                jsonrpc: '2.0',
                id: request.id,
                error: {
                    code: -32603,
                    message: error instanceof Error ? error.message : 'Internal error'
                }
            };
        }
    }

    /**
     * Handle initialize request
     */
    private handleInitialize(): Record<string, unknown> {
        return {
            protocolVersion: '2024-11-05',
            serverInfo: {
                name: 'voicecode-mcp',
                version: '1.0.0'
            },
            capabilities: {
                tools: {},
                resources: {},
                prompts: {}
            }
        };
    }

    /**
     * Handle server/info request
     */
    private handleServerInfo(): MCPServerInfo {
        return {
            name: 'VoiceCode MCP Server',
            version: '1.0.0',
            description: 'Exposes VoiceCode\'s internal AI agents via MCP',
            capabilities: {
                tools: true,
                resources: true,
                prompts: false,
                sampling: false
            },
            supportedProtocolVersions: ['2024-11-05'],
            metadata: {
                totalRequests: this.requestCount,
                uptime: this.getUptime()
            }
        };
    }

    /**
     * Handle tools/list request
     */
    private async handleToolsList(): Promise<{ tools: MCPToolInfo[] }> {
        const tools: MCPToolInfo[] = [
            // Plan tool
            {
                name: 'voicecode_plan',
                description: 'Create an implementation plan for a coding task using the Planner agent (Opus model)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        task: {
                            type: 'string',
                            description: 'The task to create a plan for'
                        },
                        context: {
                            type: 'string',
                            description: 'Additional context about the codebase or requirements'
                        }
                    },
                    required: ['task']
                }
            },
            // Explore tool
            {
                name: 'voicecode_explore',
                description: 'Search and explore the codebase using the Explorer agent (Haiku model for speed)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'What to search for in the codebase'
                        },
                        scope: {
                            type: 'string',
                            enum: ['file', 'directory', 'workspace'],
                            description: 'Scope of the search'
                        }
                    },
                    required: ['query']
                }
            },
            // Code tool
            {
                name: 'voicecode_code',
                description: 'Generate code using the Coder agent (Sonnet model)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        task: {
                            type: 'string',
                            description: 'The code generation task'
                        },
                        language: {
                            type: 'string',
                            description: 'Programming language for the generated code'
                        }
                    },
                    required: ['task']
                }
            },
            // Review tool
            {
                name: 'voicecode_review',
                description: 'Review code quality using the Reviewer agent (Sonnet model)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        code: {
                            type: 'string',
                            description: 'Code to review'
                        },
                        focus: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Areas to focus on (e.g., security, performance, style)'
                        }
                    }
                }
            },
            // Test tool
            {
                name: 'voicecode_test',
                description: 'Generate tests using the Tester agent (Sonnet model)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'string',
                            description: 'Code or functionality to test'
                        },
                        framework: {
                            type: 'string',
                            description: 'Test framework to use'
                        },
                        type: {
                            type: 'string',
                            enum: ['unit', 'integration', 'e2e'],
                            description: 'Type of tests to generate'
                        }
                    },
                    required: ['target']
                }
            },
            // Debug tool
            {
                name: 'voicecode_debug',
                description: 'Debug issues using the Debugger agent (Sonnet model)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue: {
                            type: 'string',
                            description: 'Description of the issue to debug'
                        },
                        errorMessage: {
                            type: 'string',
                            description: 'Error message if available'
                        },
                        stackTrace: {
                            type: 'string',
                            description: 'Stack trace if available'
                        }
                    },
                    required: ['issue']
                }
            },
            // Document tool
            {
                name: 'voicecode_document',
                description: 'Generate documentation using the Documenter agent (Sonnet model)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'string',
                            description: 'Code to document'
                        },
                        style: {
                            type: 'string',
                            enum: ['jsdoc', 'docstring', 'markdown'],
                            description: 'Documentation style'
                        }
                    },
                    required: ['target']
                }
            },
            // Refactor tool
            {
                name: 'voicecode_refactor',
                description: 'Refactor code using the Refactorer agent (Sonnet model)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'string',
                            description: 'Code to refactor'
                        },
                        type: {
                            type: 'string',
                            enum: ['extract', 'rename', 'simplify', 'optimize'],
                            description: 'Type of refactoring'
                        }
                    },
                    required: ['target']
                }
            },
            // Security tool
            {
                name: 'voicecode_security',
                description: 'Perform security audit using the Security agent (Opus model for thoroughness)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        target: {
                            type: 'string',
                            description: 'Code or system to audit'
                        },
                        scanType: {
                            type: 'string',
                            enum: ['quick', 'full', 'owasp'],
                            description: 'Type of security scan'
                        }
                    },
                    required: ['target']
                }
            },
            // Pipeline tool
            {
                name: 'voicecode_pipeline',
                description: 'Execute a multi-agent pipeline for complex tasks',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pipeline: {
                            type: 'string',
                            enum: [
                                'plan_implement_review',
                                'explore_plan_implement',
                                'debug_fix_test',
                                'security_audit_fix',
                                'refactor_review_test'
                            ],
                            description: 'Pipeline to execute'
                        },
                        task: {
                            type: 'string',
                            description: 'Task for the pipeline'
                        }
                    },
                    required: ['pipeline', 'task']
                }
            },
            // Get context tool
            {
                name: 'voicecode_get_context',
                description: 'Get the current code context from VS Code editor',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            }
        ];

        return { tools };
    }

    /**
     * Handle tools/call request
     */
    private async handleToolsCall(params: MCPToolCall): Promise<unknown> {
        const context = await this.getCodeContext();
        const { name, arguments: args } = params;

        this.log(`Executing tool: ${name}`);

        switch (name) {
            case 'voicecode_plan':
                return this.executeTool(SubagentType.PLANNER, args.task as string, context);

            case 'voicecode_explore':
                return this.executeTool(SubagentType.EXPLORER, args.query as string, context);

            case 'voicecode_code': {
                if (args.language) {
                    context.language = args.language as string;
                }
                return this.executeTool(SubagentType.CODER, args.task as string, context);
            }

            case 'voicecode_review':
                if (args.code) {
                    context.selected_text = args.code as string;
                }
                return this.executeTool(SubagentType.REVIEWER,
                    (args.focus as string[] || []).join(', ') || 'general review', context);

            case 'voicecode_test': {
                let task = args.target as string;
                if (args.framework) task += ` using ${args.framework}`;
                if (args.type) task += ` (${args.type} tests)`;
                return this.executeTool(SubagentType.TESTER, task, context);
            }

            case 'voicecode_debug': {
                let issue = args.issue as string;
                if (args.errorMessage) issue += `\nError: ${args.errorMessage}`;
                if (args.stackTrace) issue += `\nStack: ${args.stackTrace}`;
                return this.executeTool(SubagentType.DEBUGGER, issue, context);
            }

            case 'voicecode_document': {
                let task = args.target as string;
                if (args.style) task += ` in ${args.style} style`;
                return this.executeTool(SubagentType.DOCUMENTER, task, context);
            }

            case 'voicecode_refactor': {
                let task = args.target as string;
                if (args.type) task = `${args.type} ${task}`;
                return this.executeTool(SubagentType.REFACTORER, task, context);
            }

            case 'voicecode_security': {
                let task = args.target as string;
                if (args.scanType) task += ` (${args.scanType} scan)`;
                return this.executeTool(SubagentType.SECURITY, task, context);
            }

            case 'voicecode_pipeline': {
                const pipelineType = args.pipeline as 'plan_implement_review' | 'explore_plan_implement' |
                    'debug_fix_test' | 'security_audit_fix' | 'refactor_review_test';
                const result = await this.bridge.executePipeline(pipelineType, args.task as string, context);
                return {
                    success: result.success,
                    pipeline: pipelineType,
                    executionTime: result.total_execution_time_ms,
                    stages: result.stage_results.map(sr => ({
                        agent: sr.agent,
                        success: sr.result.success,
                        content: sr.result.content
                    }))
                };
            }

            case 'voicecode_get_context':
                return {
                    filePath: context.file_path,
                    language: context.language,
                    selectedText: context.selected_text,
                    cursorPosition: context.cursor_position,
                    visibleRange: context.visible_range
                };

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }

    /**
     * Execute a tool with an agent
     */
    private async executeTool(
        agent: SubagentType,
        task: string,
        context: CodeContext
    ): Promise<unknown> {
        const result = await this.bridge.executeWithAgent(agent, task, context);

        return {
            success: result.success,
            agent,
            content: result.content,
            codeBlocks: result.code_blocks,
            filesModified: result.files_modified,
            suggestions: result.suggestions,
            executionTime: result.execution_time_ms,
            error: result.error
        };
    }

    /**
     * Handle resources/list request
     */
    private async handleResourcesList(): Promise<{ resources: MCPResourceInfo[] }> {
        const resources: MCPResourceInfo[] = [
            {
                uri: 'voicecode://agents',
                name: 'Available Agents',
                description: 'List of VoiceCode internal agents',
                mimeType: 'application/json'
            },
            {
                uri: 'voicecode://pipelines',
                name: 'Available Pipelines',
                description: 'Multi-agent pipeline definitions',
                mimeType: 'application/json'
            },
            {
                uri: 'voicecode://strategies',
                name: 'Orchestration Strategies',
                description: 'Available orchestration strategies',
                mimeType: 'application/json'
            },
            {
                uri: 'voicecode://context',
                name: 'Current Context',
                description: 'Current VS Code editor context',
                mimeType: 'application/json'
            },
            {
                uri: 'voicecode://status',
                name: 'Server Status',
                description: 'MCP server status and statistics',
                mimeType: 'application/json'
            }
        ];

        return { resources };
    }

    /**
     * Handle resources/read request
     */
    private async handleResourcesRead(params: { uri: string }): Promise<unknown> {
        const uri = params.uri;

        switch (uri) {
            case 'voicecode://agents': {
                const agents = await this.bridge.getAvailableAgents();
                return {
                    contents: [{
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(agents, null, 2)
                    }]
                };
            }

            case 'voicecode://pipelines': {
                const pipelines = [
                    {
                        type: 'plan_implement_review',
                        name: 'Plan → Implement → Review',
                        description: 'Full development cycle',
                        stages: ['planner', 'coder', 'reviewer']
                    },
                    {
                        type: 'explore_plan_implement',
                        name: 'Explore → Plan → Implement',
                        description: 'Discovery-first development',
                        stages: ['explorer', 'planner', 'coder']
                    },
                    {
                        type: 'debug_fix_test',
                        name: 'Debug → Fix → Test',
                        description: 'Bug diagnosis and resolution',
                        stages: ['debugger', 'coder', 'tester']
                    },
                    {
                        type: 'security_audit_fix',
                        name: 'Security Audit → Fix',
                        description: 'Security vulnerability remediation',
                        stages: ['security', 'coder']
                    },
                    {
                        type: 'refactor_review_test',
                        name: 'Refactor → Review → Test',
                        description: 'Safe code improvement',
                        stages: ['refactorer', 'reviewer', 'tester']
                    }
                ];
                return {
                    contents: [{
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(pipelines, null, 2)
                    }]
                };
            }

            case 'voicecode://strategies': {
                const strategies = [
                    {
                        type: 'single_agent',
                        name: 'Single Agent',
                        description: 'Route to the best agent for the task'
                    },
                    {
                        type: 'race_execution',
                        name: 'Race Execution',
                        description: 'Run agents in parallel, take first result'
                    },
                    {
                        type: 'consensus',
                        name: 'Consensus',
                        description: 'Run agents in parallel, aggregate results'
                    },
                    {
                        type: 'pipeline',
                        name: 'Pipeline',
                        description: 'Execute through sequential stages'
                    },
                    {
                        type: 'decomposition',
                        name: 'Decomposition',
                        description: 'Split task across specialized agents'
                    }
                ];
                return {
                    contents: [{
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(strategies, null, 2)
                    }]
                };
            }

            case 'voicecode://context': {
                const context = await this.getCodeContext();
                return {
                    contents: [{
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(context, null, 2)
                    }]
                };
            }

            case 'voicecode://status': {
                const status = {
                    running: this.isRunning,
                    port: this.config.port,
                    host: this.config.host,
                    requestCount: this.requestCount,
                    uptime: this.getUptime()
                };
                return {
                    contents: [{
                        uri,
                        mimeType: 'application/json',
                        text: JSON.stringify(status, null, 2)
                    }]
                };
            }

            default:
                throw new Error(`Unknown resource: ${uri}`);
        }
    }

    /**
     * Handle capabilities/list request
     */
    private handleCapabilitiesList(): Record<string, unknown> {
        return {
            capabilities: {
                tools: {
                    listChanged: false
                },
                resources: {
                    subscribe: false,
                    listChanged: false
                },
                prompts: {
                    listChanged: false
                },
                logging: {}
            }
        };
    }

    /**
     * Get current code context
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
     * Send JSON-RPC response
     */
    private sendResponse(res: http.ServerResponse, response: MCPResponse): void {
        res.writeHead(200);
        res.end(JSON.stringify(response));
    }

    /**
     * Send error response
     */
    private sendError(res: http.ServerResponse, code: number, message: string): void {
        res.writeHead(200);
        res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code, message }
        }));
    }

    /**
     * Update status bar
     */
    private updateStatusBar(): void {
        if (this.isRunning) {
            this.statusBarItem.text = `$(radio-tower) MCP: ${this.config.port} (${this.requestCount})`;
            this.statusBarItem.tooltip = `VoiceCode MCP Server\nPort: ${this.config.port}\nRequests: ${this.requestCount}`;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.activeBackground');
            this.statusBarItem.command = 'voicecode.stopMCPServer';
        } else {
            this.statusBarItem.text = '$(radio-tower) MCP: Off';
            this.statusBarItem.tooltip = 'VoiceCode MCP Server (Stopped)';
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.command = 'voicecode.startMCPServer';
        }
        this.statusBarItem.show();
    }

    /**
     * Get server uptime
     */
    private getUptime(): number {
        // This would track actual uptime in a real implementation
        return this.isRunning ? Date.now() : 0;
    }

    /**
     * Log message
     */
    private log(message: string, level: 'info' | 'error' = 'info'): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        this.outputChannel.appendLine(logMessage);
        console.log(logMessage);
    }

    /**
     * Get MCP configuration for external agents
     */
    getMCPConfig(): Record<string, unknown> {
        return {
            voicecode: {
                command: 'http',
                url: `http://${this.config.host}:${this.config.port}`,
                description: 'VoiceCode Internal Agents',
                tools: [
                    'voicecode_plan',
                    'voicecode_explore',
                    'voicecode_code',
                    'voicecode_review',
                    'voicecode_test',
                    'voicecode_debug',
                    'voicecode_document',
                    'voicecode_refactor',
                    'voicecode_security',
                    'voicecode_pipeline',
                    'voicecode_get_context'
                ]
            }
        };
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.stop();
        this.statusBarItem.dispose();
        this.outputChannel.dispose();
    }
}

/**
 * Register MCP Server commands
 */
export function registerMCPServerCommands(
    context: vscode.ExtensionContext,
    bridge: InternalAgentBridge
): VoiceCodeMCPServer {
    const server = new VoiceCodeMCPServer(bridge);
    context.subscriptions.push(server);

    // Start server command
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.startMCPServer', async () => {
            await server.start();
        })
    );

    // Stop server command
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.stopMCPServer', async () => {
            await server.stop();
        })
    );

    // Restart server command
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.restartMCPServer', async () => {
            await server.restart();
        })
    );

    // Show MCP config command
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.showMCPConfig', async () => {
            const config = server.getMCPConfig();
            const document = await vscode.workspace.openTextDocument({
                content: JSON.stringify(config, null, 2),
                language: 'json'
            });
            await vscode.window.showTextDocument(document);
        })
    );

    // Auto-start if configured
    const autoStart = vscode.workspace.getConfiguration('voicecode.mcp').get('autoStart', false);
    if (autoStart) {
        server.start();
    }

    return server;
}
