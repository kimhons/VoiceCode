"use strict";
/**
 * Model Context Protocol (MCP) Integration Service
 * Provides tool integration capabilities for AI coding assistants
 * Enables VoiceFlow PRO to expose tools to Claude, OpenAI, and other AI providers
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPIntegrationService = void 0;
const vscode = __importStar(require("vscode"));
/**
 * MCP Integration Service
 * Implements the Model Context Protocol for AI tool integration
 */
class MCPIntegrationService {
    config;
    tools = new Map();
    resources = new Map();
    prompts = new Map();
    isRunning = false;
    serverConfig;
    // Optional enhanced services
    toolChainExecutor;
    humanApproval;
    // Event emitters for different event types
    _onToolRegistered = new vscode.EventEmitter();
    _onResourceRegistered = new vscode.EventEmitter();
    _onPromptRegistered = new vscode.EventEmitter();
    _onToolExecuted = new vscode.EventEmitter();
    _onToolError = new vscode.EventEmitter();
    // Public event accessors
    onToolRegistered = this._onToolRegistered.event;
    onResourceRegistered = this._onResourceRegistered.event;
    onPromptRegistered = this._onPromptRegistered.event;
    onToolExecuted = this._onToolExecuted.event;
    onToolError = this._onToolError.event;
    constructor(config, toolChainExecutor, humanApproval) {
        this.config = config;
        this.toolChainExecutor = toolChainExecutor;
        this.humanApproval = humanApproval;
        this.serverConfig = {
            name: 'VoiceFlow PRO MCP Server',
            version: '1.0.0',
            capabilities: {
                tools: true,
                resources: true,
                prompts: true,
            },
        };
        this.registerBuiltInTools();
    }
    /**
     * Register built-in VoiceFlow PRO tools
     */
    registerBuiltInTools() {
        // Voice Command Execution Tool
        this.registerTool({
            name: 'execute_voice_command',
            description: 'Execute a voice command in VoiceFlow PRO',
            inputSchema: {
                type: 'object',
                properties: {
                    command: {
                        type: 'string',
                        description: 'The voice command to execute',
                    },
                    context: {
                        type: 'string',
                        description: 'Optional context for the command',
                    },
                },
                required: ['command'],
            },
            handler: async (params) => {
                try {
                    await vscode.commands.executeCommand('voiceflow.executeCommand', params.command);
                    return { success: true, output: `Command executed: ${params.command}` };
                }
                catch (error) {
                    return { success: false, error: `Failed to execute command: ${error}` };
                }
            },
        });
        // File Operations Tool
        this.registerTool({
            name: 'file_operations',
            description: 'Perform file operations (read, write, create, delete)',
            inputSchema: {
                type: 'object',
                properties: {
                    operation: {
                        type: 'string',
                        description: 'The operation to perform',
                        enum: ['read', 'write', 'create', 'delete', 'list'],
                    },
                    path: {
                        type: 'string',
                        description: 'The file or directory path',
                    },
                    content: {
                        type: 'string',
                        description: 'Content for write/create operations',
                    },
                },
                required: ['operation', 'path'],
            },
            handler: async (params) => {
                return await this.handleFileOperation(params);
            },
        });
        // Code Analysis Tool
        this.registerTool({
            name: 'analyze_code',
            description: 'Analyze code for issues, patterns, and suggestions',
            inputSchema: {
                type: 'object',
                properties: {
                    code: { type: 'string', description: 'The code to analyze' },
                    language: { type: 'string', description: 'Programming language' },
                    analysisType: {
                        type: 'string',
                        description: 'Type of analysis',
                        enum: ['errors', 'style', 'security', 'performance', 'all'],
                        default: 'all',
                    },
                },
                required: ['code', 'language'],
            },
            handler: async (params) => {
                return await this.handleCodeAnalysis(params);
            },
        });
        // Search Codebase Tool
        this.registerTool({
            name: 'search_codebase',
            description: 'Search the codebase for code, symbols, or text',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Search query' },
                    searchType: {
                        type: 'string',
                        description: 'Type of search',
                        enum: ['text', 'symbol', 'semantic', 'regex'],
                        default: 'text',
                    },
                    filePattern: { type: 'string', description: 'File pattern to search in' },
                    maxResults: { type: 'number', description: 'Maximum results to return', default: 20 },
                },
                required: ['query'],
            },
            handler: async (params) => {
                return await this.handleCodebaseSearch(params);
            },
        });
        // Terminal Command Tool
        this.registerTool({
            name: 'run_terminal_command',
            description: 'Execute a command in the integrated terminal',
            inputSchema: {
                type: 'object',
                properties: {
                    command: { type: 'string', description: 'The command to run' },
                    cwd: { type: 'string', description: 'Working directory' },
                    waitForExit: { type: 'boolean', description: 'Wait for command to complete', default: false },
                },
                required: ['command'],
            },
            handler: async (params) => {
                return await this.handleTerminalCommand(params);
            },
        });
        // Git Operations Tool
        this.registerTool({
            name: 'git_operations',
            description: 'Perform Git operations',
            inputSchema: {
                type: 'object',
                properties: {
                    operation: {
                        type: 'string',
                        description: 'Git operation',
                        enum: ['status', 'diff', 'log', 'branch', 'commit', 'push', 'pull', 'stash'],
                    },
                    args: { type: 'string', description: 'Additional arguments' },
                },
                required: ['operation'],
            },
            handler: async (params) => {
                return await this.handleGitOperation(params);
            },
        });
        // =====================================================
        // ADDITIONAL MCP TOOLS (7-26)
        // =====================================================
        // 7. Editor Navigation Tool
        this.registerTool({
            name: 'editor_navigate',
            description: 'Navigate within the editor (go to line, symbol, file)',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Navigation action',
                        enum: ['goto_line', 'goto_symbol', 'goto_file', 'goto_definition', 'find_references', 'peek_definition'],
                    },
                    target: { type: 'string', description: 'Line number, symbol name, or file path' },
                },
                required: ['action', 'target'],
            },
            handler: async (params) => {
                return await this.handleEditorNavigation(params);
            },
        });
        // 8. Code Refactoring Tool
        this.registerTool({
            name: 'refactor_code',
            description: 'Perform code refactoring operations',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Refactoring action',
                        enum: ['rename', 'extract_function', 'extract_variable', 'inline', 'move', 'convert_to_arrow'],
                    },
                    symbolName: { type: 'string', description: 'Symbol to refactor' },
                    newName: { type: 'string', description: 'New name for rename operations' },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleRefactoring(params);
            },
        });
        // 9. Debugging Tool
        this.registerTool({
            name: 'debug_operations',
            description: 'Control debugging operations',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Debug action',
                        enum: ['start', 'stop', 'step_over', 'step_into', 'step_out', 'continue', 'toggle_breakpoint', 'clear_breakpoints'],
                    },
                    line: { type: 'number', description: 'Line number for breakpoint operations' },
                    configuration: { type: 'string', description: 'Debug configuration name' },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleDebugging(params);
            },
        });
        // 10. Test Runner Tool
        this.registerTool({
            name: 'run_tests',
            description: 'Execute tests in the workspace',
            inputSchema: {
                type: 'object',
                properties: {
                    scope: {
                        type: 'string',
                        description: 'Test scope',
                        enum: ['all', 'file', 'suite', 'single', 'failed', 'coverage'],
                    },
                    testName: { type: 'string', description: 'Specific test name or pattern' },
                    filePath: { type: 'string', description: 'Test file path' },
                },
                required: ['scope'],
            },
            handler: async (params) => {
                return await this.handleTestRunner(params);
            },
        });
        // 11. Snippet Management Tool
        this.registerTool({
            name: 'snippets',
            description: 'Insert or manage code snippets',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Snippet action',
                        enum: ['insert', 'list', 'create', 'delete'],
                    },
                    name: { type: 'string', description: 'Snippet name' },
                    prefix: { type: 'string', description: 'Trigger prefix for new snippets' },
                    body: { type: 'string', description: 'Snippet body for creation' },
                    language: { type: 'string', description: 'Language scope' },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleSnippets(params);
            },
        });
        // 12. Workspace Management Tool
        this.registerTool({
            name: 'workspace_manage',
            description: 'Manage workspace folders and settings',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Workspace action',
                        enum: ['add_folder', 'remove_folder', 'list_folders', 'get_setting', 'update_setting', 'open_settings'],
                    },
                    path: { type: 'string', description: 'Folder path' },
                    settingKey: { type: 'string', description: 'Setting key for get/update' },
                    settingValue: { type: 'string', description: 'New setting value' },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleWorkspaceManagement(params);
            },
        });
        // 13. Documentation Tool
        this.registerTool({
            name: 'documentation',
            description: 'Generate or fetch documentation',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Documentation action',
                        enum: ['generate_jsdoc', 'generate_docstring', 'hover_info', 'signature_help', 'open_docs'],
                    },
                    symbol: { type: 'string', description: 'Symbol name for documentation' },
                    style: { type: 'string', description: 'Documentation style', enum: ['jsdoc', 'tsdoc', 'python', 'doxygen'] },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleDocumentation(params);
            },
        });
        // 14. Code Formatting Tool
        this.registerTool({
            name: 'format_code',
            description: 'Format code in the editor',
            inputSchema: {
                type: 'object',
                properties: {
                    scope: {
                        type: 'string',
                        description: 'Format scope',
                        enum: ['document', 'selection', 'on_save', 'organize_imports'],
                    },
                    formatter: { type: 'string', description: 'Specific formatter to use' },
                },
                required: ['scope'],
            },
            handler: async (params) => {
                return await this.handleFormatting(params);
            },
        });
        // 15. Problem/Diagnostics Tool
        this.registerTool({
            name: 'diagnostics',
            description: 'View and manage code problems/diagnostics',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Diagnostics action',
                        enum: ['list_all', 'list_errors', 'list_warnings', 'next_problem', 'prev_problem', 'quick_fix', 'clear'],
                    },
                    filePath: { type: 'string', description: 'Filter by file path' },
                    severity: { type: 'string', description: 'Filter by severity', enum: ['error', 'warning', 'info', 'hint'] },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleDiagnostics(params);
            },
        });
        // 16. Selection Tool
        this.registerTool({
            name: 'selection',
            description: 'Manage editor selections',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Selection action',
                        enum: ['select_all', 'select_line', 'select_word', 'select_block', 'expand_selection', 'shrink_selection', 'select_occurrences', 'add_cursor'],
                    },
                    startLine: { type: 'number', description: 'Start line for range selection' },
                    endLine: { type: 'number', description: 'End line for range selection' },
                    text: { type: 'string', description: 'Text to find for select_occurrences' },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleSelection(params);
            },
        });
        // 17. Comment Tool
        this.registerTool({
            name: 'comments',
            description: 'Add, remove, or toggle comments',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Comment action',
                        enum: ['toggle_line', 'toggle_block', 'add_line', 'remove_line', 'add_block', 'remove_block', 'add_todo', 'add_fixme'],
                    },
                    text: { type: 'string', description: 'Comment text for add operations' },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleComments(params);
            },
        });
        // 18. Clipboard Tool
        this.registerTool({
            name: 'clipboard',
            description: 'Clipboard operations for code',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Clipboard action',
                        enum: ['copy', 'cut', 'paste', 'copy_path', 'copy_relative_path', 'copy_with_syntax'],
                    },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleClipboard(params);
            },
        });
        // 19. Window Management Tool
        this.registerTool({
            name: 'window_manage',
            description: 'Manage VS Code windows and panels',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Window action',
                        enum: ['split_editor', 'close_editor', 'close_all', 'toggle_sidebar', 'toggle_panel', 'toggle_terminal', 'focus_editor', 'new_window', 'zoom_in', 'zoom_out'],
                    },
                    direction: { type: 'string', description: 'Split direction', enum: ['horizontal', 'vertical'] },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleWindowManagement(params);
            },
        });
        // 20. Extension Management Tool
        this.registerTool({
            name: 'extensions',
            description: 'Manage VS Code extensions',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Extension action',
                        enum: ['list_installed', 'search', 'install', 'uninstall', 'enable', 'disable', 'update', 'show_recommendations'],
                    },
                    extensionId: { type: 'string', description: 'Extension ID for install/uninstall' },
                    query: { type: 'string', description: 'Search query' },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleExtensions(params);
            },
        });
        // 21. Project Generation Tool
        this.registerTool({
            name: 'project_generate',
            description: 'Generate project structure and boilerplate',
            inputSchema: {
                type: 'object',
                properties: {
                    template: {
                        type: 'string',
                        description: 'Project template',
                        enum: ['react', 'vue', 'angular', 'node', 'python', 'rust', 'go', 'typescript', 'express', 'fastapi'],
                    },
                    name: { type: 'string', description: 'Project name' },
                    options: { type: 'string', description: 'Additional options (JSON string)' },
                },
                required: ['template', 'name'],
            },
            handler: async (params) => {
                return await this.handleProjectGeneration(params);
            },
        });
        // 22. Code Folding Tool
        this.registerTool({
            name: 'folding',
            description: 'Control code folding',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Folding action',
                        enum: ['fold', 'unfold', 'fold_all', 'unfold_all', 'fold_level', 'fold_recursively', 'toggle'],
                    },
                    level: { type: 'number', description: 'Folding level (1-7)' },
                    line: { type: 'number', description: 'Line number for specific fold' },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleFolding(params);
            },
        });
        // 23. Multi-Cursor Tool
        this.registerTool({
            name: 'multi_cursor',
            description: 'Multi-cursor editing operations',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Multi-cursor action',
                        enum: ['add_cursor_above', 'add_cursor_below', 'add_cursors_to_line_ends', 'select_all_occurrences', 'change_all_occurrences', 'column_select'],
                    },
                    count: { type: 'number', description: 'Number of cursors to add' },
                    text: { type: 'string', description: 'Text to match for occurrences' },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleMultiCursor(params);
            },
        });
        // 24. Language Server Tool
        this.registerTool({
            name: 'language_server',
            description: 'Interact with language server features',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Language server action',
                        enum: ['restart', 'get_completions', 'get_hover', 'get_signature', 'find_implementations', 'find_type_definition', 'rename_symbol'],
                    },
                    symbol: { type: 'string', description: 'Symbol for lookup operations' },
                    newName: { type: 'string', description: 'New name for rename' },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleLanguageServer(params);
            },
        });
        // 25. Task Runner Tool
        this.registerTool({
            name: 'tasks',
            description: 'Run VS Code tasks',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Task action',
                        enum: ['run', 'list', 'configure', 'terminate', 'restart', 'run_build', 'run_test'],
                    },
                    taskName: { type: 'string', description: 'Task name to run' },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleTasks(params);
            },
        });
        // 26. Diff and Merge Tool
        this.registerTool({
            name: 'diff_merge',
            description: 'Compare and merge files',
            inputSchema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        description: 'Diff/merge action',
                        enum: ['diff_files', 'diff_with_clipboard', 'diff_with_saved', 'accept_current', 'accept_incoming', 'accept_both', 'compare_active'],
                    },
                    leftFile: { type: 'string', description: 'Left file path for diff' },
                    rightFile: { type: 'string', description: 'Right file path for diff' },
                },
                required: ['action'],
            },
            handler: async (params) => {
                return await this.handleDiffMerge(params);
            },
        });
        // Register built-in prompts
        this.registerBuiltInPrompts();
    }
    /**
     * Register built-in prompts for AI assistants
     */
    registerBuiltInPrompts() {
        this.registerPrompt({
            name: 'code_review',
            description: 'Generate a comprehensive code review for the given code',
            arguments: [
                { name: 'code', description: 'Code to review', required: true },
                { name: 'language', description: 'Programming language', required: true },
                { name: 'focus', description: 'Focus areas (security, performance, style)', required: false },
            ],
            generate: async (args) => {
                return `Please review the following ${args.language} code with focus on ${args.focus || 'overall quality'}:

\`\`\`${args.language}
${args.code}
\`\`\`

Provide:
1. Summary of what the code does
2. Issues found (bugs, potential errors)
3. Security concerns
4. Performance suggestions
5. Code style improvements
6. Best practices recommendations`;
            },
        });
        this.registerPrompt({
            name: 'refactor_code',
            description: 'Generate a refactoring plan for the given code',
            arguments: [
                { name: 'code', description: 'Code to refactor', required: true },
                { name: 'language', description: 'Programming language', required: true },
                { name: 'goal', description: 'Refactoring goal', required: false },
            ],
            generate: async (args) => {
                return `Please refactor the following ${args.language} code${args.goal ? ` to ${args.goal}` : ''}:

\`\`\`${args.language}
${args.code}
\`\`\`

Provide:
1. Analysis of current code structure
2. Proposed refactoring changes
3. Benefits of refactoring
4. Refactored code
5. Any breaking changes to be aware of`;
            },
        });
    }
    /**
     * Register a new tool
     */
    registerTool(tool) {
        this.tools.set(tool.name, tool);
        this._onToolRegistered.fire(tool);
    }
    /**
     * Register a new resource
     */
    registerResource(resource) {
        this.resources.set(resource.uri, resource);
        this._onResourceRegistered.fire(resource);
    }
    /**
     * Register a new prompt
     */
    registerPrompt(prompt) {
        this.prompts.set(prompt.name, prompt);
        this._onPromptRegistered.fire(prompt);
    }
    /**
     * List all available tools
     */
    listTools() {
        return Array.from(this.tools.values());
    }
    /**
     * List all available resources
     */
    listResources() {
        return Array.from(this.resources.values());
    }
    /**
     * List all available prompts
     */
    listPrompts() {
        return Array.from(this.prompts.values());
    }
    /**
     * Execute a tool by name
     */
    async executeTool(toolName, params) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            return { success: false, error: `Tool not found: ${toolName}` };
        }
        try {
            const result = await tool.handler(params);
            this._onToolExecuted.fire({ tool: toolName, params, result });
            return result;
        }
        catch (error) {
            const errorResult = {
                success: false,
                error: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
            };
            this._onToolError.fire({ tool: toolName, params, error });
            return errorResult;
        }
    }
    /**
     * Get a prompt by name and generate it with arguments
     */
    async generatePrompt(promptName, args) {
        const prompt = this.prompts.get(promptName);
        if (!prompt) {
            return null;
        }
        try {
            return await prompt.generate(args);
        }
        catch (error) {
            console.error(`Failed to generate prompt ${promptName}:`, error);
            return null;
        }
    }
    /**
     * Handle file operations
     */
    async handleFileOperation(params) {
        const { operation, path: filePath, content } = params;
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return { success: false, error: 'No workspace folder open' };
            }
            const uri = vscode.Uri.joinPath(workspaceFolder.uri, filePath);
            switch (operation) {
                case 'read': {
                    const fileContent = await vscode.workspace.fs.readFile(uri);
                    return { success: true, output: Buffer.from(fileContent).toString('utf-8') };
                }
                case 'write':
                case 'create':
                    await vscode.workspace.fs.writeFile(uri, Buffer.from(content || '', 'utf-8'));
                    return { success: true, output: `File ${operation}d: ${filePath}` };
                case 'delete':
                    await vscode.workspace.fs.delete(uri);
                    return { success: true, output: `File deleted: ${filePath}` };
                case 'list': {
                    const entries = await vscode.workspace.fs.readDirectory(uri);
                    const listing = entries.map(([name, type]) => `${type === vscode.FileType.Directory ? '[DIR]' : '[FILE]'} ${name}`).join('\n');
                    return { success: true, output: listing };
                }
                default:
                    return { success: false, error: `Unknown operation: ${operation}` };
            }
        }
        catch (error) {
            return { success: false, error: `File operation failed: ${error}` };
        }
    }
    /**
     * Handle code analysis
     */
    async handleCodeAnalysis(params) {
        const { code, language, analysisType } = params;
        try {
            // Get diagnostics for the current file
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return { success: false, error: 'No active editor' };
            }
            const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
            const issues = diagnostics.map(d => ({
                severity: vscode.DiagnosticSeverity[d.severity],
                message: d.message,
                line: d.range.start.line + 1,
                column: d.range.start.character + 1,
                source: d.source || 'unknown',
            }));
            return {
                success: true,
                output: `Found ${issues.length} issues`,
                data: { issues, language, analysisType },
            };
        }
        catch (error) {
            return { success: false, error: `Code analysis failed: ${error}` };
        }
    }
    /**
     * Handle codebase search
     */
    async handleCodebaseSearch(params) {
        const { query, searchType, filePattern, maxResults = 20 } = params;
        try {
            const files = await vscode.workspace.findFiles(filePattern || '**/*', '**/node_modules/**', maxResults);
            const results = [];
            for (const file of files) {
                const content = await vscode.workspace.fs.readFile(file);
                const text = Buffer.from(content).toString('utf-8');
                if (searchType === 'regex') {
                    const regex = new RegExp(query, 'gm');
                    const matches = text.match(regex);
                    if (matches && matches.length > 0) {
                        results.push({
                            file: vscode.workspace.asRelativePath(file),
                            matches: matches.slice(0, 5),
                        });
                    }
                }
                else {
                    if (text.toLowerCase().includes(query.toLowerCase())) {
                        const lines = text.split('\n');
                        const matchingLines = lines.filter(l => l.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
                        results.push({
                            file: vscode.workspace.asRelativePath(file),
                            matches: matchingLines,
                        });
                    }
                }
                if (results.length >= maxResults)
                    break;
            }
            return {
                success: true,
                output: `Found ${results.length} files with matches`,
                data: { results },
            };
        }
        catch (error) {
            return { success: false, error: `Search failed: ${error}` };
        }
    }
    /**
     * Handle terminal commands
     */
    async handleTerminalCommand(params) {
        const { command, cwd } = params;
        try {
            const terminal = vscode.window.createTerminal({
                name: 'VoiceFlow Command',
                cwd: cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
            });
            terminal.show();
            terminal.sendText(command);
            return { success: true, output: `Command sent to terminal: ${command}` };
        }
        catch (error) {
            return { success: false, error: `Terminal command failed: ${error}` };
        }
    }
    /**
     * Handle Git operations
     */
    async handleGitOperation(params) {
        const { operation, args } = params;
        try {
            const gitExtension = vscode.extensions.getExtension('vscode.git');
            if (!gitExtension) {
                return { success: false, error: 'Git extension not available' };
            }
            const git = gitExtension.exports.getAPI(1);
            const repo = git.repositories[0];
            if (!repo) {
                return { success: false, error: 'No Git repository found' };
            }
            // Execute git command through terminal for full compatibility
            const terminal = vscode.window.createTerminal({ name: 'Git' });
            terminal.sendText(`git ${operation}${args ? ' ' + args : ''}`);
            terminal.show();
            return { success: true, output: `Git ${operation} executed` };
        }
        catch (error) {
            return { success: false, error: `Git operation failed: ${error}` };
        }
    }
    // =====================================================
    // HANDLER IMPLEMENTATIONS FOR ADDITIONAL MCP TOOLS
    // =====================================================
    /**
     * Handle editor navigation
     */
    async handleEditorNavigation(params) {
        const { action, target } = params;
        try {
            switch (action) {
                case 'goto_line': {
                    const lineNum = parseInt(target, 10);
                    if (isNaN(lineNum)) {
                        return { success: false, error: 'Invalid line number' };
                    }
                    await vscode.commands.executeCommand('workbench.action.gotoLine');
                    return { success: true, output: `Go to line dialog opened` };
                }
                case 'goto_symbol':
                    await vscode.commands.executeCommand('workbench.action.gotoSymbol');
                    return { success: true, output: 'Go to symbol dialog opened' };
                case 'goto_file':
                    await vscode.commands.executeCommand('workbench.action.quickOpen', target);
                    return { success: true, output: `Quick open with: ${target}` };
                case 'goto_definition':
                    await vscode.commands.executeCommand('editor.action.revealDefinition');
                    return { success: true, output: 'Go to definition executed' };
                case 'find_references':
                    await vscode.commands.executeCommand('editor.action.goToReferences');
                    return { success: true, output: 'Find references executed' };
                case 'peek_definition':
                    await vscode.commands.executeCommand('editor.action.peekDefinition');
                    return { success: true, output: 'Peek definition opened' };
                default:
                    return { success: false, error: `Unknown navigation action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Navigation failed: ${error}` };
        }
    }
    /**
     * Handle code refactoring
     */
    async handleRefactoring(params) {
        const { action, newName } = params;
        try {
            switch (action) {
                case 'rename':
                    await vscode.commands.executeCommand('editor.action.rename');
                    return { success: true, output: 'Rename dialog opened' };
                case 'extract_function':
                    await vscode.commands.executeCommand('editor.action.codeAction', {
                        kind: 'refactor.extract.function',
                        apply: 'first',
                    });
                    return { success: true, output: 'Extract function executed' };
                case 'extract_variable':
                    await vscode.commands.executeCommand('editor.action.codeAction', {
                        kind: 'refactor.extract.variable',
                        apply: 'first',
                    });
                    return { success: true, output: 'Extract variable executed' };
                case 'inline':
                    await vscode.commands.executeCommand('editor.action.codeAction', {
                        kind: 'refactor.inline',
                        apply: 'first',
                    });
                    return { success: true, output: 'Inline refactoring executed' };
                case 'move':
                    await vscode.commands.executeCommand('editor.action.codeAction', {
                        kind: 'refactor.move',
                        apply: 'first',
                    });
                    return { success: true, output: 'Move refactoring executed' };
                case 'convert_to_arrow':
                    await vscode.commands.executeCommand('editor.action.codeAction', {
                        kind: 'refactor.rewrite.function.arrow',
                        apply: 'first',
                    });
                    return { success: true, output: 'Convert to arrow function executed' };
                default:
                    return { success: false, error: `Unknown refactoring action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Refactoring failed: ${error}` };
        }
    }
    /**
     * Handle debugging operations
     */
    async handleDebugging(params) {
        const { action, line, configuration } = params;
        try {
            switch (action) {
                case 'start':
                    if (configuration) {
                        await vscode.commands.executeCommand('workbench.action.debug.selectandstart', configuration);
                    }
                    else {
                        await vscode.commands.executeCommand('workbench.action.debug.start');
                    }
                    return { success: true, output: 'Debugging started' };
                case 'stop':
                    await vscode.commands.executeCommand('workbench.action.debug.stop');
                    return { success: true, output: 'Debugging stopped' };
                case 'step_over':
                    await vscode.commands.executeCommand('workbench.action.debug.stepOver');
                    return { success: true, output: 'Step over executed' };
                case 'step_into':
                    await vscode.commands.executeCommand('workbench.action.debug.stepInto');
                    return { success: true, output: 'Step into executed' };
                case 'step_out':
                    await vscode.commands.executeCommand('workbench.action.debug.stepOut');
                    return { success: true, output: 'Step out executed' };
                case 'continue':
                    await vscode.commands.executeCommand('workbench.action.debug.continue');
                    return { success: true, output: 'Continue executed' };
                case 'toggle_breakpoint':
                    await vscode.commands.executeCommand('editor.debug.action.toggleBreakpoint');
                    return { success: true, output: 'Breakpoint toggled' };
                case 'clear_breakpoints':
                    await vscode.commands.executeCommand('workbench.debug.viewlet.action.removeAllBreakpoints');
                    return { success: true, output: 'All breakpoints cleared' };
                default:
                    return { success: false, error: `Unknown debug action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Debug operation failed: ${error}` };
        }
    }
    /**
     * Handle test runner operations
     */
    async handleTestRunner(params) {
        const { scope, testName, filePath } = params;
        try {
            switch (scope) {
                case 'all':
                    await vscode.commands.executeCommand('testing.runAll');
                    return { success: true, output: 'Running all tests' };
                case 'file':
                    await vscode.commands.executeCommand('testing.runCurrentFile');
                    return { success: true, output: 'Running tests in current file' };
                case 'failed':
                    await vscode.commands.executeCommand('testing.reRunFailTests');
                    return { success: true, output: 'Re-running failed tests' };
                case 'coverage':
                    await vscode.commands.executeCommand('testing.coverageAll');
                    return { success: true, output: 'Running tests with coverage' };
                case 'single':
                case 'suite':
                    await vscode.commands.executeCommand('testing.runAtCursor');
                    return { success: true, output: 'Running test at cursor' };
                default:
                    return { success: false, error: `Unknown test scope: ${scope}` };
            }
        }
        catch (error) {
            return { success: false, error: `Test runner failed: ${error}` };
        }
    }
    /**
     * Handle snippet operations
     */
    async handleSnippets(params) {
        const { action, name, prefix, body, language } = params;
        try {
            switch (action) {
                case 'insert':
                    await vscode.commands.executeCommand('editor.action.insertSnippet', { name });
                    return { success: true, output: `Snippet "${name}" inserted` };
                case 'list':
                    await vscode.commands.executeCommand('workbench.action.openSnippets');
                    return { success: true, output: 'Snippet list opened' };
                case 'create':
                    await vscode.commands.executeCommand('workbench.action.openSnippets');
                    return { success: true, output: 'Snippet editor opened for creation' };
                case 'delete':
                    return { success: false, error: 'Delete snippet requires manual action in snippet file' };
                default:
                    return { success: false, error: `Unknown snippet action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Snippet operation failed: ${error}` };
        }
    }
    /**
     * Handle workspace management
     */
    async handleWorkspaceManagement(params) {
        const { action, path, settingKey, settingValue } = params;
        try {
            switch (action) {
                case 'add_folder':
                    if (!path)
                        return { success: false, error: 'Path required' };
                    await vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders?.length || 0, 0, { uri: vscode.Uri.file(path) });
                    return { success: true, output: `Folder added: ${path}` };
                case 'remove_folder':
                    const folderIndex = vscode.workspace.workspaceFolders?.findIndex(f => f.uri.fsPath === path);
                    if (folderIndex !== undefined && folderIndex >= 0) {
                        await vscode.workspace.updateWorkspaceFolders(folderIndex, 1);
                        return { success: true, output: `Folder removed: ${path}` };
                    }
                    return { success: false, error: 'Folder not found in workspace' };
                case 'list_folders':
                    const folders = vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath) || [];
                    return { success: true, output: folders.join('\n'), data: { folders } };
                case 'get_setting':
                    if (!settingKey)
                        return { success: false, error: 'Setting key required' };
                    const value = vscode.workspace.getConfiguration().get(settingKey);
                    return { success: true, output: JSON.stringify(value), data: { value } };
                case 'update_setting':
                    if (!settingKey)
                        return { success: false, error: 'Setting key required' };
                    await vscode.workspace.getConfiguration().update(settingKey, JSON.parse(settingValue || 'null'), vscode.ConfigurationTarget.Workspace);
                    return { success: true, output: `Setting updated: ${settingKey}` };
                case 'open_settings':
                    await vscode.commands.executeCommand('workbench.action.openSettings');
                    return { success: true, output: 'Settings opened' };
                default:
                    return { success: false, error: `Unknown workspace action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Workspace operation failed: ${error}` };
        }
    }
    /**
     * Handle documentation operations
     */
    async handleDocumentation(params) {
        const { action, symbol, style } = params;
        try {
            switch (action) {
                case 'generate_jsdoc':
                case 'generate_docstring':
                    await vscode.commands.executeCommand('editor.action.addCommentLine');
                    return { success: true, output: 'Documentation generation initiated' };
                case 'hover_info':
                    await vscode.commands.executeCommand('editor.action.showHover');
                    return { success: true, output: 'Hover info shown' };
                case 'signature_help':
                    await vscode.commands.executeCommand('editor.action.triggerParameterHints');
                    return { success: true, output: 'Signature help shown' };
                case 'open_docs':
                    await vscode.commands.executeCommand('editor.action.openLink');
                    return { success: true, output: 'Documentation link opened' };
                default:
                    return { success: false, error: `Unknown documentation action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Documentation operation failed: ${error}` };
        }
    }
    /**
     * Handle code formatting
     */
    async handleFormatting(params) {
        const { scope, formatter } = params;
        try {
            switch (scope) {
                case 'document':
                    await vscode.commands.executeCommand('editor.action.formatDocument');
                    return { success: true, output: 'Document formatted' };
                case 'selection':
                    await vscode.commands.executeCommand('editor.action.formatSelection');
                    return { success: true, output: 'Selection formatted' };
                case 'on_save':
                    await vscode.commands.executeCommand('editor.action.formatDocument');
                    await vscode.commands.executeCommand('workbench.action.files.save');
                    return { success: true, output: 'Formatted and saved' };
                case 'organize_imports':
                    await vscode.commands.executeCommand('editor.action.organizeImports');
                    return { success: true, output: 'Imports organized' };
                default:
                    return { success: false, error: `Unknown format scope: ${scope}` };
            }
        }
        catch (error) {
            return { success: false, error: `Formatting failed: ${error}` };
        }
    }
    /**
     * Handle diagnostics operations
     */
    async handleDiagnostics(params) {
        const { action, filePath, severity } = params;
        try {
            switch (action) {
                case 'list_all':
                case 'list_errors':
                case 'list_warnings': {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        return { success: false, error: 'No active editor' };
                    const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
                    let filtered = diagnostics;
                    if (action === 'list_errors') {
                        filtered = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error);
                    }
                    else if (action === 'list_warnings') {
                        filtered = diagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning);
                    }
                    const issues = filtered.map(d => ({
                        line: d.range.start.line + 1,
                        message: d.message,
                        severity: vscode.DiagnosticSeverity[d.severity],
                    }));
                    return {
                        success: true,
                        output: `Found ${issues.length} issues`,
                        data: { issues },
                    };
                }
                case 'next_problem':
                    await vscode.commands.executeCommand('editor.action.marker.next');
                    return { success: true, output: 'Moved to next problem' };
                case 'prev_problem':
                    await vscode.commands.executeCommand('editor.action.marker.prev');
                    return { success: true, output: 'Moved to previous problem' };
                case 'quick_fix':
                    await vscode.commands.executeCommand('editor.action.quickFix');
                    return { success: true, output: 'Quick fix menu opened' };
                default:
                    return { success: false, error: `Unknown diagnostics action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Diagnostics operation failed: ${error}` };
        }
    }
    /**
     * Handle selection operations
     */
    async handleSelection(params) {
        const { action, startLine, endLine, text } = params;
        try {
            switch (action) {
                case 'select_all':
                    await vscode.commands.executeCommand('editor.action.selectAll');
                    return { success: true, output: 'All selected' };
                case 'select_line':
                    await vscode.commands.executeCommand('expandLineSelection');
                    return { success: true, output: 'Line selected' };
                case 'select_word':
                    await vscode.commands.executeCommand('editor.action.addSelectionToNextFindMatch');
                    return { success: true, output: 'Word selected' };
                case 'expand_selection':
                    await vscode.commands.executeCommand('editor.action.smartSelect.expand');
                    return { success: true, output: 'Selection expanded' };
                case 'shrink_selection':
                    await vscode.commands.executeCommand('editor.action.smartSelect.shrink');
                    return { success: true, output: 'Selection shrunk' };
                case 'select_occurrences':
                    await vscode.commands.executeCommand('editor.action.selectHighlights');
                    return { success: true, output: 'All occurrences selected' };
                case 'add_cursor':
                    await vscode.commands.executeCommand('editor.action.insertCursorAtEndOfEachLineSelected');
                    return { success: true, output: 'Cursors added' };
                default:
                    return { success: false, error: `Unknown selection action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Selection operation failed: ${error}` };
        }
    }
    /**
     * Handle comment operations
     */
    async handleComments(params) {
        const { action, text } = params;
        try {
            switch (action) {
                case 'toggle_line':
                    await vscode.commands.executeCommand('editor.action.commentLine');
                    return { success: true, output: 'Line comment toggled' };
                case 'toggle_block':
                    await vscode.commands.executeCommand('editor.action.blockComment');
                    return { success: true, output: 'Block comment toggled' };
                case 'add_line':
                    await vscode.commands.executeCommand('editor.action.addCommentLine');
                    return { success: true, output: 'Comment added' };
                case 'remove_line':
                    await vscode.commands.executeCommand('editor.action.removeCommentLine');
                    return { success: true, output: 'Comment removed' };
                case 'add_todo':
                case 'add_fixme': {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        return { success: false, error: 'No active editor' };
                    const prefix = action === 'add_todo' ? 'TODO' : 'FIXME';
                    const comment = `// ${prefix}: ${text || ''}`;
                    await editor.edit(editBuilder => {
                        editBuilder.insert(editor.selection.active, comment);
                    });
                    return { success: true, output: `${prefix} comment added` };
                }
                default:
                    return { success: false, error: `Unknown comment action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Comment operation failed: ${error}` };
        }
    }
    /**
     * Handle clipboard operations
     */
    async handleClipboard(params) {
        const { action } = params;
        try {
            switch (action) {
                case 'copy':
                    await vscode.commands.executeCommand('editor.action.clipboardCopyAction');
                    return { success: true, output: 'Copied to clipboard' };
                case 'cut':
                    await vscode.commands.executeCommand('editor.action.clipboardCutAction');
                    return { success: true, output: 'Cut to clipboard' };
                case 'paste':
                    await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
                    return { success: true, output: 'Pasted from clipboard' };
                case 'copy_path':
                    await vscode.commands.executeCommand('copyFilePath');
                    return { success: true, output: 'File path copied' };
                case 'copy_relative_path':
                    await vscode.commands.executeCommand('copyRelativeFilePath');
                    return { success: true, output: 'Relative path copied' };
                case 'copy_with_syntax':
                    await vscode.commands.executeCommand('editor.action.clipboardCopyWithSyntaxHighlightingAction');
                    return { success: true, output: 'Copied with syntax highlighting' };
                default:
                    return { success: false, error: `Unknown clipboard action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Clipboard operation failed: ${error}` };
        }
    }
    /**
     * Handle window management
     */
    async handleWindowManagement(params) {
        const { action, direction } = params;
        try {
            switch (action) {
                case 'split_editor':
                    if (direction === 'horizontal') {
                        await vscode.commands.executeCommand('workbench.action.splitEditorDown');
                    }
                    else {
                        await vscode.commands.executeCommand('workbench.action.splitEditor');
                    }
                    return { success: true, output: 'Editor split' };
                case 'close_editor':
                    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                    return { success: true, output: 'Editor closed' };
                case 'close_all':
                    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
                    return { success: true, output: 'All editors closed' };
                case 'toggle_sidebar':
                    await vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
                    return { success: true, output: 'Sidebar toggled' };
                case 'toggle_panel':
                    await vscode.commands.executeCommand('workbench.action.togglePanel');
                    return { success: true, output: 'Panel toggled' };
                case 'toggle_terminal':
                    await vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
                    return { success: true, output: 'Terminal toggled' };
                case 'focus_editor':
                    await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
                    return { success: true, output: 'Editor focused' };
                case 'new_window':
                    await vscode.commands.executeCommand('workbench.action.newWindow');
                    return { success: true, output: 'New window opened' };
                case 'zoom_in':
                    await vscode.commands.executeCommand('workbench.action.zoomIn');
                    return { success: true, output: 'Zoomed in' };
                case 'zoom_out':
                    await vscode.commands.executeCommand('workbench.action.zoomOut');
                    return { success: true, output: 'Zoomed out' };
                default:
                    return { success: false, error: `Unknown window action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Window operation failed: ${error}` };
        }
    }
    /**
     * Handle extension management
     */
    async handleExtensions(params) {
        const { action, extensionId, query } = params;
        try {
            switch (action) {
                case 'list_installed': {
                    const extensions = vscode.extensions.all
                        .filter(ext => !ext.packageJSON.isBuiltin)
                        .map(ext => ({
                        id: ext.id,
                        name: ext.packageJSON.displayName || ext.id,
                        version: ext.packageJSON.version,
                    }));
                    return {
                        success: true,
                        output: `${extensions.length} extensions installed`,
                        data: { extensions },
                    };
                }
                case 'search':
                    await vscode.commands.executeCommand('workbench.extensions.search', query);
                    return { success: true, output: `Searching for: ${query}` };
                case 'install':
                    if (!extensionId)
                        return { success: false, error: 'Extension ID required' };
                    await vscode.commands.executeCommand('workbench.extensions.installExtension', extensionId);
                    return { success: true, output: `Installing: ${extensionId}` };
                case 'uninstall':
                    if (!extensionId)
                        return { success: false, error: 'Extension ID required' };
                    await vscode.commands.executeCommand('workbench.extensions.uninstallExtension', extensionId);
                    return { success: true, output: `Uninstalling: ${extensionId}` };
                case 'enable':
                    await vscode.commands.executeCommand('workbench.extensions.enableExtension', extensionId);
                    return { success: true, output: `Enabled: ${extensionId}` };
                case 'disable':
                    await vscode.commands.executeCommand('workbench.extensions.disableExtension', extensionId);
                    return { success: true, output: `Disabled: ${extensionId}` };
                case 'show_recommendations':
                    await vscode.commands.executeCommand('workbench.extensions.action.showRecommendedExtensions');
                    return { success: true, output: 'Showing recommendations' };
                default:
                    return { success: false, error: `Unknown extension action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Extension operation failed: ${error}` };
        }
    }
    /**
     * Handle project generation
     */
    async handleProjectGeneration(params) {
        const { template, name, options } = params;
        try {
            const terminal = vscode.window.createTerminal({ name: 'Project Generator' });
            terminal.show();
            const commands = {
                react: `npx create-react-app ${name}`,
                vue: `npm create vue@latest ${name}`,
                angular: `npx @angular/cli new ${name}`,
                node: `mkdir ${name} && cd ${name} && npm init -y`,
                python: `mkdir ${name} && cd ${name} && python -m venv venv`,
                rust: `cargo new ${name}`,
                go: `mkdir -p ${name} && cd ${name} && go mod init ${name}`,
                typescript: `mkdir ${name} && cd ${name} && npm init -y && npm install typescript @types/node --save-dev && npx tsc --init`,
                express: `npx express-generator ${name}`,
                fastapi: `mkdir ${name} && cd ${name} && python -m venv venv && echo "fastapi\\nuvicorn" > requirements.txt`,
            };
            const command = commands[template];
            if (!command) {
                return { success: false, error: `Unknown template: ${template}` };
            }
            terminal.sendText(command);
            return { success: true, output: `Creating ${template} project: ${name}` };
        }
        catch (error) {
            return { success: false, error: `Project generation failed: ${error}` };
        }
    }
    /**
     * Handle code folding
     */
    async handleFolding(params) {
        const { action, level, line } = params;
        try {
            switch (action) {
                case 'fold':
                    await vscode.commands.executeCommand('editor.fold');
                    return { success: true, output: 'Code folded' };
                case 'unfold':
                    await vscode.commands.executeCommand('editor.unfold');
                    return { success: true, output: 'Code unfolded' };
                case 'fold_all':
                    await vscode.commands.executeCommand('editor.foldAll');
                    return { success: true, output: 'All code folded' };
                case 'unfold_all':
                    await vscode.commands.executeCommand('editor.unfoldAll');
                    return { success: true, output: 'All code unfolded' };
                case 'fold_level':
                    if (level && level >= 1 && level <= 7) {
                        await vscode.commands.executeCommand(`editor.foldLevel${level}`);
                        return { success: true, output: `Folded to level ${level}` };
                    }
                    return { success: false, error: 'Level must be between 1 and 7' };
                case 'fold_recursively':
                    await vscode.commands.executeCommand('editor.foldRecursively');
                    return { success: true, output: 'Folded recursively' };
                case 'toggle':
                    await vscode.commands.executeCommand('editor.toggleFold');
                    return { success: true, output: 'Fold toggled' };
                default:
                    return { success: false, error: `Unknown folding action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Folding operation failed: ${error}` };
        }
    }
    /**
     * Handle multi-cursor operations
     */
    async handleMultiCursor(params) {
        const { action, count, text } = params;
        try {
            switch (action) {
                case 'add_cursor_above':
                    await vscode.commands.executeCommand('editor.action.insertCursorAbove');
                    return { success: true, output: 'Cursor added above' };
                case 'add_cursor_below':
                    await vscode.commands.executeCommand('editor.action.insertCursorBelow');
                    return { success: true, output: 'Cursor added below' };
                case 'add_cursors_to_line_ends':
                    await vscode.commands.executeCommand('editor.action.insertCursorAtEndOfEachLineSelected');
                    return { success: true, output: 'Cursors added to line ends' };
                case 'select_all_occurrences':
                    await vscode.commands.executeCommand('editor.action.selectHighlights');
                    return { success: true, output: 'All occurrences selected' };
                case 'change_all_occurrences':
                    await vscode.commands.executeCommand('editor.action.changeAll');
                    return { success: true, output: 'Change all occurrences mode' };
                case 'column_select':
                    await vscode.commands.executeCommand('cursorColumnSelect');
                    return { success: true, output: 'Column select mode' };
                default:
                    return { success: false, error: `Unknown multi-cursor action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Multi-cursor operation failed: ${error}` };
        }
    }
    /**
     * Handle language server operations
     */
    async handleLanguageServer(params) {
        const { action, symbol, newName } = params;
        try {
            switch (action) {
                case 'restart':
                    await vscode.commands.executeCommand('typescript.restartTsServer');
                    return { success: true, output: 'Language server restarted' };
                case 'get_completions':
                    await vscode.commands.executeCommand('editor.action.triggerSuggest');
                    return { success: true, output: 'Completions triggered' };
                case 'get_hover':
                    await vscode.commands.executeCommand('editor.action.showHover');
                    return { success: true, output: 'Hover info shown' };
                case 'get_signature':
                    await vscode.commands.executeCommand('editor.action.triggerParameterHints');
                    return { success: true, output: 'Signature help shown' };
                case 'find_implementations':
                    await vscode.commands.executeCommand('editor.action.goToImplementation');
                    return { success: true, output: 'Finding implementations' };
                case 'find_type_definition':
                    await vscode.commands.executeCommand('editor.action.goToTypeDefinition');
                    return { success: true, output: 'Finding type definition' };
                case 'rename_symbol':
                    await vscode.commands.executeCommand('editor.action.rename');
                    return { success: true, output: 'Rename dialog opened' };
                default:
                    return { success: false, error: `Unknown language server action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Language server operation failed: ${error}` };
        }
    }
    /**
     * Handle VS Code tasks
     */
    async handleTasks(params) {
        const { action, taskName } = params;
        try {
            switch (action) {
                case 'run':
                    if (taskName) {
                        await vscode.commands.executeCommand('workbench.action.tasks.runTask', taskName);
                    }
                    else {
                        await vscode.commands.executeCommand('workbench.action.tasks.runTask');
                    }
                    return { success: true, output: taskName ? `Running task: ${taskName}` : 'Task picker opened' };
                case 'list':
                    await vscode.commands.executeCommand('workbench.action.tasks.runTask');
                    return { success: true, output: 'Task list opened' };
                case 'configure':
                    await vscode.commands.executeCommand('workbench.action.tasks.configureTaskRunner');
                    return { success: true, output: 'Task configuration opened' };
                case 'terminate':
                    await vscode.commands.executeCommand('workbench.action.tasks.terminate');
                    return { success: true, output: 'Task terminated' };
                case 'restart':
                    await vscode.commands.executeCommand('workbench.action.tasks.restartTask');
                    return { success: true, output: 'Task restarted' };
                case 'run_build':
                    await vscode.commands.executeCommand('workbench.action.tasks.build');
                    return { success: true, output: 'Build task running' };
                case 'run_test':
                    await vscode.commands.executeCommand('workbench.action.tasks.test');
                    return { success: true, output: 'Test task running' };
                default:
                    return { success: false, error: `Unknown task action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Task operation failed: ${error}` };
        }
    }
    /**
     * Handle diff and merge operations
     */
    async handleDiffMerge(params) {
        const { action, leftFile, rightFile } = params;
        try {
            switch (action) {
                case 'diff_files':
                    if (!leftFile || !rightFile) {
                        return { success: false, error: 'Both leftFile and rightFile required' };
                    }
                    const leftUri = vscode.Uri.file(leftFile);
                    const rightUri = vscode.Uri.file(rightFile);
                    await vscode.commands.executeCommand('vscode.diff', leftUri, rightUri, `${leftFile} ↔ ${rightFile}`);
                    return { success: true, output: 'Diff view opened' };
                case 'diff_with_clipboard':
                    await vscode.commands.executeCommand('workbench.files.action.compareWithClipboard');
                    return { success: true, output: 'Comparing with clipboard' };
                case 'diff_with_saved':
                    await vscode.commands.executeCommand('workbench.files.action.compareWithSaved');
                    return { success: true, output: 'Comparing with saved version' };
                case 'accept_current':
                    await vscode.commands.executeCommand('merge.acceptCurrentChange');
                    return { success: true, output: 'Current change accepted' };
                case 'accept_incoming':
                    await vscode.commands.executeCommand('merge.acceptIncomingChange');
                    return { success: true, output: 'Incoming change accepted' };
                case 'accept_both':
                    await vscode.commands.executeCommand('merge.acceptBothChanges');
                    return { success: true, output: 'Both changes accepted' };
                case 'compare_active':
                    await vscode.commands.executeCommand('workbench.files.action.compareFileWith');
                    return { success: true, output: 'Compare file dialog opened' };
                default:
                    return { success: false, error: `Unknown diff/merge action: ${action}` };
            }
        }
        catch (error) {
            return { success: false, error: `Diff/merge operation failed: ${error}` };
        }
    }
    /**
     * Get server configuration for MCP clients
     */
    getServerConfig() {
        return this.serverConfig;
    }
    /**
     * Export tools in OpenAI function calling format
     */
    exportToolsAsOpenAIFunctions() {
        return this.listTools().map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema,
            },
        }));
    }
    /**
     * Export tools in Anthropic tool format
     */
    exportToolsAsAnthropicTools() {
        return this.listTools().map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema,
        }));
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.tools.clear();
        this.resources.clear();
        this.prompts.clear();
        this._onToolRegistered.dispose();
        this._onResourceRegistered.dispose();
        this._onPromptRegistered.dispose();
        this._onToolExecuted.dispose();
        this._onToolError.dispose();
    }
}
exports.MCPIntegrationService = MCPIntegrationService;
exports.default = MCPIntegrationService;
//# sourceMappingURL=MCPIntegrationService.js.map