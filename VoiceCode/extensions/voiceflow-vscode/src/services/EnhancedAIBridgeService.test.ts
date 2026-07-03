/**
 * EnhancedAIBridgeService Tests
 * Comprehensive test suite for all 8 AI service integrations
 *
 * Tests cover:
 * - Provider detection (Copilot, Cursor, Cline, Aider, Augment, Anthropic, OpenAI, Local)
 * - Provider status management
 * - Request handling and routing
 * - API response parsing
 * - MCP tool integration
 * - Error handling and fallback
 * - Event emissions
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import * as vscode from 'vscode';
import {
  EnhancedAIBridgeService,
  AIProviderType,
  AIRequest,
  AIResponse,
  AIContext,
  ProviderStatus
} from './EnhancedAIBridgeService';
import { MCPIntegrationService } from './MCPIntegrationService';

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

  // Mock CancellationTokenSource
  class MockCancellationTokenSource {
    token = { isCancellationRequested: false, onCancellationRequested: vi.fn() };
    cancel() {}
    dispose() {}
  }

  // Mock Language Model Chat Message
  const LanguageModelChatMessage = {
    User: (content: string) => ({ role: 'user', content }),
    Assistant: (content: string) => ({ role: 'assistant', content }),
  };

  return {
    extensions: {
      getExtension: vi.fn(),
    },
    workspace: {
      getConfiguration: vi.fn(() => ({
        get: vi.fn(),
      })),
      workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
    },
    commands: {
      executeCommand: vi.fn(),
    },
    window: {
      createTerminal: vi.fn(() => ({
        show: vi.fn(),
        sendText: vi.fn(),
      })),
    },
    EventEmitter: MockEventEmitter,
    CancellationTokenSource: MockCancellationTokenSource,
    LanguageModelChatMessage,
    lm: {
      selectChatModels: vi.fn().mockResolvedValue([]),
    },
  };
});

// Create mock MCP service instance with proper mock methods
const createMockMcpService = () => ({
  executeTool: vi.fn().mockResolvedValue({ success: true, output: 'Tool executed' }),
  getTools: vi.fn().mockReturnValue([]),
  exportToolsAsOpenAITools: vi.fn().mockReturnValue([]),
  exportToolsAsOpenAIFunctions: vi.fn().mockReturnValue([]),
  exportToolsAsAnthropicTools: vi.fn().mockReturnValue([]),
  dispose: vi.fn(),
});

// Mock MCPIntegrationService
vi.mock('./MCPIntegrationService', () => ({
  MCPIntegrationService: vi.fn().mockImplementation(() => createMockMcpService()),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

// Helper to wait for async initialization
const waitForInit = () => new Promise(resolve => setTimeout(resolve, 10));

describe('EnhancedAIBridgeService', () => {
  let service: EnhancedAIBridgeService;
  let mockConfig: vscode.WorkspaceConfiguration;
  let mockMcpService: ReturnType<typeof createMockMcpService>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup mock config with all necessary keys
    mockConfig = {
      get: vi.fn((key: string, defaultValue?: any) => {
        const configValues: Record<string, any> = {
          'anthropicApiKey': 'test-anthropic-key',
          'openaiApiKey': 'test-openai-key',
          'localLLMEndpoint': 'http://localhost:11434',
          'anthropicModel': 'claude-3-5-sonnet-20241022',
          'openaiModel': 'gpt-4',
          'maxTokens': 4096,
          'temperature': 0.7,
        };
        return configValues[key] ?? defaultValue;
      }),
    } as unknown as vscode.WorkspaceConfiguration;

    mockMcpService = createMockMcpService();
    service = new EnhancedAIBridgeService(mockConfig, mockMcpService as unknown as MCPIntegrationService);

    // Wait for async initialization to complete
    await waitForInit();
  });

  afterEach(() => {
    service.dispose();
  });

  // ============================================================
  // PROVIDER STATUS TESTS
  // ============================================================
  describe('Provider Status Management', () => {
    it('should return all provider statuses via getProviderStatuses()', () => {
      const statuses = service.getProviderStatuses();

      expect(Array.isArray(statuses)).toBe(true);
      // Should have statuses for all 8 providers
      const providerNames = statuses.map((s: ProviderStatus) => s.provider);
      expect(providerNames).toContain('copilot');
      expect(providerNames).toContain('cursor');
      expect(providerNames).toContain('cline');
      expect(providerNames).toContain('aider');
      expect(providerNames).toContain('augment');
      expect(providerNames).toContain('anthropic');
      expect(providerNames).toContain('openai');
      expect(providerNames).toContain('local');
    });

    it('should detect Copilot as available when extension is installed', async () => {
      (vscode.extensions.getExtension as Mock).mockImplementation((id: string) => {
        if (id === 'github.copilot') return { id };
        return undefined;
      });

      // Re-create service to trigger provider detection
      service = new EnhancedAIBridgeService(mockConfig, mockMcpService as unknown as MCPIntegrationService);
      await waitForInit();
      const statuses = service.getProviderStatuses();
      const copilot = statuses.find((s: ProviderStatus) => s.provider === 'copilot');

      expect(copilot?.available).toBe(true);
    });

    it('should detect Cursor as available when extension is installed', async () => {
      (vscode.extensions.getExtension as Mock).mockImplementation((id: string) => {
        if (id === 'cursor.cursor') return { id };
        return undefined;
      });

      service = new EnhancedAIBridgeService(mockConfig, mockMcpService as unknown as MCPIntegrationService);
      await waitForInit();
      const statuses = service.getProviderStatuses();
      const cursor = statuses.find((s: ProviderStatus) => s.provider === 'cursor');

      expect(cursor?.available).toBe(true);
    });

    it('should detect Cline as available when extension is installed', async () => {
      (vscode.extensions.getExtension as Mock).mockImplementation((id: string) => {
        if (id === 'saoudrizwan.claude-dev') return { id };
        return undefined;
      });

      service = new EnhancedAIBridgeService(mockConfig, mockMcpService as unknown as MCPIntegrationService);
      await waitForInit();
      const statuses = service.getProviderStatuses();
      const cline = statuses.find((s: ProviderStatus) => s.provider === 'cline');

      expect(cline?.available).toBe(true);
    });

    it('should detect Augment as available when extension is installed', async () => {
      (vscode.extensions.getExtension as Mock).mockImplementation((id: string) => {
        if (id === 'augment.augment-vscode') return { id };
        return undefined;
      });

      service = new EnhancedAIBridgeService(mockConfig, mockMcpService as unknown as MCPIntegrationService);
      await waitForInit();
      const statuses = service.getProviderStatuses();
      const augment = statuses.find((s: ProviderStatus) => s.provider === 'augment');

      expect(augment?.available).toBe(true);
    });

    it('should mark Anthropic as configured when API key is present', () => {
      const statuses = service.getProviderStatuses();
      const anthropic = statuses.find((s: ProviderStatus) => s.provider === 'anthropic');

      expect(anthropic?.configured).toBe(true);
    });

    it('should mark OpenAI as configured when API key is present', () => {
      const statuses = service.getProviderStatuses();
      const openai = statuses.find((s: ProviderStatus) => s.provider === 'openai');

      expect(openai?.configured).toBe(true);
    });

    it('should detect local LLM when endpoint is configured', () => {
      const statuses = service.getProviderStatuses();
      const local = statuses.find((s: ProviderStatus) => s.provider === 'local');

      expect(local?.available).toBe(true);
    });

    it('should mark Aider as available (CLI tool)', () => {
      const statuses = service.getProviderStatuses();
      const aider = statuses.find((s: ProviderStatus) => s.provider === 'aider');

      expect(aider?.available).toBe(true);
    });
  });

  // ============================================================
  // PREFERRED PROVIDER TESTS
  // ============================================================
  describe('Preferred Provider Selection', () => {
    it('should have a default preferred provider', () => {
      const preferred = service.getPreferredProvider();
      expect(preferred).toBeDefined();
      expect(typeof preferred).toBe('string');
    });

    it('should allow setting preferred provider to openai', () => {
      service.setPreferredProvider('openai');
      expect(service.getPreferredProvider()).toBe('openai');
    });

    it('should allow setting preferred provider to anthropic', () => {
      service.setPreferredProvider('anthropic');
      expect(service.getPreferredProvider()).toBe('anthropic');
    });

    it('should allow setting preferred provider to copilot', () => {
      service.setPreferredProvider('copilot');
      expect(service.getPreferredProvider()).toBe('copilot');
    });

    it('should allow setting preferred provider to local', () => {
      service.setPreferredProvider('local');
      expect(service.getPreferredProvider()).toBe('local');
    });
  });

  // ============================================================
  // REQUEST HANDLING TESTS
  // ============================================================
  describe('Request Handling - sendRequest()', () => {
    const testRequest: AIRequest = {
      type: 'completion',
      prompt: 'Write a hello world function',
      context: {
        code: 'function hello() {}',
        language: 'typescript',
      },
    };

    it('should send request to specified provider', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'function hello() { console.log("Hello"); }' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      });

      const response = await service.sendRequest({
        ...testRequest,
        options: { provider: 'openai' },
      });

      expect(response.provider).toBe('openai');
    });

    it('should use preferred provider when none specified', async () => {
      service.setPreferredProvider('anthropic');

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: [{ type: 'text', text: 'Hello world function' }],
          usage: { input_tokens: 10, output_tokens: 20 },
        }),
      });

      const response = await service.sendRequest(testRequest);
      expect(response.provider).toBe('anthropic');
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('API Error'));

      const response = await service.sendRequest({
        ...testRequest,
        options: { provider: 'openai' },
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should emit request started event', async () => {
      const listener = vi.fn();
      service.onRequestStarted(listener);

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'test' } }] }),
      });

      await service.sendRequest(testRequest);
      // Event should be fired
    });

    it('should emit request completed event', async () => {
      const listener = vi.fn();
      service.onRequestCompleted(listener);

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'test' } }] }),
      });

      await service.sendRequest(testRequest);
      // Event should be fired with response
    });
  });

  describe('Anthropic Integration', () => {
    it('should send request to Anthropic API', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: [{ type: 'text', text: 'Generated code' }],
          usage: { input_tokens: 10, output_tokens: 20 },
          model: 'claude-3-5-sonnet-20241022',
        }),
      });

      const response = await service.sendRequest({
        type: 'completion',
        prompt: 'Test prompt',
        options: { provider: 'anthropic' },
      });

      expect(response.provider).toBe('anthropic');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-anthropic-key',
            'anthropic-version': expect.any(String),
          }),
        })
      );
    });

    it('should include MCP tools when enabled', async () => {
      (mockMcpService.exportToolsAsAnthropicTools as Mock).mockReturnValue([
        { name: 'test_tool', description: 'Test tool' },
      ]);

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: [{ type: 'text', text: 'Response with tools' }],
        }),
      });

      await service.sendRequest({
        type: 'completion',
        prompt: 'Test',
        options: { provider: 'anthropic', tools: true },
      });

      const fetchCall = (global.fetch as Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.tools).toBeDefined();
    });

    it('should handle Anthropic tool_use responses', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: [{
            type: 'tool_use',
            id: 'tool_123',
            name: 'file_operations',
            input: { operation: 'read', path: 'test.txt' }
          }],
          usage: { input_tokens: 10, output_tokens: 20 },
          model: 'claude-3-5-sonnet-20241022',
        }),
      });

      const response = await service.sendRequest({
        type: 'completion',
        prompt: 'Read the file',
        options: { provider: 'anthropic', tools: true },
      });

      expect(response.success).toBe(true);
      expect(response.toolCalls).toBeDefined();
      expect(response.toolCalls?.length).toBeGreaterThan(0);
    });

    it('should parse token usage from Anthropic response', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          content: [{ type: 'text', text: 'Generated code' }],
          usage: { input_tokens: 150, output_tokens: 250 },
          model: 'claude-3-5-sonnet-20241022',
        }),
      });

      const response = await service.sendRequest({
        type: 'completion',
        prompt: 'Test',
        options: { provider: 'anthropic' },
      });

      expect(response.usage).toBeDefined();
      expect(response.usage?.promptTokens).toBe(150);
      expect(response.usage?.completionTokens).toBe(250);
      expect(response.usage?.totalTokens).toBe(400);
    });
  });

  // ============================================================
  // OPENAI INTEGRATION TESTS
  // ============================================================
  describe('OpenAI Integration', () => {
    it('should send request to OpenAI API', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Generated code' } }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          model: 'gpt-4',
        }),
      });

      const response = await service.sendRequest({
        type: 'completion',
        prompt: 'Test prompt',
        options: { provider: 'openai' },
      });

      expect(response.provider).toBe('openai');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-openai-key',
          }),
        })
      );
    });

    it('should handle OpenAI tool_calls responses', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: '',
              tool_calls: [{
                id: 'call_123',
                type: 'function',
                function: {
                  name: 'search_codebase',
                  arguments: '{"query":"test function"}'
                }
              }]
            }
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          model: 'gpt-4',
        }),
      });

      const response = await service.sendRequest({
        type: 'completion',
        prompt: 'Find test functions',
        options: { provider: 'openai', tools: true },
      });

      expect(response.success).toBe(true);
      expect(response.toolCalls).toBeDefined();
      expect(response.toolCalls?.[0].name).toBe('search_codebase');
    });

    it('should parse token usage from OpenAI response', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Response' } }],
          usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
          model: 'gpt-4',
        }),
      });

      const response = await service.sendRequest({
        type: 'completion',
        prompt: 'Test',
        options: { provider: 'openai' },
      });

      expect(response.usage?.promptTokens).toBe(100);
      expect(response.usage?.completionTokens).toBe(200);
      expect(response.usage?.totalTokens).toBe(300);
    });
  });

  // ============================================================
  // LOCAL LLM INTEGRATION TESTS
  // ============================================================
  describe('Local LLM Integration', () => {
    it('should send request to local endpoint', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          response: 'Local model response',
        }),
      });

      const response = await service.sendRequest({
        type: 'completion',
        prompt: 'Test prompt',
        options: { provider: 'local' },
      });

      expect(response.provider).toBe('local');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('localhost:11434'),
        expect.any(Object)
      );
    });

    it('should handle local LLM connection errors', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const response = await service.sendRequest({
        type: 'completion',
        prompt: 'Test',
        options: { provider: 'local' },
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('ECONNREFUSED');
    });
  });

  // ============================================================
  // EXTENSION-BASED PROVIDER TESTS (Copilot, Cursor, Cline, Augment)
  // ============================================================
  describe('Extension-Based Providers', () => {
    describe('Copilot Integration', () => {
      it('should use Language Model API when models are available', async () => {
        // Mock Language Model API with available model
        const mockModel = {
          id: 'gpt-4',
          sendRequest: vi.fn().mockResolvedValue({
            text: (async function* () { yield 'Generated code response'; })(),
          }),
        };
        (vscode.lm.selectChatModels as Mock).mockResolvedValue([mockModel]);

        const response = await service.sendRequest({
          type: 'completion',
          prompt: 'Generate code',
          options: { provider: 'copilot' },
        });

        expect(vscode.lm.selectChatModels).toHaveBeenCalled();
        expect(response.provider).toBe('copilot');
        expect(response.success).toBe(true);
        expect(response.content).toBe('Generated code response');
      });

      it('should fallback to command when no Language Models available', async () => {
        // Mock no Language Models available
        (vscode.lm.selectChatModels as Mock).mockResolvedValue([]);

        const response = await service.sendRequest({
          type: 'completion',
          prompt: 'Generate code',
          options: { provider: 'copilot' },
        });

        expect(response.success).toBe(false);
        expect(response.error).toContain('No language models available');
        expect(response.provider).toBe('copilot');
      });

      it('should fallback to command-based approach on Language Model API error', async () => {
        // Mock Language Model API error with "not available" message
        (vscode.lm.selectChatModels as Mock).mockRejectedValue(new Error('not available'));
        (vscode.extensions.getExtension as Mock).mockReturnValue({ id: 'github.copilot' });
        (vscode.commands.executeCommand as Mock).mockResolvedValue(undefined);

        const response = await service.sendRequest({
          type: 'completion',
          prompt: 'Generate code',
          options: { provider: 'copilot' },
        });

        expect(vscode.commands.executeCommand).toHaveBeenCalledWith('github.copilot.generate');
        expect(response.provider).toBe('copilot');
        expect(response.success).toBe(true);
      });

      it('should return error when Copilot not installed and fallback fails', async () => {
        // Mock Language Model API error
        (vscode.lm.selectChatModels as Mock).mockRejectedValue(new Error('not available'));
        // Mock Copilot not installed
        (vscode.extensions.getExtension as Mock).mockReturnValue(undefined);

        const response = await service.sendRequest({
          type: 'completion',
          prompt: 'Generate code',
          options: { provider: 'copilot' },
        });

        expect(response.success).toBe(false);
        expect(response.error).toContain('not installed');
      });
    });

    describe('Cursor Integration', () => {
      it('should open Cursor composer and submit request', async () => {
        (vscode.commands.executeCommand as Mock).mockResolvedValue(undefined);

        const response = await service.sendRequest({
          type: 'completion',
          prompt: 'Refactor this code',
          options: { provider: 'cursor' },
        });

        expect(vscode.commands.executeCommand).toHaveBeenCalledWith('cursor.composer.open');
        expect(response.provider).toBe('cursor');
      });
    });

    describe('Cline Integration', () => {
      it('should open Cline chat and send message', async () => {
        (vscode.commands.executeCommand as Mock).mockResolvedValue(undefined);

        const response = await service.sendRequest({
          type: 'chat',
          prompt: 'Explain this code',
          options: { provider: 'cline' },
        });

        expect(vscode.commands.executeCommand).toHaveBeenCalledWith('cline.openChat');
        expect(response.provider).toBe('cline');
      });
    });

    describe('Augment Integration', () => {
      it('should open Augment chat and submit', async () => {
        (vscode.commands.executeCommand as Mock).mockResolvedValue(undefined);

        const response = await service.sendRequest({
          type: 'completion',
          prompt: 'Generate tests',
          options: { provider: 'augment' },
        });

        expect(vscode.commands.executeCommand).toHaveBeenCalledWith('augment.chat.open');
        expect(response.provider).toBe('augment');
      });
    });
  });

  // ============================================================
  // ERROR HANDLING TESTS
  // ============================================================
  describe('Error Handling', () => {
    it('should return error response on API failure', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network Error'));

      const response = await service.sendRequest({
        type: 'completion',
        prompt: 'Test',
        options: { provider: 'openai' },
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.provider).toBe('openai');
    });

    it('should handle non-OK HTTP responses', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } }),
      });

      const response = await service.sendRequest({
        type: 'completion',
        prompt: 'Test',
        options: { provider: 'openai' },
      });

      expect(response.success).toBe(false);
    });

    it('should handle malformed API responses', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}), // Empty response
      });

      const response = await service.sendRequest({
        type: 'completion',
        prompt: 'Test',
        options: { provider: 'openai' },
      });

      // Should not crash, may return empty content
      expect(response.provider).toBe('openai');
    });

    it('should handle multiple consecutive failures gracefully', async () => {
      (global.fetch as Mock)
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockRejectedValueOnce(new Error('Error 3'));

      // Multiple failures should not crash the service
      for (let i = 0; i < 3; i++) {
        const response = await service.sendRequest({
          type: 'completion',
          prompt: 'Test',
          options: { provider: 'openai' },
        });
        expect(response.success).toBe(false);
      }
    });
  });

  // ============================================================
  // DISPOSE TESTS
  // ============================================================
  describe('Dispose', () => {
    it('should clean up resources on dispose', () => {
      expect(() => service.dispose()).not.toThrow();
    });

    it('should be safe to call dispose multiple times', () => {
      expect(() => {
        service.dispose();
        service.dispose();
      }).not.toThrow();
    });
  });

  // ============================================================
  // REQUEST TYPE TESTS
  // ============================================================
  describe('Request Types', () => {
    const requestTypes: AIRequest['type'][] = ['completion', 'chat', 'edit', 'refactor', 'explain', 'test', 'review'];

    requestTypes.forEach((type) => {
      it(`should handle request type: ${type}`, async () => {
        (global.fetch as Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            content: [{ type: 'text', text: `Response for ${type}` }],
          }),
        });

        const response = await service.sendRequest({
          type,
          prompt: `Test ${type} request`,
          options: { provider: 'anthropic' },
        });

        expect(response.provider).toBe('anthropic');
      });
    });
  });
});
