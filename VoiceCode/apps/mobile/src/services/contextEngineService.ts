/**
 * Context Engine Service
 * Phase 3 Week 10 Day 66-67: Real-Time AI Processing
 * 
 * Provides context understanding, topic detection, sentiment analysis,
 * entity recognition, and relationship mapping.
 */

import { supabase } from './supabase.service';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type EntityType = 'person' | 'organization' | 'location' | 'date' | 'product' | 'event' | 'other';
export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';
export type IntentType = 'question' | 'command' | 'statement' | 'request' | 'suggestion';
export type RelationshipType = 'works_for' | 'located_in' | 'related_to' | 'mentioned_with' | 'part_of';

export interface ContextAnalysis {
  id: string;
  session_id: string;
  text: string;
  topics: Topic[];
  sentiment: SentimentAnalysis;
  entities: Entity[];
  relationships: Relationship[];
  intents: Intent[];
  summary: string;
  confidence: number; // 0-1
  analyzed_at: string;
}

export interface Topic {
  id: string;
  name: string;
  category: string;
  confidence: number; // 0-1
  relevance: number; // 0-1
  keywords: string[];
  first_mentioned: number; // timestamp
  mention_count: number;
}

export interface SentimentAnalysis {
  overall: SentimentType;
  score: number; // -1 to 1 (negative to positive)
  confidence: number; // 0-1
  emotions: Emotion[];
  timeline: SentimentTimelinePoint[];
}

export interface Emotion {
  type: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust';
  intensity: number; // 0-1
  confidence: number; // 0-1
}

export interface SentimentTimelinePoint {
  timestamp: number;
  sentiment: SentimentType;
  score: number;
  text_snippet: string;
}

export interface Entity {
  id: string;
  text: string;
  type: EntityType;
  confidence: number; // 0-1
  start_position: number;
  end_position: number;
  metadata: Record<string, any>;
  mentions: number;
}

export interface Relationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  type: RelationshipType;
  confidence: number; // 0-1
  context: string;
  evidence: string[];
}

export interface Intent {
  id: string;
  type: IntentType;
  description: string;
  confidence: number; // 0-1
  entities_involved: string[];
  timestamp: number;
}

export interface ContextSummary {
  session_id: string;
  main_topics: string[];
  overall_sentiment: SentimentType;
  key_entities: Entity[];
  important_relationships: Relationship[];
  primary_intents: IntentType[];
  word_count: number;
  unique_entities: number;
  topic_diversity: number; // 0-1
  sentiment_stability: number; // 0-1
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class ContextEngineService {
  /**
   * Analyze context from text
   */
  async analyzeContext(text: string, sessionId?: string): Promise<ContextAnalysis> {
    try {
      // In production, this would call an NLP API
      // For now, we'll simulate the analysis
      const topics = await this.detectTopics(text);
      const sentiment = await this.analyzeSentiment(text);
      const entities = await this.extractEntities(text);
      const relationships = await this.mapRelationships(entities);
      const intents = await this.detectIntent(text);

      const analysis: ContextAnalysis = {
        id: `ctx_${Date.now()}`,
        session_id: sessionId || 'standalone',
        text,
        topics,
        sentiment,
        entities,
        relationships,
        intents,
        summary: this.generateSummary(text, topics, entities),
        confidence: 0.85,
        analyzed_at: new Date().toISOString(),
      };

      // Save to database if session ID provided
      if (sessionId) {
        await supabase
          .from('context_analysis')
          .insert(analysis);
      }

      return analysis;
    } catch (error) {
      console.error('Failed to analyze context:', error);
      throw error;
    }
  }

  /**
   * Detect topics and themes in text
   */
  async detectTopics(text: string): Promise<Topic[]> {
    // Simulate topic detection
    // In production, this would use NLP models
    const words = text.toLowerCase().split(/\s+/);
    const topicKeywords: Record<string, string[]> = {
      'Business': ['meeting', 'project', 'deadline', 'budget', 'revenue', 'sales'],
      'Technology': ['software', 'app', 'code', 'api', 'database', 'server'],
      'Healthcare': ['patient', 'doctor', 'treatment', 'diagnosis', 'medical'],
      'Education': ['student', 'teacher', 'course', 'exam', 'learning'],
      'Finance': ['investment', 'stock', 'market', 'profit', 'loss', 'portfolio'],
    };

    const detectedTopics: Topic[] = [];
    let topicId = 1;

    for (const [category, keywords] of Object.entries(topicKeywords)) {
      const matchCount = keywords.filter(keyword => 
        words.some(word => word.includes(keyword))
      ).length;

      if (matchCount > 0) {
        detectedTopics.push({
          id: `topic_${topicId++}`,
          name: category,
          category,
          confidence: Math.min(matchCount / keywords.length, 1),
          relevance: matchCount / words.length,
          keywords: keywords.filter(k => words.some(w => w.includes(k))),
          first_mentioned: 0,
          mention_count: matchCount,
        });
      }
    }

    return detectedTopics.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    // Simulate sentiment analysis
    // In production, this would use sentiment analysis models
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'disappointing', 'poor'];

    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(w => positiveWords.some(pw => w.includes(pw))).length;
    const negativeCount = words.filter(w => negativeWords.some(nw => w.includes(nw))).length;

    const score = (positiveCount - negativeCount) / Math.max(words.length, 1);
    const overall: SentimentType = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral';

    const emotions: Emotion[] = [];
    if (positiveCount > 0) {
      emotions.push({
        type: 'joy',
        intensity: Math.min(positiveCount / 5, 1),
        confidence: 0.75,
      });
    }
    if (negativeCount > 0) {
      emotions.push({
        type: 'sadness',
        intensity: Math.min(negativeCount / 5, 1),
        confidence: 0.75,
      });
    }

    return {
      overall,
      score,
      confidence: 0.80,
      emotions,
      timeline: [{
        timestamp: Date.now(),
        sentiment: overall,
        score,
        text_snippet: text.substring(0, 100),
      }],
    };
  }

  /**
   * Extract named entities from text
   */
  async extractEntities(text: string): Promise<Entity[]> {
    // Simulate entity extraction
    // In production, this would use NER models
    const entities: Entity[] = [];
    let entityId = 1;

    // Simple pattern matching for demonstration
    // Person names (capitalized words)
    const personPattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const personMatches = text.match(personPattern) || [];
    personMatches.forEach((match, index) => {
      entities.push({
        id: `entity_${entityId++}`,
        text: match,
        type: 'person',
        confidence: 0.85,
        start_position: text.indexOf(match),
        end_position: text.indexOf(match) + match.length,
        metadata: {},
        mentions: 1,
      });
    });

    // Organizations (words ending with Inc, Corp, LLC, etc.)
    const orgPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc|Corp|LLC|Ltd)\b/g;
    const orgMatches = text.match(orgPattern) || [];
    orgMatches.forEach((match) => {
      entities.push({
        id: `entity_${entityId++}`,
        text: match,
        type: 'organization',
        confidence: 0.90,
        start_position: text.indexOf(match),
        end_position: text.indexOf(match) + match.length,
        metadata: {},
        mentions: 1,
      });
    });

    // Dates (simple pattern)
    const datePattern = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g;
    const dateMatches = text.match(datePattern) || [];
    dateMatches.forEach((match) => {
      entities.push({
        id: `entity_${entityId++}`,
        text: match,
        type: 'date',
        confidence: 0.95,
        start_position: text.indexOf(match),
        end_position: text.indexOf(match) + match.length,
        metadata: {},
        mentions: 1,
      });
    });

    return entities;
  }

  /**
   * Map relationships between entities
   */
  async mapRelationships(entities: Entity[]): Promise<Relationship[]> {
    const relationships: Relationship[] = [];
    let relationshipId = 1;

    // Simple relationship mapping based on entity types
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const source = entities[i];
        const target = entities[j];

        // Person works for Organization
        if (source.type === 'person' && target.type === 'organization') {
          relationships.push({
            id: `rel_${relationshipId++}`,
            source_entity_id: source.id,
            target_entity_id: target.id,
            type: 'works_for',
            confidence: 0.70,
            context: `${source.text} mentioned with ${target.text}`,
            evidence: [],
          });
        }

        // Organization located in Location
        if (source.type === 'organization' && target.type === 'location') {
          relationships.push({
            id: `rel_${relationshipId++}`,
            source_entity_id: source.id,
            target_entity_id: target.id,
            type: 'located_in',
            confidence: 0.75,
            context: `${source.text} associated with ${target.text}`,
            evidence: [],
          });
        }

        // Generic relationship for entities mentioned together
        if (Math.abs(source.start_position - target.start_position) < 100) {
          relationships.push({
            id: `rel_${relationshipId++}`,
            source_entity_id: source.id,
            target_entity_id: target.id,
            type: 'mentioned_with',
            confidence: 0.60,
            context: 'Entities mentioned in close proximity',
            evidence: [],
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Detect intent from text
   */
  async detectIntent(text: string): Promise<Intent[]> {
    const intents: Intent[] = [];
    let intentId = 1;

    // Question detection
    if (text.includes('?') || /\b(what|when|where|who|why|how)\b/i.test(text)) {
      intents.push({
        id: `intent_${intentId++}`,
        type: 'question',
        description: 'User is asking a question',
        confidence: 0.90,
        entities_involved: [],
        timestamp: Date.now(),
      });
    }

    // Command detection
    if (/\b(please|could you|can you|would you)\b/i.test(text)) {
      intents.push({
        id: `intent_${intentId++}`,
        type: 'request',
        description: 'User is making a request',
        confidence: 0.85,
        entities_involved: [],
        timestamp: Date.now(),
      });
    }

    // Suggestion detection
    if (/\b(suggest|recommend|should|might want to)\b/i.test(text)) {
      intents.push({
        id: `intent_${intentId++}`,
        type: 'suggestion',
        description: 'User is making a suggestion',
        confidence: 0.80,
        entities_involved: [],
        timestamp: Date.now(),
      });
    }

    // Default to statement if no specific intent detected
    if (intents.length === 0) {
      intents.push({
        id: `intent_${intentId++}`,
        type: 'statement',
        description: 'User is making a statement',
        confidence: 0.70,
        entities_involved: [],
        timestamp: Date.now(),
      });
    }

    return intents;
  }

  /**
   * Get context summary for a session
   */
  async getContextSummary(sessionId: string): Promise<ContextSummary> {
    // Fetch all context analyses for the session
    const { data: analyses, error } = await supabase
      .from('context_analysis')
      .select('*')
      .eq('session_id', sessionId);

    if (error || !analyses || analyses.length === 0) {
      throw new Error('No context data found for session');
    }

    // Aggregate data
    const allTopics = analyses.flatMap(a => a.topics);
    const allEntities = analyses.flatMap(a => a.entities);
    const allRelationships = analyses.flatMap(a => a.relationships);
    const allIntents = analyses.flatMap(a => a.intents);

    // Calculate metrics
    const topicCounts = new Map<string, number>();
    allTopics.forEach(t => {
      topicCounts.set(t.name, (topicCounts.get(t.name) || 0) + 1);
    });

    const mainTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const sentiments = analyses.map(a => a.sentiment.overall);
    const overallSentiment = this.getMostCommonSentiment(sentiments);

    const uniqueEntities = new Set(allEntities.map(e => e.text)).size;
    const topicDiversity = topicCounts.size / Math.max(allTopics.length, 1);

    return {
      session_id: sessionId,
      main_topics: mainTopics,
      overall_sentiment: overallSentiment,
      key_entities: allEntities.slice(0, 10),
      important_relationships: allRelationships.slice(0, 10),
      primary_intents: [...new Set(allIntents.map(i => i.type))],
      word_count: analyses.reduce((sum, a) => sum + a.text.split(/\s+/).length, 0),
      unique_entities: uniqueEntities,
      topic_diversity: topicDiversity,
      sentiment_stability: 0.75, // Simulated
    };
  }

  /**
   * Generate summary from analysis
   */
  private generateSummary(text: string, topics: Topic[], entities: Entity[]): string {
    const topicNames = topics.slice(0, 3).map(t => t.name).join(', ');
    const entityNames = entities.slice(0, 3).map(e => e.text).join(', ');

    return `Discussion about ${topicNames || 'general topics'}${entityNames ? ` involving ${entityNames}` : ''}.`;
  }

  /**
   * Get most common sentiment
   */
  private getMostCommonSentiment(sentiments: SentimentType[]): SentimentType {
    const counts = new Map<SentimentType, number>();
    sentiments.forEach(s => {
      counts.set(s, (counts.get(s) || 0) + 1);
    });

    let maxCount = 0;
    let mostCommon: SentimentType = 'neutral';
    counts.forEach((count, sentiment) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = sentiment;
      }
    });

    return mostCommon;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let contextEngineServiceInstance: ContextEngineService | null = null;

export function getContextEngineService(): ContextEngineService {
  if (!contextEngineServiceInstance) {
    contextEngineServiceInstance = new ContextEngineService();
  }
  return contextEngineServiceInstance;
}

export default getContextEngineService;

