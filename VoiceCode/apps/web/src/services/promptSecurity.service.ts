/**
 * Prompt Security Service
 * Comprehensive security layer for AI prompts and responses
 * 
 * Features:
 * - Prompt injection detection
 * - PII detection and redaction
 * - Output sanitization
 * - Content policy enforcement
 * - Jailbreak prevention
 */

// Types
export interface PIIDetectionResult {
  hasPII: boolean;
  types: PIIType[];
  redactedText: string;
  detections: PIIDetection[];
}

export interface PIIDetection {
  type: PIIType;
  value: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export type PIIType = 
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'address'
  | 'name'
  | 'date_of_birth';

export interface PromptInjectionResult {
  isInjection: boolean;
  confidence: number;
  patterns: string[];
  sanitizedInput: string;
}

export interface ContentPolicyResult {
  allowed: boolean;
  violations: ContentViolation[];
  confidence: number;
  sanitizedContent?: string;
}

export interface ContentViolation {
  type: ViolationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  startIndex: number;
  endIndex: number;
}

export type ViolationType =
  | 'toxicity'
  | 'hate_speech'
  | 'violence'
  | 'sexual_content'
  | 'self_harm'
  | 'illegal_activity'
  | 'spam'
  | 'malware';

export class PromptSecurityService {
  private static instance: PromptSecurityService;

  // Singleton pattern
  public static getInstance(): PromptSecurityService {
    if (!PromptSecurityService.instance) {
      PromptSecurityService.instance = new PromptSecurityService();
    }
    return PromptSecurityService.instance;
  }

  /**
   * Detect prompt injection attempts
   */
  public detectPromptInjection(input: string): PromptInjectionResult {
    const injectionPatterns = [
      // Direct instruction override (broadened to allow optional adjectives in between)
      { pattern: /ignore\s+(?:all\s+)?(?:previous|above)?\s*instructions?/i, weight: 0.95 },
      { pattern: /disregard\s+(?:all\s+)?(?:previous|above)?\s*(?:instructions?|prompts?)/i, weight: 0.9 },
      { pattern: /forget\s+(?:all\s+)?(?:previous|above)?\s*(?:instructions?|prompts?)/i, weight: 0.9 },
      { pattern: /ignore\s+instructions?/i, weight: 0.85 },

      // Role manipulation
      { pattern: /you are now/i, weight: 0.8 },
      { pattern: /act as (?:if )?you (?:are|were)/i, weight: 0.7 },
      { pattern: /pretend (?:to be|you are)/i, weight: 0.7 },

      // System prompt injection
      { pattern: /new instructions?:/i, weight: 0.9 },
      { pattern: /system:/i, weight: 0.8 },
      { pattern: /\[SYSTEM\]/i, weight: 0.9 },
      { pattern: /<\|im_start\|>/i, weight: 1 },
      { pattern: /<\|im_end\|>/i, weight: 1 },
      { pattern: /<\|system\|>/i, weight: 1 },

      // Delimiter injection
      { pattern: /---\s*END\s*INSTRUCTIONS?\s*---/i, weight: 0.8 },
      { pattern: /\*\*\*\s*NEW\s*PROMPT\s*\*\*\*/i, weight: 0.8 },

      // Jailbreak attempts
      { pattern: /DAN mode/i, weight: 0.9 },
      { pattern: /developer mode/i, weight: 0.7 },
      { pattern: /sudo mode/i, weight: 0.8 },
      { pattern: /god mode/i, weight: 0.8 },

      // Encoding tricks
      { pattern: /base64:/i, weight: 0.6 },
      { pattern: /rot13:/i, weight: 0.6 },
      { pattern: /hex:/i, weight: 0.6 },
    ];

    let maxConfidence = 0;
    const detectedPatterns: string[] = [];

    for (const { pattern, weight } of injectionPatterns) {
      if (pattern.test(input)) {
        maxConfidence = Math.max(maxConfidence, weight);
        detectedPatterns.push(pattern.source);
      }
    }

    const isInjection = maxConfidence > 0.6;
    const sanitizedInput = isInjection ? this.sanitizePromptInjection(input) : input;

    return {
      isInjection,
      confidence: maxConfidence,
      patterns: detectedPatterns,
      sanitizedInput,
    };
  }

  /**
   * Sanitize prompt injection attempts
   */
  private sanitizePromptInjection(input: string): string {
    let sanitized = input;

    // Remove system delimiters
    sanitized = sanitized.replaceAll(/<\|im_start\|>/gi, '');
    sanitized = sanitized.replaceAll(/<\|im_end\|>/gi, '');
    sanitized = sanitized.replaceAll(/<\|system\|>/gi, '');
    sanitized = sanitized.replaceAll(/\[SYSTEM\]/gi, '');

    // Remove instruction override attempts (broadened)
    sanitized = sanitized.replaceAll(/ignore\s+(?:all\s+)?(?:previous|above)?\s*instructions?/gi, '');
    sanitized = sanitized.replaceAll(/disregard\s+(?:all\s+)?(?:previous|above)?\s*(?:instructions?|prompts?)/gi, '');
    sanitized = sanitized.replaceAll(/forget\s+(?:all\s+)?(?:previous|above)?\s*(?:instructions?|prompts?)/gi, '');
    sanitized = sanitized.replaceAll(/ignore\s+instructions?/gi, '');

    return sanitized.trim();
  }

  /**
   * Detect and redact PII
   */
  public detectPII(text: string): PIIDetectionResult {
    const detections: PIIDetection[] = [];
    let redactedText = text;

    // Email detection
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let match;
    while ((match = emailPattern.exec(text)) !== null) {
      detections.push({
        type: 'email',
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.95,
      });
      redactedText = redactedText.replace(match[0], '[EMAIL_REDACTED]');
    }

    // Phone number detection (US format)
    const phonePattern = /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    while ((match = phonePattern.exec(text)) !== null) {
      detections.push({
        type: 'phone',
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.9,
      });
      redactedText = redactedText.replace(match[0], '[PHONE_REDACTED]');
    }

    // SSN detection
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
    while ((match = ssnPattern.exec(text)) !== null) {
      detections.push({
        type: 'ssn',
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.98,
      });
      redactedText = redactedText.replace(match[0], '[SSN_REDACTED]');
    }

    // Credit card detection
    const ccPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
    while ((match = ccPattern.exec(text)) !== null) {
      detections.push({
        type: 'credit_card',
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.85,
      });
      redactedText = redactedText.replace(match[0], '[CREDIT_CARD_REDACTED]');
    }

    // IP address detection
    const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    while ((match = ipPattern.exec(text)) !== null) {
      detections.push({
        type: 'ip_address',
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        confidence: 0.8,
      });
      redactedText = redactedText.replace(match[0], '[IP_REDACTED]');
    }

    const types = [...new Set(detections.map(d => d.type))];

    return {
      hasPII: detections.length > 0,
      types,
      redactedText,
      detections,
    };
  }

  /**
   * Sanitize AI output
   */
  public sanitizeOutput(text: string): string {
    let sanitized = text;

    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Escape HTML special characters
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    };

    sanitized = sanitized.replace(/[&<>"'/]/g, (char) => escapeMap[char]);

    return sanitized;
  }

  /**
   * Check content against policy
   */
  public async checkContentPolicy(text: string): Promise<ContentPolicyResult> {
    const violations: ContentViolation[] = [];

    // Toxicity patterns
    const toxicPatterns = [
      { pattern: /\b(stupid|idiot|moron|dumb)\b/gi, severity: 'low' as const },
      { pattern: /\b(hate|despise|loathe)\b/gi, severity: 'medium' as const },
    ];

    // Hate speech patterns
    const hateSpeechPatterns = [
      { pattern: /\b(racist|sexist|homophobic)\b/gi, severity: 'high' as const },
    ];

    // Violence patterns
    const violencePatterns = [
      { pattern: /\b(kill|murder|assault|attack)\b/gi, severity: 'high' as const },
    ];

    // Check all patterns
    for (const { pattern, severity } of [...toxicPatterns, ...hateSpeechPatterns, ...violencePatterns]) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        violations.push({
          type: 'toxicity', // Simplified for this example
          severity,
          description: `Potentially inappropriate content detected: "${match[0]}"`,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }

    const allowed = violations.filter(v => v.severity === 'high' || v.severity === 'critical').length === 0;
    const confidence = violations.length === 0 ? 1.0 : 0.5;

    return {
      allowed,
      violations,
      confidence,
    };
  }

  /**
   * Comprehensive security check
   */
  public async performSecurityCheck(input: string): Promise<{
    safe: boolean;
    injectionResult: PromptInjectionResult;
    piiResult: PIIDetectionResult;
    policyResult: ContentPolicyResult;
    sanitizedInput: string;
  }> {
    // Check for prompt injection
    const injectionResult = this.detectPromptInjection(input);

    // Check for PII
    const piiResult = this.detectPII(input);

    // Check content policy
    const policyResult = await this.checkContentPolicy(input);

    // Determine if input is safe
    // Consider injection with high confidence as unsafe
    const safe = !(injectionResult.isInjection && injectionResult.confidence > 0.6) && policyResult.allowed;

    // Use sanitized versions - apply both injection and PII sanitization
    let sanitizedInput = injectionResult.sanitizedInput;
    if (piiResult.hasPII) {
      // Apply PII redaction to the already injection-sanitized input
      const piiResultOnSanitized = this.detectPII(sanitizedInput);
      sanitizedInput = piiResultOnSanitized.redactedText;
    }

    return {
      safe,
      injectionResult,
      piiResult,
      policyResult,
      sanitizedInput,
    };
  }
}

// Export singleton instance
export const promptSecurityService = PromptSecurityService.getInstance();

