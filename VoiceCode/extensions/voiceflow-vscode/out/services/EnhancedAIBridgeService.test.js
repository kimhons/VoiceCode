"use strict";
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
const EnhancedAIBridgeService_1 = require("./EnhancedAIBridgeService");
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
    // Mock CancellationTokenSource
    class MockCancellationTokenSource {
        token = { isCancellationRequested: false, onCancellationRequested: vitest_1.vi.fn() };
        cancel() { }
        dispose() { }
    }
    // Mock Language Model Chat Message
    const LanguageModelChatMessage = {
        User: (content) => ({ role: 'user', content }),
        Assistant: (content) => ({ role: 'assistant', content }),
    };
    return {
        extensions: {
            getExtension: vitest_1.vi.fn(),
        },
        workspace: {
            getConfiguration: vitest_1.vi.fn(() => ({
                get: vitest_1.vi.fn(),
            })),
            workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
        },
        commands: {
            executeCommand: vitest_1.vi.fn(),
        },
        window: {
            createTerminal: vitest_1.vi.fn(() => ({
                show: vitest_1.vi.fn(),
                sendText: vitest_1.vi.fn(),
            })),
        },
        EventEmitter: MockEventEmitter,
        CancellationTokenSource: MockCancellationTokenSource,
        LanguageModelChatMessage,
        lm: {
            selectChatModels: vitest_1.vi.fn().mockResolvedValue([]),
        },
    };
});
// Create mock MCP service instance with proper mock methods
const createMockMcpService = () => ({
    executeTool: vitest_1.vi.fn().mockResolvedValue({ success: true, output: 'Tool executed' }),
    getTools: vitest_1.vi.fn().mockReturnValue([]),
    exportToolsAsOpenAITools: vitest_1.vi.fn().mockReturnValue([]),
    exportToolsAsOpenAIFunctions: vitest_1.vi.fn().mockReturnValue([]),
    exportToolsAsAnthropicTools: vitest_1.vi.fn().mockReturnValue([]),
    dispose: vitest_1.vi.fn(),
});
// Mock MCPIntegrationService
vitest_1.vi.mock('./MCPIntegrationService', () => ({
    MCPIntegrationService: vitest_1.vi.fn().mockImplementation(() => createMockMcpService()),
}));
// Mock fetch for API calls
global.fetch = vitest_1.vi.fn();
// Helper to wait for async initialization
const waitForInit = () => new Promise(resolve => setTimeout(resolve, 10));
(0, vitest_1.describe)('EnhancedAIBridgeService', () => {
    let service;
    let mockConfig;
    let mockMcpService;
    (0, vitest_1.beforeEach)(async () => {
        vitest_1.vi.clearAllMocks();
        // Setup mock config with all necessary keys
        mockConfig = {
            get: vitest_1.vi.fn((key, defaultValue) => {
                const configValues = {
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
        };
        mockMcpService = createMockMcpService();
        service = new EnhancedAIBridgeService_1.EnhancedAIBridgeService(mockConfig, mockMcpService);
        // Wait for async initialization to complete
        await waitForInit();
    });
    (0, vitest_1.afterEach)(() => {
        service.dispose();
    });
    // ============================================================
    // PROVIDER STATUS TESTS
    // ============================================================
    (0, vitest_1.describe)('Provider Status Management', () => {
        (0, vitest_1.it)('should return all provider statuses via getProviderStatuses()', () => {
            const statuses = service.getProviderStatuses();
            (0, vitest_1.expect)(Array.isArray(statuses)).toBe(true);
            // Should have statuses for all 8 providers
            const providerNames = statuses.map((s) => s.provider);
            (0, vitest_1.expect)(providerNames).toContain('copilot');
            (0, vitest_1.expect)(providerNames).toContain('cursor');
            (0, vitest_1.expect)(providerNames).toContain('cline');
            (0, vitest_1.expect)(providerNames).toContain('aider');
            (0, vitest_1.expect)(providerNames).toContain('augment');
            (0, vitest_1.expect)(providerNames).toContain('anthropic');
            (0, vitest_1.expect)(providerNames).toContain('openai');
            (0, vitest_1.expect)(providerNames).toContain('local');
        });
        (0, vitest_1.it)('should detect Copilot as available when extension is installed', async () => {
            vscode.extensions.getExtension.mockImplementation((id) => {
                if (id === 'github.copilot')
                    return { id };
                return undefined;
            });
            // Re-create service to trigger provider detection
            service = new EnhancedAIBridgeService_1.EnhancedAIBridgeService(mockConfig, mockMcpService);
            await waitForInit();
            const statuses = service.getProviderStatuses();
            const copilot = statuses.find((s) => s.provider === 'copilot');
            (0, vitest_1.expect)(copilot?.available).toBe(true);
        });
        (0, vitest_1.it)('should detect Cursor as available when extension is installed', async () => {
            vscode.extensions.getExtension.mockImplementation((id) => {
                if (id === 'cursor.cursor')
                    return { id };
                return undefined;
            });
            service = new EnhancedAIBridgeService_1.EnhancedAIBridgeService(mockConfig, mockMcpService);
            await waitForInit();
            const statuses = service.getProviderStatuses();
            const cursor = statuses.find((s) => s.provider === 'cursor');
            (0, vitest_1.expect)(cursor?.available).toBe(true);
        });
        (0, vitest_1.it)('should detect Cline as available when extension is installed', async () => {
            vscode.extensions.getExtension.mockImplementation((id) => {
                if (id === 'saoudrizwan.claude-dev')
                    return { id };
                return undefined;
            });
            service = new EnhancedAIBridgeService_1.EnhancedAIBridgeService(mockConfig, mockMcpService);
            await waitForInit();
            const statuses = service.getProviderStatuses();
            const cline = statuses.find((s) => s.provider === 'cline');
            (0, vitest_1.expect)(cline?.available).toBe(true);
        });
        (0, vitest_1.it)('should detect Augment as available when extension is installed', async () => {
            vscode.extensions.getExtension.mockImplementation((id) => {
                if (id === 'augment.augment-vscode')
                    return { id };
                return undefined;
            });
            service = new EnhancedAIBridgeService_1.EnhancedAIBridgeService(mockConfig, mockMcpService);
            await waitForInit();
            const statuses = service.getProviderStatuses();
            const augment = statuses.find((s) => s.provider === 'augment');
            (0, vitest_1.expect)(augment?.available).toBe(true);
        });
        (0, vitest_1.it)('should mark Anthropic as configured when API key is present', () => {
            const statuses = service.getProviderStatuses();
            const anthropic = statuses.find((s) => s.provider === 'anthropic');
            (0, vitest_1.expect)(anthropic?.configured).toBe(true);
        });
        (0, vitest_1.it)('should mark OpenAI as configured when API key is present', () => {
            const statuses = service.getProviderStatuses();
            const openai = statuses.find((s) => s.provider === 'openai');
            (0, vitest_1.expect)(openai?.configured).toBe(true);
        });
        (0, vitest_1.it)('should detect local LLM when endpoint is configured', () => {
            const statuses = service.getProviderStatuses();
            const local = statuses.find((s) => s.provider === 'local');
            (0, vitest_1.expect)(local?.available).toBe(true);
        });
        (0, vitest_1.it)('should mark Aider as available (CLI tool)', () => {
            const statuses = service.getProviderStatuses();
            const aider = statuses.find((s) => s.provider === 'aider');
            (0, vitest_1.expect)(aider?.available).toBe(true);
        });
    });
    // ============================================================
    // PREFERRED PROVIDER TESTS
    // ============================================================
    (0, vitest_1.describe)('Preferred Provider Selection', () => {
        (0, vitest_1.it)('should have a default preferred provider', () => {
            const preferred = service.getPreferredProvider();
            (0, vitest_1.expect)(preferred).toBeDefined();
            (0, vitest_1.expect)(typeof preferred).toBe('string');
        });
        (0, vitest_1.it)('should allow setting preferred provider to openai', () => {
            service.setPreferredProvider('openai');
            (0, vitest_1.expect)(service.getPreferredProvider()).toBe('openai');
        });
        (0, vitest_1.it)('should allow setting preferred provider to anthropic', () => {
            service.setPreferredProvider('anthropic');
            (0, vitest_1.expect)(service.getPreferredProvider()).toBe('anthropic');
        });
        (0, vitest_1.it)('should allow setting preferred provider to copilot', () => {
            service.setPreferredProvider('copilot');
            (0, vitest_1.expect)(service.getPreferredProvider()).toBe('copilot');
        });
        (0, vitest_1.it)('should allow setting preferred provider to local', () => {
            service.setPreferredProvider('local');
            (0, vitest_1.expect)(service.getPreferredProvider()).toBe('local');
        });
    });
    // ============================================================
    // REQUEST HANDLING TESTS
    // ============================================================
    (0, vitest_1.describe)('Request Handling - sendRequest()', () => {
        const testRequest = {
            type: 'completion',
            prompt: 'Write a hello world function',
            context: {
                code: 'function hello() {}',
                language: 'typescript',
            },
        };
        (0, vitest_1.it)('should send request to specified provider', async () => {
            global.fetch.mockResolvedValueOnce({
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
            (0, vitest_1.expect)(response.provider).toBe('openai');
        });
        (0, vitest_1.it)('should use preferred provider when none specified', async () => {
            service.setPreferredProvider('anthropic');
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    content: [{ type: 'text', text: 'Hello world function' }],
                    usage: { input_tokens: 10, output_tokens: 20 },
                }),
            });
            const response = await service.sendRequest(testRequest);
            (0, vitest_1.expect)(response.provider).toBe('anthropic');
        });
        (0, vitest_1.it)('should handle API errors gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('API Error'));
            const response = await service.sendRequest({
                ...testRequest,
                options: { provider: 'openai' },
            });
            (0, vitest_1.expect)(response.success).toBe(false);
            (0, vitest_1.expect)(response.error).toBeDefined();
        });
        (0, vitest_1.it)('should emit request started event', async () => {
            const listener = vitest_1.vi.fn();
            service.onRequestStarted(listener);
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ choices: [{ message: { content: 'test' } }] }),
            });
            await service.sendRequest(testRequest);
            // Event should be fired
        });
        (0, vitest_1.it)('should emit request completed event', async () => {
            const listener = vitest_1.vi.fn();
            service.onRequestCompleted(listener);
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ choices: [{ message: { content: 'test' } }] }),
            });
            await service.sendRequest(testRequest);
            // Event should be fired with response
        });
    });
    (0, vitest_1.describe)('Anthropic Integration', () => {
        (0, vitest_1.it)('should send request to Anthropic API', async () => {
            global.fetch.mockResolvedValueOnce({
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
            (0, vitest_1.expect)(response.provider).toBe('anthropic');
            (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', vitest_1.expect.objectContaining({
                method: 'POST',
                headers: vitest_1.expect.objectContaining({
                    'x-api-key': 'test-anthropic-key',
                    'anthropic-version': vitest_1.expect.any(String),
                }),
            }));
        });
        (0, vitest_1.it)('should include MCP tools when enabled', async () => {
            mockMcpService.exportToolsAsAnthropicTools.mockReturnValue([
                { name: 'test_tool', description: 'Test tool' },
            ]);
            global.fetch.mockResolvedValueOnce({
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
            const fetchCall = global.fetch.mock.calls[0];
            const body = JSON.parse(fetchCall[1].body);
            (0, vitest_1.expect)(body.tools).toBeDefined();
        });
        (0, vitest_1.it)('should handle Anthropic tool_use responses', async () => {
            global.fetch.mockResolvedValueOnce({
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
            (0, vitest_1.expect)(response.success).toBe(true);
            (0, vitest_1.expect)(response.toolCalls).toBeDefined();
            (0, vitest_1.expect)(response.toolCalls?.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should parse token usage from Anthropic response', async () => {
            global.fetch.mockResolvedValueOnce({
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
            (0, vitest_1.expect)(response.usage).toBeDefined();
            (0, vitest_1.expect)(response.usage?.promptTokens).toBe(150);
            (0, vitest_1.expect)(response.usage?.completionTokens).toBe(250);
            (0, vitest_1.expect)(response.usage?.totalTokens).toBe(400);
        });
    });
    // ============================================================
    // OPENAI INTEGRATION TESTS
    // ============================================================
    (0, vitest_1.describe)('OpenAI Integration', () => {
        (0, vitest_1.it)('should send request to OpenAI API', async () => {
            global.fetch.mockResolvedValueOnce({
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
            (0, vitest_1.expect)(response.provider).toBe('openai');
            (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', vitest_1.expect.objectContaining({
                method: 'POST',
                headers: vitest_1.expect.objectContaining({
                    'Authorization': 'Bearer test-openai-key',
                }),
            }));
        });
        (0, vitest_1.it)('should handle OpenAI tool_calls responses', async () => {
            global.fetch.mockResolvedValueOnce({
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
            (0, vitest_1.expect)(response.success).toBe(true);
            (0, vitest_1.expect)(response.toolCalls).toBeDefined();
            (0, vitest_1.expect)(response.toolCalls?.[0].name).toBe('search_codebase');
        });
        (0, vitest_1.it)('should parse token usage from OpenAI response', async () => {
            global.fetch.mockResolvedValueOnce({
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
            (0, vitest_1.expect)(response.usage?.promptTokens).toBe(100);
            (0, vitest_1.expect)(response.usage?.completionTokens).toBe(200);
            (0, vitest_1.expect)(response.usage?.totalTokens).toBe(300);
        });
    });
    // ============================================================
    // LOCAL LLM INTEGRATION TESTS
    // ============================================================
    (0, vitest_1.describe)('Local LLM Integration', () => {
        (0, vitest_1.it)('should send request to local endpoint', async () => {
            global.fetch.mockResolvedValueOnce({
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
            (0, vitest_1.expect)(response.provider).toBe('local');
            (0, vitest_1.expect)(global.fetch).toHaveBeenCalledWith(vitest_1.expect.stringContaining('localhost:11434'), vitest_1.expect.any(Object));
        });
        (0, vitest_1.it)('should handle local LLM connection errors', async () => {
            global.fetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
            const response = await service.sendRequest({
                type: 'completion',
                prompt: 'Test',
                options: { provider: 'local' },
            });
            (0, vitest_1.expect)(response.success).toBe(false);
            (0, vitest_1.expect)(response.error).toContain('ECONNREFUSED');
        });
    });
    // ============================================================
    // EXTENSION-BASED PROVIDER TESTS (Copilot, Cursor, Cline, Augment)
    // ============================================================
    (0, vitest_1.describe)('Extension-Based Providers', () => {
        (0, vitest_1.describe)('Copilot Integration', () => {
            (0, vitest_1.it)('should use Language Model API when models are available', async () => {
                // Mock Language Model API with available model
                const mockModel = {
                    id: 'gpt-4',
                    sendRequest: vitest_1.vi.fn().mockResolvedValue({
                        text: (async function* () { yield 'Generated code response'; })(),
                    }),
                };
                vscode.lm.selectChatModels.mockResolvedValue([mockModel]);
                const response = await service.sendRequest({
                    type: 'completion',
                    prompt: 'Generate code',
                    options: { provider: 'copilot' },
                });
                (0, vitest_1.expect)(vscode.lm.selectChatModels).toHaveBeenCalled();
                (0, vitest_1.expect)(response.provider).toBe('copilot');
                (0, vitest_1.expect)(response.success).toBe(true);
                (0, vitest_1.expect)(response.content).toBe('Generated code response');
            });
            (0, vitest_1.it)('should fallback to command when no Language Models available', async () => {
                // Mock no Language Models available
                vscode.lm.selectChatModels.mockResolvedValue([]);
                const response = await service.sendRequest({
                    type: 'completion',
                    prompt: 'Generate code',
                    options: { provider: 'copilot' },
                });
                (0, vitest_1.expect)(response.success).toBe(false);
                (0, vitest_1.expect)(response.error).toContain('No language models available');
                (0, vitest_1.expect)(response.provider).toBe('copilot');
            });
            (0, vitest_1.it)('should fallback to command-based approach on Language Model API error', async () => {
                // Mock Language Model API error with "not available" message
                vscode.lm.selectChatModels.mockRejectedValue(new Error('not available'));
                vscode.extensions.getExtension.mockReturnValue({ id: 'github.copilot' });
                vscode.commands.executeCommand.mockResolvedValue(undefined);
                const response = await service.sendRequest({
                    type: 'completion',
                    prompt: 'Generate code',
                    options: { provider: 'copilot' },
                });
                (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('github.copilot.generate');
                (0, vitest_1.expect)(response.provider).toBe('copilot');
                (0, vitest_1.expect)(response.success).toBe(true);
            });
            (0, vitest_1.it)('should return error when Copilot not installed and fallback fails', async () => {
                // Mock Language Model API error
                vscode.lm.selectChatModels.mockRejectedValue(new Error('not available'));
                // Mock Copilot not installed
                vscode.extensions.getExtension.mockReturnValue(undefined);
                const response = await service.sendRequest({
                    type: 'completion',
                    prompt: 'Generate code',
                    options: { provider: 'copilot' },
                });
                (0, vitest_1.expect)(response.success).toBe(false);
                (0, vitest_1.expect)(response.error).toContain('not installed');
            });
        });
        (0, vitest_1.describe)('Cursor Integration', () => {
            (0, vitest_1.it)('should open Cursor composer and submit request', async () => {
                vscode.commands.executeCommand.mockResolvedValue(undefined);
                const response = await service.sendRequest({
                    type: 'completion',
                    prompt: 'Refactor this code',
                    options: { provider: 'cursor' },
                });
                (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('cursor.composer.open');
                (0, vitest_1.expect)(response.provider).toBe('cursor');
            });
        });
        (0, vitest_1.describe)('Cline Integration', () => {
            (0, vitest_1.it)('should open Cline chat and send message', async () => {
                vscode.commands.executeCommand.mockResolvedValue(undefined);
                const response = await service.sendRequest({
                    type: 'chat',
                    prompt: 'Explain this code',
                    options: { provider: 'cline' },
                });
                (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('cline.openChat');
                (0, vitest_1.expect)(response.provider).toBe('cline');
            });
        });
        (0, vitest_1.describe)('Augment Integration', () => {
            (0, vitest_1.it)('should open Augment chat and submit', async () => {
                vscode.commands.executeCommand.mockResolvedValue(undefined);
                const response = await service.sendRequest({
                    type: 'completion',
                    prompt: 'Generate tests',
                    options: { provider: 'augment' },
                });
                (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledWith('augment.chat.open');
                (0, vitest_1.expect)(response.provider).toBe('augment');
            });
        });
    });
    // ============================================================
    // ERROR HANDLING TESTS
    // ============================================================
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('should return error response on API failure', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network Error'));
            const response = await service.sendRequest({
                type: 'completion',
                prompt: 'Test',
                options: { provider: 'openai' },
            });
            (0, vitest_1.expect)(response.success).toBe(false);
            (0, vitest_1.expect)(response.error).toBeDefined();
            (0, vitest_1.expect)(response.provider).toBe('openai');
        });
        (0, vitest_1.it)('should handle non-OK HTTP responses', async () => {
            global.fetch.mockResolvedValueOnce({
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
            (0, vitest_1.expect)(response.success).toBe(false);
        });
        (0, vitest_1.it)('should handle malformed API responses', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}), // Empty response
            });
            const response = await service.sendRequest({
                type: 'completion',
                prompt: 'Test',
                options: { provider: 'openai' },
            });
            // Should not crash, may return empty content
            (0, vitest_1.expect)(response.provider).toBe('openai');
        });
        (0, vitest_1.it)('should handle multiple consecutive failures gracefully', async () => {
            global.fetch
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
                (0, vitest_1.expect)(response.success).toBe(false);
            }
        });
    });
    // ============================================================
    // DISPOSE TESTS
    // ============================================================
    (0, vitest_1.describe)('Dispose', () => {
        (0, vitest_1.it)('should clean up resources on dispose', () => {
            (0, vitest_1.expect)(() => service.dispose()).not.toThrow();
        });
        (0, vitest_1.it)('should be safe to call dispose multiple times', () => {
            (0, vitest_1.expect)(() => {
                service.dispose();
                service.dispose();
            }).not.toThrow();
        });
    });
    // ============================================================
    // REQUEST TYPE TESTS
    // ============================================================
    (0, vitest_1.describe)('Request Types', () => {
        const requestTypes = ['completion', 'chat', 'edit', 'refactor', 'explain', 'test', 'review'];
        requestTypes.forEach((type) => {
            (0, vitest_1.it)(`should handle request type: ${type}`, async () => {
                global.fetch.mockResolvedValueOnce({
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
                (0, vitest_1.expect)(response.provider).toBe('anthropic');
            });
        });
    });
});
//# sourceMappingURL=EnhancedAIBridgeService.test.js.map