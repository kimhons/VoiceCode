/**
 * Advanced AI Service
 * Phase 5.6: More AI Features + Enhanced Security & Prompting
 *
 * Advanced AI capabilities including custom prompts, smart categorization,
 * meeting insights, emotion detection, and more
 *
 * ENHANCED WITH:
 * - Comprehensive system prompts
 * - Prompt injection prevention
 * - PII detection and redaction
 * - Content policy enforcement
 * - Output sanitization
 * - Confidence scoring
 * - Audit logging
 */

import { getSupabaseService } from './supabase.service';
import { promptSecurityService } from './promptSecurity.service';
import { getSystemPrompt } from '../config/systemPrompts';

// Types
export interface AIPrompt {
  id: string;
  userId: string;
  name: string;
  description: string;
  prompt: string;
  category: 'summarization' | 'analysis' | 'extraction' | 'transformation' | 'custom';
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingInsights {
  transcriptId: string;
  duration: number;
  speakerCount: number;
  topTopics: Array<{ topic: string; relevance: number }>;
  keyDecisions: string[];
  actionItems: Array<{ task: string; assignee?: string; deadline?: string }>;
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
    breakdown: Array<{ speaker?: string; sentiment: string; score: number }>;
  };
  engagement: {
    score: number;
    indicators: string[];
  };
  followUpSuggestions: string[];
}

export interface SmartCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  confidence: number;
  color: string;
  icon: string;
}

export interface EmotionAnalysis {
  emotions: Array<{
    emotion: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'neutral';
    confidence: number;
    timestamp: number;
  }>;
  dominantEmotion: string;
  emotionalArc: Array<{ time: number; emotion: string; intensity: number }>;
}

export interface SpeakerProfile {
  speakerId: string;
  name?: string;
  talkTime: number;
  wordCount: number;
  averageSentenceLength: number;
  vocabulary: {
    uniqueWords: number;
    complexWords: number;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topics: string[];
  speakingStyle: 'formal' | 'casual' | 'technical' | 'mixed';
}

export interface AISearchResult {
  transcriptId: string;
  title: string;
  relevance: number;
  matchedSegments: Array<{
    text: string;
    timestamp: number;
    relevance: number;
  }>;
  summary: string;
}

// Advanced AI Service
class AdvancedAIService {
  private apiKey: string = import.meta.env.VITE_AIML_API_KEY || '';
  private apiUrl: string = 'https://api.aimlapi.com/v1';
  private securityService = promptSecurityService;

  // Audit logging
  private async logAIOperation(
    operation: string,
    userId: string,
    input: string,
    output: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return;

      await client.from('ai_audit_logs').insert({
        operation,
        user_id: userId,
        input_length: input.length,
        output_length: output.length,
        metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log AI operation:', error);
    }
  }

  // =====================================================
  // CUSTOM AI PROMPTS
  // =====================================================

  async createPrompt(
    userId: string,
    name: string,
    description: string,
    prompt: string,
    category: AIPrompt['category'],
    isPublic: boolean = false
  ): Promise<AIPrompt> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      const { data, error } = await client
        .from('ai_prompts')
        .insert({
          user_id: userId,
          name,
          description,
          prompt,
          category,
          is_public: isPublic,
          usage_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as AIPrompt;
    } catch (error) {
      console.error('Failed to create prompt:', error);
      throw error;
    }
  }

  async getPrompts(userId: string, includePublic: boolean = true): Promise<AIPrompt[]> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) return [];

      let query = client.from('ai_prompts').select('*');

      if (includePublic) {
        query = query.or(`user_id.eq.${userId},is_public.eq.true`);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('usage_count', { ascending: false });

      if (error) throw error;
      return data as AIPrompt[];
    } catch (error) {
      console.error('Failed to get prompts:', error);
      return [];
    }
  }

  async executeCustomPrompt(
    promptId: string,
    transcriptText: string,
    userId: string
  ): Promise<{ result: string; confidence: number; warnings: string[] }> {
    try {
      const supabaseService = getSupabaseService();
      const client = supabaseService.getClient();
      if (!client) throw new Error('Supabase client not available');

      // Get prompt
      const { data: prompt, error } = await client
        .from('ai_prompts')
        .select('*')
        .eq('id', promptId)
        .single();

      if (error || !prompt) throw new Error('Prompt not found');

      // SECURITY: Perform comprehensive security check on user prompt
      const securityCheck = await this.securityService.performSecurityCheck(prompt.prompt);

      if (!securityCheck.safe) {
        throw new Error('Prompt contains unsafe content or injection attempts');
      }

      // SECURITY: Check transcript text for PII
      const piiCheck = this.securityService.detectPII(transcriptText);
      const sanitizedTranscript = piiCheck.hasPII ? piiCheck.redactedText : transcriptText;

      // Execute prompt with sanitized inputs
      const result = await this.callAISecure(
        securityCheck.sanitizedInput,
        sanitizedTranscript,
        'custom'
      );

      // Update usage count
      await client
        .from('ai_prompts')
        .update({ usage_count: prompt.usage_count + 1 })
        .eq('id', promptId);

      // Audit log
      await this.logAIOperation('execute_custom_prompt', userId, prompt.prompt, result.content, {
        prompt_id: promptId,
        pii_detected: piiCheck.hasPII,
        pii_types: piiCheck.types,
      });

      return {
        result: result.content,
        confidence: result.confidence,
        warnings: piiCheck.hasPII
          ? [`PII detected and redacted: ${piiCheck.types.join(', ')}`]
          : [],
      };
    } catch (error) {
      console.error('Failed to execute custom prompt:', error);
      throw error;
    }
  }

  // =====================================================
  // MEETING INSIGHTS
  // =====================================================

  async generateMeetingInsights(transcriptId: string, transcriptText: string): Promise<MeetingInsights> {
    try {
      const prompt = `Analyze this meeting transcript and provide comprehensive insights:

Transcript:
${transcriptText}

Provide a JSON response with:
1. Top 5 topics discussed (with relevance scores 0-1)
2. Key decisions made
3. Action items (with assignees and deadlines if mentioned)
4. Overall sentiment (positive/neutral/negative with score 0-1)
5. Engagement score (0-1) with indicators
6. Follow-up suggestions

Format: JSON only, no markdown.`;

      const response = await this.callAI(prompt, '');
      const insights = JSON.parse(response);

      // Calculate additional metrics
      const duration = this.estimateDuration(transcriptText);
      const speakerCount = this.countSpeakers(transcriptText);

      return {
        transcriptId,
        duration,
        speakerCount,
        topTopics: insights.topics || [],
        keyDecisions: insights.decisions || [],
        actionItems: insights.actionItems || [],
        sentiment: {
          overall: insights.sentiment?.overall || 'neutral',
          score: insights.sentiment?.score || 0.5,
          breakdown: insights.sentiment?.breakdown || [],
        },
        engagement: {
          score: insights.engagement?.score || 0.5,
          indicators: insights.engagement?.indicators || [],
        },
        followUpSuggestions: insights.followUp || [],
      };
    } catch (error) {
      console.error('Failed to generate meeting insights:', error);
      throw error;
    }
  }

  // =====================================================
  // SMART CATEGORIZATION
  // =====================================================

  async categorizeTranscript(transcriptText: string): Promise<SmartCategory[]> {
    try {
      const prompt = `Analyze this transcript and suggest 3-5 relevant categories:

Transcript:
${transcriptText.substring(0, 2000)}...

For each category provide:
- name: Category name
- description: Brief description
- keywords: 5-10 relevant keywords
- confidence: Confidence score (0-1)
- color: Hex color code
- icon: Emoji icon

Format: JSON array only, no markdown.`;

      const response = await this.callAI(prompt, '');
      const categories = JSON.parse(response);

      return categories.map((cat: any, index: number) => ({
        id: `cat_${Date.now()}_${index}`,
        name: cat.name,
        description: cat.description,
        keywords: cat.keywords || [],
        confidence: cat.confidence || 0.5,
        color: cat.color || '#007bff',
        icon: cat.icon || '📁',
      }));
    } catch (error) {
      console.error('Failed to categorize transcript:', error);
      return [];
    }
  }

  // =====================================================
  // EMOTION DETECTION
  // =====================================================

  async detectEmotions(transcriptText: string): Promise<EmotionAnalysis> {
    try {
      const prompt = `Analyze the emotions in this transcript:

Transcript:
${transcriptText}

Provide a JSON response with:
1. emotions: Array of { emotion, confidence, timestamp }
2. dominantEmotion: Most prevalent emotion
3. emotionalArc: Timeline of emotional changes

Emotions: joy, sadness, anger, fear, surprise, neutral
Format: JSON only, no markdown.`;

      const response = await this.callAI(prompt, '');
      const analysis = JSON.parse(response);

      return {
        emotions: analysis.emotions || [],
        dominantEmotion: analysis.dominantEmotion || 'neutral',
        emotionalArc: analysis.emotionalArc || [],
      };
    } catch (error) {
      console.error('Failed to detect emotions:', error);
      return {
        emotions: [],
        dominantEmotion: 'neutral',
        emotionalArc: [],
      };
    }
  }

  // =====================================================
  // SPEAKER IDENTIFICATION & PROFILING
  // =====================================================

  async analyzeSpeakers(transcriptText: string): Promise<SpeakerProfile[]> {
    try {
      const speakers = this.extractSpeakers(transcriptText);
      const profiles: SpeakerProfile[] = [];

      for (const speaker of speakers) {
        const profile = await this.generateSpeakerProfile(speaker.id, speaker.text);
        profiles.push(profile);
      }

      return profiles;
    } catch (error) {
      console.error('Failed to analyze speakers:', error);
      return [];
    }
  }

  private async generateSpeakerProfile(speakerId: string, text: string): Promise<SpeakerProfile> {
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));

    return {
      speakerId,
      talkTime: this.estimateDuration(text),
      wordCount: words.length,
      averageSentenceLength: words.length / sentences.length,
      vocabulary: {
        uniqueWords: uniqueWords.size,
        complexWords: words.filter(w => w.length > 8).length,
      },
      sentiment: {
        positive: 0.33,
        neutral: 0.34,
        negative: 0.33,
      },
      topics: [],
      speakingStyle: 'mixed',
    };
  }

  // =====================================================
  // AI-POWERED SEARCH
  // =====================================================

  async semanticSearch(query: string, transcripts: Array<{ id: string; title: string; content: string }>): Promise<AISearchResult[]> {
    try {
      const results: AISearchResult[] = [];

      for (const transcript of transcripts) {
        const relevance = await this.calculateSemanticRelevance(query, transcript.content);
        
        if (relevance > 0.3) {
          const matchedSegments = this.findMatchedSegments(query, transcript.content);
          const summary = await this.generateSearchSummary(query, transcript.content);

          results.push({
            transcriptId: transcript.id,
            title: transcript.title,
            relevance,
            matchedSegments,
            summary,
          });
        }
      }

      return results.sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('Failed to perform semantic search:', error);
      return [];
    }
  }

  private async calculateSemanticRelevance(query: string, content: string): Promise<number> {
    // Simple keyword-based relevance (in production, use embeddings)
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    const matches = queryWords.filter(word => contentWords.includes(word));
    return matches.length / queryWords.length;
  }

  private findMatchedSegments(query: string, content: string): Array<{ text: string; timestamp: number; relevance: number }> {
    const segments: Array<{ text: string; timestamp: number; relevance: number }> = [];
    const sentences = content.split(/[.!?]+/);

    sentences.forEach((sentence, index) => {
      const relevance = this.calculateSentenceRelevance(query, sentence);
      if (relevance > 0.3) {
        segments.push({
          text: sentence.trim(),
          timestamp: index * 5, // Estimate 5 seconds per sentence
          relevance,
        });
      }
    });

    return segments.slice(0, 5); // Top 5 segments
  }

  private calculateSentenceRelevance(query: string, sentence: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const sentenceWords = sentence.toLowerCase().split(/\s+/);
    const matches = queryWords.filter(word => sentenceWords.includes(word));
    return matches.length / queryWords.length;
  }

  private async generateSearchSummary(query: string, content: string): Promise<string> {
    try {
      const prompt = `Summarize how this content relates to the query: "${query}"

Content:
${content.substring(0, 1000)}...

Provide a brief 1-2 sentence summary.`;

      return await this.callAI(prompt, '');
    } catch {
      return 'Relevant content found.';
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * LEGACY METHOD - Use callAISecure instead
   * @deprecated
   */
  private async callAI(prompt: string, context: string): Promise<string> {
    const result = await this.callAISecure(prompt, context, 'general');
    return result.content;
  }

  /**
   * SECURE AI CALL with comprehensive system prompts and security
   */
  private async callAISecure(
    prompt: string,
    context: string,
    contextType: 'general' | 'medical' | 'legal' | 'technical' | 'business' | 'custom'
  ): Promise<{
    content: string;
    confidence: number;
    tokensUsed: number;
    warnings: string[];
  }> {
    try {
      // Get comprehensive system prompt based on context
      const systemPrompt = getSystemPrompt(
        contextType === 'general' ? undefined : contextType
      );

      // Prepare messages
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context ? `${prompt}\n\n${context}` : prompt },
      ];

      // Call AI API
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AI API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const tokensUsed = data.usage?.total_tokens || 0;

      // SECURITY: Sanitize output
      const sanitizedContent = this.securityService.sanitizeOutput(content);

      // SECURITY: Check output for policy violations
      const policyCheck = await this.securityService.checkContentPolicy(sanitizedContent);

      if (!policyCheck.allowed) {
        throw new Error('AI output violates content policy');
      }

      // Calculate confidence score based on response quality
      const confidence = this.calculateConfidence(sanitizedContent, data);

      // Collect warnings
      const warnings: string[] = [];
      if (policyCheck.violations.length > 0) {
        warnings.push(`Content policy warnings: ${policyCheck.violations.length} minor issues detected`);
      }
      if (confidence < 0.7) {
        warnings.push('Low confidence response - please verify accuracy');
      }

      return {
        content: sanitizedContent,
        confidence,
        tokensUsed,
        warnings,
      };
    } catch (error) {
      console.error('AI API call failed:', error);
      throw error;
    }
  }

  /**
   * Calculate confidence score for AI response
   */
  private calculateConfidence(content: string, apiResponse: any): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on response length
    if (content.length < 50) confidence -= 0.1;
    if (content.length > 2000) confidence += 0.1;

    // Adjust based on finish reason
    if (apiResponse.choices[0].finish_reason === 'stop') {
      confidence += 0.1;
    } else if (apiResponse.choices[0].finish_reason === 'length') {
      confidence -= 0.2;
    }

    // Check for uncertainty markers
    const uncertaintyMarkers = [
      'i think', 'maybe', 'possibly', 'might be', 'could be',
      'not sure', 'uncertain', 'unclear'
    ];
    const lowerContent = content.toLowerCase();
    const uncertaintyCount = uncertaintyMarkers.filter(marker =>
      lowerContent.includes(marker)
    ).length;
    confidence -= uncertaintyCount * 0.05;

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  private estimateDuration(text: string): number {
    // Estimate ~150 words per minute
    const words = text.split(/\s+/).length;
    return Math.round((words / 150) * 60); // seconds
  }

  private countSpeakers(text: string): number {
    const speakerPattern = /^(Speaker \d+|[A-Z][a-z]+ [A-Z][a-z]+):/gm;
    const matches = text.match(speakerPattern);
    return matches ? new Set(matches).size : 1;
  }

  private extractSpeakers(text: string): Array<{ id: string; text: string }> {
    const speakers = new Map<string, string>();
    const lines = text.split('\n');

    let currentSpeaker = 'Unknown';
    let currentText = '';

    for (const line of lines) {
      const speakerMatch = line.match(/^(Speaker \d+|[A-Z][a-z]+ [A-Z][a-z]+):\s*(.*)$/);
      
      if (speakerMatch) {
        if (currentText) {
          speakers.set(currentSpeaker, (speakers.get(currentSpeaker) || '') + ' ' + currentText);
        }
        currentSpeaker = speakerMatch[1];
        currentText = speakerMatch[2];
      } else {
        currentText += ' ' + line;
      }
    }

    if (currentText) {
      speakers.set(currentSpeaker, (speakers.get(currentSpeaker) || '') + ' ' + currentText);
    }

    return Array.from(speakers.entries()).map(([id, text]) => ({ id, text }));
  }
}

// Singleton instance
let advancedAIInstance: AdvancedAIService | null = null;

export function getAdvancedAIService(): AdvancedAIService {
  if (!advancedAIInstance) {
    advancedAIInstance = new AdvancedAIService();
  }
  return advancedAIInstance;
}

export default AdvancedAIService;

