/**
 * Checkpoint Manager
 * Provides checkpoint/rewind functionality for agent executions
 * Matches Claude Code's instant state rewind capabilities
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import { SubagentType, AgentResult, CodeContext } from '../types/agents';
import { InternalAgentBridge } from './internalAgentBridge';

/**
 * Trigger type for checkpoint creation
 */
export type CheckpointTrigger = 'manual' | 'auto-pre-change' | 'auto-post-change';

/**
 * Status of a checkpoint
 */
export enum CheckpointStatus {
    ACTIVE = 'active',
    REVERTED = 'reverted',
    ORPHANED = 'orphaned'
}

/**
 * A snapshot of a file's state
 */
export interface FileSnapshot {
    filePath: string;
    content: string;
    hash: string;
    encoding: string;
    lineCount: number;
}

/**
 * A cursor/selection state
 */
export interface CursorState {
    filePath: string;
    line: number;
    column: number;
    selections: Array<{
        start: { line: number; column: number };
        end: { line: number; column: number };
    }>;
}

/**
 * Options for creating a checkpoint
 */
export interface CreateCheckpointOptions {
    trigger: CheckpointTrigger;
    name: string;
    description?: string;
    agentType?: SubagentType;
    task?: string;
    context?: CodeContext;
    parentId?: string;
    agentResult?: AgentResult;
}

/**
 * A checkpoint representing a point in time
 */
export interface Checkpoint {
    id: string;
    parentId: string | null;
    name: string;
    description?: string;
    timestamp: Date;
    trigger: CheckpointTrigger;
    status: CheckpointStatus;

    // State snapshots
    files: Map<string, FileSnapshot>;
    cursors: Map<string, CursorState>;

    // Agent context
    agentType?: SubagentType;
    task?: string;
    agentResult?: AgentResult;

    // Metadata
    metadata: {
        filesChanged: string[];
        totalLinesChanged: number;
        executionTimeMs?: number;
        workspaceRoot?: string;
    };

    // Tree structure
    children: string[];
}

/**
 * The checkpoint tree structure
 */
export interface CheckpointTree {
    root: Checkpoint | null;
    nodes: Map<string, Checkpoint>;
    current: Checkpoint | null;
}

/**
 * Configuration for the checkpoint system
 */
export interface CheckpointConfig {
    /** Maximum number of checkpoints to keep */
    maxCheckpoints: number;
    /** Auto-create checkpoints before agent changes */
    autoCheckpoint: boolean;
    /** Include file content in checkpoints (vs just hashes) */
    includeContent: boolean;
    /** Storage location */
    storageLocation: 'memory' | 'workspace' | 'global';
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: CheckpointConfig = {
    maxCheckpoints: 50,
    autoCheckpoint: true,
    includeContent: true,
    storageLocation: 'memory'
};

/**
 * CheckpointManager - Manages checkpoint creation and state rewind
 */
export class CheckpointManager extends EventEmitter implements vscode.Disposable {
    private tree: CheckpointTree;
    private config: CheckpointConfig;
    private disposables: vscode.Disposable[] = [];
    private outputChannel: vscode.OutputChannel;

    constructor(private context: vscode.ExtensionContext) {
        super();
        this.tree = {
            root: null,
            nodes: new Map(),
            current: null
        };
        this.config = this.loadConfig();
        this.outputChannel = vscode.window.createOutputChannel('VoiceCode Checkpoints');
        this.disposables.push(this.outputChannel);

        // Listen for config changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('voicecode.checkpoint')) {
                    this.config = this.loadConfig();
                    this.emit('configChanged', this.config);
                }
            })
        );

        // Load persisted checkpoints if using workspace/global storage
        this.loadPersistedCheckpoints();
    }

    /**
     * Load configuration from VS Code settings
     */
    private loadConfig(): CheckpointConfig {
        const config = vscode.workspace.getConfiguration('voicecode.checkpoint');

        return {
            maxCheckpoints: config.get<number>('maxCheckpoints', 50),
            autoCheckpoint: config.get<boolean>('autoCheckpoint', true),
            includeContent: config.get<boolean>('includeContent', true),
            storageLocation: config.get<'memory' | 'workspace' | 'global'>('storageLocation', 'memory')
        };
    }

    /**
     * Load checkpoints from persistent storage
     */
    private async loadPersistedCheckpoints(): Promise<void> {
        if (this.config.storageLocation === 'memory') {
            return;
        }

        try {
            const storage = this.config.storageLocation === 'global'
                ? this.context.globalState
                : this.context.workspaceState;

            const data = storage.get<{ nodes: Array<[string, Checkpoint]>; currentId: string | null }>('voicecode.checkpoints');

            if (data) {
                this.tree.nodes = new Map(data.nodes.map(([id, cp]) => [
                    id,
                    {
                        ...cp,
                        timestamp: new Date(cp.timestamp),
                        files: new Map(Object.entries(cp.files || {})),
                        cursors: new Map(Object.entries(cp.cursors || {}))
                    }
                ]));

                if (data.currentId) {
                    this.tree.current = this.tree.nodes.get(data.currentId) || null;
                }

                // Find root (checkpoint with no parent)
                for (const [, checkpoint] of this.tree.nodes) {
                    if (!checkpoint.parentId) {
                        this.tree.root = checkpoint;
                        break;
                    }
                }

                this.log(`Loaded ${this.tree.nodes.size} checkpoints from storage`);
            }
        } catch (error) {
            console.warn('[CheckpointManager] Failed to load persisted checkpoints:', error);
        }
    }

    /**
     * Save checkpoints to persistent storage
     */
    private async persistCheckpoints(): Promise<void> {
        if (this.config.storageLocation === 'memory') {
            return;
        }

        try {
            const storage = this.config.storageLocation === 'global'
                ? this.context.globalState
                : this.context.workspaceState;

            const nodes = Array.from(this.tree.nodes.entries()).map(([id, cp]) => [
                id,
                {
                    ...cp,
                    files: Object.fromEntries(cp.files),
                    cursors: Object.fromEntries(cp.cursors)
                }
            ]);

            await storage.update('voicecode.checkpoints', {
                nodes,
                currentId: this.tree.current?.id || null
            });
        } catch (error) {
            console.warn('[CheckpointManager] Failed to persist checkpoints:', error);
        }
    }

    /**
     * Create a new checkpoint
     */
    async createCheckpoint(options: CreateCheckpointOptions): Promise<Checkpoint> {
        const id = `cp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

        // Capture current file states
        const files = await this.captureFileStates(options.context);

        // Capture cursor states
        const cursors = this.captureCursorStates();

        // Calculate files changed
        const filesChanged = options.context?.file_path ? [options.context.file_path] : [];

        const checkpoint: Checkpoint = {
            id,
            parentId: options.parentId || this.tree.current?.id || null,
            name: options.name,
            description: options.description,
            timestamp: new Date(),
            trigger: options.trigger,
            status: CheckpointStatus.ACTIVE,
            files,
            cursors,
            agentType: options.agentType,
            task: options.task,
            agentResult: options.agentResult,
            metadata: {
                filesChanged,
                totalLinesChanged: 0,
                executionTimeMs: options.agentResult?.execution_time_ms,
                workspaceRoot: options.context?.workspace_root
            },
            children: []
        };

        // Add to tree
        this.tree.nodes.set(id, checkpoint);

        // Update parent's children
        if (checkpoint.parentId) {
            const parent = this.tree.nodes.get(checkpoint.parentId);
            if (parent) {
                parent.children.push(id);
            }
        }

        // Set as root if first checkpoint
        if (!this.tree.root) {
            this.tree.root = checkpoint;
        }

        // Set as current
        this.tree.current = checkpoint;

        // Enforce max checkpoints limit
        await this.pruneOldCheckpoints();

        // Persist
        await this.persistCheckpoints();

        this.emit('checkpointCreated', checkpoint);
        this.log(`Created checkpoint: ${checkpoint.name} (${id})`);

        return checkpoint;
    }

    /**
     * Capture current file states
     */
    private async captureFileStates(context?: CodeContext): Promise<Map<string, FileSnapshot>> {
        const files = new Map<string, FileSnapshot>();

        // Capture the current file if available
        if (context?.file_path) {
            try {
                const uri = vscode.Uri.file(context.file_path);
                const doc = await vscode.workspace.openTextDocument(uri);
                const content = doc.getText();

                files.set(context.file_path, {
                    filePath: context.file_path,
                    content: this.config.includeContent ? content : '',
                    hash: this.hashContent(content),
                    encoding: 'utf-8',
                    lineCount: doc.lineCount
                });
            } catch (error) {
                // File might not exist yet
            }
        }

        // Capture all dirty documents
        for (const doc of vscode.workspace.textDocuments) {
            if (doc.isDirty && !files.has(doc.uri.fsPath)) {
                const content = doc.getText();
                files.set(doc.uri.fsPath, {
                    filePath: doc.uri.fsPath,
                    content: this.config.includeContent ? content : '',
                    hash: this.hashContent(content),
                    encoding: 'utf-8',
                    lineCount: doc.lineCount
                });
            }
        }

        return files;
    }

    /**
     * Capture current cursor states
     */
    private captureCursorStates(): Map<string, CursorState> {
        const cursors = new Map<string, CursorState>();

        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const filePath = editor.document.uri.fsPath;
            const position = editor.selection.active;

            cursors.set(filePath, {
                filePath,
                line: position.line,
                column: position.character,
                selections: editor.selections.map(sel => ({
                    start: { line: sel.start.line, column: sel.start.character },
                    end: { line: sel.end.line, column: sel.end.character }
                }))
            });
        }

        return cursors;
    }

    /**
     * Hash content for comparison
     */
    private hashContent(content: string): string {
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }

    /**
     * Revert to a specific checkpoint
     */
    async revertToCheckpoint(checkpointId: string): Promise<void> {
        const checkpoint = this.tree.nodes.get(checkpointId);
        if (!checkpoint) {
            throw new Error(`Checkpoint not found: ${checkpointId}`);
        }

        this.log(`Reverting to checkpoint: ${checkpoint.name} (${checkpointId})`);

        // Restore file states
        for (const [filePath, snapshot] of checkpoint.files) {
            if (!snapshot.content) {
                this.log(`Skipping ${filePath} - no content stored`);
                continue;
            }

            try {
                const uri = vscode.Uri.file(filePath);
                const doc = await vscode.workspace.openTextDocument(uri);
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    new vscode.Position(0, 0),
                    new vscode.Position(doc.lineCount, 0)
                );
                edit.replace(uri, fullRange, snapshot.content);
                await vscode.workspace.applyEdit(edit);
                await doc.save();
            } catch (error) {
                console.warn(`[CheckpointManager] Failed to restore ${filePath}:`, error);
            }
        }

        // Restore cursor states
        for (const [filePath, cursorState] of checkpoint.cursors) {
            try {
                const uri = vscode.Uri.file(filePath);
                const doc = await vscode.workspace.openTextDocument(uri);
                const editor = await vscode.window.showTextDocument(doc);

                const selections = cursorState.selections.map(sel =>
                    new vscode.Selection(
                        new vscode.Position(sel.start.line, sel.start.column),
                        new vscode.Position(sel.end.line, sel.end.column)
                    )
                );

                editor.selections = selections;
                editor.revealRange(selections[0], vscode.TextEditorRevealType.InCenter);
            } catch (error) {
                console.warn(`[CheckpointManager] Failed to restore cursor for ${filePath}:`, error);
            }
        }

        // Mark checkpoints after this one as reverted
        this.markDescendantsReverted(checkpointId);

        // Update current
        this.tree.current = checkpoint;

        // Persist
        await this.persistCheckpoints();

        this.emit('checkpointReverted', checkpoint);
        vscode.window.showInformationMessage(`Reverted to checkpoint: ${checkpoint.name}`);
    }

    /**
     * Mark all descendants of a checkpoint as reverted
     */
    private markDescendantsReverted(checkpointId: string): void {
        const checkpoint = this.tree.nodes.get(checkpointId);
        if (!checkpoint) return;

        for (const childId of checkpoint.children) {
            const child = this.tree.nodes.get(childId);
            if (child && child.status === CheckpointStatus.ACTIVE) {
                child.status = CheckpointStatus.REVERTED;
                this.markDescendantsReverted(childId);
            }
        }
    }

    /**
     * Delete a checkpoint
     */
    async deleteCheckpoint(checkpointId: string): Promise<void> {
        const checkpoint = this.tree.nodes.get(checkpointId);
        if (!checkpoint) {
            throw new Error(`Checkpoint not found: ${checkpointId}`);
        }

        // Remove from parent's children
        if (checkpoint.parentId) {
            const parent = this.tree.nodes.get(checkpoint.parentId);
            if (parent) {
                parent.children = parent.children.filter(id => id !== checkpointId);
            }
        }

        // Reparent children to parent
        for (const childId of checkpoint.children) {
            const child = this.tree.nodes.get(childId);
            if (child) {
                child.parentId = checkpoint.parentId;
                if (checkpoint.parentId) {
                    const parent = this.tree.nodes.get(checkpoint.parentId);
                    if (parent && !parent.children.includes(childId)) {
                        parent.children.push(childId);
                    }
                }
            }
        }

        // Remove from nodes
        this.tree.nodes.delete(checkpointId);

        // Update root if necessary
        if (this.tree.root?.id === checkpointId) {
            this.tree.root = checkpoint.children.length > 0
                ? this.tree.nodes.get(checkpoint.children[0]) || null
                : null;
        }

        // Update current if necessary
        if (this.tree.current?.id === checkpointId) {
            this.tree.current = checkpoint.parentId
                ? this.tree.nodes.get(checkpoint.parentId) || null
                : this.tree.root;
        }

        // Persist
        await this.persistCheckpoints();

        this.emit('checkpointDeleted', checkpointId);
        this.log(`Deleted checkpoint: ${checkpoint.name} (${checkpointId})`);
    }

    /**
     * Prune old checkpoints to stay within limit
     */
    private async pruneOldCheckpoints(): Promise<void> {
        if (this.tree.nodes.size <= this.config.maxCheckpoints) {
            return;
        }

        // Get all checkpoints sorted by timestamp (oldest first)
        const checkpoints = Array.from(this.tree.nodes.values())
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Remove oldest checkpoints that are not in the current lineage
        const currentLineage = this.getCurrentLineage();
        const toRemove = checkpoints
            .filter(cp => !currentLineage.has(cp.id))
            .slice(0, this.tree.nodes.size - this.config.maxCheckpoints);

        for (const checkpoint of toRemove) {
            await this.deleteCheckpoint(checkpoint.id);
        }
    }

    /**
     * Get the lineage of current checkpoint (all ancestors)
     */
    private getCurrentLineage(): Set<string> {
        const lineage = new Set<string>();
        let current = this.tree.current;

        while (current) {
            lineage.add(current.id);
            current = current.parentId ? this.tree.nodes.get(current.parentId) || null : null;
        }

        return lineage;
    }

    /**
     * Get the checkpoint tree
     */
    getTree(): CheckpointTree {
        return this.tree;
    }

    /**
     * Get all checkpoints
     */
    getAllCheckpoints(): Checkpoint[] {
        return Array.from(this.tree.nodes.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Get a specific checkpoint
     */
    getCheckpoint(id: string): Checkpoint | undefined {
        return this.tree.nodes.get(id);
    }

    /**
     * Get the current checkpoint
     */
    getCurrentCheckpoint(): Checkpoint | null {
        return this.tree.current;
    }

    /**
     * Compare two checkpoints
     */
    async compareCheckpoints(id1: string, id2: string): Promise<Map<string, { before: string; after: string }>> {
        const cp1 = this.tree.nodes.get(id1);
        const cp2 = this.tree.nodes.get(id2);

        if (!cp1 || !cp2) {
            throw new Error('One or both checkpoints not found');
        }

        const diffs = new Map<string, { before: string; after: string }>();

        // Get all file paths from both checkpoints
        const allPaths = new Set([...cp1.files.keys(), ...cp2.files.keys()]);

        for (const path of allPaths) {
            const file1 = cp1.files.get(path);
            const file2 = cp2.files.get(path);

            if (file1?.hash !== file2?.hash) {
                diffs.set(path, {
                    before: file1?.content || '',
                    after: file2?.content || ''
                });
            }
        }

        return diffs;
    }

    /**
     * Clear all checkpoints
     */
    async clearAll(): Promise<void> {
        this.tree = {
            root: null,
            nodes: new Map(),
            current: null
        };

        await this.persistCheckpoints();
        this.emit('checkpointsCleared');
        this.log('Cleared all checkpoints');
    }

    /**
     * Get configuration
     */
    getConfig(): CheckpointConfig {
        return { ...this.config };
    }

    /**
     * Log a message
     */
    private log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.tree.nodes.clear();
        this.disposables.forEach(d => d.dispose());
        this.removeAllListeners();
    }
}

// Singleton instance
let checkpointManagerInstance: CheckpointManager | null = null;

/**
 * Get the singleton CheckpointManager instance
 */
export function getCheckpointManager(context?: vscode.ExtensionContext): CheckpointManager {
    if (!checkpointManagerInstance && context) {
        checkpointManagerInstance = new CheckpointManager(context);
    }
    if (!checkpointManagerInstance) {
        throw new Error('CheckpointManager not initialized. Call with context first.');
    }
    return checkpointManagerInstance;
}

/**
 * Dispose the singleton instance
 */
export function disposeCheckpointManager(): void {
    if (checkpointManagerInstance) {
        checkpointManagerInstance.dispose();
        checkpointManagerInstance = null;
    }
}

/**
 * Register checkpoint-related commands
 */
export function registerCheckpointCommands(
    context: vscode.ExtensionContext,
    agentBridge: InternalAgentBridge
): CheckpointManager {
    const manager = getCheckpointManager(context);

    // Command: Create manual checkpoint
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.checkpoint.create', async () => {
            const name = await vscode.window.showInputBox({
                prompt: 'Enter checkpoint name',
                placeHolder: 'My checkpoint'
            });

            if (name) {
                const currentFile = vscode.window.activeTextEditor?.document.uri.fsPath;
                await manager.createCheckpoint({
                    trigger: 'manual',
                    name,
                    context: currentFile ? { file_path: currentFile } as CodeContext : undefined
                });
                vscode.window.showInformationMessage(`Checkpoint created: ${name}`);
            }
        })
    );

    // Command: Revert to checkpoint
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.checkpoint.revert', async () => {
            const checkpoints = manager.getAllCheckpoints();

            if (checkpoints.length === 0) {
                vscode.window.showInformationMessage('No checkpoints available');
                return;
            }

            const items = checkpoints.map(cp => ({
                label: `$(${cp.trigger === 'manual' ? 'bookmark' : 'history'}) ${cp.name}`,
                description: cp.timestamp.toLocaleString(),
                detail: cp.agentType ? `${cp.agentType} agent` : undefined,
                checkpoint: cp
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a checkpoint to revert to'
            });

            if (selected) {
                const confirm = await vscode.window.showWarningMessage(
                    `Revert to "${selected.checkpoint.name}"? This will restore file states.`,
                    'Yes',
                    'No'
                );

                if (confirm === 'Yes') {
                    await manager.revertToCheckpoint(selected.checkpoint.id);
                }
            }
        })
    );

    // Command: Compare checkpoints
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.checkpoint.compare', async () => {
            const checkpoints = manager.getAllCheckpoints();

            if (checkpoints.length < 2) {
                vscode.window.showInformationMessage('Need at least 2 checkpoints to compare');
                return;
            }

            const items = checkpoints.map(cp => ({
                label: cp.name,
                description: cp.timestamp.toLocaleString(),
                checkpoint: cp
            }));

            const first = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select first checkpoint'
            });

            if (!first) return;

            const second = await vscode.window.showQuickPick(
                items.filter(i => i.checkpoint.id !== first.checkpoint.id),
                { placeHolder: 'Select second checkpoint' }
            );

            if (!second) return;

            const diffs = await manager.compareCheckpoints(
                first.checkpoint.id,
                second.checkpoint.id
            );

            if (diffs.size === 0) {
                vscode.window.showInformationMessage('No differences found between checkpoints');
            } else {
                // Show diff for each file
                for (const [filePath, { before, after }] of diffs) {
                    const beforeUri = vscode.Uri.parse(`voicecode-checkpoint:before/${filePath}`);
                    const afterUri = vscode.Uri.parse(`voicecode-checkpoint:after/${filePath}`);

                    // Register content provider
                    const provider = new CheckpointDiffContentProvider(before, after);
                    const disposable = vscode.workspace.registerTextDocumentContentProvider(
                        'voicecode-checkpoint',
                        provider
                    );
                    context.subscriptions.push(disposable);

                    await vscode.commands.executeCommand(
                        'vscode.diff',
                        beforeUri,
                        afterUri,
                        `${filePath} (${first.checkpoint.name} ↔ ${second.checkpoint.name})`
                    );
                }
            }
        })
    );

    // Command: Delete checkpoint
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.checkpoint.delete', async () => {
            const checkpoints = manager.getAllCheckpoints();

            if (checkpoints.length === 0) {
                vscode.window.showInformationMessage('No checkpoints available');
                return;
            }

            const items = checkpoints.map(cp => ({
                label: cp.name,
                description: cp.timestamp.toLocaleString(),
                checkpoint: cp
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a checkpoint to delete'
            });

            if (selected) {
                await manager.deleteCheckpoint(selected.checkpoint.id);
                vscode.window.showInformationMessage(`Deleted checkpoint: ${selected.checkpoint.name}`);
            }
        })
    );

    // Command: Clear all checkpoints
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.checkpoint.clearAll', async () => {
            const confirm = await vscode.window.showWarningMessage(
                'Clear all checkpoints? This cannot be undone.',
                'Yes',
                'No'
            );

            if (confirm === 'Yes') {
                await manager.clearAll();
                vscode.window.showInformationMessage('All checkpoints cleared');
            }
        })
    );

    // Command: Show checkpoint tree
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.checkpoint.showTree', () => {
            vscode.commands.executeCommand('voicecode.checkpoints.focus');
        })
    );

    return manager;
}

/**
 * Content provider for checkpoint diffs
 */
class CheckpointDiffContentProvider implements vscode.TextDocumentContentProvider {
    constructor(private before: string, private after: string) {}

    provideTextDocumentContent(uri: vscode.Uri): string {
        if (uri.path.startsWith('before/')) {
            return this.before;
        }
        return this.after;
    }
}
