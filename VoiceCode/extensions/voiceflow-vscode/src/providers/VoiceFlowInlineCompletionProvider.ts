/**
 * VoiceFlow Inline Completion Provider
 * Provides ghost text suggestions like Copilot
 * Critical feature for Phase 2: Feature Parity
 */

import * as vscode from 'vscode';

/**
 * Completion suggestion with metadata
 */
export interface CompletionSuggestion {
  text: string;
  confidence: number;
  source: 'voice' | 'ai' | 'context';
  metadata?: Record<string, unknown>;
}

/**
 * Voice context for completions
 */
export interface VoiceContext {
  lastTranscript: string | null;
  timestamp: number;
  isActive: boolean;
}

/**
 * VoiceFlow Inline Completion Provider
 * Implements VS Code's InlineCompletionItemProvider for ghost text suggestions
 */
export class VoiceFlowInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
  private voiceContext: VoiceContext = {
    lastTranscript: null,
    timestamp: 0,
    isActive: false,
  };

  private config: vscode.WorkspaceConfiguration;
  private completionCache: Map<string, CompletionSuggestion[]> = new Map();
  private readonly cacheTimeout = 5000; // 5 seconds

  // Event emitters
  private readonly _onCompletionAccepted = new vscode.EventEmitter<CompletionSuggestion>();
  private readonly _onCompletionRejected = new vscode.EventEmitter<CompletionSuggestion>();
  
  public readonly onCompletionAccepted = this._onCompletionAccepted.event;
  public readonly onCompletionRejected = this._onCompletionRejected.event;

  constructor(config: vscode.WorkspaceConfiguration) {
    this.config = config;
  }

  /**
   * Update voice context from voice recognition
   */
  public updateVoiceContext(transcript: string): void {
    this.voiceContext = {
      lastTranscript: transcript,
      timestamp: Date.now(),
      isActive: true,
    };
  }

  /**
   * Clear voice context
   */
  public clearVoiceContext(): void {
    this.voiceContext = {
      lastTranscript: null,
      timestamp: 0,
      isActive: false,
    };
  }

  /**
   * Provide inline completion items
   */
  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionList | null> {
    // Check if inline completions are enabled
    if (!this.config.get<boolean>('inlineCompletions.enabled', true)) {
      return null;
    }

    // Check cancellation
    if (token.isCancellationRequested) {
      return null;
    }

    try {
      // Get suggestions based on context
      const suggestions = await this.getSuggestions(document, position, context);
      
      if (suggestions.length === 0) {
        return null;
      }

      // Convert to VS Code inline completion items
      const items: vscode.InlineCompletionItem[] = suggestions.map(suggestion => {
        return new vscode.InlineCompletionItem(
          suggestion.text,
          new vscode.Range(position, position),
          {
            title: 'Accept Completion',
            command: 'voiceflow.acceptInlineCompletion',
            arguments: [suggestion],
          }
        );
      });

      return { items };
    } catch (error) {
      console.error('Error providing inline completions:', error);
      return null;
    }
  }

  /**
   * Get suggestions based on context
   */
  private async getSuggestions(
    document: vscode.TextDocument,
    position: vscode.Position,
    _context: vscode.InlineCompletionContext
  ): Promise<CompletionSuggestion[]> {
    const suggestions: CompletionSuggestion[] = [];

    // Check cache first
    const cacheKey = this.getCacheKey(document, position);
    const cached = this.completionCache.get(cacheKey);
    if (cached && Date.now() - this.voiceContext.timestamp < this.cacheTimeout) {
      return cached;
    }

    // Get line context
    const line = document.lineAt(position.line);
    const prefix = line.text.substring(0, position.character);
    const suffix = line.text.substring(position.character);

    // Voice-triggered completion takes priority
    if (this.voiceContext.isActive && this.voiceContext.lastTranscript) {
      const voiceSuggestion = await this.getVoiceTriggeredSuggestion(
        document,
        position,
        this.voiceContext.lastTranscript
      );
      if (voiceSuggestion) {
        suggestions.push(voiceSuggestion);
      }
    }

    // Context-based suggestions
    const contextSuggestions = await this.getContextSuggestions(
      document,
      position,
      prefix,
      suffix
    );
    suggestions.push(...contextSuggestions);

    // Cache suggestions
    this.completionCache.set(cacheKey, suggestions);

    return suggestions;
  }

  /**
   * Get voice-triggered suggestion
   */
  private async getVoiceTriggeredSuggestion(
    document: vscode.TextDocument,
    _position: vscode.Position,
    transcript: string
  ): Promise<CompletionSuggestion | null> {
    // Parse voice command for code generation intent
    const codeIntent = this.parseCodeIntent(transcript);
    if (!codeIntent) {
      return null;
    }

    // Generate code based on voice intent
    const generatedCode = await this.generateCodeFromIntent(
      codeIntent,
      document.languageId,
      document.getText()
    );

    if (!generatedCode) {
      return null;
    }

    return {
      text: generatedCode,
      confidence: 0.9,
      source: 'voice',
      metadata: {
        transcript,
        intent: codeIntent,
      },
    };
  }

  /**
   * Get context-based suggestions
   */
  private async getContextSuggestions(
    document: vscode.TextDocument,
    _position: vscode.Position,
    prefix: string,
    _suffix: string
  ): Promise<CompletionSuggestion[]> {
    const suggestions: CompletionSuggestion[] = [];

    // Common code patterns
    const patterns = this.getCommonPatterns(document.languageId);

    for (const pattern of patterns) {
      if (prefix.trim().endsWith(pattern.trigger)) {
        suggestions.push({
          text: pattern.completion,
          confidence: pattern.confidence,
          source: 'context',
          metadata: { pattern: pattern.name },
        });
      }
    }

    return suggestions;
  }

  /**
   * Parse code generation intent from transcript
   */
  private parseCodeIntent(transcript: string): string | null {
    const lowerTranscript = transcript.toLowerCase();

    // Common code generation phrases
    const intentPatterns = [
      { pattern: /create (a |an )?function/i, intent: 'create_function' },
      { pattern: /add (a |an )?import/i, intent: 'add_import' },
      { pattern: /write (a |an )?(for |while )?loop/i, intent: 'create_loop' },
      { pattern: /create (a |an )?class/i, intent: 'create_class' },
      { pattern: /add (a |an )?try.?catch/i, intent: 'add_try_catch' },
      { pattern: /insert (a |an )?console.?log/i, intent: 'add_console_log' },
      { pattern: /create (a |an )?interface/i, intent: 'create_interface' },
      { pattern: /add (a |an )?comment/i, intent: 'add_comment' },
    ];

    for (const { pattern, intent } of intentPatterns) {
      if (pattern.test(lowerTranscript)) {
        return intent;
      }
    }

    return null;
  }

  /**
   * Generate code from intent
   */
  private async generateCodeFromIntent(
    intent: string,
    languageId: string,
    _documentContent: string
  ): Promise<string | null> {
    // Language-specific code templates
    const templates: Record<string, Record<string, string>> = {
      typescript: {
        create_function: 'function name(params: Type): ReturnType {\n  \n}',
        add_import: "import {  } from '';",
        create_loop: 'for (let i = 0; i < length; i++) {\n  \n}',
        create_class: 'class ClassName {\n  constructor() {\n    \n  }\n}',
        add_try_catch: 'try {\n  \n} catch (error) {\n  console.error(error);\n}',
        add_console_log: "console.log('');",
        create_interface: 'interface InterfaceName {\n  \n}',
        add_comment: '// ',
      },
      javascript: {
        create_function: 'function name(params) {\n  \n}',
        add_import: "import {  } from '';",
        create_loop: 'for (let i = 0; i < length; i++) {\n  \n}',
        create_class: 'class ClassName {\n  constructor() {\n    \n  }\n}',
        add_try_catch: 'try {\n  \n} catch (error) {\n  console.error(error);\n}',
        add_console_log: "console.log('');",
        add_comment: '// ',
      },
      python: {
        create_function: 'def name(params):\n    pass',
        add_import: 'import ',
        create_loop: 'for i in range(length):\n    pass',
        create_class: 'class ClassName:\n    def __init__(self):\n        pass',
        add_try_catch: 'try:\n    pass\nexcept Exception as e:\n    print(e)',
        add_console_log: "print('')",
        add_comment: '# ',
      },
    };

    const langTemplates = templates[languageId] || templates['typescript'];
    return langTemplates[intent] || null;
  }

  /**
   * Get common code patterns for a language
   */
  private getCommonPatterns(languageId: string): Array<{
    name: string;
    trigger: string;
    completion: string;
    confidence: number;
  }> {
    const patterns: Record<string, Array<{
      name: string;
      trigger: string;
      completion: string;
      confidence: number;
    }>> = {
      typescript: [
        { name: 'async_function', trigger: 'async', completion: ' function name(): Promise<void> {\n  \n}', confidence: 0.7 },
        { name: 'arrow_function', trigger: '=>', completion: ' {\n  \n}', confidence: 0.8 },
        { name: 'export_default', trigger: 'export default', completion: ' ', confidence: 0.6 },
      ],
      javascript: [
        { name: 'async_function', trigger: 'async', completion: ' function name() {\n  \n}', confidence: 0.7 },
        { name: 'arrow_function', trigger: '=>', completion: ' {\n  \n}', confidence: 0.8 },
      ],
      python: [
        { name: 'def_function', trigger: 'def', completion: ' name():\n    pass', confidence: 0.7 },
        { name: 'class_def', trigger: 'class', completion: ' ClassName:\n    pass', confidence: 0.7 },
      ],
    };

    return patterns[languageId] || [];
  }

  /**
   * Generate cache key
   */
  private getCacheKey(document: vscode.TextDocument, position: vscode.Position): string {
    return `${document.uri.toString()}:${position.line}:${position.character}`;
  }

  /**
   * Accept a completion
   */
  public acceptCompletion(suggestion: CompletionSuggestion): void {
    this._onCompletionAccepted.fire(suggestion);
    this.clearVoiceContext();
  }

  /**
   * Reject a completion
   */
  public rejectCompletion(suggestion: CompletionSuggestion): void {
    this._onCompletionRejected.fire(suggestion);
  }

  /**
   * Clear completion cache
   */
  public clearCache(): void {
    this.completionCache.clear();
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.completionCache.clear();
    this._onCompletionAccepted.dispose();
    this._onCompletionRejected.dispose();
  }
}

export default VoiceFlowInlineCompletionProvider;

