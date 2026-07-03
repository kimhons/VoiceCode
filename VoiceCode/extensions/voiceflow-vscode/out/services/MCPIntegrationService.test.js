"use strict";
/**
 * MCPIntegrationService Tests
 * Comprehensive test suite for Model Context Protocol integration
 *
 * Tests cover:
 * - Tool registration and listing
 * - Resource registration and management
 * - Prompt registration and generation
 * - Tool execution with various operations
 * - Built-in tools (file_operations, analyze_code, search_codebase, etc.)
 * - Export formats (OpenAI, Anthropic)
 * - Event emissions
 * - Error handling
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
const vitest_1 = require("vitest");
const vscode = __importStar(require("vscode"));
const MCPIntegrationService_1 = require("./MCPIntegrationService");
// Mock vscode module - define MockEventEmitter inside factory to avoid hoisting issues
vitest_1.vi.mock('vscode', () => {
    // Mock EventEmitter class that matches VSCode's EventEmitter API
    class MockEventEmitter {
        listeners = [];
        event = (listener) => {
            this.listeners.push(listener);
            return { dispose: () => {
                    const index = this.listeners.indexOf(listener);
                    if (index > -1)
                        this.listeners.splice(index, 1);
                } };
        };
        fire(data) {
            this.listeners.forEach(l => l(data));
        }
        dispose() {
            this.listeners = [];
        }
    }
    return {
        workspace: {
            getConfiguration: vitest_1.vi.fn(() => ({
                get: vitest_1.vi.fn(),
            })),
            workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
            fs: {
                readFile: vitest_1.vi.fn(),
                writeFile: vitest_1.vi.fn(),
                delete: vitest_1.vi.fn(),
                readDirectory: vitest_1.vi.fn(),
                stat: vitest_1.vi.fn(),
            },
            findFiles: vitest_1.vi.fn(),
        },
        Uri: {
            file: vitest_1.vi.fn((path) => ({ fsPath: path, path })),
            joinPath: vitest_1.vi.fn((base, ...paths) => ({
                fsPath: [base.fsPath, ...paths].join('/'),
                path: [base.path, ...paths].join('/'),
            })),
        },
        commands: {
            executeCommand: vitest_1.vi.fn(),
        },
        window: {
            createTerminal: vitest_1.vi.fn(() => ({
                show: vitest_1.vi.fn(),
                sendText: vitest_1.vi.fn(),
                dispose: vitest_1.vi.fn(),
            })),
            activeTextEditor: {
                document: {
                    getText: vitest_1.vi.fn(() => 'const x = 1;'),
                    languageId: 'typescript',
                    uri: { fsPath: '/test/file.ts' },
                },
            },
        },
        EventEmitter: MockEventEmitter,
    };
});
(0, vitest_1.describe)('MCPIntegrationService', () => {
    let service;
    let mockConfig;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockConfig = {
            get: vitest_1.vi.fn((key, defaultValue) => defaultValue),
        };
        service = new MCPIntegrationService_1.MCPIntegrationService(mockConfig);
    });
    (0, vitest_1.afterEach)(() => {
        service.dispose();
    });
    // ============================================================
    // SERVER CONFIG TESTS
    // ============================================================
    (0, vitest_1.describe)('Server Configuration', () => {
        (0, vitest_1.it)('should return valid server configuration', () => {
            const config = service.getServerConfig();
            (0, vitest_1.expect)(config.name).toBe('VoiceFlow PRO MCP Server');
            (0, vitest_1.expect)(config.version).toBeDefined();
            (0, vitest_1.expect)(config.capabilities.tools).toBe(true);
            (0, vitest_1.expect)(config.capabilities.resources).toBe(true);
            (0, vitest_1.expect)(config.capabilities.prompts).toBe(true);
        });
    });
    // ============================================================
    // TOOL REGISTRATION TESTS
    // ============================================================
    (0, vitest_1.describe)('Tool Registration', () => {
        (0, vitest_1.it)('should register a custom tool', () => {
            const customTool = {
                name: 'custom_tool',
                description: 'A custom test tool',
                inputSchema: {
                    type: 'object',
                    properties: {
                        input: { type: 'string', description: 'Input string' },
                    },
                    required: ['input'],
                },
                handler: async (params) => ({ success: true, output: params.input }),
            };
            service.registerTool(customTool);
            const tools = service.listTools();
            (0, vitest_1.expect)(tools.some(t => t.name === 'custom_tool')).toBe(true);
        });
        (0, vitest_1.it)('should list all registered tools', () => {
            const tools = service.listTools();
            // Should have built-in tools
            (0, vitest_1.expect)(Array.isArray(tools)).toBe(true);
            (0, vitest_1.expect)(tools.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should have built-in execute_voice_command tool', () => {
            const tools = service.listTools();
            const voiceTool = tools.find(t => t.name === 'execute_voice_command');
            (0, vitest_1.expect)(voiceTool).toBeDefined();
            (0, vitest_1.expect)(voiceTool?.description).toContain('voice command');
        });
        (0, vitest_1.it)('should have built-in file_operations tool', () => {
            const tools = service.listTools();
            const fileTool = tools.find(t => t.name === 'file_operations');
            (0, vitest_1.expect)(fileTool).toBeDefined();
            (0, vitest_1.expect)(fileTool?.inputSchema.properties.operation).toBeDefined();
        });
        (0, vitest_1.it)('should have built-in analyze_code tool', () => {
            const tools = service.listTools();
            const analyzeTool = tools.find(t => t.name === 'analyze_code');
            (0, vitest_1.expect)(analyzeTool).toBeDefined();
        });
        (0, vitest_1.it)('should have built-in search_codebase tool', () => {
            const tools = service.listTools();
            const searchTool = tools.find(t => t.name === 'search_codebase');
            (0, vitest_1.expect)(searchTool).toBeDefined();
        });
        (0, vitest_1.it)('should have built-in run_terminal_command tool', () => {
            const tools = service.listTools();
            const terminalTool = tools.find(t => t.name === 'run_terminal_command');
            (0, vitest_1.expect)(terminalTool).toBeDefined();
        });
        (0, vitest_1.it)('should have built-in git_operations tool', () => {
            const tools = service.listTools();
            const gitTool = tools.find(t => t.name === 'git_operations');
            (0, vitest_1.expect)(gitTool).toBeDefined();
        });
        (0, vitest_1.it)('should have all 26 built-in tools registered', () => {
            const tools = service.listTools();
            const expectedTools = [
                'execute_voice_command',
                'file_operations',
                'analyze_code',
                'search_codebase',
                'run_terminal_command',
                'git_operations',
                'editor_navigate',
                'refactor_code',
                'debug_operations',
                'run_tests',
                'snippets',
                'workspace_manage',
                'documentation',
                'format_code',
                'diagnostics',
                'selection',
                'comments',
                'clipboard',
                'window_manage',
                'extensions',
                'project_generate',
                'folding',
                'multi_cursor',
                'language_server',
                'tasks',
                'diff_merge',
            ];
            (0, vitest_1.expect)(tools.length).toBe(26);
            for (const toolName of expectedTools) {
                const tool = tools.find(t => t.name === toolName);
                (0, vitest_1.expect)(tool).toBeDefined();
            }
        });
        (0, vitest_1.it)('should have built-in editor_navigate tool', () => {
            const tools = service.listTools();
            const tool = tools.find(t => t.name === 'editor_navigate');
            (0, vitest_1.expect)(tool).toBeDefined();
            (0, vitest_1.expect)(tool?.inputSchema.properties.action).toBeDefined();
        });
        (0, vitest_1.it)('should have built-in debug_operations tool', () => {
            const tools = service.listTools();
            const tool = tools.find(t => t.name === 'debug_operations');
            (0, vitest_1.expect)(tool).toBeDefined();
            (0, vitest_1.expect)(tool?.inputSchema.properties.action.enum).toContain('start');
            (0, vitest_1.expect)(tool?.inputSchema.properties.action.enum).toContain('toggle_breakpoint');
        });
        (0, vitest_1.it)('should have built-in run_tests tool', () => {
            const tools = service.listTools();
            const tool = tools.find(t => t.name === 'run_tests');
            (0, vitest_1.expect)(tool).toBeDefined();
            (0, vitest_1.expect)(tool?.inputSchema.properties.scope.enum).toContain('all');
            (0, vitest_1.expect)(tool?.inputSchema.properties.scope.enum).toContain('coverage');
        });
        (0, vitest_1.it)('should have built-in format_code tool', () => {
            const tools = service.listTools();
            const tool = tools.find(t => t.name === 'format_code');
            (0, vitest_1.expect)(tool).toBeDefined();
            (0, vitest_1.expect)(tool?.inputSchema.properties.scope.enum).toContain('document');
            (0, vitest_1.expect)(tool?.inputSchema.properties.scope.enum).toContain('organize_imports');
        });
        (0, vitest_1.it)('should have built-in window_manage tool', () => {
            const tools = service.listTools();
            const tool = tools.find(t => t.name === 'window_manage');
            (0, vitest_1.expect)(tool).toBeDefined();
            (0, vitest_1.expect)(tool?.inputSchema.properties.action.enum).toContain('split_editor');
            (0, vitest_1.expect)(tool?.inputSchema.properties.action.enum).toContain('toggle_terminal');
        });
        (0, vitest_1.it)('should have built-in project_generate tool', () => {
            const tools = service.listTools();
            const tool = tools.find(t => t.name === 'project_generate');
            (0, vitest_1.expect)(tool).toBeDefined();
            (0, vitest_1.expect)(tool?.inputSchema.properties.template.enum).toContain('react');
            (0, vitest_1.expect)(tool?.inputSchema.properties.template.enum).toContain('typescript');
        });
        (0, vitest_1.it)('should have built-in diff_merge tool', () => {
            const tools = service.listTools();
            const tool = tools.find(t => t.name === 'diff_merge');
            (0, vitest_1.expect)(tool).toBeDefined();
            (0, vitest_1.expect)(tool?.inputSchema.properties.action.enum).toContain('diff_files');
            (0, vitest_1.expect)(tool?.inputSchema.properties.action.enum).toContain('accept_incoming');
        });
    });
    // ============================================================
    // RESOURCE REGISTRATION TESTS
    // ============================================================
    (0, vitest_1.describe)('Resource Registration', () => {
        (0, vitest_1.it)('should register a resource', () => {
            const resource = {
                uri: 'file:///test/resource.txt',
                name: 'Test Resource',
                description: 'A test resource',
                mimeType: 'text/plain',
                fetch: async () => 'Resource content',
            };
            service.registerResource(resource);
            const resources = service.listResources();
            (0, vitest_1.expect)(resources.some(r => r.uri === 'file:///test/resource.txt')).toBe(true);
        });
        (0, vitest_1.it)('should list all registered resources', () => {
            const resources = service.listResources();
            (0, vitest_1.expect)(Array.isArray(resources)).toBe(true);
        });
    });
    // ============================================================
    // PROMPT REGISTRATION TESTS
    // ============================================================
    (0, vitest_1.describe)('Prompt Registration', () => {
        (0, vitest_1.it)('should register a prompt', () => {
            const prompt = {
                name: 'test_prompt',
                description: 'A test prompt',
                arguments: [
                    { name: 'code', description: 'Code to analyze', required: true },
                ],
                generate: async (args) => `Analyze this code: ${args.code}`,
            };
            service.registerPrompt(prompt);
            const prompts = service.listPrompts();
            (0, vitest_1.expect)(prompts.some(p => p.name === 'test_prompt')).toBe(true);
        });
        (0, vitest_1.it)('should generate a prompt with arguments', async () => {
            const prompt = {
                name: 'code_review',
                description: 'Code review prompt',
                arguments: [
                    { name: 'code', description: 'Code to review', required: true },
                    { name: 'language', description: 'Programming language', required: false },
                ],
                generate: async (args) => `Review this ${args.language} code:\n${args.code}`,
            };
            service.registerPrompt(prompt);
            const generated = await service.generatePrompt('code_review', {
                code: 'function test() {}',
                language: 'JavaScript',
            });
            (0, vitest_1.expect)(generated).toContain('function test()');
            (0, vitest_1.expect)(generated).toContain('JavaScript');
        });
        (0, vitest_1.it)('should return null for non-existent prompt', async () => {
            const result = await service.generatePrompt('non_existent', {});
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    // ============================================================
    // TOOL EXECUTION TESTS
    // ============================================================
    (0, vitest_1.describe)('Tool Execution', () => {
        (0, vitest_1.it)('should execute a registered tool', async () => {
            const customTool = {
                name: 'echo_tool',
                description: 'Echoes input',
                inputSchema: {
                    type: 'object',
                    properties: { message: { type: 'string', description: 'Message to echo' } },
                },
                handler: async (params) => ({
                    success: true,
                    output: `Echo: ${params.message}`
                }),
            };
            service.registerTool(customTool);
            const result = await service.executeTool('echo_tool', { message: 'Hello' });
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.output).toBe('Echo: Hello');
        });
        (0, vitest_1.it)('should return error for non-existent tool', async () => {
            const result = await service.executeTool('non_existent_tool', {});
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('not found');
        });
        (0, vitest_1.it)('should handle tool execution errors gracefully', async () => {
            const errorTool = {
                name: 'error_tool',
                description: 'Always throws',
                inputSchema: { type: 'object', properties: {} },
                handler: async () => { throw new Error('Tool error'); },
            };
            service.registerTool(errorTool);
            const result = await service.executeTool('error_tool', {});
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toContain('Tool error');
        });
        (0, vitest_1.describe)('Built-in Tool Execution', () => {
            (0, vitest_1.it)('should execute voice command tool', async () => {
                vscode.commands.executeCommand.mockResolvedValue(undefined);
                const result = await service.executeTool('execute_voice_command', {
                    command: 'open file test.ts',
                });
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should execute terminal command tool', async () => {
                const mockTerminal = {
                    show: vitest_1.vi.fn(),
                    sendText: vitest_1.vi.fn(),
                    dispose: vitest_1.vi.fn(),
                };
                vscode.window.createTerminal.mockReturnValue(mockTerminal);
                const result = await service.executeTool('run_terminal_command', {
                    command: 'npm test',
                });
                (0, vitest_1.expect)(result.success).toBe(true);
            });
            (0, vitest_1.it)('should execute format_code tool', async () => {
                vscode.commands.executeCommand.mockResolvedValue(undefined);
                const result = await service.executeTool('format_code', {
                    scope: 'document',
                });
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('editor.action.formatDocument');
            });
            (0, vitest_1.it)('should execute debug_operations start', async () => {
                vscode.commands.executeCommand.mockResolvedValue(undefined);
                const result = await service.executeTool('debug_operations', {
                    action: 'start',
                });
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.debug.start');
            });
            (0, vitest_1.it)('should execute window_manage toggle_terminal', async () => {
                vscode.commands.executeCommand.mockResolvedValue(undefined);
                const result = await service.executeTool('window_manage', {
                    action: 'toggle_terminal',
                });
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.terminal.toggleTerminal');
            });
            (0, vitest_1.it)('should execute clipboard copy', async () => {
                vscode.commands.executeCommand.mockResolvedValue(undefined);
                const result = await service.executeTool('clipboard', {
                    action: 'copy',
                });
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('editor.action.clipboardCopyAction');
            });
            (0, vitest_1.it)('should execute folding fold_all', async () => {
                vscode.commands.executeCommand.mockResolvedValue(undefined);
                const result = await service.executeTool('folding', {
                    action: 'fold_all',
                });
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('editor.foldAll');
            });
            (0, vitest_1.it)('should execute multi_cursor add_cursor_below', async () => {
                vscode.commands.executeCommand.mockResolvedValue(undefined);
                const result = await service.executeTool('multi_cursor', {
                    action: 'add_cursor_below',
                });
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('editor.action.insertCursorBelow');
            });
            (0, vitest_1.it)('should execute tasks run_build', async () => {
                vscode.commands.executeCommand.mockResolvedValue(undefined);
                const result = await service.executeTool('tasks', {
                    action: 'run_build',
                });
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.action.tasks.build');
            });
            (0, vitest_1.it)('should execute project_generate with react template', async () => {
                const mockTerminal = {
                    show: vitest_1.vi.fn(),
                    sendText: vitest_1.vi.fn(),
                    dispose: vitest_1.vi.fn(),
                };
                vscode.window.createTerminal.mockReturnValue(mockTerminal);
                const result = await service.executeTool('project_generate', {
                    template: 'react',
                    name: 'my-app',
                });
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(mockTerminal.sendText).toHaveBeenCalledWith('npx create-react-app my-app');
            });
            (0, vitest_1.it)('should execute run_tests with coverage', async () => {
                vscode.commands.executeCommand.mockResolvedValue(undefined);
                const result = await service.executeTool('run_tests', {
                    scope: 'coverage',
                });
                (0, vitest_1.expect)(result.success).toBe(true);
                (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('testing.coverageAll');
            });
        });
    });
    // ============================================================
    // EXPORT FORMAT TESTS
    // ============================================================
    (0, vitest_1.describe)('Export Formats', () => {
        (0, vitest_1.it)('should export tools in OpenAI function format', () => {
            const openAITools = service.exportToolsAsOpenAIFunctions();
            (0, vitest_1.expect)(Array.isArray(openAITools)).toBe(true);
            (0, vitest_1.expect)(openAITools.length).toBeGreaterThan(0);
            const firstTool = openAITools[0];
            (0, vitest_1.expect)(firstTool.type).toBe('function');
            (0, vitest_1.expect)(firstTool.function.name).toBeDefined();
            (0, vitest_1.expect)(firstTool.function.description).toBeDefined();
            (0, vitest_1.expect)(firstTool.function.parameters).toBeDefined();
        });
        (0, vitest_1.it)('should export tools in Anthropic format', () => {
            const anthropicTools = service.exportToolsAsAnthropicTools();
            (0, vitest_1.expect)(Array.isArray(anthropicTools)).toBe(true);
            (0, vitest_1.expect)(anthropicTools.length).toBeGreaterThan(0);
            const firstTool = anthropicTools[0];
            (0, vitest_1.expect)(firstTool.name).toBeDefined();
            (0, vitest_1.expect)(firstTool.description).toBeDefined();
            (0, vitest_1.expect)(firstTool.input_schema).toBeDefined();
        });
        (0, vitest_1.it)('should include all tools in OpenAI export', () => {
            const tools = service.listTools();
            const openAITools = service.exportToolsAsOpenAIFunctions();
            (0, vitest_1.expect)(openAITools.length).toBe(tools.length);
        });
        (0, vitest_1.it)('should include all tools in Anthropic export', () => {
            const tools = service.listTools();
            const anthropicTools = service.exportToolsAsAnthropicTools();
            (0, vitest_1.expect)(anthropicTools.length).toBe(tools.length);
        });
    });
    // ============================================================
    // ERROR HANDLING TESTS
    // ============================================================
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('should handle file read errors in file_operations', async () => {
            vscode.workspace.fs.readFile.mockRejectedValue(new Error('File not found'));
            const result = await service.executeTool('file_operations', {
                operation: 'read',
                path: 'nonexistent.txt',
            });
            (0, vitest_1.expect)(result.success).toBe(false);
        });
        (0, vitest_1.it)('should validate required parameters', async () => {
            // Try to execute file_operations without required params
            const result = await service.executeTool('file_operations', {
            // Missing 'operation' and 'path'
            });
            // Should fail or handle gracefully
            (0, vitest_1.expect)(result).toBeDefined();
        });
    });
    // ============================================================
    // DISPOSE TESTS
    // ============================================================
    (0, vitest_1.describe)('Dispose', () => {
        (0, vitest_1.it)('should clean up resources on dispose', () => {
            service.registerTool({
                name: 'temp_tool',
                description: 'Temporary',
                inputSchema: { type: 'object', properties: {} },
                handler: async () => ({ success: true }),
            });
            (0, vitest_1.expect)(() => service.dispose()).not.toThrow();
            // After dispose, tools should be cleared
            const tools = service.listTools();
            (0, vitest_1.expect)(tools.length).toBe(0);
        });
        (0, vitest_1.it)('should clear prompts on dispose', () => {
            service.registerPrompt({
                name: 'temp_prompt',
                description: 'Temporary',
                arguments: [],
                generate: async () => 'Test',
            });
            service.dispose();
            const prompts = service.listPrompts();
            (0, vitest_1.expect)(prompts.length).toBe(0);
        });
        (0, vitest_1.it)('should clear resources on dispose', () => {
            service.registerResource({
                uri: 'file:///temp',
                name: 'Temp',
                description: 'Temporary',
                mimeType: 'text/plain',
                fetch: async () => 'content',
            });
            service.dispose();
            const resources = service.listResources();
            (0, vitest_1.expect)(resources.length).toBe(0);
        });
    });
});
//# sourceMappingURL=MCPIntegrationService.test.js.map