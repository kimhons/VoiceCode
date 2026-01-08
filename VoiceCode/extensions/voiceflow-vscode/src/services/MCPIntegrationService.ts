/**
 * Model Context Protocol (MCP) Integration Service
 * Provides tool integration capabilities for AI coding assistants
 * Enables VoiceFlow PRO to expose tools to Claude, OpenAI, and other AI providers
 */

import * as vscode from 'vscode';

/**
 * MCP Tool Definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      default?: any;
    }>;
    required?: string[];
  };
  handler: (params: Record<string, any>) => Promise<MCPToolResult>;
}

export interface MCPToolResult {
  success: boolean;
  output?: string;
  error?: string;
  data?: any;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  fetch: () => Promise<string>;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
  generate: (args: Record<string, string>) => Promise<string>;
}

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  name: string;
  version: string;
  capabilities: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
  };
}

/**
 * MCP Event Types
 */
export interface MCPEvents {
  toolRegistered: MCPTool;
  resourceRegistered: MCPResource;
  promptRegistered: MCPPrompt;
  toolExecuted: { tool: string; params: Record<string, any>; result: MCPToolResult };
  toolError: { tool: string; params: Record<string, any>; error: any };
}

/**
 * MCP Integration Service
 * Implements the Model Context Protocol for AI tool integration
 */
export class MCPIntegrationService {
  private config: vscode.WorkspaceConfiguration;
  private tools: Map<string, MCPTool> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private prompts: Map<string, MCPPrompt> = new Map();
  private isRunning: boolean = false;
  private serverConfig: MCPServerConfig;

  // Event emitters for different event types
  private readonly _onToolRegistered = new vscode.EventEmitter<MCPTool>();
  private readonly _onResourceRegistered = new vscode.EventEmitter<MCPResource>();
  private readonly _onPromptRegistered = new vscode.EventEmitter<MCPPrompt>();
  private readonly _onToolExecuted = new vscode.EventEmitter<MCPEvents['toolExecuted']>();
  private readonly _onToolError = new vscode.EventEmitter<MCPEvents['toolError']>();

  // Public event accessors
  public readonly onToolRegistered = this._onToolRegistered.event;
  public readonly onResourceRegistered = this._onResourceRegistered.event;
  public readonly onPromptRegistered = this._onPromptRegistered.event;
  public readonly onToolExecuted = this._onToolExecuted.event;
  public readonly onToolError = this._onToolError.event;

  constructor(config: vscode.WorkspaceConfiguration) {
    this.config = config;
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
  private registerBuiltInTools(): void {
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
        } catch (error) {
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

    // Register built-in prompts
    this.registerBuiltInPrompts();
  }

  /**
   * Register built-in prompts for AI assistants
   */
  private registerBuiltInPrompts(): void {
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
  public registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
    this._onToolRegistered.fire(tool);
  }

  /**
   * Register a new resource
   */
  public registerResource(resource: MCPResource): void {
    this.resources.set(resource.uri, resource);
    this._onResourceRegistered.fire(resource);
  }

  /**
   * Register a new prompt
   */
  public registerPrompt(prompt: MCPPrompt): void {
    this.prompts.set(prompt.name, prompt);
    this._onPromptRegistered.fire(prompt);
  }

  /**
   * List all available tools
   */
  public listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * List all available resources
   */
  public listResources(): MCPResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * List all available prompts
   */
  public listPrompts(): MCPPrompt[] {
    return Array.from(this.prompts.values());
  }

  /**
   * Execute a tool by name
   */
  public async executeTool(toolName: string, params: Record<string, any>): Promise<MCPToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return { success: false, error: `Tool not found: ${toolName}` };
    }

    try {
      const result = await tool.handler(params);
      this._onToolExecuted.fire({ tool: toolName, params, result });
      return result;
    } catch (error) {
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
  public async generatePrompt(promptName: string, args: Record<string, string>): Promise<string | null> {
    const prompt = this.prompts.get(promptName);
    if (!prompt) {
      return null;
    }

    try {
      return await prompt.generate(args);
    } catch (error) {
      console.error(`Failed to generate prompt ${promptName}:`, error);
      return null;
    }
  }

  /**
   * Handle file operations
   */
  private async handleFileOperation(params: Record<string, any>): Promise<MCPToolResult> {
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
          const listing = entries.map(([name, type]) =>
            `${type === vscode.FileType.Directory ? '[DIR]' : '[FILE]'} ${name}`
          ).join('\n');
          return { success: true, output: listing };
        }

        default:
          return { success: false, error: `Unknown operation: ${operation}` };
      }
    } catch (error) {
      return { success: false, error: `File operation failed: ${error}` };
    }
  }

  /**
   * Handle code analysis
   */
  private async handleCodeAnalysis(params: Record<string, any>): Promise<MCPToolResult> {
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
    } catch (error) {
      return { success: false, error: `Code analysis failed: ${error}` };
    }
  }

  /**
   * Handle codebase search
   */
  private async handleCodebaseSearch(params: Record<string, any>): Promise<MCPToolResult> {
    const { query, searchType, filePattern, maxResults = 20 } = params;

    try {
      const files = await vscode.workspace.findFiles(
        filePattern || '**/*',
        '**/node_modules/**',
        maxResults
      );

      const results: Array<{ file: string; matches: string[] }> = [];

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
        } else {
          if (text.toLowerCase().includes(query.toLowerCase())) {
            const lines = text.split('\n');
            const matchingLines = lines.filter(l =>
              l.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 5);
            results.push({
              file: vscode.workspace.asRelativePath(file),
              matches: matchingLines,
            });
          }
        }

        if (results.length >= maxResults) break;
      }

      return {
        success: true,
        output: `Found ${results.length} files with matches`,
        data: { results },
      };
    } catch (error) {
      return { success: false, error: `Search failed: ${error}` };
    }
  }

  /**
   * Handle terminal commands
   */
  private async handleTerminalCommand(params: Record<string, any>): Promise<MCPToolResult> {
    const { command, cwd } = params;

    try {
      const terminal = vscode.window.createTerminal({
        name: 'VoiceFlow Command',
        cwd: cwd || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      });

      terminal.show();
      terminal.sendText(command);

      return { success: true, output: `Command sent to terminal: ${command}` };
    } catch (error) {
      return { success: false, error: `Terminal command failed: ${error}` };
    }
  }

  /**
   * Handle Git operations
   */
  private async handleGitOperation(params: Record<string, any>): Promise<MCPToolResult> {
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
    } catch (error) {
      return { success: false, error: `Git operation failed: ${error}` };
    }
  }

  /**
   * Get server configuration for MCP clients
   */
  public getServerConfig(): MCPServerConfig {
    return this.serverConfig;
  }

  /**
   * Export tools in OpenAI function calling format
   */
  public exportToolsAsOpenAIFunctions(): Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: any;
    };
  }> {
    return this.listTools().map(tool => ({
      type: 'function' as const,
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
  public exportToolsAsAnthropicTools(): Array<{
    name: string;
    description: string;
    input_schema: any;
  }> {
    return this.listTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
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

export default MCPIntegrationService;
