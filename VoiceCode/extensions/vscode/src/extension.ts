/**
 * VoiceCode VS Code Extension
 * Phase 3: IDE Integration
 *
 * Provides voice-controlled coding capabilities directly in VS Code,
 * including dictation, voice commands, and code generation.
 */

import * as vscode from 'vscode';
import { VoiceCodeClient } from './voicecodeClient';
import { StatusBarManager } from './statusBar';
import { DictationManager } from './dictation';
import { CommandProcessor } from './commands';
import { HistoryProvider } from './historyProvider';
import { CommandsProvider } from './commandsProvider';

let client: VoiceCodeClient;
let statusBar: StatusBarManager;
let dictation: DictationManager;
let commandProcessor: CommandProcessor;

export async function activate(context: vscode.ExtensionContext) {
    console.log('VoiceCode extension is now active');

    // Initialize components
    const config = vscode.workspace.getConfiguration('voicecode');
    const apiEndpoint = config.get<string>('apiEndpoint') || 'http://localhost:3847';

    // Initialize VoiceCode client
    client = new VoiceCodeClient(apiEndpoint);

    // Initialize status bar
    statusBar = new StatusBarManager();
    context.subscriptions.push(statusBar);

    // Initialize dictation manager
    dictation = new DictationManager(client, statusBar);

    // Initialize command processor
    commandProcessor = new CommandProcessor(client);

    // Register commands
    const commands = [
        vscode.commands.registerCommand('voicecode.startDictation', () => {
            dictation.start();
        }),

        vscode.commands.registerCommand('voicecode.stopDictation', () => {
            dictation.stop();
        }),

        vscode.commands.registerCommand('voicecode.toggleDictation', () => {
            dictation.toggle();
        }),

        vscode.commands.registerCommand('voicecode.executeVoiceCommand', async () => {
            const input = await vscode.window.showInputBox({
                prompt: 'Enter voice command',
                placeHolder: 'e.g., "change foo to bar", "delete last line", "generate function to calculate sum"'
            });

            if (input) {
                await commandProcessor.execute(input);
            }
        }),

        vscode.commands.registerCommand('voicecode.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'voicecode');
        }),

        vscode.commands.registerCommand('voicecode.showStatus', async () => {
            const status = await client.getStatus();
            vscode.window.showInformationMessage(
                `VoiceCode Status: ${status.connected ? 'Connected' : 'Disconnected'} | ` +
                `Dictation: ${status.isDictating ? 'Active' : 'Inactive'} | ` +
                `Mode: ${status.streamingMode}`
            );
        }),

        vscode.commands.registerCommand('voicecode.generateCode', async () => {
            const input = await vscode.window.showInputBox({
                prompt: 'Describe the code you want to generate',
                placeHolder: 'e.g., "create a function that validates email addresses"'
            });

            if (input) {
                await commandProcessor.generateCode(input);
            }
        }),

        vscode.commands.registerCommand('voicecode.explainCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.selection.isEmpty) {
                vscode.window.showWarningMessage('Please select some code first');
                return;
            }

            const selectedText = editor.document.getText(editor.selection);
            await commandProcessor.explainCode(selectedText);
        }),

        vscode.commands.registerCommand('voicecode.refactorCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || editor.selection.isEmpty) {
                vscode.window.showWarningMessage('Please select some code first');
                return;
            }

            const selectedText = editor.document.getText(editor.selection);
            const instructions = await vscode.window.showInputBox({
                prompt: 'How would you like to refactor this code?',
                placeHolder: 'e.g., "extract into a separate function", "add error handling"'
            });

            if (instructions) {
                await commandProcessor.refactorCode(selectedText, instructions, editor);
            }
        }),

        vscode.commands.registerCommand('voicecode.addToCustomDictionary', async () => {
            const editor = vscode.window.activeTextEditor;
            let word: string | undefined;

            if (editor && !editor.selection.isEmpty) {
                word = editor.document.getText(editor.selection);
            } else {
                word = await vscode.window.showInputBox({
                    prompt: 'Enter word to add to custom dictionary',
                    placeHolder: 'e.g., Kubernetes'
                });
            }

            if (word) {
                const aliases = await vscode.window.showInputBox({
                    prompt: 'Enter aliases (comma-separated)',
                    placeHolder: 'e.g., kubernetes, k8s, kube'
                });

                await client.addCustomTerm(word, aliases?.split(',').map(a => a.trim()) || []);
                vscode.window.showInformationMessage(`Added "${word}" to custom dictionary`);
            }
        })
    ];

    // Register tree view providers
    const historyProvider = new HistoryProvider(client);
    const commandsProvider = new CommandsProvider();

    vscode.window.registerTreeDataProvider('voicecode.history', historyProvider);
    vscode.window.registerTreeDataProvider('voicecode.commands', commandsProvider);

    // Add all commands to subscriptions
    context.subscriptions.push(...commands);

    // Auto-start dictation if configured
    if (config.get<boolean>('autoStart')) {
        dictation.start();
    }

    // Connect to VoiceCode desktop app
    try {
        await client.connect();
        statusBar.setConnected(true);
        vscode.window.showInformationMessage('VoiceCode connected successfully');
    } catch (error) {
        statusBar.setConnected(false);
        vscode.window.showWarningMessage(
            'Could not connect to VoiceCode desktop app. Please ensure it is running.'
        );
    }

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('voicecode')) {
                // Reload configuration
                const newConfig = vscode.workspace.getConfiguration('voicecode');
                client.updateConfig({
                    streamingMode: newConfig.get('streamingMode'),
                    codeVocabulary: newConfig.get('codeVocabulary'),
                    naturalLanguageCommands: newConfig.get('naturalLanguageCommands'),
                    punctuationMode: newConfig.get('punctuationMode')
                });
            }
        })
    );
}

export function deactivate() {
    if (dictation) {
        dictation.stop();
    }
    if (client) {
        client.disconnect();
    }
}
