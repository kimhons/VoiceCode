/**
 * VoiceCode Status Bar Manager
 * Manages the VS Code status bar item for VoiceCode
 */

import * as vscode from 'vscode';

export class StatusBarManager implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private isConnected: boolean = false;
    private isDictating: boolean = false;
    private latencyMs: number = 0;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'voicecode.toggleDictation';
        this.statusBarItem.tooltip = 'Click to toggle voice dictation';
        this.updateDisplay();
        this.statusBarItem.show();
    }

    setConnected(connected: boolean): void {
        this.isConnected = connected;
        this.updateDisplay();
    }

    setDictating(dictating: boolean): void {
        this.isDictating = dictating;
        this.updateDisplay();
    }

    setLatency(latencyMs: number): void {
        this.latencyMs = latencyMs;
        this.updateDisplay();
    }

    private updateDisplay(): void {
        if (!this.isConnected) {
            this.statusBarItem.text = '$(circle-slash) VoiceCode';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            this.statusBarItem.tooltip = 'VoiceCode: Not connected. Click to reconnect.';
            return;
        }

        if (this.isDictating) {
            this.statusBarItem.text = `$(mic-filled) Listening... (${this.latencyMs}ms)`;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.tooltip = 'VoiceCode: Dictation active. Click to stop.';
        } else {
            this.statusBarItem.text = '$(mic) VoiceCode';
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.tooltip = 'VoiceCode: Ready. Click to start dictation.';
        }
    }

    showProcessing(text: string = 'Processing...'): void {
        this.statusBarItem.text = `$(sync~spin) ${text}`;
    }

    showError(message: string): void {
        this.statusBarItem.text = `$(error) ${message}`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');

        // Reset after 3 seconds
        setTimeout(() => {
            this.updateDisplay();
        }, 3000);
    }

    showSuccess(message: string): void {
        this.statusBarItem.text = `$(check) ${message}`;

        // Reset after 2 seconds
        setTimeout(() => {
            this.updateDisplay();
        }, 2000);
    }

    dispose(): void {
        this.statusBarItem.dispose();
    }
}
