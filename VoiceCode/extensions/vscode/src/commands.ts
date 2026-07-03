/**
 * VoiceCode Command Processor
 * Handles voice commands for code editing, generation, and navigation
 */

import * as vscode from 'vscode';
import { VoiceCodeClient } from './voicecodeClient';

export class CommandProcessor {
    private client: VoiceCodeClient;

    constructor(client: VoiceCodeClient) {
        this.client = client;
    }

    async execute(command: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;

        // Check for built-in VS Code commands first
        if (this.isVSCodeCommand(command)) {
            await this.executeVSCodeCommand(command);
            return;
        }

        // Check for navigation commands
        if (this.isNavigationCommand(command)) {
            await this.executeNavigationCommand(command);
            return;
        }

        // Send to VoiceCode backend for processing
        try {
            const result = await this.client.executeCommand(command);

            if (result.success && editor) {
                if (result.newText !== undefined) {
                    // Text modification command
                    await editor.edit(editBuilder => {
                        if (editor.selection.isEmpty) {
                            // Apply to whole document or current line based on command
                            const document = editor.document;
                            const fullRange = new vscode.Range(
                                document.positionAt(0),
                                document.positionAt(document.getText().length)
                            );
                            editBuilder.replace(fullRange, result.newText || '');
                        } else {
                            editBuilder.replace(editor.selection, result.newText || '');
                        }
                    });
                }

                vscode.window.showInformationMessage(result.message || 'Command executed');
            } else if (!result.success) {
                vscode.window.showWarningMessage(result.message || 'Command failed');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to execute command: ${error}`);
        }
    }

    async generateCode(description: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;

        // Determine target language
        let language = 'javascript';
        if (editor) {
            language = editor.document.languageId;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Generating code...',
                cancellable: false
            }, async () => {
                const result = await this.client.generateCode(description, language);

                if (editor) {
                    // Insert at cursor position
                    await editor.edit(editBuilder => {
                        const position = editor.selection.active;
                        editBuilder.insert(position, result.code);
                    });

                    // Show explanation if available
                    if (result.explanation) {
                        vscode.window.showInformationMessage(result.explanation);
                    }
                } else {
                    // No editor - create new file
                    const document = await vscode.workspace.openTextDocument({
                        content: result.code,
                        language: result.language
                    });
                    await vscode.window.showTextDocument(document);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate code: ${error}`);
        }
    }

    async explainCode(code: string): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Analyzing code...',
                cancellable: false
            }, async () => {
                const explanation = await this.client.explainCode(code);

                // Show explanation in output panel
                const outputChannel = vscode.window.createOutputChannel('VoiceCode Explanation');
                outputChannel.clear();
                outputChannel.appendLine('Code Explanation');
                outputChannel.appendLine('================');
                outputChannel.appendLine('');
                outputChannel.appendLine(explanation);
                outputChannel.show();
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to explain code: ${error}`);
        }
    }

    async refactorCode(code: string, instructions: string, editor: vscode.TextEditor): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Refactoring code...',
                cancellable: false
            }, async () => {
                const refactoredCode = await this.client.refactorCode(code, instructions);

                // Replace selected code with refactored version
                await editor.edit(editBuilder => {
                    editBuilder.replace(editor.selection, refactoredCode);
                });

                vscode.window.showInformationMessage('Code refactored successfully');
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to refactor code: ${error}`);
        }
    }

    private isVSCodeCommand(command: string): boolean {
        const vsCodeCommands = [
            'save', 'save file', 'save all',
            'undo', 'redo',
            'copy', 'cut', 'paste',
            'find', 'replace', 'find and replace',
            'format', 'format document',
            'comment', 'uncomment', 'toggle comment',
            'fold', 'unfold', 'fold all', 'unfold all',
            'close', 'close file', 'close tab',
            'new file', 'new tab',
            'split', 'split editor',
            'terminal', 'open terminal',
            'command palette', 'show commands'
        ];

        const lowerCommand = command.toLowerCase().trim();
        return vsCodeCommands.some(cmd => lowerCommand === cmd || lowerCommand.startsWith(cmd + ' '));
    }

    private async executeVSCodeCommand(command: string): Promise<void> {
        const lowerCommand = command.toLowerCase().trim();

        const commandMap: Record<string, string> = {
            'save': 'workbench.action.files.save',
            'save file': 'workbench.action.files.save',
            'save all': 'workbench.action.files.saveAll',
            'undo': 'undo',
            'redo': 'redo',
            'copy': 'editor.action.clipboardCopyAction',
            'cut': 'editor.action.clipboardCutAction',
            'paste': 'editor.action.clipboardPasteAction',
            'find': 'actions.find',
            'replace': 'editor.action.startFindReplaceAction',
            'find and replace': 'editor.action.startFindReplaceAction',
            'format': 'editor.action.formatDocument',
            'format document': 'editor.action.formatDocument',
            'comment': 'editor.action.commentLine',
            'uncomment': 'editor.action.commentLine',
            'toggle comment': 'editor.action.commentLine',
            'fold': 'editor.fold',
            'unfold': 'editor.unfold',
            'fold all': 'editor.foldAll',
            'unfold all': 'editor.unfoldAll',
            'close': 'workbench.action.closeActiveEditor',
            'close file': 'workbench.action.closeActiveEditor',
            'close tab': 'workbench.action.closeActiveEditor',
            'new file': 'workbench.action.files.newUntitledFile',
            'new tab': 'workbench.action.files.newUntitledFile',
            'split': 'workbench.action.splitEditor',
            'split editor': 'workbench.action.splitEditor',
            'terminal': 'workbench.action.terminal.toggleTerminal',
            'open terminal': 'workbench.action.terminal.toggleTerminal',
            'command palette': 'workbench.action.showCommands',
            'show commands': 'workbench.action.showCommands'
        };

        const vsCodeCommand = commandMap[lowerCommand];
        if (vsCodeCommand) {
            await vscode.commands.executeCommand(vsCodeCommand);
        }
    }

    private isNavigationCommand(command: string): boolean {
        const navPatterns = [
            /^go to (line|function|class|method|definition)/i,
            /^jump to/i,
            /^find (function|class|method|variable|file)/i,
            /^open file/i,
            /^switch to/i
        ];

        return navPatterns.some(pattern => pattern.test(command));
    }

    private async executeNavigationCommand(command: string): Promise<void> {
        const lowerCommand = command.toLowerCase();

        // Go to line
        const lineMatch = lowerCommand.match(/go to line (\d+)/);
        if (lineMatch) {
            const lineNumber = parseInt(lineMatch[1], 10);
            await vscode.commands.executeCommand('workbench.action.gotoLine');
            // The gotoLine command opens a dialog, so we type the line number
            return;
        }

        // Go to definition
        if (lowerCommand.includes('go to definition')) {
            await vscode.commands.executeCommand('editor.action.revealDefinition');
            return;
        }

        // Find symbol
        if (lowerCommand.includes('find function') || lowerCommand.includes('find class') || lowerCommand.includes('find method')) {
            await vscode.commands.executeCommand('workbench.action.gotoSymbol');
            return;
        }

        // Open file
        const fileMatch = lowerCommand.match(/open file (.+)/);
        if (fileMatch) {
            const fileName = fileMatch[1];
            await vscode.commands.executeCommand('workbench.action.quickOpen', fileName);
            return;
        }

        // Go to symbol in workspace
        if (lowerCommand.includes('find') && (lowerCommand.includes('variable') || lowerCommand.includes('symbol'))) {
            await vscode.commands.executeCommand('workbench.action.showAllSymbols');
            return;
        }
    }
}
