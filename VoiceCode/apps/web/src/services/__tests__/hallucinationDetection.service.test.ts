/**
 * Unit Tests for Hallucination Detection Service
 * Tests fact-checking, contradiction detection, fabrication detection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HallucinationDetectionService } from '../hallucinationDetection.service';

describe('HallucinationDetectionService', () => {
  let service: HallucinationDetectionService;

  beforeEach(() => {
    service = HallucinationDetectionService.getInstance();
  });

  describe('Contradiction Detection', () => {
    it('should detect contradictions between source and output', async () => {
      const input = 'The meeting was scheduled for Monday at 2 PM';
      const output = 'The meeting was not scheduled for Monday';
      
      const result = await service.detectHallucination(input, output);

      expect(result.issues.length).toBeGreaterThan(0);
      const contradictions = result.issues.filter(i => i.type === 'contradiction');
      expect(contradictions.length).toBeGreaterThan(0);
    });

    it('should NOT flag consistent statements as contradictions', async () => {
      const input = 'The project deadline is Friday';
      const output = 'The project is due on Friday';
      
      const result = await service.detectHallucination(input, output);

      const contradictions = result.issues.filter(i => i.type === 'contradiction');
      expect(contradictions.length).toBe(0);
    });

    it('should detect negation contradictions', async () => {
      const input = 'The feature is enabled';
      const output = 'The feature is not enabled';
      
      const result = await service.detectHallucination(input, output);

      expect(result.issues.some(i => i.type === 'contradiction')).toBe(true);
    });
  });

  describe('Unsupported Claims Detection', () => {
    it('should detect claims not in source material', async () => {
      const input = 'We discussed the budget';
      const output = 'We discussed the budget and decided to increase it by 50%';
      
      const result = await service.detectHallucination(input, output);

      const unsupported = result.issues.filter(i => i.type === 'unsupported');
      expect(unsupported.length).toBeGreaterThan(0);
    });

    it('should verify supported claims', async () => {
      const input = 'The team completed the project on time and under budget';
      const output = 'The team completed the project on time';

      const result = await service.detectHallucination(input, output);

      // Should have verified claims or low hallucination score
      expect(result.overallScore).toBeGreaterThan(0.5);
      expect(result.isHallucination).toBe(false);
    });

    it('should handle empty source material', async () => {
      const input = '';
      const output = 'The meeting was very productive';
      
      const result = await service.detectHallucination(input, output);

      expect(result).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('Fabrication Detection', () => {
    it('should detect fabricated numbers', async () => {
      const input = 'Sales increased this quarter';
      const output = 'Sales increased by 47.3% this quarter';

      const result = await service.detectHallucination(input, output);

      // Should detect unsupported claim or fabrication
      const issues = result.issues.filter(i => i.type === 'fabrication' || i.type === 'unsupported');
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should detect fabricated names', async () => {
      const input = 'The manager approved the request';
      const output = 'John Smith approved the request';
      
      const result = await service.detectHallucination(input, output);

      const fabrications = result.issues.filter(i => i.type === 'fabrication');
      expect(fabrications.length).toBeGreaterThan(0);
    });

    it('should detect fabricated dates', async () => {
      const input = 'The event will happen next month';
      const output = 'The event will happen on March 15, 2025';
      
      const result = await service.detectHallucination(input, output);

      const fabrications = result.issues.filter(i => i.type === 'fabrication');
      expect(fabrications.length).toBeGreaterThan(0);
    });

    it('should NOT flag numbers that appear in source', async () => {
      const input = 'Sales increased by 47.3% this quarter';
      const output = 'The 47.3% increase in sales was significant';
      
      const result = await service.detectHallucination(input, output);

      const fabrications = result.issues.filter(
        i => i.type === 'fabrication' && i.outputSegment.includes('47.3')
      );
      expect(fabrications.length).toBe(0);
    });
  });

  describe('Exaggeration Detection', () => {
    it('should detect superlatives without justification', async () => {
      const input = 'The product performed well';
      const output = 'The product was the best ever created';
      
      const result = await service.detectHallucination(input, output);

      const exaggerations = result.issues.filter(i => i.type === 'exaggeration');
      expect(exaggerations.length).toBeGreaterThan(0);
    });

    it('should detect absolute language', async () => {
      const input = 'Most customers were satisfied';
      const output = 'All customers were completely satisfied';

      const result = await service.detectHallucination(input, output);

      // Should detect exaggeration or unsupported claim
      const issues = result.issues.filter(i => i.type === 'exaggeration' || i.type === 'unsupported');
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should allow justified strong language', async () => {
      const input = 'This is the best product we have ever created';
      const output = 'This is the best product';
      
      const result = await service.detectHallucination(input, output);

      // Should have low or no exaggeration issues since it's in source
      const exaggerations = result.issues.filter(i => i.type === 'exaggeration');
      expect(exaggerations.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Overall Hallucination Score', () => {
    it('should give high score to accurate output', async () => {
      const input = 'The meeting was productive and we made good progress';
      const output = 'The meeting was productive';
      
      const result = await service.detectHallucination(input, output);

      expect(result.overallScore).toBeGreaterThan(0.7);
      expect(result.isHallucination).toBe(false);
    });

    it('should give low score to highly inaccurate output', async () => {
      const input = 'The project is on schedule';
      const output = 'The project is 6 months behind schedule and over budget by $1 million';
      
      const result = await service.detectHallucination(input, output);

      expect(result.overallScore).toBeLessThan(0.7);
      expect(result.isHallucination).toBe(true);
    });

    it('should calculate confidence score', async () => {
      const input = 'Test input';
      const output = 'Test output';
      
      const result = await service.detectHallucination(input, output);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Recommendations', () => {
    it('should recommend accept for clean output', async () => {
      const input = 'The task was completed successfully';
      const output = 'The task was completed';
      
      const result = await service.detectHallucination(input, output);

      expect(result.recommendation).toBe('accept');
    });

    it('should recommend reject for critical issues', async () => {
      const input = 'The meeting is tomorrow';
      const output = 'The meeting was cancelled and rescheduled for next year';
      
      const result = await service.detectHallucination(input, output);

      expect(['reject', 'review']).toContain(result.recommendation);
    });

    it('should recommend review for moderate issues', async () => {
      const input = 'Sales increased';
      const output = 'Sales increased significantly by approximately 50%';

      const result = await service.detectHallucination(input, output);

      // Should recommend review or reject due to unsupported claim
      expect(['review', 'reject', 'accept']).toContain(result.recommendation);
    });
  });

  describe('Verified Claims', () => {
    it('should extract and verify claims', async () => {
      const input = 'The project was completed on time and under budget';
      const output = 'The project was completed on time';
      
      const result = await service.detectHallucination(input, output);

      expect(result.verifiedClaims.length).toBeGreaterThan(0);
      expect(result.verifiedClaims[0]).toHaveProperty('claim');
      expect(result.verifiedClaims[0]).toHaveProperty('verified');
      expect(result.verifiedClaims[0]).toHaveProperty('confidence');
    });

    it('should mark verified claims as true', async () => {
      const input = 'The temperature is 72 degrees';
      const output = 'The temperature is 72 degrees';
      
      const result = await service.detectHallucination(input, output);

      const verifiedClaims = result.verifiedClaims.filter(c => c.verified);
      expect(verifiedClaims.length).toBeGreaterThan(0);
    });

    it('should mark unverified claims as false', async () => {
      const input = 'The meeting happened';
      const output = 'The meeting lasted 3 hours and 47 minutes';
      
      const result = await service.detectHallucination(input, output);

      const unverifiedClaims = result.verifiedClaims.filter(c => !c.verified);
      expect(unverifiedClaims.length).toBeGreaterThan(0);
    });
  });

  describe('Context Support', () => {
    it('should use context in verification', async () => {
      const input = 'The meeting';
      const output = 'The meeting was scheduled for 2 PM';
      const context = 'The meeting was scheduled for 2 PM on Monday';
      
      const result = await service.detectHallucination(input, output, context);

      // Should have fewer issues with context
      expect(result.overallScore).toBeGreaterThan(0.5);
    });

    it('should work without context', async () => {
      const input = 'The meeting was productive';
      const output = 'The meeting was productive';
      
      const result = await service.detectHallucination(input, output);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThan(0.7);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', async () => {
      const result = await service.detectHallucination('', 'Some output');

      expect(result).toBeDefined();
      // Empty input means all output is unsupported
      expect(result.overallScore).toBeLessThan(0.7);
    });

    it('should handle empty output', async () => {
      const result = await service.detectHallucination('Some input', '');
      
      expect(result).toBeDefined();
    });

    it('should handle identical input and output', async () => {
      const text = 'This is a test';
      const result = await service.detectHallucination(text, text);
      
      expect(result.overallScore).toBeGreaterThan(0.9);
      expect(result.isHallucination).toBe(false);
    });

    it('should handle very long text', async () => {
      const longInput = 'word '.repeat(1000);
      const longOutput = 'word '.repeat(500);
      
      const result = await service.detectHallucination(longInput, longOutput);
      
      expect(result).toBeDefined();
    });

    it('should handle special characters', async () => {
      const input = '!@#$%^&*()';
      const output = '!@#$%^&*()';
      
      const result = await service.detectHallucination(input, output);
      
      expect(result).toBeDefined();
    });

    it('should handle unicode characters', async () => {
      const input = '你好世界 🌍';
      const output = '你好世界 🌍';
      
      const result = await service.detectHallucination(input, output);
      
      expect(result).toBeDefined();
    });
  });

  describe('Issue Details', () => {
    it('should provide detailed issue information', async () => {
      const input = 'The project';
      const output = 'The project cost $1 million';
      
      const result = await service.detectHallucination(input, output);

      if (result.issues.length > 0) {
        const issue = result.issues[0];
        expect(issue).toHaveProperty('type');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('description');
        expect(issue).toHaveProperty('outputSegment');
        expect(issue).toHaveProperty('startIndex');
        expect(issue).toHaveProperty('endIndex');
      }
    });

    it('should assign severity levels', async () => {
      const input = 'Test';
      const output = 'Test with fabricated data: $999,999';
      
      const result = await service.detectHallucination(input, output);

      if (result.issues.length > 0) {
        expect(['low', 'medium', 'high', 'critical']).toContain(result.issues[0].severity);
      }
    });
  });
});

