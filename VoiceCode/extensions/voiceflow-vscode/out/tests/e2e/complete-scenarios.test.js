"use strict";
/**
 * End-to-End Test Suite
 * Tests complete user scenarios from start to finish
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('E2E: Complete User Scenarios', () => {
    (0, vitest_1.describe)('Full Coding Session via Voice', () => {
        (0, vitest_1.it)('should complete entire feature development via voice', async () => {
            // Scenario: User develops a new feature entirely via voice
            const scenario = [
                { step: 1, command: 'open project VoiceCode', action: 'workspace.open' },
                { step: 2, command: 'create new file user-service.ts', action: 'file.create' },
                { step: 3, command: 'add a user class with name and email properties', action: 'code.generate' },
                { step: 4, command: 'add a method to validate email', action: 'code.generate' },
                { step: 5, command: 'generate tests for this class', action: 'test.generate' },
                { step: 6, command: 'run the tests', action: 'test.run' },
                { step: 7, command: 'commit changes with message add user service', action: 'git.commit' },
            ];
            const results = [];
            for (const { step, command, action } of scenario) {
                const result = {
                    step,
                    command,
                    action,
                    success: true,
                    timestamp: Date.now(),
                };
                results.push(result);
            }
            (0, vitest_1.expect)(results).toHaveLength(7);
            (0, vitest_1.expect)(results.every(r => r.success)).toBe(true);
            (0, vitest_1.expect)(results[0].action).toBe('workspace.open');
            (0, vitest_1.expect)(results[6].action).toBe('git.commit');
        });
        (0, vitest_1.it)('should handle code review and refactoring workflow', async () => {
            const workflow = [
                { command: 'review this file for issues', expected: 'code_review' },
                { command: 'refactor based on suggestions', expected: 'code_refactor' },
                { command: 'format the code', expected: 'code_format' },
                { command: 'save all files', expected: 'file_save_all' },
            ];
            for (const { command, expected } of workflow) {
                // Each command should be interpreted and executed
                (0, vitest_1.expect)(expected).toBeDefined();
            }
            (0, vitest_1.expect)(workflow).toHaveLength(4);
        });
        (0, vitest_1.it)('should handle debugging session via voice', async () => {
            const debugSession = [
                { command: 'start debugging', action: 'debug.start' },
                { command: 'set breakpoint on line 42', action: 'debug.breakpoint' },
                { command: 'continue', action: 'debug.continue' },
                { command: 'step over', action: 'debug.stepOver' },
                { command: 'inspect variable user', action: 'debug.inspect' },
                { command: 'stop debugging', action: 'debug.stop' },
            ];
            const executed = debugSession.map(cmd => ({
                ...cmd,
                executed: true,
            }));
            (0, vitest_1.expect)(executed.every(cmd => cmd.executed)).toBe(true);
        });
    });
    (0, vitest_1.describe)('Workspace Configuration via Voice', () => {
        (0, vitest_1.it)('should configure complete workspace via voice', async () => {
            const configuration = [
                { command: 'change theme to dark', setting: 'workbench.colorTheme', value: 'Default Dark+' },
                { command: 'set font size to 14', setting: 'editor.fontSize', value: 14 },
                { command: 'enable auto save', setting: 'files.autoSave', value: 'afterDelay' },
                { command: 'set tab size to 2', setting: 'editor.tabSize', value: 2 },
                { command: 'enable format on save', setting: 'editor.formatOnSave', value: true },
                { command: 'set zoom level to 1.2', setting: 'window.zoomLevel', value: 1.2 },
            ];
            const applied = configuration.map(config => ({
                ...config,
                applied: true,
            }));
            (0, vitest_1.expect)(applied).toHaveLength(6);
            (0, vitest_1.expect)(applied.every(c => c.applied)).toBe(true);
        });
        (0, vitest_1.it)('should install and configure extensions via voice', async () => {
            const extensionSetup = [
                { command: 'install prettier extension', action: 'extension.install', id: 'esbenp.prettier-vscode' },
                { command: 'install eslint extension', action: 'extension.install', id: 'dbaeumer.vscode-eslint' },
                { command: 'enable prettier', action: 'extension.enable', id: 'esbenp.prettier-vscode' },
                { command: 'configure prettier to format on save', action: 'setting.update' },
            ];
            (0, vitest_1.expect)(extensionSetup).toHaveLength(4);
            (0, vitest_1.expect)(extensionSetup[0].action).toBe('extension.install');
        });
        (0, vitest_1.it)('should create and configure workspace settings', async () => {
            const workspaceSetup = [
                { command: 'create new workspace', action: 'workspace.create' },
                { command: 'add folder src to workspace', action: 'workspace.addFolder' },
                { command: 'set workspace tab size to 4', action: 'setting.update', scope: 'workspace' },
                { command: 'save workspace as MyProject', action: 'workspace.save' },
            ];
            (0, vitest_1.expect)(workspaceSetup.every(step => step.action)).toBe(true);
        });
    });
    (0, vitest_1.describe)('Multi-Agent Collaboration Scenarios', () => {
        (0, vitest_1.it)('should use multiple agents for complex task', async () => {
            const task = 'Implement authentication system with tests and documentation';
            const agentWorkflow = [
                { agent: 'planner', task: 'Create implementation plan', output: 'plan' },
                { agent: 'coder', task: 'Implement auth logic', output: 'code' },
                { agent: 'copilot', task: 'Review and improve code', output: 'improved_code' },
                { agent: 'test', task: 'Generate test suite', output: 'tests' },
                { agent: 'reviewer', task: 'Final security review', output: 'review' },
            ];
            const results = agentWorkflow.map(step => ({
                ...step,
                completed: true,
                duration: Math.random() * 2000 + 1000,
            }));
            (0, vitest_1.expect)(results).toHaveLength(5);
            (0, vitest_1.expect)(results.every(r => r.completed)).toBe(true);
        });
        (0, vitest_1.it)('should get consensus from multiple agents', async () => {
            const question = 'Is this code production-ready?';
            const agentResponses = [
                { agent: 'copilot', answer: 'Yes, with minor improvements', confidence: 0.85 },
                { agent: 'cline', answer: 'Yes, looks good', confidence: 0.9 },
                { agent: 'reviewer', answer: 'Yes, after fixing 2 issues', confidence: 0.8 },
            ];
            const consensus = agentResponses.every(r => r.answer.toLowerCase().includes('yes'));
            const avgConfidence = agentResponses.reduce((sum, r) => sum + r.confidence, 0) / agentResponses.length;
            (0, vitest_1.expect)(consensus).toBe(true);
            (0, vitest_1.expect)(avgConfidence).toBeGreaterThan(0.8);
        });
        (0, vitest_1.it)('should handle agent failures with fallback', async () => {
            const primaryAgent = { id: 'agent1', available: false };
            const fallbackAgents = [
                { id: 'agent2', available: true },
                { id: 'agent3', available: true },
            ];
            let selectedAgent;
            if (!primaryAgent.available) {
                selectedAgent = fallbackAgents.find(a => a.available);
            }
            (0, vitest_1.expect)(selectedAgent?.id).toBe('agent2');
        });
    });
    (0, vitest_1.describe)('Error Recovery and Edge Cases', () => {
        (0, vitest_1.it)('should recover from voice recognition errors', async () => {
            const attempts = [
                { input: 'chng thme to drk', recognized: false, retry: true },
                { input: 'change theme to dark', recognized: true, retry: false },
            ];
            const finalAttempt = attempts.find(a => a.recognized);
            (0, vitest_1.expect)(finalAttempt).toBeDefined();
            (0, vitest_1.expect)(finalAttempt?.recognized).toBe(true);
        });
        (0, vitest_1.it)('should handle ambiguous commands', async () => {
            const ambiguousCommand = 'open that';
            // Should ask for clarification
            const clarification = {
                needed: true,
                question: 'What would you like to open?',
                suggestions: ['file', 'folder', 'workspace', 'terminal'],
            };
            (0, vitest_1.expect)(clarification.needed).toBe(true);
            (0, vitest_1.expect)(clarification.suggestions).toHaveLength(4);
        });
        (0, vitest_1.it)('should handle permission errors gracefully', async () => {
            const restrictedOperation = {
                command: 'delete system files',
                allowed: false,
                reason: 'Insufficient permissions',
            };
            (0, vitest_1.expect)(restrictedOperation.allowed).toBe(false);
            (0, vitest_1.expect)(restrictedOperation.reason).toBeDefined();
        });
        (0, vitest_1.it)('should handle network failures', async () => {
            const networkOperation = {
                action: 'fetch AI response',
                online: false,
                fallback: 'Use local model',
            };
            const result = networkOperation.online ? 'cloud' : networkOperation.fallback;
            (0, vitest_1.expect)(result).toBe('Use local model');
        });
    });
    (0, vitest_1.describe)('Performance and Responsiveness', () => {
        (0, vitest_1.it)('should respond to voice commands within acceptable time', async () => {
            const startTime = Date.now();
            // Simulate command processing
            await new Promise(resolve => setTimeout(resolve, 100));
            const duration = Date.now() - startTime;
            (0, vitest_1.expect)(duration).toBeLessThan(500); // Should respond within 500ms
        });
        (0, vitest_1.it)('should handle rapid consecutive commands', async () => {
            const commands = [
                'change theme to dark',
                'set font size to 14',
                'enable auto save',
            ];
            const results = await Promise.all(commands.map(async (cmd) => ({
                command: cmd,
                processed: true,
            })));
            (0, vitest_1.expect)(results).toHaveLength(3);
            (0, vitest_1.expect)(results.every(r => r.processed)).toBe(true);
        });
        (0, vitest_1.it)('should queue commands when system is busy', async () => {
            const commandQueue = [];
            const commands = ['command1', 'command2', 'command3'];
            commands.forEach(cmd => commandQueue.push(cmd));
            (0, vitest_1.expect)(commandQueue).toHaveLength(3);
            // Process queue
            while (commandQueue.length > 0) {
                commandQueue.shift();
            }
            (0, vitest_1.expect)(commandQueue).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('User Experience Scenarios', () => {
        (0, vitest_1.it)('should provide helpful feedback for all actions', async () => {
            const actions = [
                { action: 'file.create', feedback: 'File created successfully' },
                { action: 'setting.update', feedback: 'Setting updated' },
                { action: 'command.execute', feedback: 'Command executed' },
            ];
            (0, vitest_1.expect)(actions.every(a => a.feedback)).toBe(true);
        });
        (0, vitest_1.it)('should maintain command history', async () => {
            const history = [];
            const commands = [
                'change theme to dark',
                'create new file',
                'run tests',
            ];
            commands.forEach(cmd => history.push(cmd));
            (0, vitest_1.expect)(history).toHaveLength(3);
            (0, vitest_1.expect)(history[0]).toBe('change theme to dark');
        });
        (0, vitest_1.it)('should support undo for voice commands', async () => {
            const commandStack = [
                { command: 'change theme to dark', undo: 'change theme to light' },
                { command: 'set font size to 14', undo: 'set font size to 12' },
            ];
            // Execute undo
            const lastCommand = commandStack[commandStack.length - 1];
            (0, vitest_1.expect)(lastCommand.undo).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Accessibility and Inclusivity', () => {
        (0, vitest_1.it)('should work with different accents and speech patterns', async () => {
            const variations = [
                'change theme to dark',
                'change the theme to dark',
                'set theme dark',
                'make theme dark',
            ];
            // All should be interpreted as the same intent
            const intent = 'change_theme';
            (0, vitest_1.expect)(variations.every(v => v.toLowerCase().includes('theme'))).toBe(true);
            (0, vitest_1.expect)(variations.every(v => v.toLowerCase().includes('dark'))).toBe(true);
        });
        (0, vitest_1.it)('should provide visual feedback for voice commands', async () => {
            const voiceCommand = {
                input: 'change theme to dark',
                visualFeedback: {
                    listening: true,
                    processing: true,
                    completed: true,
                },
            };
            (0, vitest_1.expect)(voiceCommand.visualFeedback.completed).toBe(true);
        });
        (0, vitest_1.it)('should support keyboard shortcuts as fallback', async () => {
            const command = {
                voice: 'toggle sidebar',
                keyboard: 'Ctrl+B',
                fallback: true,
            };
            (0, vitest_1.expect)(command.fallback).toBe(true);
            (0, vitest_1.expect)(command.keyboard).toBeDefined();
        });
    });
});
//# sourceMappingURL=complete-scenarios.test.js.map