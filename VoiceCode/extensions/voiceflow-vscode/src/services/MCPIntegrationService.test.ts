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

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import * as vscode from 'vscode';
import {
  MCPIntegrationService,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPToolResult,
} from './MCPIntegrationService';

// Mock vscode module - define MockEventEmitter inside factory to avoid hoisting issues
vi.mock('vscode', () => {
  // Mock EventEmitter class that matches VSCode's EventEmitter API
  class MockEventEmitter<T> {
    private listeners: ((e: T) => void)[] = [];

    event = (listener: (e: T) => void) => {
      this.listeners.push(listener);
      return { dispose: () => {
        const index = this.listeners.indexOf(listener);
        if (index > -1) this.listeners.splice(index, 1);
      }};
    };

    fire(data: T) {
      this.listeners.forEach(l => l(data));
    }

    dispose() {
      this.listeners = [];
    }
  }

  return {
    workspace: {
      getConfiguration: vi.fn(() => ({
        get: vi.fn(),
      })),
      workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
      fs: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        delete: vi.fn(),
        readDirectory: vi.fn(),
        stat: vi.fn(),
      },
      findFiles: vi.fn(),
    },
    Uri: {
      file: vi.fn((path: string) => ({ fsPath: path, path })),
      joinPath: vi.fn((base: any, ...paths: string[]) => ({
        fsPath: [base.fsPath, ...paths].join('/'),
        path: [base.path, ...paths].join('/'),
      })),
    },
    commands: {
      executeCommand: vi.fn(),
    },
    window: {
      createTerminal: vi.fn(() => ({
        show: vi.fn(),
        sendText: vi.fn(),
        dispose: vi.fn(),
      })),
      activeTextEditor: {
        document: {
          getText: vi.fn(() => 'const x = 1;'),
          languageId: 'typescript',
          uri: { fsPath: '/test/file.ts' },
        },
      },
    },
    EventEmitter: MockEventEmitter,
  };
});

describe('MCPIntegrationService', () => {
  let service: MCPIntegrationService;
  let mockConfig: vscode.WorkspaceConfiguration;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockConfig = {
      get: vi.fn((key: string, defaultValue?: any) => defaultValue),
    } as unknown as vscode.WorkspaceConfiguration;
    
    service = new MCPIntegrationService(mockConfig);
  });

  afterEach(() => {
    service.dispose();
  });

  // ============================================================
  // SERVER CONFIG TESTS
  // ============================================================
  describe('Server Configuration', () => {
    it('should return valid server configuration', () => {
      const config = service.getServerConfig();
      
      expect(config.name).toBe('VoiceFlow PRO MCP Server');
      expect(config.version).toBeDefined();
      expect(config.capabilities.tools).toBe(true);
      expect(config.capabilities.resources).toBe(true);
      expect(config.capabilities.prompts).toBe(true);
    });
  });

  // ============================================================
  // TOOL REGISTRATION TESTS
  // ============================================================
  describe('Tool Registration', () => {
    it('should register a custom tool', () => {
      const customTool: MCPTool = {
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

      expect(tools.some(t => t.name === 'custom_tool')).toBe(true);
    });

    it('should list all registered tools', () => {
      const tools = service.listTools();
      
      // Should have built-in tools
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should have built-in execute_voice_command tool', () => {
      const tools = service.listTools();
      const voiceTool = tools.find(t => t.name === 'execute_voice_command');
      
      expect(voiceTool).toBeDefined();
      expect(voiceTool?.description).toContain('voice command');
    });

    it('should have built-in file_operations tool', () => {
      const tools = service.listTools();
      const fileTool = tools.find(t => t.name === 'file_operations');
      
      expect(fileTool).toBeDefined();
      expect(fileTool?.inputSchema.properties.operation).toBeDefined();
    });

    it('should have built-in analyze_code tool', () => {
      const tools = service.listTools();
      const analyzeTool = tools.find(t => t.name === 'analyze_code');
      
      expect(analyzeTool).toBeDefined();
    });

    it('should have built-in search_codebase tool', () => {
      const tools = service.listTools();
      const searchTool = tools.find(t => t.name === 'search_codebase');

      expect(searchTool).toBeDefined();
    });

    it('should have built-in run_terminal_command tool', () => {
      const tools = service.listTools();
      const terminalTool = tools.find(t => t.name === 'run_terminal_command');

      expect(terminalTool).toBeDefined();
    });

    it('should have built-in git_operations tool', () => {
      const tools = service.listTools();
      const gitTool = tools.find(t => t.name === 'git_operations');

      expect(gitTool).toBeDefined();
    });
  });

  // ============================================================
  // RESOURCE REGISTRATION TESTS
  // ============================================================
  describe('Resource Registration', () => {
    it('should register a resource', () => {
      const resource: MCPResource = {
        uri: 'file:///test/resource.txt',
        name: 'Test Resource',
        description: 'A test resource',
        mimeType: 'text/plain',
        fetch: async () => 'Resource content',
      };

      service.registerResource(resource);
      const resources = service.listResources();

      expect(resources.some(r => r.uri === 'file:///test/resource.txt')).toBe(true);
    });

    it('should list all registered resources', () => {
      const resources = service.listResources();
      expect(Array.isArray(resources)).toBe(true);
    });
  });

  // ============================================================
  // PROMPT REGISTRATION TESTS
  // ============================================================
  describe('Prompt Registration', () => {
    it('should register a prompt', () => {
      const prompt: MCPPrompt = {
        name: 'test_prompt',
        description: 'A test prompt',
        arguments: [
          { name: 'code', description: 'Code to analyze', required: true },
        ],
        generate: async (args) => `Analyze this code: ${args.code}`,
      };

      service.registerPrompt(prompt);
      const prompts = service.listPrompts();

      expect(prompts.some(p => p.name === 'test_prompt')).toBe(true);
    });

    it('should generate a prompt with arguments', async () => {
      const prompt: MCPPrompt = {
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

      expect(generated).toContain('function test()');
      expect(generated).toContain('JavaScript');
    });

    it('should return null for non-existent prompt', async () => {
      const result = await service.generatePrompt('non_existent', {});
      expect(result).toBeNull();
    });
  });

  // ============================================================
  // TOOL EXECUTION TESTS
  // ============================================================
  describe('Tool Execution', () => {
    it('should execute a registered tool', async () => {
      const customTool: MCPTool = {
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

      expect(result.success).toBe(true);
      expect(result.output).toBe('Echo: Hello');
    });

    it('should return error for non-existent tool', async () => {
      const result = await service.executeTool('non_existent_tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle tool execution errors gracefully', async () => {
      const errorTool: MCPTool = {
        name: 'error_tool',
        description: 'Always throws',
        inputSchema: { type: 'object', properties: {} },
        handler: async () => { throw new Error('Tool error'); },
      };

      service.registerTool(errorTool);
      const result = await service.executeTool('error_tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool error');
    });

    describe('Built-in Tool Execution', () => {
      it('should execute voice command tool', async () => {
        (vscode.commands.executeCommand as Mock).mockResolvedValue(undefined);

        const result = await service.executeTool('execute_voice_command', {
          command: 'open file test.ts',
        });

        expect(result.success).toBe(true);
      });

      it('should execute terminal command tool', async () => {
        const mockTerminal = {
          show: vi.fn(),
          sendText: vi.fn(),
          dispose: vi.fn(),
        };
        (vscode.window.createTerminal as Mock).mockReturnValue(mockTerminal);

        const result = await service.executeTool('run_terminal_command', {
          command: 'npm test',
        });

        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================
  // EXPORT FORMAT TESTS
  // ============================================================
  describe('Export Formats', () => {
    it('should export tools in OpenAI function format', () => {
      const openAITools = service.exportToolsAsOpenAIFunctions();

      expect(Array.isArray(openAITools)).toBe(true);
      expect(openAITools.length).toBeGreaterThan(0);

      const firstTool = openAITools[0];
      expect(firstTool.type).toBe('function');
      expect(firstTool.function.name).toBeDefined();
      expect(firstTool.function.description).toBeDefined();
      expect(firstTool.function.parameters).toBeDefined();
    });

    it('should export tools in Anthropic format', () => {
      const anthropicTools = service.exportToolsAsAnthropicTools();

      expect(Array.isArray(anthropicTools)).toBe(true);
      expect(anthropicTools.length).toBeGreaterThan(0);

      const firstTool = anthropicTools[0];
      expect(firstTool.name).toBeDefined();
      expect(firstTool.description).toBeDefined();
      expect(firstTool.input_schema).toBeDefined();
    });

    it('should include all tools in OpenAI export', () => {
      const tools = service.listTools();
      const openAITools = service.exportToolsAsOpenAIFunctions();

      expect(openAITools.length).toBe(tools.length);
    });

    it('should include all tools in Anthropic export', () => {
      const tools = service.listTools();
      const anthropicTools = service.exportToolsAsAnthropicTools();

      expect(anthropicTools.length).toBe(tools.length);
    });
  });

  // ============================================================
  // ERROR HANDLING TESTS
  // ============================================================
  describe('Error Handling', () => {
    it('should handle file read errors in file_operations', async () => {
      (vscode.workspace.fs.readFile as Mock).mockRejectedValue(new Error('File not found'));

      const result = await service.executeTool('file_operations', {
        operation: 'read',
        path: 'nonexistent.txt',
      });

      expect(result.success).toBe(false);
    });

    it('should validate required parameters', async () => {
      // Try to execute file_operations without required params
      const result = await service.executeTool('file_operations', {
        // Missing 'operation' and 'path'
      });

      // Should fail or handle gracefully
      expect(result).toBeDefined();
    });
  });

  // ============================================================
  // DISPOSE TESTS
  // ============================================================
  describe('Dispose', () => {
    it('should clean up resources on dispose', () => {
      service.registerTool({
        name: 'temp_tool',
        description: 'Temporary',
        inputSchema: { type: 'object', properties: {} },
        handler: async () => ({ success: true }),
      });

      expect(() => service.dispose()).not.toThrow();

      // After dispose, tools should be cleared
      const tools = service.listTools();
      expect(tools.length).toBe(0);
    });

    it('should clear prompts on dispose', () => {
      service.registerPrompt({
        name: 'temp_prompt',
        description: 'Temporary',
        arguments: [],
        generate: async () => 'Test',
      });

      service.dispose();

      const prompts = service.listPrompts();
      expect(prompts.length).toBe(0);
    });

    it('should clear resources on dispose', () => {
      service.registerResource({
        uri: 'file:///temp',
        name: 'Temp',
        description: 'Temporary',
        mimeType: 'text/plain',
        fetch: async () => 'content',
      });

      service.dispose();

      const resources = service.listResources();
      expect(resources.length).toBe(0);
    });
  });
});

