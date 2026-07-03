/**
 * Context Management Service
 * Intelligent context length management and optimization
 * 
 * Features:
 * - Smart truncation strategies
 * - Context summarization
 * - Priority-based context selection
 * - Token counting and estimation
 * - Context window optimization
 * - Conversation history management
 */

export interface ContextWindow {
  systemPrompt: string;
  conversationHistory: Message[];
  currentInput: string;
  totalTokens: number;
  maxTokens: number;
  truncated: boolean;
  strategy: TruncationStrategy;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  tokens: number;
  timestamp: Date;
  priority: number;
}

export type TruncationStrategy = 
  | 'fifo' // First In First Out
  | 'lifo' // Last In First Out
  | 'priority' // Keep highest priority
  | 'summarize' // Summarize old messages
  | 'smart'; // Intelligent selection

export interface ContextOptimizationResult {
  optimizedContext: string;
  originalTokens: number;
  optimizedTokens: number;
  compressionRatio: number;
  strategy: TruncationStrategy;
  messagesRemoved: number;
  messagesSummarized: number;
}

export class ContextManagementService {
  private static instance: ContextManagementService;
  
  // Token limits for different models
  private readonly MODEL_LIMITS: Record<string, number> = {
    'gpt-4o-mini': 128000,
    'gpt-4o': 128000,
    'gpt-4': 8192,
    'gpt-3.5-turbo': 16385,
    'gpt-5-pro': 200000,
  };

  // Reserve tokens for response
  private readonly RESPONSE_RESERVE = 2000;

  public static getInstance(): ContextManagementService {
    if (!ContextManagementService.instance) {
      ContextManagementService.instance = new ContextManagementService();
    }
    return ContextManagementService.instance;
  }

  /**
   * Optimize context to fit within token limits
   */
  public async optimizeContext(
    systemPrompt: string,
    conversationHistory: Message[],
    currentInput: string,
    model: string = 'gpt-4o-mini',
    strategy: TruncationStrategy = 'smart'
  ): Promise<ContextOptimizationResult> {
    const maxTokens = this.MODEL_LIMITS[model] || 128000;
    const availableTokens = maxTokens - this.RESPONSE_RESERVE;

    // Count tokens
    const systemTokens = this.estimateTokens(systemPrompt);
    const inputTokens = this.estimateTokens(currentInput);
    const historyTokens = conversationHistory.reduce((sum, msg) => sum + msg.tokens, 0);
    const originalTokens = systemTokens + inputTokens + historyTokens;

    // Check if optimization needed
    if (originalTokens <= availableTokens) {
      return {
        optimizedContext: this.buildContext(systemPrompt, conversationHistory, currentInput),
        originalTokens,
        optimizedTokens: originalTokens,
        compressionRatio: 1.0,
        strategy,
        messagesRemoved: 0,
        messagesSummarized: 0,
      };
    }

    // Calculate how many tokens to save
    const tokensToSave = originalTokens - availableTokens;

    // Apply optimization strategy
    let optimizedHistory: Message[];
    let messagesRemoved = 0;
    let messagesSummarized = 0;

    switch (strategy) {
      case 'fifo':
        ({ history: optimizedHistory, removed: messagesRemoved } = 
          this.truncateFIFO(conversationHistory, tokensToSave));
        break;
      
      case 'lifo':
        ({ history: optimizedHistory, removed: messagesRemoved } = 
          this.truncateLIFO(conversationHistory, tokensToSave));
        break;
      
      case 'priority':
        ({ history: optimizedHistory, removed: messagesRemoved } = 
          this.truncatePriority(conversationHistory, tokensToSave));
        break;
      
      case 'summarize':
        ({ history: optimizedHistory, summarized: messagesSummarized } = 
          await this.summarizeHistory(conversationHistory, tokensToSave));
        break;
      
      case 'smart':
      default:
        ({ history: optimizedHistory, removed: messagesRemoved, summarized: messagesSummarized } = 
          await this.smartOptimization(conversationHistory, tokensToSave));
        break;
    }

    const optimizedTokens = systemTokens + inputTokens + 
      optimizedHistory.reduce((sum, msg) => sum + msg.tokens, 0);

    return {
      optimizedContext: this.buildContext(systemPrompt, optimizedHistory, currentInput),
      originalTokens,
      optimizedTokens,
      compressionRatio: optimizedTokens / originalTokens,
      strategy,
      messagesRemoved,
      messagesSummarized,
    };
  }

  /**
   * FIFO truncation - remove oldest messages first
   */
  private truncateFIFO(
    history: Message[],
    tokensToSave: number
  ): { history: Message[]; removed: number } {
    let tokensSaved = 0;
    let removed = 0;
    const optimized: Message[] = [];

    // Keep messages from the end
    for (let i = history.length - 1; i >= 0; i--) {
      if (tokensSaved >= tokensToSave) {
        optimized.unshift(history[i]);
      } else {
        tokensSaved += history[i].tokens;
        removed++;
      }
    }

    return { history: optimized, removed };
  }

  /**
   * LIFO truncation - remove newest messages first (keep context)
   */
  private truncateLIFO(
    history: Message[],
    tokensToSave: number
  ): { history: Message[]; removed: number } {
    let tokensSaved = 0;
    let removed = 0;
    const optimized: Message[] = [];

    // Keep messages from the beginning
    for (let i = 0; i < history.length; i++) {
      if (tokensSaved >= tokensToSave) {
        optimized.push(history[i]);
      } else {
        tokensSaved += history[i].tokens;
        removed++;
      }
    }

    return { history: optimized, removed };
  }

  /**
   * Priority-based truncation - keep highest priority messages
   */
  private truncatePriority(
    history: Message[],
    tokensToSave: number
  ): { history: Message[]; removed: number } {
    // Sort by priority (descending)
    const sorted = [...history].sort((a, b) => b.priority - a.priority);
    
    let tokensSaved = 0;
    let removed = 0;
    const kept: Message[] = [];

    for (const msg of sorted) {
      if (tokensSaved >= tokensToSave) {
        kept.push(msg);
      } else {
        tokensSaved += msg.tokens;
        removed++;
      }
    }

    // Restore chronological order
    kept.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return { history: kept, removed };
  }

  /**
   * Summarize old messages
   */
  private async summarizeHistory(
    history: Message[],
    tokensToSave: number
  ): Promise<{ history: Message[]; summarized: number }> {
    if (history.length < 4) {
      return { history, summarized: 0 };
    }

    // Summarize first half of conversation
    const splitPoint = Math.floor(history.length / 2);
    const toSummarize = history.slice(0, splitPoint);
    const toKeep = history.slice(splitPoint);

    // Create summary
    const summaryText = this.createSummary(toSummarize);
    const summaryTokens = this.estimateTokens(summaryText);

    const summaryMessage: Message = {
      role: 'system',
      content: `[Conversation Summary]: ${summaryText}`,
      tokens: summaryTokens,
      timestamp: toSummarize[0].timestamp,
      priority: 5, // Medium-high priority
    };

    return {
      history: [summaryMessage, ...toKeep],
      summarized: toSummarize.length,
    };
  }

  /**
   * Smart optimization - combination of strategies
   */
  private async smartOptimization(
    history: Message[],
    tokensToSave: number
  ): Promise<{ history: Message[]; removed: number; summarized: number }> {
    let optimized = [...history];
    let removed = 0;
    let summarized = 0;

    // Step 1: Remove low-priority messages
    if (tokensToSave > 0) {
      const lowPriority = optimized.filter(m => m.priority < 3);
      const tokensSaved = lowPriority.reduce((sum, m) => sum + m.tokens, 0);
      
      if (tokensSaved > 0) {
        optimized = optimized.filter(m => m.priority >= 3);
        removed += lowPriority.length;
      }
    }

    // Step 2: Summarize old messages if still needed
    const currentTokens = optimized.reduce((sum, m) => sum + m.tokens, 0);
    if (currentTokens > tokensToSave && optimized.length > 6) {
      const result = await this.summarizeHistory(optimized, tokensToSave);
      optimized = result.history;
      summarized = result.summarized;
    }

    // Step 3: FIFO truncation as last resort
    const finalTokens = optimized.reduce((sum, m) => sum + m.tokens, 0);
    if (finalTokens > tokensToSave) {
      const result = this.truncateFIFO(optimized, tokensToSave);
      optimized = result.history;
      removed += result.removed;
    }

    return { history: optimized, removed, summarized };
  }

  /**
   * Create summary of messages
   */
  private createSummary(messages: Message[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    const topics = this.extractTopics(messages);
    const keyPoints = this.extractKeyPoints(messages);

    return `Previous conversation covered ${topics.length} topics: ${topics.join(', ')}. ` +
           `Key points: ${keyPoints.join('; ')}. ` +
           `(${userMessages.length} user messages, ${assistantMessages.length} assistant responses)`;
  }

  /**
   * Extract topics from messages
   */
  private extractTopics(messages: Message[]): string[] {
    // Simple keyword extraction
    const allText = messages.map(m => m.content).join(' ');
    const words = allText.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();

    for (const word of words) {
      if (word.length > 5) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
  }

  /**
   * Extract key points from messages
   */
  private extractKeyPoints(messages: Message[]): string[] {
    // Extract first sentence from each assistant message
    return messages
      .filter(m => m.role === 'assistant')
      .map(m => {
        const firstSentence = m.content.split(/[.!?]/)[0];
        return firstSentence.substring(0, 50) + (firstSentence.length > 50 ? '...' : '');
      })
      .slice(0, 3);
  }

  /**
   * Build context string
   */
  private buildContext(
    systemPrompt: string,
    history: Message[],
    currentInput: string
  ): string {
    const parts = [systemPrompt];

    for (const msg of history) {
      parts.push(`${msg.role.toUpperCase()}: ${msg.content}`);
    }

    parts.push(`USER: ${currentInput}`);

    return parts.join('\n\n');
  }

  /**
   * Estimate token count (rough approximation)
   * More accurate: use tiktoken library
   */
  public estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Create message with token count
   */
  public createMessage(
    role: 'system' | 'user' | 'assistant',
    content: string,
    priority: number = 5
  ): Message {
    return {
      role,
      content,
      tokens: this.estimateTokens(content),
      timestamp: new Date(),
      priority,
    };
  }

  /**
   * Calculate priority based on message characteristics
   */
  public calculatePriority(message: Message, position: number, total: number): number {
    let priority = 5; // Base priority

    // Recent messages are more important
    const recencyScore = position / total;
    priority += recencyScore * 3;

    // System messages are important
    if (message.role === 'system') {
      priority += 2;
    }

    // Longer messages might be more important
    if (message.tokens > 100) {
      priority += 1;
    }

    // Messages with questions are important
    if (message.content.includes('?')) {
      priority += 1;
    }

    return Math.min(10, priority);
  }
}

// Export singleton
export const contextManagementService = ContextManagementService.getInstance();

