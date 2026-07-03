/**
 * AI Features Service
 * Phase 3.3: AI-Powered Features
 * 
 * Provides AI-powered features for transcript analysis
 */

import { Transcript } from './supabase.service';

export interface TranscriptSummary {
  short: string;        // 1-2 sentences
  medium: string;       // 1 paragraph
  long: string;         // Multiple paragraphs
  wordCount: number;
  compressionRatio: number;
}

export interface KeyPoint {
  id: string;
  text: string;
  importance: number;   // 0-1
  timestamp?: number;
  category?: string;
}

export interface ActionItem {
  id: string;
  text: string;
  assignee?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  timestamp?: number;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  score: number;        // -1 to 1
  confidence: number;   // 0-1
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
  timeline?: Array<{
    timestamp: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
  }>;
}

export interface Topic {
  id: string;
  name: string;
  confidence: number;   // 0-1
  keywords: string[];
  mentions: number;
}

export interface SmartSearchResult {
  transcriptId: string;
  relevance: number;    // 0-1
  matches: Array<{
    text: string;
    timestamp?: number;
    context: string;
  }>;
}

/**
 * AI Features Service Class
 */
export class AIFeaturesService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = import.meta.env.VITE_AIML_BASE_URL || 'https://api.aimlapi.com/v1';
  }

  /**
   * Generate transcript summary
   */
  async generateSummary(transcript: Transcript): Promise<TranscriptSummary> {
    const content = transcript.content;
    const wordCount = content.split(/\s+/).length;

    try {
      // Call AIML API for summarization
      const response = await this.callAIMLAPI('chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional summarization assistant. Generate concise, accurate summaries.',
          },
          {
            role: 'user',
            content: `Generate three summaries of this transcript:\n1. Short (1-2 sentences)\n2. Medium (1 paragraph)\n3. Long (2-3 paragraphs)\n\nTranscript:\n${content}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const summaryText = response.choices[0].message.content;
      
      // Parse summaries (simplified - in production, use structured output)
      const summaries = this.parseSummaries(summaryText);

      return {
        short: summaries.short || this.generateFallbackSummary(content, 50),
        medium: summaries.medium || this.generateFallbackSummary(content, 150),
        long: summaries.long || this.generateFallbackSummary(content, 300),
        wordCount,
        compressionRatio: summaries.short.split(/\s+/).length / wordCount,
      };
    } catch (error) {
      console.error('Failed to generate summary:', error);
      // Fallback to simple summarization
      return {
        short: this.generateFallbackSummary(content, 50),
        medium: this.generateFallbackSummary(content, 150),
        long: this.generateFallbackSummary(content, 300),
        wordCount,
        compressionRatio: 0.1,
      };
    }
  }

  /**
   * Extract key points
   */
  async extractKeyPoints(transcript: Transcript, maxPoints: number = 10): Promise<KeyPoint[]> {
    const content = transcript.content;

    try {
      const response = await this.callAIMLAPI('chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting key points from text. Extract the most important points.',
          },
          {
            role: 'user',
            content: `Extract the ${maxPoints} most important key points from this transcript. Format as a numbered list.\n\nTranscript:\n${content}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const keyPointsText = response.choices[0].message.content;
      return this.parseKeyPoints(keyPointsText);
    } catch (error) {
      console.error('Failed to extract key points:', error);
      return this.extractFallbackKeyPoints(content, maxPoints);
    }
  }

  /**
   * Detect action items
   */
  async detectActionItems(transcript: Transcript): Promise<ActionItem[]> {
    const content = transcript.content;

    try {
      const response = await this.callAIMLAPI('chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at identifying action items and tasks from conversations. Extract all actionable items.',
          },
          {
            role: 'user',
            content: `Identify all action items from this transcript. For each item, specify:\n- The action\n- Assignee (if mentioned)\n- Priority (low/medium/high)\n\nTranscript:\n${content}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const actionItemsText = response.choices[0].message.content;
      return this.parseActionItems(actionItemsText);
    } catch (error) {
      console.error('Failed to detect action items:', error);
      return this.detectFallbackActionItems(content);
    }
  }

  /**
   * Analyze sentiment
   */
  async analyzeSentiment(transcript: Transcript): Promise<SentimentAnalysis> {
    const content = transcript.content;

    try {
      const response = await this.callAIMLAPI('chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze the emotional tone and sentiment of text.',
          },
          {
            role: 'user',
            content: `Analyze the sentiment of this transcript. Provide:\n1. Overall sentiment (positive/neutral/negative)\n2. Sentiment score (-1 to 1)\n3. Confidence (0-1)\n4. Emotion breakdown (joy, sadness, anger, fear, surprise)\n\nTranscript:\n${content}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const sentimentText = response.choices[0].message.content;
      return this.parseSentiment(sentimentText);
    } catch (error) {
      console.error('Failed to analyze sentiment:', error);
      return this.analyzeFallbackSentiment(content);
    }
  }

  /**
   * Detect topics
   */
  async detectTopics(transcript: Transcript, maxTopics: number = 5): Promise<Topic[]> {
    const content = transcript.content;

    try {
      const response = await this.callAIMLAPI('chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at topic detection and categorization. Identify main topics discussed.',
          },
          {
            role: 'user',
            content: `Identify the ${maxTopics} main topics discussed in this transcript. For each topic, provide:\n- Topic name\n- Key keywords\n- Confidence level\n\nTranscript:\n${content}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 600,
      });

      const topicsText = response.choices[0].message.content;
      return this.parseTopics(topicsText);
    } catch (error) {
      console.error('Failed to detect topics:', error);
      return this.detectFallbackTopics(content, maxTopics);
    }
  }

  /**
   * Smart search across transcripts
   */
  async smartSearch(
    query: string,
    transcripts: Transcript[],
    maxResults: number = 10
  ): Promise<SmartSearchResult[]> {
    // Simple keyword-based search (in production, use vector embeddings)
    const results: SmartSearchResult[] = [];
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    for (const transcript of transcripts) {
      const contentLower = transcript.content.toLowerCase();
      
      // Calculate relevance score
      let relevance = 0;
      const matches: Array<{ text: string; timestamp?: number; context: string }> = [];

      // Check for exact phrase match
      if (contentLower.includes(queryLower)) {
        relevance += 1.0;
        const index = contentLower.indexOf(queryLower);
        matches.push({
          text: query,
          context: this.extractContext(transcript.content, index, 100),
        });
      }

      // Check for individual word matches
      for (const word of queryWords) {
        if (word.length < 3) continue; // Skip short words
        const wordCount = (contentLower.match(new RegExp(word, 'g')) || []).length;
        relevance += wordCount * 0.1;
      }

      if (relevance > 0) {
        results.push({
          transcriptId: transcript.id,
          relevance: Math.min(relevance, 1.0),
          matches,
        });
      }
    }

    // Sort by relevance and return top results
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxResults);
  }

  /**
   * Call AIML API
   */
  private async callAIMLAPI(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`AIML API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Parsing helpers
  private parseSummaries(text: string): { short: string; medium: string; long: string } {
    // Simple parsing - in production, use structured output
    const lines = text.split('\n').filter(l => l.trim());
    return {
      short: lines[0] || '',
      medium: lines.slice(0, 3).join(' ') || '',
      long: lines.join(' ') || '',
    };
  }

  private parseKeyPoints(text: string): KeyPoint[] {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.map((line, index) => ({
      id: crypto.randomUUID(),
      text: line.replace(/^\d+\.\s*/, '').trim(),
      importance: 1 - (index * 0.1),
      category: 'general',
    }));
  }

  private parseActionItems(text: string): ActionItem[] {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.map(line => ({
      id: crypto.randomUUID(),
      text: line.replace(/^[-*]\s*/, '').trim(),
      priority: 'medium' as const,
      completed: false,
    }));
  }

  private parseSentiment(text: string): SentimentAnalysis {
    // Simple parsing - in production, use structured output
    return {
      overall: 'neutral',
      score: 0,
      confidence: 0.7,
      emotions: { joy: 0.2, sadness: 0.1, anger: 0.1, fear: 0.1, surprise: 0.1 },
    };
  }

  private parseTopics(text: string): Topic[] {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.slice(0, 5).map((line, index) => ({
      id: crypto.randomUUID(),
      name: line.replace(/^\d+\.\s*/, '').trim(),
      confidence: 1 - (index * 0.15),
      keywords: [],
      mentions: 1,
    }));
  }

  // Fallback methods (when API fails)
  private generateFallbackSummary(content: string, maxWords: number): string {
    const words = content.split(/\s+/);
    return words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '...' : '');
  }

  private extractFallbackKeyPoints(content: string, maxPoints: number): KeyPoint[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    return sentences.slice(0, maxPoints).map((sentence, index) => ({
      id: crypto.randomUUID(),
      text: sentence.trim(),
      importance: 1 - (index * 0.1),
      category: 'general',
    }));
  }

  private detectFallbackActionItems(content: string): ActionItem[] {
    const actionWords = ['todo', 'task', 'action', 'need to', 'should', 'must', 'will'];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim());
    const actionItems: ActionItem[] = [];

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (actionWords.some(word => lower.includes(word))) {
        actionItems.push({
          id: crypto.randomUUID(),
          text: sentence.trim(),
          priority: 'medium',
          completed: false,
        });
      }
    }

    return actionItems;
  }

  private analyzeFallbackSentiment(content: string): SentimentAnalysis {
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'hate', 'sad', 'angry', 'awful'];
    
    const lower = content.toLowerCase();
    const positiveCount = positiveWords.filter(w => lower.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lower.includes(w)).length;
    
    const score = (positiveCount - negativeCount) / Math.max(positiveCount + negativeCount, 1);
    
    return {
      overall: score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral',
      score,
      confidence: 0.6,
      emotions: { joy: 0.2, sadness: 0.1, anger: 0.1, fear: 0.1, surprise: 0.1 },
    };
  }

  private detectFallbackTopics(content: string, maxTopics: number): Topic[] {
    // Simple word frequency analysis
    const words = content.toLowerCase().split(/\s+/);
    const frequency: Record<string, number> = {};
    
    for (const word of words) {
      if (word.length > 4) { // Only count longer words
        frequency[word] = (frequency[word] || 0) + 1;
      }
    }
    
    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTopics);
    
    return sorted.map(([word, count]) => ({
      id: crypto.randomUUID(),
      name: word,
      confidence: count / words.length,
      keywords: [word],
      mentions: count,
    }));
  }

  private extractContext(content: string, index: number, contextLength: number): string {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + contextLength);
    return '...' + content.substring(start, end) + '...';
  }
}

// Export singleton instance
let aiFeaturesInstance: AIFeaturesService | null = null;

export function getAIFeaturesService(apiKey?: string): AIFeaturesService {
  if (!aiFeaturesInstance) {
    const key = apiKey || import.meta.env.VITE_AIML_API_KEY || '';
    aiFeaturesInstance = new AIFeaturesService(key);
  }
  return aiFeaturesInstance;
}

export default getAIFeaturesService;

