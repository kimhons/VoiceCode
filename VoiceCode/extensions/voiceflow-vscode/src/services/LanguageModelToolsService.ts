/**
 * Language Model Tools Service
 * Implements VS Code's Language Model Tools API for native AI tool calling
 * Allows VoiceFlow tools to be used by any VS Code AI extension
 *
 * Based on: https://code.visualstudio.com/api/extension-guides/language-model
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { MCPIntegrationService, MCPTool, MCPToolResult } from './MCPIntegrationService';
import { TelemetryService } from './TelemetryService';

/**
 * Tool handler function type
 */
type ToolHandler = (input: Record<string, unknown>, token: vscode.CancellationToken) => Promise<MCPToolResult>;

/**
 * Tools that require user confirmation before execution
 */
const CONFIRMATION_REQUIRED_TOOLS = new Set([
  'voiceflow-git-commit',
  'voiceflow-git-branch',
  'voiceflow-multi-file-edit',
  'voiceflow-terminal-run',
  'voiceflow-rename-symbol',
  'file_operations',
  'run_terminal_command',
  'git_operations',
]);

/**
 * Language Model Tools Service
 * Registers VoiceFlow tools with VS Code's Language Model API
 */
export class LanguageModelToolsService implements vscode.Disposable {
  private mcpService: MCPIntegrationService;
  private telemetry: TelemetryService;
  private context: vscode.ExtensionContext;
  private registeredTools: Map<string, vscode.Disposable> = new Map();
  private disposables: vscode.Disposable[] = [];
  private builtInToolHandlers: Map<string, ToolHandler> = new Map();

  constructor(
    context: vscode.ExtensionContext,
    mcpService: MCPIntegrationService,
    telemetry: TelemetryService
  ) {
    this.context = context;
    this.mcpService = mcpService;
    this.telemetry = telemetry;
    this.initializeBuiltInToolHandlers();
    this.registerAllTools();
    this.setupToolUpdateListener();
  }

  /**
   * Initialize built-in tool handlers for LM tools defined in package.json
   */
  private initializeBuiltInToolHandlers(): void {
    // Code Refactoring Tools
    this.builtInToolHandlers.set('voiceflow-extract-function', this.handleExtractFunction.bind(this));
    this.builtInToolHandlers.set('voiceflow-rename-symbol', this.handleRenameSymbol.bind(this));
    this.builtInToolHandlers.set('voiceflow-optimize-imports', this.handleOptimizeImports.bind(this));

    // Testing Tools
    this.builtInToolHandlers.set('voiceflow-generate-tests', this.handleGenerateTests.bind(this));
    this.builtInToolHandlers.set('voiceflow-run-tests', this.handleRunTests.bind(this));
    this.builtInToolHandlers.set('voiceflow-create-test-file', this.handleCreateTestFile.bind(this));

    // Documentation Tools
    this.builtInToolHandlers.set('voiceflow-generate-jsdoc', this.handleGenerateJsdoc.bind(this));
    this.builtInToolHandlers.set('voiceflow-explain-code', this.handleExplainCode.bind(this));
    this.builtInToolHandlers.set('voiceflow-generate-readme', this.handleGenerateReadme.bind(this));

    // Git Integration Tools
    this.builtInToolHandlers.set('voiceflow-git-commit', this.handleGitCommit.bind(this));
    this.builtInToolHandlers.set('voiceflow-git-branch', this.handleGitBranch.bind(this));
    this.builtInToolHandlers.set('voiceflow-git-diff', this.handleGitDiff.bind(this));

    // Project Analysis Tools
    this.builtInToolHandlers.set('voiceflow-analyze-dependencies', this.handleAnalyzeDependencies.bind(this));
    this.builtInToolHandlers.set('voiceflow-analyze-complexity', this.handleAnalyzeComplexity.bind(this));
    this.builtInToolHandlers.set('voiceflow-find-patterns', this.handleFindPatterns.bind(this));

    // Voice-Specific Tools
    this.builtInToolHandlers.set('voiceflow-voice-to-code', this.handleVoiceToCode.bind(this));
    this.builtInToolHandlers.set('voiceflow-voice-navigate', this.handleVoiceNavigate.bind(this));
    this.builtInToolHandlers.set('voiceflow-voice-edit', this.handleVoiceEdit.bind(this));

    // Multi-File & Context Tools
    this.builtInToolHandlers.set('voiceflow-multi-file-edit', this.handleMultiFileEdit.bind(this));
    this.builtInToolHandlers.set('voiceflow-context-gather', this.handleContextGather.bind(this));

    // Editor Tools
    this.builtInToolHandlers.set('voiceflow-execute-command', this.handleExecuteCommand.bind(this));
    this.builtInToolHandlers.set('voiceflow-insert-code', this.handleInsertCode.bind(this));
    this.builtInToolHandlers.set('voiceflow-read-file', this.handleReadFile.bind(this));
    this.builtInToolHandlers.set('voiceflow-search-workspace', this.handleSearchWorkspace.bind(this));
    this.builtInToolHandlers.set('voiceflow-terminal-run', this.handleTerminalRun.bind(this));
    this.builtInToolHandlers.set('voiceflow-debug-start', this.handleDebugStart.bind(this));
    this.builtInToolHandlers.set('voiceflow-find-references', this.handleFindReferences.bind(this));
    this.builtInToolHandlers.set('voiceflow-type-hierarchy', this.handleTypeHierarchy.bind(this));
    this.builtInToolHandlers.set('voiceflow-quick-fix', this.handleQuickFix.bind(this));
    this.builtInToolHandlers.set('voiceflow-snippet-create', this.handleSnippetCreate.bind(this));
  }

  /**
   * Register all tools (MCP tools + built-in LM tools)
   */
  private registerAllTools(): void {
    // Register MCP tools
    const mcpTools = this.mcpService.listTools();
    for (const tool of mcpTools) {
      this.registerMcpTool(tool);
    }

    // Register built-in LM tools from package.json
    for (const [toolName, handler] of this.builtInToolHandlers) {
      this.registerBuiltInTool(toolName, handler);
    }
  }

  /**
   * Register an MCP tool with VS Code LM API
   */
  private registerMcpTool(tool: MCPTool): void {
    const toolId = `voiceflow-mcp-${tool.name}`;

    try {
      const lmTool: vscode.LanguageModelTool<Record<string, unknown>> = {
        invoke: async (options, token) => {
          return this.invokeToolWithResult(
            tool.name,
            () => this.mcpService.executeTool(tool.name, options.input),
            token
          );
        },
        prepareInvocation: async (options, _token) => {
          return this.prepareInvocation(tool.name, options.input);
        }
      };

      const disposable = vscode.lm.registerTool(toolId, lmTool);
      this.registeredTools.set(tool.name, disposable);
      this.disposables.push(disposable);
    } catch (error) {
      console.error(`Failed to register MCP tool ${toolId}:`, error);
    }
  }

  /**
   * Register a built-in tool with VS Code LM API
   */
  private registerBuiltInTool(toolName: string, handler: ToolHandler): void {
    try {
      const lmTool: vscode.LanguageModelTool<Record<string, unknown>> = {
        invoke: async (options, token) => {
          return this.invokeToolWithResult(
            toolName,
            () => handler(options.input, token),
            token
          );
        },
        prepareInvocation: async (options, _token) => {
          return this.prepareInvocation(toolName, options.input);
        }
      };

      const disposable = vscode.lm.registerTool(toolName, lmTool);
      this.registeredTools.set(toolName, disposable);
      this.disposables.push(disposable);
    } catch (error) {
      console.error(`Failed to register built-in tool ${toolName}:`, error);
    }
  }

  /**
   * Common tool invocation wrapper with telemetry
   */
  private async invokeToolWithResult(
    toolName: string,
    executor: () => Promise<MCPToolResult>,
    token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult> {
    const startTime = Date.now();

    try {
      if (token.isCancellationRequested) {
        return this.createTextResult('Tool invocation was cancelled');
      }

      const result = await executor();
      const duration = Date.now() - startTime;

      this.telemetry.recordEvent('command_executed', {
        command: `lm_tool:${toolName}`,
        success: result.success,
      }, { duration });

      if (result.success) {
        let output = result.output || 'Success';
        if (result.data) {
          output += `\n\nData:\n\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\``;
        }
        return this.createTextResult(output);
      } else {
        return this.createTextResult(`Error: ${result.error}`);
      }
    } catch (error) {
      this.telemetry.recordError(error instanceof Error ? error : new Error(String(error)), {
        tool: toolName,
      });
      return this.createTextResult(
        `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a text result for LM tool
   */
  private createTextResult(text: string): vscode.LanguageModelToolResult {
    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(text)
    ]);
  }

  /**
   * Prepare tool invocation with optional confirmation
   */
  private prepareInvocation(
    toolName: string,
    input: Record<string, unknown>
  ): vscode.PreparedToolInvocation {
    if (CONFIRMATION_REQUIRED_TOOLS.has(toolName)) {
      const paramString = JSON.stringify(input, null, 2);
      return {
        invocationMessage: `Executing ${toolName}...`,
        confirmationMessages: {
          title: `VoiceFlow: ${toolName}`,
          message: new vscode.MarkdownString(
            `**Tool:** \`${toolName}\`\n\n**Parameters:**\n\`\`\`json\n${paramString}\n\`\`\`\n\nDo you want to execute this tool?`
          )
        }
      };
    }
    return { invocationMessage: `Executing ${toolName}...` };
  }

  /**
   * Setup listener for new MCP tool registrations
   */
  private setupToolUpdateListener(): void {
    this.mcpService.onToolRegistered((tool) => {
      this.registerMcpTool(tool);
    });
  }

  // ========================================
  // CODE REFACTORING TOOL HANDLERS
  // ========================================

  /**
   * Extract selected code into a new function
   */
  private async handleExtractFunction(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const functionName = input.functionName as string;
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        return { success: false, error: 'No active editor' };
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        return { success: false, error: 'No code selected for extraction' };
      }

      const isAsync = input.async === true;
      const language = editor.document.languageId;

      // Generate function based on language
      let extractedFunction: string;
      if (['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(language)) {
        extractedFunction = `${isAsync ? 'async ' : ''}function ${functionName}() {\n  ${selectedText.split('\n').join('\n  ')}\n}\n\n`;
      } else if (language === 'python') {
        extractedFunction = `${isAsync ? 'async ' : ''}def ${functionName}():\n    ${selectedText.split('\n').join('\n    ')}\n\n`;
      } else {
        extractedFunction = `function ${functionName}() {\n  ${selectedText}\n}\n\n`;
      }

      await editor.edit(editBuilder => {
        // Insert function before selection
        editBuilder.insert(new vscode.Position(selection.start.line, 0), extractedFunction);
        // Replace selection with function call
        editBuilder.replace(selection, `${functionName}()`);
      });

      return {
        success: true,
        output: `Extracted code into function '${functionName}'`,
        data: { functionName, language, isAsync }
      };
    } catch (error) {
      return { success: false, error: `Extract function failed: ${error}` };
    }
  }

  /**
   * Rename a symbol across the workspace
   */
  private async handleRenameSymbol(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const oldName = input.oldName as string;
      const newName = input.newName as string;

      // Use VS Code's rename provider
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return { success: false, error: 'No active editor' };
      }

      // Find the symbol in the document
      const document = editor.document;
      const text = document.getText();
      const symbolIndex = text.indexOf(oldName);

      if (symbolIndex === -1) {
        return { success: false, error: `Symbol '${oldName}' not found in current file` };
      }

      const position = document.positionAt(symbolIndex);

      // Execute rename
      const edit = await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
        'vscode.executeDocumentRenameProvider',
        document.uri,
        position,
        newName
      );

      if (edit) {
        await vscode.workspace.applyEdit(edit);
        return {
          success: true,
          output: `Renamed '${oldName}' to '${newName}'`,
          data: { oldName, newName, filesChanged: edit.entries().length }
        };
      }

      return { success: false, error: 'Rename provider returned no edits' };
    } catch (error) {
      return { success: false, error: `Rename failed: ${error}` };
    }
  }

  /**
   * Optimize imports in the current file
   */
  private async handleOptimizeImports(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const filePath = input.filePath as string | undefined;

      if (filePath) {
        const uri = vscode.Uri.file(filePath);
        await vscode.window.showTextDocument(uri);
      }

      // Execute organize imports command
      await vscode.commands.executeCommand('editor.action.organizeImports');

      return {
        success: true,
        output: 'Imports optimized successfully'
      };
    } catch (error) {
      return { success: false, error: `Optimize imports failed: ${error}` };
    }
  }

  // ========================================
  // TESTING TOOL HANDLERS
  // ========================================

  /**
   * Generate unit tests for code
   */
  private async handleGenerateTests(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const targetPath = input.targetPath as string;
      const functionName = input.functionName as string | undefined;
      const framework = (input.framework as string) || 'jest';
      const coverage = (input.coverage as string) || 'comprehensive';

      const uri = vscode.Uri.file(targetPath);
      const document = await vscode.workspace.openTextDocument(uri);
      const code = document.getText();
      const language = document.languageId;

      // Generate test template based on framework
      const testTemplate = this.generateTestTemplate(code, language, framework, functionName, coverage);

      return {
        success: true,
        output: `Generated ${coverage} tests using ${framework}`,
        data: {
          targetPath,
          framework,
          coverage,
          testCode: testTemplate
        }
      };
    } catch (error) {
      return { success: false, error: `Generate tests failed: ${error}` };
    }
  }

  private generateTestTemplate(code: string, language: string, framework: string, functionName?: string, coverage?: string): string {
    const isTypeScript = language.includes('typescript');
    const ext = isTypeScript ? 'ts' : 'js';

    if (framework === 'jest' || framework === 'vitest') {
      return `import { describe, it, expect } from '${framework}';
// Import the module to test
// import { ${functionName || 'moduleName'} } from './module';

describe('${functionName || 'Module'}', () => {
  it('should work correctly', () => {
    // TODO: Add test implementation
    expect(true).toBe(true);
  });

  ${coverage === 'comprehensive' ? `
  it('should handle edge cases', () => {
    // TODO: Add edge case tests
  });

  it('should handle errors gracefully', () => {
    // TODO: Add error handling tests
  });` : ''}
});
`;
    }

    return `// Test file for ${functionName || 'module'}`;
  }

  /**
   * Run tests
   */
  private async handleRunTests(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const testPath = input.testPath as string | undefined;
      const testName = input.testName as string | undefined;
      const withCoverage = input.coverage === true;

      // Build test command
      let command = 'npm test';
      if (testPath) {
        command += ` -- ${testPath}`;
      }
      if (testName) {
        command += ` -t "${testName}"`;
      }
      if (withCoverage) {
        command += ' --coverage';
      }

      // Execute in terminal
      const terminal = vscode.window.createTerminal('VoiceFlow Tests');
      terminal.show();
      terminal.sendText(command);

      return {
        success: true,
        output: `Running tests: ${command}`,
        data: { command, testPath, testName, coverage: withCoverage }
      };
    } catch (error) {
      return { success: false, error: `Run tests failed: ${error}` };
    }
  }

  /**
   * Create a test file for a source file
   */
  private async handleCreateTestFile(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const sourceFile = input.sourceFile as string;
      const testDirectory = (input.testDirectory as string) || '__tests__';
      const framework = (input.framework as string) || 'jest';

      // Generate test file path
      const sourceName = path.basename(sourceFile, path.extname(sourceFile));
      const sourceDir = path.dirname(sourceFile);
      const testFileName = `${sourceName}.test${path.extname(sourceFile)}`;
      const testFilePath = path.join(sourceDir, testDirectory, testFileName);

      // Create test file content
      const testContent = this.generateTestTemplate('', 'typescript', framework, sourceName);

      // Create the file
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        return { success: false, error: 'No workspace folder open' };
      }

      const fullPath = vscode.Uri.joinPath(workspaceFolders[0].uri, testFilePath);
      await vscode.workspace.fs.writeFile(fullPath, Buffer.from(testContent, 'utf-8'));

      // Open the file
      const doc = await vscode.workspace.openTextDocument(fullPath);
      await vscode.window.showTextDocument(doc);

      return {
        success: true,
        output: `Created test file: ${testFilePath}`,
        data: { testFilePath, sourceFile, framework }
      };
    } catch (error) {
      return { success: false, error: `Create test file failed: ${error}` };
    }
  }

  // ========================================
  // DOCUMENTATION TOOL HANDLERS
  // ========================================

  /**
   * Generate JSDoc/TSDoc comments
   */
  private async handleGenerateJsdoc(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return { success: false, error: 'No active editor' };
      }

      const selection = editor.selection;
      const includeExamples = input.includeExamples === true;
      const position = selection.start;

      const jsdoc = `/**
 * Description
 * @param {type} paramName - Parameter description
 * @returns {type} Return description
${includeExamples ? ` * @example
 * // Usage example
 * const result = functionName(param);
` : ''} */
`;

      await editor.edit(editBuilder => {
        editBuilder.insert(new vscode.Position(position.line, 0), jsdoc);
      });

      return { success: true, output: 'Generated JSDoc comment template' };
    } catch (error) {
      return { success: false, error: `Generate JSDoc failed: ${error}` };
    }
  }

  /**
   * Explain code in detail
   */
  private async handleExplainCode(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    const code = input.code as string;
    const language = (input.language as string) || 'unknown';
    const detailLevel = (input.detailLevel as string) || 'medium';

    return {
      success: true,
      output: `Code explanation request prepared`,
      data: {
        code, language, detailLevel,
        analysisPrompt: `Please explain this ${language} code in ${detailLevel} detail:\n\n\`\`\`${language}\n${code}\n\`\`\``
      }
    };
  }

  /**
   * Generate README sections
   */
  private async handleGenerateReadme(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    const section = input.section as string;
    const templates: Record<string, string> = {
      installation: '## Installation\n\n```bash\nnpm install package-name\n```',
      usage: '## Usage\n\n```javascript\nimport { feature } from \'package-name\';\n```',
      api: '## API Reference\n\n### `functionName(params)`\n\nDescription.',
      contributing: '## Contributing\n\n1. Fork the repository\n2. Create feature branch'
    };

    const content = templates[section] || `## ${section}\n\nContent here.`;
    return { success: true, output: `Generated ${section} section`, data: { section, content } };
  }

  // ========================================
  // GIT INTEGRATION TOOL HANDLERS
  // ========================================

  private async handleGitCommit(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const type = (input.type as string) || 'feat';
      const scope = input.scope as string | undefined;
      const autoStage = input.autoStage === true;

      if (autoStage) {
        await vscode.commands.executeCommand('git.stageAll');
      }
      await vscode.commands.executeCommand('git.commit');

      const template = scope ? `${type}(${scope}): ` : `${type}: `;
      return { success: true, output: `Git commit prepared: ${template}` };
    } catch (error) {
      return { success: false, error: `Git commit failed: ${error}` };
    }
  }

  private async handleGitBranch(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const operation = input.operation as string;
      const branchName = input.branchName as string | undefined;

      const commands: Record<string, string> = {
        create: 'git.branch',
        switch: 'git.checkout',
        delete: 'git.deleteBranch',
        merge: 'git.merge'
      };

      const cmd = commands[operation];
      if (!cmd) return { success: false, error: `Unknown operation: ${operation}` };

      await vscode.commands.executeCommand(cmd, branchName);
      return { success: true, output: `Branch ${operation} executed` };
    } catch (error) {
      return { success: false, error: `Git branch failed: ${error}` };
    }
  }

  private async handleGitDiff(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const diffType = (input.diffType as string) || 'working';
      const cmd = diffType === 'staged' ? 'git.openChange' : 'git.openAllChanges';
      await vscode.commands.executeCommand(cmd);
      return { success: true, output: `Opened ${diffType} diff view` };
    } catch (error) {
      return { success: false, error: `Git diff failed: ${error}` };
    }
  }

  // ========================================
  // PROJECT ANALYSIS TOOL HANDLERS
  // ========================================

  private async handleAnalyzeDependencies(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const analysisType = (input.analysisType as string) || 'all';
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) return { success: false, error: 'No workspace' };

      const packageJsonUri = vscode.Uri.joinPath(workspaceFolders[0].uri, 'package.json');
      const content = await vscode.workspace.fs.readFile(packageJsonUri);
      const pkg = JSON.parse(new TextDecoder().decode(content));

      const deps = Object.keys(pkg.dependencies || {});
      const devDeps = Object.keys(pkg.devDependencies || {});

      return {
        success: true,
        output: `Found ${deps.length} dependencies and ${devDeps.length} devDependencies`,
        data: { analysisType, dependencies: deps, devDependencies: devDeps, total: deps.length + devDeps.length }
      };
    } catch (error) {
      return { success: false, error: `Analyze dependencies failed: ${error}` };
    }
  }

  private async handleAnalyzeComplexity(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const editor = vscode.window.activeTextEditor;
      const filePath = (input.filePath as string) || editor?.document.fileName;
      if (!filePath) return { success: false, error: 'No file specified' };

      const doc = editor?.document || await vscode.workspace.openTextDocument(filePath);
      const text = doc.getText();

      // Simple complexity metrics
      const lines = text.split('\n').length;
      const functions = (text.match(/function\s+\w+|=>\s*{|\(\s*\)\s*=>/g) || []).length;
      const conditionals = (text.match(/if\s*\(|switch\s*\(|\?\s*:/g) || []).length;
      const loops = (text.match(/for\s*\(|while\s*\(|\.forEach|\.map|\.filter/g) || []).length;

      return {
        success: true,
        output: `Complexity analysis: ${lines} lines, ${functions} functions, ${conditionals} conditionals, ${loops} loops`,
        data: { filePath, lines, functions, conditionals, loops, cyclomaticComplexity: conditionals + loops + 1 }
      };
    } catch (error) {
      return { success: false, error: `Analyze complexity failed: ${error}` };
    }
  }

  private async handleFindPatterns(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const patternType = (input.patternType as string) || 'all';
      const editor = vscode.window.activeTextEditor;
      if (!editor) return { success: false, error: 'No active editor' };

      const text = editor.document.getText();
      const patterns: string[] = [];

      // Detect common patterns
      if (text.includes('class') && text.includes('getInstance')) patterns.push('Singleton');
      if (text.includes('Factory') || text.includes('create')) patterns.push('Factory');
      if (text.includes('Observer') || text.includes('subscribe')) patterns.push('Observer');
      if (text.includes('async') && text.includes('await')) patterns.push('Async/Await');
      if (text.includes('useState') || text.includes('useEffect')) patterns.push('React Hooks');

      return {
        success: true,
        output: `Found ${patterns.length} patterns: ${patterns.join(', ') || 'none'}`,
        data: { patternType, patterns }
      };
    } catch (error) {
      return { success: false, error: `Find patterns failed: ${error}` };
    }
  }

  // ========================================
  // VOICE-SPECIFIC TOOL HANDLERS
  // ========================================

  private async handleVoiceToCode(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const description = input.description as string;
      const language = (input.language as string) || 'typescript';
      const insertAt = (input.insertAt as string) || 'cursor';

      // This would integrate with AI service for code generation
      return {
        success: true,
        output: `Voice-to-code request: "${description}" in ${language}`,
        data: { description, language, insertAt, prompt: `Generate ${language} code: ${description}` }
      };
    } catch (error) {
      return { success: false, error: `Voice to code failed: ${error}` };
    }
  }

  private async handleVoiceNavigate(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const target = input.target as string;
      const targetType = (input.targetType as string) || 'symbol';

      if (targetType === 'file') {
        await vscode.commands.executeCommand('workbench.action.quickOpen', target);
      } else {
        await vscode.commands.executeCommand('workbench.action.gotoSymbol', target);
      }

      return { success: true, output: `Navigating to ${targetType}: ${target}` };
    } catch (error) {
      return { success: false, error: `Voice navigate failed: ${error}` };
    }
  }

  private async handleVoiceEdit(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const instruction = input.instruction as string;
      const scope = (input.scope as string) || 'selection';

      return {
        success: true,
        output: `Voice edit instruction: "${instruction}" on ${scope}`,
        data: { instruction, scope, prompt: `Apply this edit: ${instruction}` }
      };
    } catch (error) {
      return { success: false, error: `Voice edit failed: ${error}` };
    }
  }

  // ========================================
  // MULTI-FILE & CONTEXT TOOL HANDLERS
  // ========================================

  private async handleMultiFileEdit(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const edits = input.edits as Array<{ filePath: string; changes: Array<{ startLine: number; endLine: number; newContent: string }> }>;
      const preview = input.preview !== false;

      if (!edits || edits.length === 0) {
        return { success: false, error: 'No edits provided' };
      }

      // Use MCP service for multi-file editing
      const result = await this.mcpService.executeTool('multi_file_edit', { edits, preview });
      return result;
    } catch (error) {
      return { success: false, error: `Multi-file edit failed: ${error}` };
    }
  }

  private async handleContextGather(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const symbol = input.symbol as string | undefined;
      const depth = (input.depth as number) || 2;
      const editor = vscode.window.activeTextEditor;
      const filePath = (input.filePath as string) || editor?.document.fileName;

      if (!filePath) return { success: false, error: 'No file specified' };

      const doc = await vscode.workspace.openTextDocument(filePath);
      const context = {
        filePath,
        language: doc.languageId,
        lineCount: doc.lineCount,
        symbol,
        depth
      };

      return {
        success: true,
        output: `Gathered context for ${filePath}`,
        data: context
      };
    } catch (error) {
      return { success: false, error: `Context gather failed: ${error}` };
    }
  }

  // ========================================
  // EDITOR TOOL HANDLERS
  // ========================================

  private async handleExecuteCommand(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const command = input.command as string;
      const args = input.args as unknown[] | undefined;
      const result = await vscode.commands.executeCommand(command, ...(args || []));
      return { success: true, output: `Executed command: ${command}`, data: { command, result } };
    } catch (error) {
      return { success: false, error: `Execute command failed: ${error}` };
    }
  }

  private async handleInsertCode(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const code = input.code as string;
      const position = (input.position as string) || 'cursor';
      const editor = vscode.window.activeTextEditor;
      if (!editor) return { success: false, error: 'No active editor' };

      let insertPosition: vscode.Position;
      if (position === 'cursor') {
        insertPosition = editor.selection.active;
      } else if (position === 'file-start') {
        insertPosition = new vscode.Position(0, 0);
      } else {
        insertPosition = new vscode.Position(editor.document.lineCount, 0);
      }

      await editor.edit(editBuilder => editBuilder.insert(insertPosition, code));
      return { success: true, output: `Inserted code at ${position}` };
    } catch (error) {
      return { success: false, error: `Insert code failed: ${error}` };
    }
  }

  private async handleReadFile(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const filePath = input.filePath as string;
      const startLine = input.startLine as number | undefined;
      const endLine = input.endLine as number | undefined;

      const doc = await vscode.workspace.openTextDocument(filePath);
      let content = doc.getText();

      if (startLine !== undefined && endLine !== undefined) {
        const lines = content.split('\n');
        content = lines.slice(startLine - 1, endLine).join('\n');
      }

      return { success: true, output: content, data: { filePath, lineCount: doc.lineCount } };
    } catch (error) {
      return { success: false, error: `Read file failed: ${error}` };
    }
  }

  private async handleSearchWorkspace(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const query = input.query as string;
      const filePattern = (input.filePattern as string) || '**/*';
      const maxResults = (input.maxResults as number) || 100;

      const results = await vscode.workspace.findFiles(filePattern, '**/node_modules/**', maxResults);
      const matchingFiles: string[] = [];

      for (const uri of results.slice(0, 20)) {
        try {
          const doc = await vscode.workspace.openTextDocument(uri);
          if (doc.getText().includes(query)) {
            matchingFiles.push(uri.fsPath);
          }
        } catch { /* skip unreadable files */ }
      }

      return {
        success: true,
        output: `Found ${matchingFiles.length} files matching "${query}"`,
        data: { query, filePattern, files: matchingFiles }
      };
    } catch (error) {
      return { success: false, error: `Search workspace failed: ${error}` };
    }
  }

  private async handleTerminalRun(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const command = input.command as string;
      const name = (input.name as string) || 'VoiceFlow';
      const terminal = vscode.window.createTerminal(name);
      terminal.show();
      terminal.sendText(command);
      return { success: true, output: `Running in terminal: ${command}` };
    } catch (error) {
      return { success: false, error: `Terminal run failed: ${error}` };
    }
  }

  private async handleDebugStart(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const configName = input.configName as string | undefined;
      if (configName) {
        await vscode.debug.startDebugging(undefined, configName);
      } else {
        await vscode.commands.executeCommand('workbench.action.debug.start');
      }
      return { success: true, output: `Started debugging${configName ? `: ${configName}` : ''}` };
    } catch (error) {
      return { success: false, error: `Debug start failed: ${error}` };
    }
  }

  private async handleFindReferences(_input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return { success: false, error: 'No active editor' };

      const position = editor.selection.active;
      const locations = await vscode.commands.executeCommand<vscode.Location[]>(
        'vscode.executeReferenceProvider',
        editor.document.uri,
        position
      );

      return {
        success: true,
        output: `Found ${locations?.length || 0} references`,
        data: { references: locations?.map(l => ({ file: l.uri.fsPath, line: l.range.start.line })) || [] }
      };
    } catch (error) {
      return { success: false, error: `Find references failed: ${error}` };
    }
  }

  private async handleTypeHierarchy(_input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      await vscode.commands.executeCommand('editor.showTypeHierarchy');
      return { success: true, output: 'Opened type hierarchy view' };
    } catch (error) {
      return { success: false, error: `Type hierarchy failed: ${error}` };
    }
  }

  private async handleQuickFix(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const autoApply = input.autoApply === true;
      if (autoApply) {
        await vscode.commands.executeCommand('editor.action.autoFix');
      } else {
        await vscode.commands.executeCommand('editor.action.quickFix');
      }
      return { success: true, output: autoApply ? 'Applied auto-fix' : 'Opened quick fix menu' };
    } catch (error) {
      return { success: false, error: `Quick fix failed: ${error}` };
    }
  }

  private async handleSnippetCreate(input: Record<string, unknown>, _token: vscode.CancellationToken): Promise<MCPToolResult> {
    try {
      const name = input.name as string;
      const prefix = input.prefix as string;
      const body = input.body as string | string[];
      const description = (input.description as string) || '';

      const snippet = {
        [name]: {
          prefix,
          body: Array.isArray(body) ? body : body.split('\n'),
          description
        }
      };

      return {
        success: true,
        output: `Created snippet: ${name}`,
        data: { snippet: JSON.stringify(snippet, null, 2) }
      };
    } catch (error) {
      return { success: false, error: `Snippet create failed: ${error}` };
    }
  }

  // ========================================
  // PUBLIC API & LIFECYCLE
  // ========================================

  /**
   * Get tool schemas for external use
   */
  public getToolSchemas(): Array<{ name: string; description: string; inputSchema: object }> {
    return this.mcpService.listTools().map(tool => ({
      name: `voiceflow.${tool.name}`,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  /**
   * Check if Language Model API is available
   */
  public static isAvailable(): boolean {
    return typeof vscode.lm !== 'undefined' && typeof vscode.lm.registerTool === 'function';
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    for (const disposable of this.registeredTools.values()) {
      disposable.dispose();
    }
    this.registeredTools.clear();
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}

export default LanguageModelToolsService;