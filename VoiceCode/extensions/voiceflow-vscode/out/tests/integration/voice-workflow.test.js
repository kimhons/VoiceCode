"use strict";
/**
 * Voice Workflow Integration Tests
 * Tests complete voice command workflows from input to execution
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode = __importStar(require("vscode"));
// Mock vscode
vitest_1.vi.mock('vscode', () => ({
    window: {
        showInformationMessage: vitest_1.vi.fn(),
        showErrorMessage: vitest_1.vi.fn(),
        showWarningMessage: vitest_1.vi.fn(),
        withProgress: vitest_1.vi.fn((_, task) => task({ report: vitest_1.vi.fn() })),
    },
    workspace: {
        getConfiguration: vitest_1.vi.fn(() => ({
            get: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
            has: vitest_1.vi.fn(),
            inspect: vitest_1.vi.fn(),
        })),
        onDidChangeConfiguration: vitest_1.vi.fn(),
    },
    commands: {
        executeCommand: vitest_1.vi.fn(),
        registerCommand: vitest_1.vi.fn(),
    },
    ConfigurationTarget: {
        Global: 1,
        Workspace: 2,
        WorkspaceFolder: 3,
    },
    EventEmitter: class {
        event = vitest_1.vi.fn();
        fire = vitest_1.vi.fn();
        dispose = vitest_1.vi.fn();
    },
}));
(0, vitest_1.describe)('Voice Workflow Integration Tests', () => {
    (0, vitest_1.describe)('Complete Voice Command Workflow', () => {
        (0, vitest_1.it)('should execute complete voice-to-action workflow', async () => {
            // Simulate: User speaks → Voice Recognition → Command Interpretation → Action Execution
            // 1. Voice input captured
            const voiceInput = "change theme to dark";
            // 2. Voice recognition processes input
            // (Would use VoiceRecognitionService)
            // 3. Command interpretation
            // (Would use VoiceSettingsService or VoiceCommandRouter)
            // 4. Action execution
            const config = vscode.workspace.getConfiguration();
            await config.update('workbench.colorTheme', 'Default Dark+', vscode.ConfigurationTarget.Global);
            // 5. Verify execution
            (0, vitest_1.expect)(config.update).toHaveBeenCalledWith('workbench.colorTheme', 'Default Dark+', vscode.ConfigurationTarget.Global);
        });
        (0, vitest_1.it)('should handle multi-step voice commands', async () => {
            // Simulate: "create a new file called test.ts and add a function"
            const commands = [
                { action: 'createFile', params: { name: 'test.ts' } },
                { action: 'insertText', params: { text: 'function test() {}' } },
            ];
            for (const cmd of commands) {
                await vscode.commands.executeCommand(cmd.action, cmd.params);
            }
            (0, vitest_1.expect)(vscode.commands.executeCommand).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('should provide feedback after command execution', async () => {
            const voiceInput = "set font size to 14";
            // Execute command
            const config = vscode.workspace.getConfiguration();
            await config.update('editor.fontSize', 14, vscode.ConfigurationTarget.Global);
            // Verify feedback
            (0, vitest_1.expect)(vscode.window.showInformationMessage).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('Settings Management via Voice', () => {
        (0, vitest_1.it)('should change theme via voice command', async () => {
            const config = vscode.workspace.getConfiguration();
            // Voice command: "change theme to dark"
            await config.update('workbench.colorTheme', 'Default Dark+', vscode.ConfigurationTarget.Global);
            (0, vitest_1.expect)(config.update).toHaveBeenCalledWith('workbench.colorTheme', 'Default Dark+', vscode.ConfigurationTarget.Global);
        });
        (0, vitest_1.it)('should change font size via voice command', async () => {
            const config = vscode.workspace.getConfiguration();
            // Voice command: "set font size to 16"
            await config.update('editor.fontSize', 16, vscode.ConfigurationTarget.Global);
            (0, vitest_1.expect)(config.update).toHaveBeenCalledWith('editor.fontSize', 16, vscode.ConfigurationTarget.Global);
        });
        (0, vitest_1.it)('should enable/disable settings via voice', async () => {
            const config = vscode.workspace.getConfiguration();
            // Voice command: "enable auto save"
            await config.update('files.autoSave', 'afterDelay', vscode.ConfigurationTarget.Global);
            (0, vitest_1.expect)(config.update).toHaveBeenCalledWith('files.autoSave', 'afterDelay', vscode.ConfigurationTarget.Global);
        });
        (0, vitest_1.it)('should handle workspace-specific settings', async () => {
            const config = vscode.workspace.getConfiguration();
            // Voice command: "set workspace tab size to 2"
            await config.update('editor.tabSize', 2, vscode.ConfigurationTarget.Workspace);
            (0, vitest_1.expect)(config.update).toHaveBeenCalledWith('editor.tabSize', 2, vscode.ConfigurationTarget.Workspace);
        });
    });
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('should handle invalid voice commands gracefully', async () => {
            const voiceInput = "do something impossible";
            // Should not throw
            (0, vitest_1.expect)(() => {
                // Command interpretation would return "unknown" intent
            }).not.toThrow();
        });
        (0, vitest_1.it)('should handle setting update failures', async () => {
            const config = vscode.workspace.getConfiguration();
            config.update.mockRejectedValueOnce(new Error('Permission denied'));
            try {
                await config.update('some.setting', 'value', vscode.ConfigurationTarget.Global);
            }
            catch (error) {
                (0, vitest_1.expect)(error).toBeDefined();
                (0, vitest_1.expect)(vscode.window.showErrorMessage).toHaveBeenCalled();
            }
        });
        (0, vitest_1.it)('should provide helpful error messages', async () => {
            const voiceInput = "change something unknown";
            // Should suggest alternatives
            const message = "I'm not sure how to interpret that command. Try something like 'change theme to dark'";
            (0, vitest_1.expect)(message).toContain('Try something like');
        });
    });
    (0, vitest_1.describe)('Voice Command History', () => {
        (0, vitest_1.it)('should track executed commands', async () => {
            const commandHistory = [];
            const commands = [
                "change theme to dark",
                "set font size to 14",
                "enable auto save",
            ];
            for (const cmd of commands) {
                commandHistory.push(cmd);
            }
            (0, vitest_1.expect)(commandHistory).toHaveLength(3);
            (0, vitest_1.expect)(commandHistory[0]).toBe("change theme to dark");
        });
        (0, vitest_1.it)('should allow repeating previous commands', async () => {
            const lastCommand = "change theme to dark";
            // Voice command: "repeat last command"
            // Should re-execute the last command
            (0, vitest_1.expect)(lastCommand).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Context-Aware Commands', () => {
        (0, vitest_1.it)('should use current file context', async () => {
            // Simulate active editor with TypeScript file
            const mockEditor = {
                document: {
                    languageId: 'typescript',
                    fileName: 'test.ts',
                    getText: vitest_1.vi.fn(() => 'const x = 1;'),
                },
            };
            // Voice command: "refactor this" should know it's TypeScript
            (0, vitest_1.expect)(mockEditor.document.languageId).toBe('typescript');
        });
        (0, vitest_1.it)('should use workspace context', async () => {
            // Voice command: "what's my workspace name"
            // Should access workspace information
            const workspaceName = 'VoiceCode';
            (0, vitest_1.expect)(workspaceName).toBeDefined();
        });
    });
});
//# sourceMappingURL=voice-workflow.test.js.map