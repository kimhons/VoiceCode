/**
 * Hallucination Detection Service
 * Advanced fact-checking and hallucination detection for AI outputs
 * 
 * Features:
 * - Fact verification against source material
 * - Contradiction detection
 * - Unsupported claim identification
 * - Fabricated detail detection
 * - Confidence scoring
 * - Source attribution
 */

export interface HallucinationResult {
  isHallucination: boolean;
  confidence: number;
  issues: HallucinationIssue[];
  verifiedClaims: VerifiedClaim[];
  overallScore: number;
  recommendation: 'accept' | 'review' | 'reject';
}

export interface HallucinationIssue {
  type: 'contradiction' | 'unsupported' | 'fabrication' | 'exaggeration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  outputSegment: string;
  sourceSegment?: string;
  startIndex: number;
  endIndex: number;
}

export interface VerifiedClaim {
  claim: string;
  verified: boolean;
  confidence: number;
  sourceReference?: string;
}

export class HallucinationDetectionService {
  private static instance: HallucinationDetectionService;

  public static getInstance(): HallucinationDetectionService {
    if (!HallucinationDetectionService.instance) {
      HallucinationDetectionService.instance = new HallucinationDetectionService();
    }
    return HallucinationDetectionService.instance;
  }

  /**
   * Detect hallucinations in AI output
   */
  public async detectHallucination(
    input: string,
    output: string,
    context?: string
  ): Promise<HallucinationResult> {
    const issues: HallucinationIssue[] = [];
    const verifiedClaims: VerifiedClaim[] = [];

    // Combine input and context as source material
    const sourceMaterial = context ? `${input}\n\n${context}` : input;

    // 1. Check for contradictions
    const contradictions = this.detectContradictions(sourceMaterial, output);
    issues.push(...contradictions);

    // 2. Check for unsupported claims
    const unsupportedClaims = this.detectUnsupportedClaims(sourceMaterial, output);
    issues.push(...unsupportedClaims);

    // 3. Check for fabricated details
    const fabrications = this.detectFabrications(sourceMaterial, output);
    issues.push(...fabrications);

    // 4. Check for exaggerations
    const exaggerations = this.detectExaggerations(sourceMaterial, output);
    issues.push(...exaggerations);

    // 5. Verify factual claims
    const claims = this.extractClaims(output);
    for (const claim of claims) {
      const verified = this.verifyClaim(claim, sourceMaterial);
      verifiedClaims.push(verified);
    }

    // Calculate overall score
    let overallScore = this.calculateHallucinationScore(issues, verifiedClaims);

    // Penalize outputs when no source material is provided
    if (input.trim().length === 0 && output.trim().length > 0) {
      overallScore = Math.min(overallScore, 0.6);
    }

    const isHallucination = overallScore < 0.7;
    const confidence = this.calculateConfidence(issues, verifiedClaims);
    const recommendation = this.getRecommendation(overallScore, issues);

    return {
      isHallucination,
      confidence,
      issues,
      verifiedClaims,
      overallScore,
      recommendation,
    };
  }

  /**
   * Detect contradictions between source and output
   */
  private detectContradictions(source: string, output: string): HallucinationIssue[] {
    const issues: HallucinationIssue[] = [];
    
    // Extract key facts from source
    const sourceFacts = this.extractKeyFacts(source);
    const outputSentences = this.splitIntoSentences(output);

    for (const sentence of outputSentences) {
      for (const fact of sourceFacts) {
        if (this.isContradiction(fact, sentence)) {
          issues.push({
            type: 'contradiction',
            severity: 'high',
            description: `Output contradicts source material: "${fact}"`,
            outputSegment: sentence,
            sourceSegment: fact,
            startIndex: output.indexOf(sentence),
            endIndex: output.indexOf(sentence) + sentence.length,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Detect unsupported claims
   */
  private detectUnsupportedClaims(source: string, output: string): HallucinationIssue[] {
    const issues: HallucinationIssue[] = [];

    // If no source provided but there is output, treat output as unsupported claims
    if (source.trim().length === 0 && output.trim().length > 0) {
      issues.push({
        type: 'unsupported',
        severity: 'medium',
        description: 'No source material provided; output is unsupported',
        outputSegment: output,
        startIndex: 0,
        endIndex: output.length,
      });
      return issues;
    }

    const outputSentences = this.splitIntoSentences(output);

    for (const sentence of outputSentences) {
      // Check if sentence makes a factual claim
      if (this.isFactualClaim(sentence)) {
        // Check if claim is supported by source
        if (!this.isSupported(sentence, source)) {
          issues.push({
            type: 'unsupported',
            severity: 'medium',
            description: 'Claim not supported by source material',
            outputSegment: sentence,
            startIndex: output.indexOf(sentence),
            endIndex: output.indexOf(sentence) + sentence.length,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Detect fabricated details
   */
  private detectFabrications(source: string, output: string): HallucinationIssue[] {
    const issues: HallucinationIssue[] = [];

    // Check for specific details that don't appear in source
    const specificPatterns = [
      // Numbers and statistics
      { pattern: /\b\d+(?:\.\d+)?%/g, type: 'percentage' },
      { pattern: /\$\d+(\.\d+)?[KMB]?\b/g, type: 'monetary value' },
      { pattern: /\b\d{4}\b/g, type: 'year' },
      
      // Names and entities
      { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, type: 'proper name' },
      { pattern: /\b[A-Z][A-Z]+\b/g, type: 'acronym' },
      
      // Dates and times
      { pattern: /\b(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2},? \d{4}\b/g, type: 'date' },
    ];

    for (const { pattern, type } of specificPatterns) {
      const outputMatches = output.match(pattern);
      const sourceMatches = source.match(pattern);

      if (outputMatches) {
        for (const match of outputMatches) {
            if (!sourceMatches || !sourceMatches.includes(match)) {
              const startIndex = output.indexOf(match);
              issues.push({
                type: 'fabrication',
                severity: 'high',
                description: `Fabricated ${type}: "${match}" not found in source`,
                outputSegment: match,
                startIndex,
                endIndex: startIndex + match.length,
              });
            }
          }
        }
      }

    return issues;
  }

  /**
   * Detect exaggerations
   */
  private detectExaggerations(source: string, output: string): HallucinationIssue[] {
    const issues: HallucinationIssue[] = [];

    // Check for superlatives and extreme language
    const exaggerationPatterns = [
      /\b(always|never|every|all|none|completely|totally|absolutely|definitely)\b/gi,
      /\b(best|worst|greatest|most|least|highest|lowest)\b/gi,
      /\b(revolutionary|groundbreaking|unprecedented|extraordinary)\b/gi,
    ];

    for (const pattern of exaggerationPatterns) {
      let match;
      while ((match = pattern.exec(output)) !== null) {
        // Check if this strong language is justified by source
        const context = this.getContext(output, match.index, 50);
        if (!this.isJustified(context, source)) {
          issues.push({
            type: 'exaggeration',
            severity: 'low',
            description: `Potentially exaggerated language: "${match[0]}"`,
            outputSegment: context,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Extract factual claims from text
   */
  private extractClaims(text: string): string[] {
    const sentences = this.splitIntoSentences(text);
    return sentences.filter(sentence => this.isFactualClaim(sentence));
  }

  /**
   * Verify a claim against source material
   */
  private verifyClaim(claim: string, source: string): VerifiedClaim {
    const verified = this.isSupported(claim, source);
    const confidence = this.calculateClaimConfidence(claim, source);
    const sourceReference = verified ? this.findSourceReference(claim, source) : undefined;

    return {
      claim,
      verified,
      confidence,
      sourceReference,
    };
  }

  /**
   * Helper: Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Helper: Extract key facts from text
   */
  private extractKeyFacts(text: string): string[] {
    // Simple implementation - extract sentences with factual indicators
    const sentences = this.splitIntoSentences(text);
    return sentences.filter(s => this.isFactualClaim(s));
  }

  /**
   * Helper: Check if sentence is a factual claim
   */
  private isFactualClaim(sentence: string): boolean {
    // Check for factual indicators
    const factualIndicators = [
      /\b(is|are|was|were|has|have|had)\b/i,
      /\b\d+/,
      /\b(said|stated|reported|announced|confirmed)\b/i,
    ];

    return factualIndicators.some(pattern => pattern.test(sentence));
  }

  /**
   * Helper: Check if two statements contradict
   */
  private isContradiction(fact: string, statement: string): boolean {
    // Simple negation detection
    const factLower = fact.toLowerCase();
    const statementLower = statement.toLowerCase();

    // Check for opposite meanings
    if (factLower.includes('not') && !statementLower.includes('not')) {
      return this.haveSimilarContent(factLower, statementLower);
    }
    if (!factLower.includes('not') && statementLower.includes('not')) {
      return this.haveSimilarContent(factLower, statementLower);
    }

    return false;
  }

  /**
   * Helper: Check if claim is supported by source
   */
  private isSupported(claim: string, source: string): boolean {
    const claimWords = claim.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const sourceWords = source.toLowerCase().split(/\s+/);
    
    // Check if most claim words appear in source
    const matchCount = claimWords.filter(word => sourceWords.includes(word)).length;
    return matchCount / claimWords.length > 0.6;
  }

  /**
   * Helper: Check if statements have similar content
   */
  private haveSimilarContent(text1: string, text2: string): boolean {
    const words1 = text1.split(/\s+/).filter(w => w.length > 3);
    const words2 = text2.split(/\s+/).filter(w => w.length > 3);
    
    const commonWords = words1.filter(w => words2.includes(w));
    return commonWords.length / Math.min(words1.length, words2.length) > 0.5;
  }

  /**
   * Helper: Get context around a position
   */
  private getContext(text: string, position: number, radius: number): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(text.length, position + radius);
    return text.substring(start, end);
  }

  /**
   * Helper: Check if strong language is justified
   */
  private isJustified(context: string, source: string): boolean {
    const contextLower = context.toLowerCase();
    const sourceLower = source.toLowerCase();

    const absoluteKeywords = ['always','never','every','all','none','completely','totally','absolutely','definitely'];
    const superlativeKeywords = ['best','worst','greatest','most','least','highest','lowest'];

    const hasAbsInContext = absoluteKeywords.some(k => new RegExp(`\\b${k}\\b`).test(contextLower));
    const hasAbsInSource = absoluteKeywords.some(k => new RegExp(`\\b${k}\\b`).test(sourceLower));

    if (hasAbsInContext && !hasAbsInSource) {
      return false;
    }

    const hasSupInContext = superlativeKeywords.some(k => new RegExp(`\\b${k}\\b`).test(contextLower));
    const hasSupInSource = superlativeKeywords.some(k => new RegExp(`\\b${k}\\b`).test(sourceLower));

    if (hasSupInContext && !hasSupInSource) {
      return false;
    }

    return this.isSupported(context, source);
  }

  /**
   * Helper: Find source reference for claim
   */
  private findSourceReference(claim: string, source: string): string {
    const sentences = this.splitIntoSentences(source);
    for (const sentence of sentences) {
      if (this.haveSimilarContent(claim, sentence)) {
        return sentence;
      }
    }
    return '';
  }

  /**
   * Helper: Calculate claim confidence
   */
  private calculateClaimConfidence(claim: string, source: string): number {
    const claimWords = claim.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const sourceWords = source.toLowerCase().split(/\s+/);
    
    const matchCount = claimWords.filter(word => sourceWords.includes(word)).length;
    return matchCount / claimWords.length;
  }

  /**
   * Calculate overall hallucination score
   */
  private calculateHallucinationScore(
    issues: HallucinationIssue[],
    verifiedClaims: VerifiedClaim[]
  ): number {
    let score = 1.0;

    // Deduct for issues
    for (const issue of issues) {
      const deduction = {
        low: 0.05,
        medium: 0.1,
        high: 0.2,
        critical: 0.3,
      }[issue.severity];
      score -= deduction;
    }

    // Adjust based on verified claims
    if (verifiedClaims.length > 0) {
      const verifiedRatio = verifiedClaims.filter(c => c.verified).length / verifiedClaims.length;
      score = (score + verifiedRatio) / 2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate confidence in detection
   */
  private calculateConfidence(
    issues: HallucinationIssue[],
    verifiedClaims: VerifiedClaim[]
  ): number {
    // Higher confidence with more evidence
    const evidenceCount = issues.length + verifiedClaims.length;
    return Math.min(0.95, 0.5 + (evidenceCount * 0.05));
  }

  /**
   * Get recommendation based on score
   */
  private getRecommendation(
    score: number,
    issues: HallucinationIssue[]
  ): 'accept' | 'review' | 'reject' {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    
    if (criticalIssues > 0 || score < 0.5) return 'reject';
    if (score < 0.7 || issues.length > 3) return 'review';
    return 'accept';
  }
}

// Export singleton
export const hallucinationDetectionService = HallucinationDetectionService.getInstance();

