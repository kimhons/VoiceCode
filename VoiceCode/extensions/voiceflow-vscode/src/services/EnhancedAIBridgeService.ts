/**
 * Enhanced AI Bridge Service
 * Unified interface for 8 AI service providers with deep integration
 * Supports: Copilot, Cursor, Cline, Aider, Augment, Anthropic, OpenAI, Local LLM
 */

import * as vscode from 'vscode';
import { MCPIntegrationService } from './MCPIntegrationService';

// AI Provider Types
export type AIProviderType = 'copilot' | 'cursor' | 'cline' | 'aider' | 'augment' | 'anthropic' | 'openai' | 'local';

// AI Request Interface
export interface AIRequest {
  type: 'completion' | 'chat' | 'edit' | 'refactor' | 'explain' | 'test' | 'review';
  prompt: string;
  context?: AIContext;
  options?: AIRequestOptions;
}

export interface AIContext {
  code?: string;
  language?: string;
  filePath?: string;
  selection?: { start: number; end: number };
}

export interface AIRequestOptions {
  provider?: AIProviderType;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: boolean;
}

// AI Tool Call Interface
export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

// AI Response Interface
export interface AIResponse {
  success: boolean;
  content?: string;
  code?: string;  // Generated code (if applicable)
  error?: string;
  provider: AIProviderType;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls?: AIToolCall[];
}

// Provider Status Interface
export interface ProviderStatus {
  provider: AIProviderType;
  available: boolean;
  configured: boolean;
  error?: string;
}

/**
 * Enhanced AI Bridge Service
 * Provides unified access to multiple AI providers with deep response capture
 */
export class EnhancedAIBridgeService {
  private config: vscode.WorkspaceConfiguration;
  private mcpService: MCPIntegrationService;
  private providerStatus: Map<AIProviderType, ProviderStatus> = new Map();
  private preferredProvider: AIProviderType = 'copilot';

  // Event emitters
  private readonly _onProviderChanged = new vscode.EventEmitter<AIProviderType>();
  private readonly _onRequestStarted = new vscode.EventEmitter<AIRequest>();
  private readonly _onRequestCompleted = new vscode.EventEmitter<AIResponse>();
  private readonly _onStreamChunk = new vscode.EventEmitter<{ chunk: string; provider: AIProviderType }>();

  // Public event accessors
  public readonly onProviderChanged = this._onProviderChanged.event;
  public readonly onRequestStarted = this._onRequestStarted.event;
  public readonly onRequestCompleted = this._onRequestCompleted.event;
  public readonly onStreamChunk = this._onStreamChunk.event;

  constructor(config?: vscode.WorkspaceConfiguration, mcpService?: MCPIntegrationService) {
    this.config = config || vscode.workspace.getConfiguration('voiceflow');
    this.mcpService = mcpService || new MCPIntegrationService(this.config);
    this.detectAvailableProviders();
  }

  /**
   * Detect which AI providers are available
   */
  private detectAvailableProviders(): void {
    const providers: AIProviderType[] = ['copilot', 'cursor', 'cline', 'aider', 'augment', 'anthropic', 'openai', 'local'];

    for (const provider of providers) {
      const status: ProviderStatus = {
        provider,
        available: false,
        configured: false,
      };

      switch (provider) {
        case 'copilot':
          status.available = !!vscode.extensions.getExtension('github.copilot');
          status.configured = status.available;
          break;
        case 'cursor':
          status.available = !!vscode.extensions.getExtension('cursor.cursor');
          status.configured = status.available;
          break;
        case 'cline':
          status.available = !!vscode.extensions.getExtension('saoudrizwan.claude-dev');
          status.configured = status.available;
          break;
        case 'augment':
          status.available = !!vscode.extensions.getExtension('augment.augment-vscode');
          status.configured = status.available;
          break;
        case 'aider':
          status.available = true; // CLI tool, always "available"
          status.configured = true;
          break;
        case 'anthropic':
          status.available = true;
          status.configured = !!this.config.get<string>('anthropicApiKey');
          break;
        case 'openai':
          status.available = true;
          status.configured = !!this.config.get<string>('openaiApiKey');
          break;
        case 'local':
          status.available = !!this.config.get<string>('localLLMEndpoint');
          status.configured = status.available;
          break;
      }

      this.providerStatus.set(provider, status);
    }
  }

  /**
   * Send request to the appropriate provider
   */
  public async sendRequest(request: AIRequest): Promise<AIResponse> {
    const provider = request.options?.provider || this.preferredProvider;
    this._onRequestStarted.fire(request);

    let response: AIResponse;

    switch (provider) {
      case 'copilot':
        response = await this.sendToCopilot(request);
        break;
      case 'cursor':
        response = await this.sendToCursor(request);
        break;
      case 'cline':
        response = await this.sendToCline(request);
        break;
      case 'aider':
        response = await this.sendToAider(request);
        break;
      case 'augment':
        response = await this.sendToAugment(request);
        break;
      case 'anthropic':
        response = await this.sendToAnthropic(request);
        break;
      case 'openai':
        response = await this.sendToOpenAI(request);
        break;
      case 'local':
        response = await this.sendToLocal(request);
        break;
      default:
        response = { success: false, error: `Unknown provider: ${provider}`, provider };
    }

    this._onRequestCompleted.fire(response);
    return response;
  }

  /**
   * Send request to GitHub Copilot
   * Uses VS Code Language Model API for full response capture
   */
  private async sendToCopilot(request: AIRequest): Promise<AIResponse> {
    // Try Language Model API first (captures actual responses)
    return this.sendViaLanguageModelAPI(request, 'gpt-4');
  }

  /**
   * Send request to Cursor
   */
  private async sendToCursor(request: AIRequest): Promise<AIResponse> {
    try {
      // Use Cursor's composer API
      await vscode.commands.executeCommand('cursor.composer.open');
      await this.delay(300);

      // Send the prompt to Cursor
      await vscode.commands.executeCommand('cursor.composer.submit', {
        message: this.formatPromptForProvider(request, 'cursor'),
      });

      return {
        success: true,
        content: 'Request sent to Cursor',
        provider: 'cursor',
      };
    } catch (error) {
      return {
        success: false,
        error: `Cursor error: ${error}`,
        provider: 'cursor',
      };
    }
  }

  /**
   * Send request to Cline (Claude Dev)
   */
  private async sendToCline(request: AIRequest): Promise<AIResponse> {
    try {
      // Use Cline's chat API
      await vscode.commands.executeCommand('cline.openChat');
      await this.delay(300);

      await vscode.commands.executeCommand('cline.sendMessage', {
        message: this.formatPromptForProvider(request, 'cline'),
      });

      return {
        success: true,
        content: 'Request sent to Cline',
        provider: 'cline',
      };
    } catch (error) {
      return {
        success: false,
        error: `Cline error: ${error}`,
        provider: 'cline',
      };
    }
  }

  /**
   * Send request to Augment
   */
  private async sendToAugment(request: AIRequest): Promise<AIResponse> {
    try {
      await vscode.commands.executeCommand('augment.chat.open');
      await this.delay(300);

      await vscode.commands.executeCommand('augment.chat.submit', {
        message: this.formatPromptForProvider(request, 'augment'),
      });

      return {
        success: true,
        content: 'Request sent to Augment',
        provider: 'augment',
      };
    } catch (error) {
      return {
        success: false,
        error: `Augment error: ${error}`,
        provider: 'augment',
      };
    }
  }

  /**
   * Send request to Anthropic Claude API
   */
  private async sendToAnthropic(request: AIRequest): Promise<AIResponse> {
    const apiKey = this.config.get<string>('anthropicApiKey');
    if (!apiKey) {
      return { success: false, error: 'Anthropic API key not configured', provider: 'anthropic' };
    }

    const model = request.options?.model || this.config.get<string>('anthropicModel', 'claude-3-5-sonnet-20241022');
    const maxTokens = request.options?.maxTokens || this.config.get<number>('maxTokens', 4096);

    try {
      const messages = this.buildAnthropicMessages(request);
      const tools = request.options?.tools ? this.mcpService.exportToolsAsAnthropicTools() : undefined;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages,
          tools,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Anthropic API error: ${errorText}`, provider: 'anthropic' };
      }

      const data = await response.json() as any;
      return this.parseAnthropicResponse(data, request);
    } catch (error) {
      return {
        success: false,
        error: `Anthropic error: ${error}`,
        provider: 'anthropic',
      };
    }
  }

  /**
   * Send request to OpenAI API
   */
  private async sendToOpenAI(request: AIRequest): Promise<AIResponse> {
    const apiKey = this.config.get<string>('openaiApiKey');
    if (!apiKey) {
      return { success: false, error: 'OpenAI API key not configured', provider: 'openai' };
    }

    const model = request.options?.model || this.config.get<string>('openaiModel', 'gpt-4-turbo-preview');
    const maxTokens = request.options?.maxTokens || this.config.get<number>('maxTokens', 4096);

    try {
      const messages = this.buildOpenAIMessages(request);
      const tools = request.options?.tools ? this.mcpService.exportToolsAsOpenAIFunctions() : undefined;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages,
          tools,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `OpenAI API error: ${errorText}`, provider: 'openai' };
      }

      const data = await response.json() as any;
      return this.parseOpenAIResponse(data);
    } catch (error) {
      return {
        success: false,
        error: `OpenAI error: ${error}`,
        provider: 'openai',
      };
    }
  }

  /**
   * Send request to Aider CLI
   */
  private async sendToAider(request: AIRequest): Promise<AIResponse> {
    try {
      const terminal = vscode.window.createTerminal({
        name: 'Aider',
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      });

      const prompt = this.formatPromptForProvider(request, 'aider');
      terminal.show();
      terminal.sendText(`aider --message "${prompt.replace(/"/g, '\\"')}"`);

      return {
        success: true,
        content: 'Request sent to Aider',
        provider: 'aider',
      };
    } catch (error) {
      return {
        success: false,
        error: `Aider error: ${error}`,
        provider: 'aider',
      };
    }
  }

  /**
   * Send request to local LLM
   */
  private async sendToLocal(request: AIRequest): Promise<AIResponse> {
    const endpoint = this.config.get<string>('localLLMEndpoint');
    if (!endpoint) {
      return { success: false, error: 'Local LLM endpoint not configured', provider: 'local' };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: this.formatPromptForProvider(request, 'local'),
          max_tokens: request.options?.maxTokens || 4096,
          temperature: request.options?.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        return { success: false, error: 'Local LLM request failed', provider: 'local' };
      }

      const data = await response.json() as any;
      return {
        success: true,
        content: data.response || data.text || data.content,
        provider: 'local',
      };
    } catch (error) {
      return {
        success: false,
        error: `Local LLM error: ${error}`,
        provider: 'local',
      };
    }
  }

  /**
   * Send request using VS Code Language Model API (works with Copilot, etc.)
   * This captures actual responses from the model
   */
  private async sendViaLanguageModelAPI(request: AIRequest, preferredModelFamily?: string): Promise<AIResponse> {
    try {
      // Get available language models
      const models = await vscode.lm.selectChatModels({
        family: preferredModelFamily, // e.g., 'gpt-4', 'claude'
      });

      if (models.length === 0) {
        return {
          success: false,
          error: 'No language models available via VS Code Language Model API',
          provider: 'copilot',
        };
      }

      const model = models[0];
      const messages = [
        vscode.LanguageModelChatMessage.User(this.formatPromptForProvider(request, 'copilot')),
      ];

      // Add context if available
      if (request.context?.code) {
        messages.unshift(
          vscode.LanguageModelChatMessage.User(
            `Context - Working with ${request.context.language || 'code'} in file: ${request.context.filePath || 'unknown'}`
          )
        );
      }

      // Send request and collect response
      const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);

      // Collect streamed response
      let fullContent = '';
      for await (const chunk of response.text) {
        fullContent += chunk;
        this._onStreamChunk.fire({ chunk, provider: 'copilot' });
      }

      return {
        success: true,
        content: fullContent,
        provider: 'copilot',
        model: model.id,
      };
    } catch (error) {
      // If Language Model API is not available, fall back to command-based approach
      if (error instanceof Error && error.message.includes('not available')) {
        console.log('[EnhancedAIBridge] Language Model API not available, falling back to command-based approach');
        return this.sendToCopilotViaCommand(request);
      }
      return {
        success: false,
        error: `Language Model API error: ${error}`,
        provider: 'copilot',
      };
    }
  }

  /**
   * Fallback: Send to Copilot via command (no response capture)
   */
  private async sendToCopilotViaCommand(request: AIRequest): Promise<AIResponse> {
    try {
      const copilotExtension = vscode.extensions.getExtension('github.copilot');
      if (!copilotExtension) {
        return { success: false, error: 'Copilot not installed', provider: 'copilot' };
      }

      await vscode.commands.executeCommand('github.copilot.generate');

      return {
        success: true,
        content: 'Copilot suggestion triggered (response not captured - use Language Model API for full integration)',
        provider: 'copilot',
      };
    } catch (error) {
      return {
        success: false,
        error: `Copilot error: ${error}`,
        provider: 'copilot',
      };
    }
  }


  /**
   * Format prompt for specific provider
   */
  private formatPromptForProvider(request: AIRequest, provider: AIProviderType): string {
    let prompt = request.prompt;

    if (request.context?.code) {
      prompt += `\n\nCode:\n\`\`\`${request.context.language || ''}\n${request.context.code}\n\`\`\``;
    }

    if (request.context?.filePath) {
      prompt += `\n\nFile: ${request.context.filePath}`;
    }

    return prompt;
  }

  /**
   * Build Anthropic messages array
   */
  private buildAnthropicMessages(request: AIRequest): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // Add system context
    if (request.context) {
      let systemContent = 'You are an expert coding assistant.';
      if (request.context.language) {
        systemContent += ` The user is working with ${request.context.language}.`;
      }
      messages.push({ role: 'user', content: systemContent });
      messages.push({ role: 'assistant', content: 'I understand. I\'m ready to help with your code.' });
    }

    // Add the main request
    messages.push({ role: 'user', content: this.formatPromptForProvider(request, 'anthropic') });

    return messages;
  }

  /**
   * Build OpenAI messages array
   */
  private buildOpenAIMessages(request: AIRequest): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // Add system message
    let systemContent = 'You are an expert coding assistant.';
    if (request.context?.language) {
      systemContent += ` The user is working with ${request.context.language}.`;
    }
    messages.push({ role: 'system', content: systemContent });

    // Add the main request
    messages.push({ role: 'user', content: this.formatPromptForProvider(request, 'openai') });

    return messages;
  }

  /**
   * Parse Anthropic API response
   */
  private async parseAnthropicResponse(data: any, request: AIRequest): Promise<AIResponse> {
    const content = data.content?.[0];

    if (content?.type === 'tool_use') {
      // Handle tool calls
      const toolResult = await this.mcpService.executeTool(content.name, content.input);
      return {
        success: true,
        content: `Tool ${content.name} executed`,
        toolCalls: [{
          id: content.id,
          name: content.name,
          arguments: content.input,
          result: toolResult,
        }],
        provider: 'anthropic',
        model: data.model,
        usage: {
          promptTokens: data.usage?.input_tokens || 0,
          completionTokens: data.usage?.output_tokens || 0,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      };
    }

    return {
      success: true,
      content: content?.text || '',
      provider: 'anthropic',
      model: data.model,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }

  /**
   * Parse OpenAI API response
   */
  private parseOpenAIResponse(data: any): AIResponse {
    const choice = data.choices?.[0];
    const message = choice?.message;

    if (message?.tool_calls) {
      return {
        success: true,
        content: message.content || '',
        toolCalls: message.tool_calls.map((tc: any) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments || '{}'),
        })),
        provider: 'openai',
        model: data.model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    }

    return {
      success: true,
      content: message?.content || '',
      provider: 'openai',
      model: data.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  /**
   * Get all provider statuses
   */
  public getProviderStatuses(): ProviderStatus[] {
    return Array.from(this.providerStatus.values());
  }

  /**
   * Set preferred provider
   */
  public setPreferredProvider(provider: AIProviderType): void {
    this.preferredProvider = provider;
    this._onProviderChanged.fire(provider);
  }

  /**
   * Get preferred provider
   */
  public getPreferredProvider(): AIProviderType {
    return this.preferredProvider;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this._onProviderChanged.dispose();
    this._onRequestStarted.dispose();
    this._onRequestCompleted.dispose();
    this._onStreamChunk.dispose();
  }
}

export default EnhancedAIBridgeService;
