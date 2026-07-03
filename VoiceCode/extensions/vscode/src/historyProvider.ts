/**
 * VoiceCode History Provider
 * Provides dictation history in the sidebar tree view
 */

import * as vscode from 'vscode';
import { VoiceCodeClient, TranscriptionResult } from './voicecodeClient';

export class HistoryProvider implements vscode.TreeDataProvider<HistoryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<HistoryItem | undefined | null | void> = new vscode.EventEmitter<HistoryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<HistoryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private history: TranscriptionResult[] = [];
    private client: VoiceCodeClient;

    constructor(client: VoiceCodeClient) {
        this.client = client;

        // Listen for new transcriptions
        this.client.on('transcription', (result: TranscriptionResult) => {
            if (result.isFinal) {
                this.history.unshift(result);
                // Keep only last 50 items
                if (this.history.length > 50) {
                    this.history = this.history.slice(0, 50);
                }
                this.refresh();
            }
        });

        // Load initial history
        this.loadHistory();
    }

    private async loadHistory(): Promise<void> {
        try {
            this.history = await this.client.getDictationHistory();
            this.refresh();
        } catch (error) {
            console.error('Failed to load dictation history:', error);
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: HistoryItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: HistoryItem): Thenable<HistoryItem[]> {
        if (element) {
            return Promise.resolve([]);
        }

        if (this.history.length === 0) {
            return Promise.resolve([
                new HistoryItem(
                    'No dictation history yet',
                    '',
                    vscode.TreeItemCollapsibleState.None,
                    undefined
                )
            ]);
        }

        return Promise.resolve(
            this.history.map(item => new HistoryItem(
                item.text.length > 50 ? item.text.slice(0, 50) + '...' : item.text,
                `${item.latencyMs}ms | ${item.confidence.toFixed(0)}%`,
                vscode.TreeItemCollapsibleState.None,
                {
                    command: 'voicecode.insertHistoryItem',
                    title: 'Insert',
                    arguments: [item.text]
                }
            ))
        );
    }
}

class HistoryItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = label;
        this.iconPath = new vscode.ThemeIcon('history');
    }
}
