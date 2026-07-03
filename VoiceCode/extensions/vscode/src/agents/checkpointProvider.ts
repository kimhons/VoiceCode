/**
 * Checkpoint Tree View Provider
 * Displays checkpoints in VS Code sidebar for navigation and management
 */

import * as vscode from 'vscode';
import {
    CheckpointManager,
    Checkpoint,
    CheckpointStatus,
    CheckpointTrigger,
    getCheckpointManager
} from './checkpointManager';

/**
 * Tree item representing a checkpoint
 */
export class CheckpointTreeItem extends vscode.TreeItem {
    constructor(
        public readonly checkpoint: Checkpoint,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly isCurrent: boolean = false
    ) {
        super(checkpoint.name, collapsibleState);

        // Set description
        this.description = this.formatTimestamp(checkpoint.timestamp);

        // Set tooltip
        this.tooltip = this.buildTooltip();

        // Set context value for menu commands
        this.contextValue = isCurrent ? 'checkpoint-current' : 'checkpoint';

        // Set icon based on type and status
        this.iconPath = this.getIcon();

        // Set command to show details on click
        this.command = {
            command: 'voicecode.checkpoint.showDetails',
            title: 'Show Checkpoint Details',
            arguments: [checkpoint]
        };
    }

    private formatTimestamp(date: Date): string {
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) {
            return 'Just now';
        } else if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins}m ago`;
        } else if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    private buildTooltip(): vscode.MarkdownString {
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`**${this.checkpoint.name}**\n\n`);
        md.appendMarkdown(`- **Time:** ${this.checkpoint.timestamp.toLocaleString()}\n`);
        md.appendMarkdown(`- **Trigger:** ${this.checkpoint.trigger}\n`);
        md.appendMarkdown(`- **Status:** ${this.checkpoint.status}\n`);

        if (this.checkpoint.agentType) {
            md.appendMarkdown(`- **Agent:** ${this.checkpoint.agentType}\n`);
        }

        if (this.checkpoint.task) {
            md.appendMarkdown(`- **Task:** ${this.checkpoint.task.substring(0, 100)}\n`);
        }

        md.appendMarkdown(`- **Files:** ${this.checkpoint.files.size}\n`);

        if (this.checkpoint.description) {
            md.appendMarkdown(`\n${this.checkpoint.description}`);
        }

        return md;
    }

    private getIcon(): vscode.ThemeIcon {
        // Determine icon based on status and trigger
        if (this.checkpoint.status === CheckpointStatus.REVERTED) {
            return new vscode.ThemeIcon('debug-step-back', new vscode.ThemeColor('charts.gray'));
        }

        if (this.isCurrent) {
            return new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('charts.green'));
        }

        switch (this.checkpoint.trigger) {
            case 'manual':
                return new vscode.ThemeIcon('bookmark', new vscode.ThemeColor('charts.blue'));
            case 'auto-pre-change':
                return new vscode.ThemeIcon('arrow-circle-down', new vscode.ThemeColor('charts.yellow'));
            case 'auto-post-change':
                return new vscode.ThemeIcon('arrow-circle-up', new vscode.ThemeColor('charts.purple'));
            default:
                return new vscode.ThemeIcon('history');
        }
    }
}

/**
 * Tree data provider for checkpoints
 */
export class CheckpointTreeProvider implements vscode.TreeDataProvider<CheckpointTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<CheckpointTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private checkpointManager: CheckpointManager;
    private disposables: vscode.Disposable[] = [];

    constructor(context: vscode.ExtensionContext) {
        this.checkpointManager = getCheckpointManager(context);

        // Listen for checkpoint changes
        this.checkpointManager.on('checkpointCreated', () => this.refresh());
        this.checkpointManager.on('checkpointReverted', () => this.refresh());
        this.checkpointManager.on('checkpointDeleted', () => this.refresh());
        this.checkpointManager.on('checkpointsCleared', () => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: CheckpointTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: CheckpointTreeItem): CheckpointTreeItem[] {
        if (!element) {
            // Root level - get all top-level checkpoints (no parent or parent is root)
            return this.getRootCheckpoints();
        } else {
            // Get children of this checkpoint
            return this.getChildCheckpoints(element.checkpoint);
        }
    }

    getParent(element: CheckpointTreeItem): CheckpointTreeItem | undefined {
        if (!element.checkpoint.parentId) {
            return undefined;
        }

        const parent = this.checkpointManager.getCheckpoint(element.checkpoint.parentId);
        if (!parent) {
            return undefined;
        }

        const currentId = this.checkpointManager.getCurrentCheckpoint()?.id;
        return new CheckpointTreeItem(
            parent,
            parent.children.length > 0
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None,
            parent.id === currentId
        );
    }

    private getRootCheckpoints(): CheckpointTreeItem[] {
        const tree = this.checkpointManager.getTree();
        const currentId = this.checkpointManager.getCurrentCheckpoint()?.id;

        // Get checkpoints without parents (or with missing parents)
        const rootCheckpoints: Checkpoint[] = [];

        for (const [, checkpoint] of tree.nodes) {
            if (!checkpoint.parentId || !tree.nodes.has(checkpoint.parentId)) {
                rootCheckpoints.push(checkpoint);
            }
        }

        // Sort by timestamp (newest first)
        rootCheckpoints.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return rootCheckpoints.map(cp => new CheckpointTreeItem(
            cp,
            cp.children.length > 0
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None,
            cp.id === currentId
        ));
    }

    private getChildCheckpoints(parent: Checkpoint): CheckpointTreeItem[] {
        const currentId = this.checkpointManager.getCurrentCheckpoint()?.id;

        const children: Checkpoint[] = [];
        for (const childId of parent.children) {
            const child = this.checkpointManager.getCheckpoint(childId);
            if (child) {
                children.push(child);
            }
        }

        // Sort by timestamp (newest first)
        children.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return children.map(cp => new CheckpointTreeItem(
            cp,
            cp.children.length > 0
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None,
            cp.id === currentId
        ));
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this._onDidChangeTreeData.dispose();
    }
}

/**
 * Register the checkpoint tree view and related commands
 */
export function registerCheckpointTreeView(
    context: vscode.ExtensionContext
): CheckpointTreeProvider {
    const provider = new CheckpointTreeProvider(context);

    // Register tree view
    const treeView = vscode.window.createTreeView('voicecode.checkpoints', {
        treeDataProvider: provider,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView);

    // Command: Refresh tree
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.checkpoints.refresh', () => {
            provider.refresh();
        })
    );

    // Command: Show checkpoint details
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.checkpoint.showDetails', async (checkpoint: Checkpoint) => {
            const panel = vscode.window.createWebviewPanel(
                'checkpointDetails',
                `Checkpoint: ${checkpoint.name}`,
                vscode.ViewColumn.Beside,
                { enableScripts: false }
            );

            panel.webview.html = getCheckpointDetailsHtml(checkpoint);
        })
    );

    // Command: Revert from tree item
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.checkpoint.revertFromTree', async (item: CheckpointTreeItem) => {
            const manager = getCheckpointManager();
            const confirm = await vscode.window.showWarningMessage(
                `Revert to "${item.checkpoint.name}"?`,
                'Yes',
                'No'
            );

            if (confirm === 'Yes') {
                await manager.revertToCheckpoint(item.checkpoint.id);
            }
        })
    );

    // Command: Delete from tree item
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.checkpoint.deleteFromTree', async (item: CheckpointTreeItem) => {
            const manager = getCheckpointManager();
            await manager.deleteCheckpoint(item.checkpoint.id);
            vscode.window.showInformationMessage(`Deleted: ${item.checkpoint.name}`);
        })
    );

    // Command: Compare with current from tree item
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.checkpoint.compareWithCurrent', async (item: CheckpointTreeItem) => {
            const manager = getCheckpointManager();
            const current = manager.getCurrentCheckpoint();

            if (!current) {
                vscode.window.showInformationMessage('No current checkpoint to compare with');
                return;
            }

            if (current.id === item.checkpoint.id) {
                vscode.window.showInformationMessage('This is the current checkpoint');
                return;
            }

            const diffs = await manager.compareCheckpoints(item.checkpoint.id, current.id);

            if (diffs.size === 0) {
                vscode.window.showInformationMessage('No differences found');
            } else {
                vscode.window.showInformationMessage(`Found differences in ${diffs.size} file(s)`);
                // Could show diffs here
            }
        })
    );

    return provider;
}

/**
 * Generate HTML for checkpoint details panel
 */
function getCheckpointDetailsHtml(checkpoint: Checkpoint): string {
    const filesHtml = Array.from(checkpoint.files.entries())
        .map(([path, snapshot]) => `
            <tr>
                <td>${escapeHtml(path)}</td>
                <td>${snapshot.lineCount}</td>
                <td><code>${snapshot.hash}</code></td>
            </tr>
        `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkpoint Details</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        h1 { font-size: 1.5em; margin-bottom: 10px; }
        h2 { font-size: 1.2em; margin-top: 20px; margin-bottom: 10px; }
        .meta { color: var(--vscode-descriptionForeground); }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            margin-right: 8px;
        }
        .badge-manual { background: var(--vscode-badge-background); }
        .badge-auto { background: var(--vscode-statusBarItem-warningBackground); }
        .badge-active { background: var(--vscode-testing-iconPassed); }
        .badge-reverted { background: var(--vscode-testing-iconSkipped); }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        th { font-weight: bold; }
        code {
            font-family: var(--vscode-editor-font-family);
            font-size: 0.9em;
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 4px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <h1>${escapeHtml(checkpoint.name)}</h1>
    <p class="meta">
        <span class="badge badge-${checkpoint.trigger === 'manual' ? 'manual' : 'auto'}">${checkpoint.trigger}</span>
        <span class="badge badge-${checkpoint.status}">${checkpoint.status}</span>
    </p>
    <p class="meta">${checkpoint.timestamp.toLocaleString()}</p>

    ${checkpoint.description ? `<p>${escapeHtml(checkpoint.description)}</p>` : ''}

    ${checkpoint.agentType ? `
    <h2>Agent Details</h2>
    <p><strong>Agent:</strong> ${checkpoint.agentType}</p>
    ${checkpoint.task ? `<p><strong>Task:</strong> ${escapeHtml(checkpoint.task)}</p>` : ''}
    ` : ''}

    <h2>Files (${checkpoint.files.size})</h2>
    ${checkpoint.files.size > 0 ? `
    <table>
        <thead>
            <tr>
                <th>File Path</th>
                <th>Lines</th>
                <th>Hash</th>
            </tr>
        </thead>
        <tbody>
            ${filesHtml}
        </tbody>
    </table>
    ` : '<p class="meta">No files captured</p>'}

    <h2>Metadata</h2>
    <p><strong>Files Changed:</strong> ${checkpoint.metadata.filesChanged.length}</p>
    ${checkpoint.metadata.executionTimeMs ? `<p><strong>Execution Time:</strong> ${checkpoint.metadata.executionTimeMs}ms</p>` : ''}
    ${checkpoint.metadata.workspaceRoot ? `<p><strong>Workspace:</strong> ${escapeHtml(checkpoint.metadata.workspaceRoot)}</p>` : ''}
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
