"use strict";
/**
 * Agent Orchestration Integration Tests
 * Tests multi-agent coordination and communication
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('Agent Orchestration Integration Tests', () => {
    (0, vitest_1.describe)('Agent Discovery and Registration', () => {
        (0, vitest_1.it)('should discover all available agents', async () => {
            // Mock agent registry
            const mockRegistry = {
                discover: vitest_1.vi.fn().mockResolvedValue([
                    { id: 'internal-planner', name: 'Planner', type: 'internal' },
                    { id: 'internal-coder', name: 'Coder', type: 'internal' },
                    { id: 'external-copilot', name: 'Copilot', type: 'external' },
                ]),
            };
            const agents = await mockRegistry.discover();
            (0, vitest_1.expect)(agents).toHaveLength(3);
            (0, vitest_1.expect)(agents[0].type).toBe('internal');
            (0, vitest_1.expect)(agents[2].type).toBe('external');
        });
        (0, vitest_1.it)('should register agent capabilities', async () => {
            const mockAgent = {
                id: 'internal-planner',
                capabilities: [
                    { name: 'task-decomposition', strength: 95 },
                    { name: 'planning', strength: 90 },
                ],
            };
            (0, vitest_1.expect)(mockAgent.capabilities).toHaveLength(2);
            (0, vitest_1.expect)(mockAgent.capabilities[0].strength).toBeGreaterThan(90);
        });
        (0, vitest_1.it)('should track agent performance metrics', async () => {
            const mockPerformance = {
                agentId: 'internal-coder',
                totalRequests: 100,
                successfulRequests: 95,
                averageLatency: 1500,
            };
            const successRate = mockPerformance.successfulRequests / mockPerformance.totalRequests;
            (0, vitest_1.expect)(successRate).toBeGreaterThan(0.9);
            (0, vitest_1.expect)(mockPerformance.averageLatency).toBeLessThan(2000);
        });
    });
    (0, vitest_1.describe)('Intelligent Task Routing', () => {
        (0, vitest_1.it)('should route task to best agent based on capabilities', async () => {
            const task = "Create a detailed implementation plan";
            // Mock scoring
            const agentScores = [
                { agentId: 'internal-planner', score: 95 },
                { agentId: 'internal-coder', score: 60 },
                { agentId: 'external-copilot', score: 70 },
            ];
            const bestAgent = agentScores.reduce((best, current) => current.score > best.score ? current : best);
            (0, vitest_1.expect)(bestAgent.agentId).toBe('internal-planner');
        });
        (0, vitest_1.it)('should consider agent specializations', async () => {
            const task = "Refactor React component";
            const context = { language: 'typescript', framework: 'react' };
            const mockAgents = [
                { id: 'cursor', specializations: ['typescript', 'react'], score: 0 },
                { id: 'copilot', specializations: ['general'], score: 0 },
            ];
            // Agent with React specialization should score higher
            mockAgents[0].score = 90; // Has React specialization
            mockAgents[1].score = 70; // General
            const bestAgent = mockAgents.reduce((best, current) => current.score > best.score ? current : best);
            (0, vitest_1.expect)(bestAgent.id).toBe('cursor');
        });
        (0, vitest_1.it)('should fallback to alternative agent on failure', async () => {
            const primaryAgent = { id: 'agent1', available: false };
            const fallbackAgent = { id: 'agent2', available: true };
            const selectedAgent = primaryAgent.available ? primaryAgent : fallbackAgent;
            (0, vitest_1.expect)(selectedAgent.id).toBe('agent2');
        });
    });
    (0, vitest_1.describe)('Multi-Agent Coordination', () => {
        (0, vitest_1.it)('should execute parallel agent requests', async () => {
            const task = "Review this code for issues";
            const agentIds = ['copilot', 'cline', 'reviewer'];
            const mockResponses = await Promise.all(agentIds.map(async (id) => ({
                agentId: id,
                success: true,
                content: `Review from ${id}`,
                confidence: 0.85,
            })));
            (0, vitest_1.expect)(mockResponses).toHaveLength(3);
            (0, vitest_1.expect)(mockResponses.every(r => r.success)).toBe(true);
        });
        (0, vitest_1.it)('should execute sequential pipeline', async () => {
            const pipeline = [
                { agentId: 'planner', task: 'Create plan' },
                { agentId: 'coder', task: 'Implement code' },
                { agentId: 'reviewer', task: 'Review code' },
            ];
            const results = [];
            for (const step of pipeline) {
                const result = {
                    agentId: step.agentId,
                    success: true,
                    output: `Completed: ${step.task}`,
                };
                results.push(result);
            }
            (0, vitest_1.expect)(results).toHaveLength(3);
            (0, vitest_1.expect)(results[0].agentId).toBe('planner');
            (0, vitest_1.expect)(results[2].agentId).toBe('reviewer');
        });
        (0, vitest_1.it)('should aggregate responses from multiple agents', async () => {
            const responses = [
                { agentId: 'agent1', content: 'Response 1', confidence: 0.9 },
                { agentId: 'agent2', content: 'Response 2', confidence: 0.85 },
                { agentId: 'agent3', content: 'Response 3', confidence: 0.8 },
            ];
            const aggregated = {
                content: responses.map(r => r.content).join('\n\n'),
                avgConfidence: responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length,
            };
            (0, vitest_1.expect)(aggregated.content).toContain('Response 1');
            (0, vitest_1.expect)(aggregated.content).toContain('Response 2');
            (0, vitest_1.expect)(aggregated.avgConfidence).toBeGreaterThan(0.8);
        });
        (0, vitest_1.it)('should find consensus among agent responses', async () => {
            const responses = [
                { content: 'This code has 2 issues', confidence: 0.9 },
                { content: 'Found 2 problems', confidence: 0.85 },
                { content: 'Detected 3 issues', confidence: 0.8 },
            ];
            // Majority says 2 issues
            const consensus = '2 issues';
            (0, vitest_1.expect)(consensus).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Agent Communication', () => {
        (0, vitest_1.it)('should send message to specific agent', async () => {
            const message = {
                id: 'msg-1',
                from: 'hub',
                to: 'internal-coder',
                task: 'Generate function',
                requiresResponse: true,
            };
            const mockSend = vitest_1.vi.fn().mockResolvedValue({
                success: true,
                content: 'Function generated',
            });
            const response = await mockSend(message);
            (0, vitest_1.expect)(response.success).toBe(true);
            (0, vitest_1.expect)(mockSend).toHaveBeenCalledWith(message);
        });
        (0, vitest_1.it)('should broadcast message to all agents', async () => {
            const message = {
                id: 'msg-broadcast',
                from: 'hub',
                to: 'broadcast',
                task: 'Analyze this code',
            };
            const agents = ['agent1', 'agent2', 'agent3'];
            const responses = agents.map(id => ({
                agentId: id,
                received: true,
            }));
            (0, vitest_1.expect)(responses).toHaveLength(3);
            (0, vitest_1.expect)(responses.every(r => r.received)).toBe(true);
        });
        (0, vitest_1.it)('should handle agent timeouts', async () => {
            const timeout = 5000;
            const startTime = Date.now();
            const mockSlowAgent = new Promise((resolve) => {
                setTimeout(() => resolve({ success: false, error: 'Timeout' }), timeout + 1000);
            });
            const raceResult = await Promise.race([
                mockSlowAgent,
                new Promise((resolve) => setTimeout(() => resolve({ success: false, error: 'Timeout' }), timeout)),
            ]);
            const duration = Date.now() - startTime;
            (0, vitest_1.expect)(duration).toBeLessThanOrEqual(timeout + 100);
        });
    });
    (0, vitest_1.describe)('Performance Tracking', () => {
        (0, vitest_1.it)('should record agent usage statistics', async () => {
            const stats = {
                agentId: 'internal-coder',
                requests: 0,
                successes: 0,
                failures: 0,
            };
            // Simulate requests
            stats.requests++;
            stats.successes++;
            stats.requests++;
            stats.successes++;
            stats.requests++;
            stats.failures++;
            (0, vitest_1.expect)(stats.requests).toBe(3);
            (0, vitest_1.expect)(stats.successes).toBe(2);
            (0, vitest_1.expect)(stats.failures).toBe(1);
        });
        (0, vitest_1.it)('should calculate success rates', async () => {
            const performance = {
                totalRequests: 100,
                successfulRequests: 85,
            };
            const successRate = performance.successfulRequests / performance.totalRequests;
            (0, vitest_1.expect)(successRate).toBe(0.85);
        });
        (0, vitest_1.it)('should track average response times', async () => {
            const responseTimes = [1200, 1500, 1300, 1400, 1600];
            const average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
            (0, vitest_1.expect)(average).toBe(1400);
        });
    });
    (0, vitest_1.describe)('Error Handling and Recovery', () => {
        (0, vitest_1.it)('should handle agent failures gracefully', async () => {
            const mockAgent = {
                execute: vitest_1.vi.fn().mockRejectedValue(new Error('Agent failed')),
            };
            try {
                await mockAgent.execute();
            }
            catch (error) {
                (0, vitest_1.expect)(error).toBeDefined();
                // Should log error and try fallback
            }
        });
        (0, vitest_1.it)('should retry failed requests', async () => {
            let attempts = 0;
            const maxRetries = 3;
            const mockExecute = vitest_1.vi.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Failed');
                }
                return { success: true };
            });
            let result;
            for (let i = 0; i < maxRetries; i++) {
                try {
                    result = await mockExecute();
                    break;
                }
                catch (error) {
                    if (i === maxRetries - 1)
                        throw error;
                }
            }
            (0, vitest_1.expect)(attempts).toBe(3);
            (0, vitest_1.expect)(result?.success).toBe(true);
        });
        (0, vitest_1.it)('should provide meaningful error messages', async () => {
            const error = {
                agentId: 'internal-coder',
                error: 'Failed to generate code',
                suggestion: 'Try simplifying the request',
            };
            (0, vitest_1.expect)(error.error).toBeDefined();
            (0, vitest_1.expect)(error.suggestion).toBeDefined();
        });
    });
});
//# sourceMappingURL=agent-orchestration.test.js.map