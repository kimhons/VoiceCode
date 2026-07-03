/**
 * VoiceCode Dictation Manager
 * Handles voice dictation functionality in VS Code
 */

import * as vscode from 'vscode';
import { VoiceCodeClient, TranscriptionResult } from './voicecodeClient';
import { StatusBarManager } from './statusBar';

export class DictationManager {
    private client: VoiceCodeClient;
    private statusBar: StatusBarManager;
    private isActive: boolean = false;
    private pendingText: string = '';
    private insertionTimer: NodeJS.Timeout | null = null;

    constructor(client: VoiceCodeClient, statusBar: StatusBarManager) {
        this.client = client;
        this.statusBar = statusBar;

        // Listen for transcription results
        this.client.on('transcription', this.handleTranscription.bind(this));
    }

    async start(): Promise<void> {
        if (this.isActive) {
            return;
        }

        if (!this.client.isConnected()) {
            vscode.window.showWarningMessage('VoiceCode is not connected. Please ensure the desktop app is running.');
            return;
        }

        try {
            await this.client.startDictation();
            this.isActive = true;
            this.statusBar.setDictating(true);
            vscode.window.showInformationMessage('Voice dictation started');
        } catch (error) {
            this.statusBar.showError('Failed to start');
            vscode.window.showErrorMessage(`Failed to start dictation: ${error}`);
        }
    }

    async stop(): Promise<void> {
        if (!this.isActive) {
            return;
        }

        try {
            await this.client.stopDictation();
            this.isActive = false;
            this.statusBar.setDictating(false);

            // Insert any pending text
            if (this.pendingText) {
                await this.insertText(this.pendingText);
                this.pendingText = '';
            }

            vscode.window.showInformationMessage('Voice dictation stopped');
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to stop dictation: ${error}`);
        }
    }

    async toggle(): Promise<void> {
        if (this.isActive) {
            await this.stop();
        } else {
            await this.start();
        }
    }

    private handleTranscription(result: TranscriptionResult): void {
        if (!this.isActive) {
            return;
        }

        // Update latency in status bar
        this.statusBar.setLatency(result.latencyMs);

        const config = vscode.workspace.getConfiguration('voicecode');
        const insertionDelay = config.get<number>('insertionDelay') || 100;

        if (result.isFinal) {
            // Final result - insert after delay
            this.pendingText = result.text;

            // Clear any existing timer
            if (this.insertionTimer) {
                clearTimeout(this.insertionTimer);
            }

            // Insert after delay to allow for corrections
            this.insertionTimer = setTimeout(async () => {
                await this.insertText(this.pendingText);
                this.pendingText = '';
                this.insertionTimer = null;
            }, insertionDelay);

        } else {
            // Interim result - show in status bar or inline preview
            this.statusBar.showProcessing(result.text.slice(0, 30) + (result.text.length > 30 ? '...' : ''));
        }
    }

    private async insertText(text: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            // No active editor - copy to clipboard instead
            await vscode.env.clipboard.writeText(text);
            vscode.window.showInformationMessage('Text copied to clipboard (no active editor)');
            return;
        }

        const config = vscode.workspace.getConfiguration('voicecode');
        const punctuationMode = config.get<string>('punctuationMode') || 'smart';

        // Apply punctuation based on mode
        let processedText = text;
        if (punctuationMode === 'smart') {
            processedText = this.applySmartPunctuation(text, editor);
        } else if (punctuationMode === 'none') {
            processedText = text.replace(/[.,!?;:]/g, '');
        }

        // Insert at cursor position
        await editor.edit(editBuilder => {
            const position = editor.selection.active;

            // Check if we should add a space before
            const shouldAddSpace = this.shouldAddLeadingSpace(editor, position);
            const finalText = shouldAddSpace ? ' ' + processedText : processedText;

            if (editor.selection.isEmpty) {
                editBuilder.insert(position, finalText);
            } else {
                editBuilder.replace(editor.selection, finalText);
            }
        });

        // Move cursor to end of inserted text
        const newPosition = editor.selection.active;
        editor.selection = new vscode.Selection(newPosition, newPosition);
    }

    private applySmartPunctuation(text: string, editor: vscode.TextEditor): string {
        const document = editor.document;
        const languageId = document.languageId;

        // Code-aware punctuation
        if (['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'csharp'].includes(languageId)) {
            // In code files, be more conservative with punctuation
            // Don't auto-add periods at end of lines (might be code)
            return text;
        }

        // For non-code files, apply smart punctuation
        let result = text;

        // Capitalize first letter after sentence-ending punctuation
        result = result.replace(/([.!?]\s+)([a-z])/g, (_, punct, letter) => punct + letter.toUpperCase());

        // Ensure sentence starts with capital letter
        if (result.length > 0 && /[a-z]/.test(result[0])) {
            const position = editor.selection.active;
            const lineStart = document.lineAt(position.line).text.slice(0, position.character);

            // If at start of line or after sentence-ending punctuation, capitalize
            if (lineStart.trim() === '' || /[.!?]\s*$/.test(lineStart)) {
                result = result[0].toUpperCase() + result.slice(1);
            }
        }

        return result;
    }

    private shouldAddLeadingSpace(editor: vscode.TextEditor, position: vscode.Position): boolean {
        const document = editor.document;
        const lineText = document.lineAt(position.line).text;

        // Don't add space at start of line
        if (position.character === 0) {
            return false;
        }

        // Check the character before cursor
        const charBefore = lineText[position.character - 1];

        // Don't add space after certain characters
        if (['(', '[', '{', '"', "'", '`', ' ', '\t'].includes(charBefore)) {
            return false;
        }

        return true;
    }

    isActive(): boolean {
        return this.isActive;
    }
}
