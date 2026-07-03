/**
 * Multi-Modal Context Provider
 * Provides comprehensive context from multiple sources including
 * code, images, audio, terminal output, and external resources
 * to enable rich, informed AI agent interactions
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { InternalAgentBridge } from './internalAgentBridge';
import { CodeContext, SubagentType } from '../types/agents';

/**
 * Context source types
 */
export enum ContextSourceType {
    CODE = 'code',
    IMAGE = 'image',
    AUDIO = 'audio',
    TERMINAL = 'terminal',
    WEB = 'web',
    FILE = 'file',
    CLIPBOARD = 'clipboard',
    SELECTION = 'selection',
    DIAGNOSTICS = 'diagnostics',
    GIT = 'git',
    WORKSPACE = 'workspace',
    USER_INPUT = 'user_input'
}

/**
 * Context item
 */
export interface ContextItem {
    id: string;
    type: ContextSourceType;
    source: string;
    content: string | Buffer;
    metadata: Record<string, unknown>;
    timestamp: number;
    relevance: number;
    summary?: string;
}

/**
 * Aggregated context
 */
export interface AggregatedContext {
    sessionId: string;
    items: ContextItem[];
    summary: string;
    relevantFiles: string[];
    codeContext: CodeContext;
    metadata: {
        totalItems: number;
        types: ContextSourceType[];
        timestamp: number;
        tokenEstimate: number;
    };
}

/**
 * Context query
 */
export interface ContextQuery {
    task: string;
    types?: ContextSourceType[];
    maxItems?: number;
    maxTokens?: number;
    includeHistory?: boolean;
    timeRange?: { start: number; end: number };
}

/**
 * Context source interface
 */
interface ContextSource {
    type: ContextSourceType;
    enabled: boolean;
    gather(): Promise<ContextItem[]>;
}

/**
 * Multi-Modal Context Provider
 */
export class MultiModalContextProvider implements vscode.Disposable {
    private bridge: InternalAgentBridge;
    private outputChannel: vscode.OutputChannel;
    private contextHistory: Map<string, ContextItem[]> = new Map();
    private maxHistorySize = 100;
    private sources: Map<ContextSourceType, ContextSource> = new Map();
    private activeContext: AggregatedContext | undefined;

    constructor(bridge: InternalAgentBridge) {
        this.bridge = bridge;
        this.outputChannel = vscode.window.createOutputChannel('VoiceCode Context');

        // Initialize context sources
        this.initializeSources();
    }

    /**
     * Initialize context sources
     */
    private initializeSources(): void {
        // Code source
        this.sources.set(ContextSourceType.CODE, {
            type: ContextSourceType.CODE,
            enabled: true,
            gather: () => this.gatherCodeContext()
        });

        // Selection source
        this.sources.set(ContextSourceType.SELECTION, {
            type: ContextSourceType.SELECTION,
            enabled: true,
            gather: () => this.gatherSelectionContext()
        });

        // Diagnostics source
        this.sources.set(ContextSourceType.DIAGNOSTICS, {
            type: ContextSourceType.DIAGNOSTICS,
            enabled: true,
            gather: () => this.gatherDiagnosticsContext()
        });

        // Terminal source
        this.sources.set(ContextSourceType.TERMINAL, {
            type: ContextSourceType.TERMINAL,
            enabled: true,
            gather: () => this.gatherTerminalContext()
        });

        // Git source
        this.sources.set(ContextSourceType.GIT, {
            type: ContextSourceType.GIT,
            enabled: true,
            gather: () => this.gatherGitContext()
        });

        // Workspace source
        this.sources.set(ContextSourceType.WORKSPACE, {
            type: ContextSourceType.WORKSPACE,
            enabled: true,
            gather: () => this.gatherWorkspaceContext()
        });

        // Clipboard source
        this.sources.set(ContextSourceType.CLIPBOARD, {
            type: ContextSourceType.CLIPBOARD,
            enabled: true,
            gather: () => this.gatherClipboardContext()
        });
    }

    /**
     * Gather context for a task
     */
    async gatherContext(query: ContextQuery): Promise<AggregatedContext> {
        const sessionId = this.generateSessionId();
        const items: ContextItem[] = [];

        this.log(`Gathering context for task: ${query.task}`);

        // Determine which sources to use
        const sourcesToUse = query.types || Array.from(this.sources.keys());

        // Gather from each source in parallel
        const gatherPromises = sourcesToUse
            .map(type => this.sources.get(type))
            .filter((source): source is ContextSource => source !== undefined && source.enabled)
            .map(source => source.gather());

        const results = await Promise.all(gatherPromises);
        for (const sourceItems of results) {
            items.push(...sourceItems);
        }

        // Score relevance
        await this.scoreRelevance(items, query.task);

        // Sort by relevance and limit
        items.sort((a, b) => b.relevance - a.relevance);
        const limitedItems = items.slice(0, query.maxItems || 50);

        // Generate summary
        const summary = await this.generateContextSummary(limitedItems, query.task);

        // Build code context
        const codeContext = await this.buildCodeContext();

        // Create aggregated context
        const context: AggregatedContext = {
            sessionId,
            items: limitedItems,
            summary,
            relevantFiles: this.extractRelevantFiles(limitedItems),
            codeContext,
            metadata: {
                totalItems: limitedItems.length,
                types: [...new Set(limitedItems.map(i => i.type))],
                timestamp: Date.now(),
                tokenEstimate: this.estimateTokens(limitedItems)
            }
        };

        // Store in history
        this.contextHistory.set(sessionId, limitedItems);
        this.activeContext = context;

        this.log(`Context gathered: ${context.metadata.totalItems} items, ~${context.metadata.tokenEstimate} tokens`);

        return context;
    }

    /**
     * Gather code context from active editor
     */
    private async gatherCodeContext(): Promise<ContextItem[]> {
        const items: ContextItem[] = [];
        const editor = vscode.window.activeTextEditor;

        if (!editor) return items;

        const document = editor.document;
        const content = document.getText();

        // Current file content
        items.push({
            id: this.generateId(),
            type: ContextSourceType.CODE,
            source: document.uri.fsPath,
            content,
            metadata: {
                language: document.languageId,
                lineCount: document.lineCount,
                isUntitled: document.isUntitled
            },
            timestamp: Date.now(),
            relevance: 1.0
        });

        // Visible range
        const visibleRanges = editor.visibleRanges;
        if (visibleRanges.length > 0) {
            const visibleContent = document.getText(visibleRanges[0]);
            items.push({
                id: this.generateId(),
                type: ContextSourceType.CODE,
                source: `${document.uri.fsPath}:visible`,
                content: visibleContent,
                metadata: {
                    language: document.languageId,
                    startLine: visibleRanges[0].start.line,
                    endLine: visibleRanges[0].end.line
                },
                timestamp: Date.now(),
                relevance: 0.9
            });
        }

        // Related files (imports)
        const imports = await this.extractImports(document);
        for (const importPath of imports.slice(0, 5)) {
            try {
                const resolvedPath = this.resolveImportPath(importPath, document.uri.fsPath);
                if (resolvedPath && fs.existsSync(resolvedPath)) {
                    const importContent = fs.readFileSync(resolvedPath, 'utf-8');
                    items.push({
                        id: this.generateId(),
                        type: ContextSourceType.CODE,
                        source: resolvedPath,
                        content: importContent.substring(0, 5000), // Limit size
                        metadata: {
                            importedBy: document.uri.fsPath,
                            language: path.extname(resolvedPath).slice(1)
                        },
                        timestamp: Date.now(),
                        relevance: 0.7
                    });
                }
            } catch {
                // Skip unresolvable imports
            }
        }

        return items;
    }

    /**
     * Extract imports from a document
     */
    private async extractImports(document: vscode.TextDocument): Promise<string[]> {
        const text = document.getText();
        const imports: string[] = [];

        // JavaScript/TypeScript imports
        const jsImports = text.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
        for (const match of jsImports) {
            imports.push(match[1]);
        }

        // Python imports
        const pyImports = text.matchAll(/(?:from|import)\s+([^\s]+)/g);
        for (const match of pyImports) {
            imports.push(match[1]);
        }

        // Rust imports
        const rustImports = text.matchAll(/use\s+([^;]+)/g);
        for (const match of rustImports) {
            imports.push(match[1].split('::')[0]);
        }

        return [...new Set(imports)];
    }

    /**
     * Resolve import path to file path
     */
    private resolveImportPath(importPath: string, fromFile: string): string | undefined {
        const dir = path.dirname(fromFile);

        // Relative imports
        if (importPath.startsWith('.')) {
            const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.rs', ''];
            for (const ext of extensions) {
                const fullPath = path.join(dir, importPath + ext);
                if (fs.existsSync(fullPath)) {
                    return fullPath;
                }
                // Try index file
                const indexPath = path.join(dir, importPath, `index${ext}`);
                if (fs.existsSync(indexPath)) {
                    return indexPath;
                }
            }
        }

        return undefined;
    }

    /**
     * Gather selection context
     */
    private async gatherSelectionContext(): Promise<ContextItem[]> {
        const items: ContextItem[] = [];
        const editor = vscode.window.activeTextEditor;

        if (!editor || editor.selection.isEmpty) return items;

        const selectedText = editor.document.getText(editor.selection);
        items.push({
            id: this.generateId(),
            type: ContextSourceType.SELECTION,
            source: editor.document.uri.fsPath,
            content: selectedText,
            metadata: {
                language: editor.document.languageId,
                startLine: editor.selection.start.line,
                endLine: editor.selection.end.line,
                length: selectedText.length
            },
            timestamp: Date.now(),
            relevance: 1.0
        });

        return items;
    }

    /**
     * Gather diagnostics context
     */
    private async gatherDiagnosticsContext(): Promise<ContextItem[]> {
        const items: ContextItem[] = [];

        // Get all diagnostics
        const allDiagnostics = vscode.languages.getDiagnostics();

        for (const [uri, diagnostics] of allDiagnostics) {
            if (diagnostics.length === 0) continue;

            const errorDiagnostics = diagnostics.filter(d =>
                d.severity === vscode.DiagnosticSeverity.Error ||
                d.severity === vscode.DiagnosticSeverity.Warning
            );

            if (errorDiagnostics.length > 0) {
                const content = errorDiagnostics.map(d =>
                    `Line ${d.range.start.line + 1}: [${vscode.DiagnosticSeverity[d.severity]}] ${d.message}`
                ).join('\n');

                items.push({
                    id: this.generateId(),
                    type: ContextSourceType.DIAGNOSTICS,
                    source: uri.fsPath,
                    content,
                    metadata: {
                        errors: errorDiagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length,
                        warnings: errorDiagnostics.filter(d => d.severity === vscode.DiagnosticSeverity.Warning).length
                    },
                    timestamp: Date.now(),
                    relevance: 0.95 // High relevance for errors
                });
            }
        }

        return items;
    }

    /**
     * Gather terminal context
     */
    private async gatherTerminalContext(): Promise<ContextItem[]> {
        const items: ContextItem[] = [];

        // Note: VS Code doesn't provide direct access to terminal content
        // This would need to be implemented with terminal integration
        // For now, we'll provide a placeholder

        const activeTerminal = vscode.window.activeTerminal;
        if (activeTerminal) {
            items.push({
                id: this.generateId(),
                type: ContextSourceType.TERMINAL,
                source: activeTerminal.name,
                content: `Terminal: ${activeTerminal.name}`,
                metadata: {
                    terminalName: activeTerminal.name,
                    processId: activeTerminal.processId
                },
                timestamp: Date.now(),
                relevance: 0.5
            });
        }

        return items;
    }

    /**
     * Gather Git context
     */
    private async gatherGitContext(): Promise<ContextItem[]> {
        const items: ContextItem[] = [];
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        if (!workspaceRoot) return items;

        try {
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);

            // Get git status
            const { stdout: status } = await execAsync('git status --short', { cwd: workspaceRoot });
            if (status) {
                items.push({
                    id: this.generateId(),
                    type: ContextSourceType.GIT,
                    source: 'git status',
                    content: status,
                    metadata: { command: 'status' },
                    timestamp: Date.now(),
                    relevance: 0.8
                });
            }

            // Get recent commits
            const { stdout: log } = await execAsync('git log --oneline -10', { cwd: workspaceRoot });
            if (log) {
                items.push({
                    id: this.generateId(),
                    type: ContextSourceType.GIT,
                    source: 'git log',
                    content: log,
                    metadata: { command: 'log', count: 10 },
                    timestamp: Date.now(),
                    relevance: 0.6
                });
            }

            // Get current diff
            const { stdout: diff } = await execAsync('git diff --stat', { cwd: workspaceRoot });
            if (diff) {
                items.push({
                    id: this.generateId(),
                    type: ContextSourceType.GIT,
                    source: 'git diff',
                    content: diff,
                    metadata: { command: 'diff' },
                    timestamp: Date.now(),
                    relevance: 0.85
                });
            }
        } catch {
            // Git not available or not a git repo
        }

        return items;
    }

    /**
     * Gather workspace context
     */
    private async gatherWorkspaceContext(): Promise<ContextItem[]> {
        const items: ContextItem[] = [];
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        if (!workspaceRoot) return items;

        // Package.json info
        const packageJsonPath = path.join(workspaceRoot, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            try {
                const content = fs.readFileSync(packageJsonPath, 'utf-8');
                const pkg = JSON.parse(content);
                items.push({
                    id: this.generateId(),
                    type: ContextSourceType.WORKSPACE,
                    source: packageJsonPath,
                    content: JSON.stringify({
                        name: pkg.name,
                        version: pkg.version,
                        scripts: pkg.scripts,
                        dependencies: Object.keys(pkg.dependencies || {}),
                        devDependencies: Object.keys(pkg.devDependencies || {})
                    }, null, 2),
                    metadata: {
                        name: pkg.name,
                        version: pkg.version
                    },
                    timestamp: Date.now(),
                    relevance: 0.7
                });
            } catch {
                // Invalid package.json
            }
        }

        // README content (summarized)
        const readmePath = path.join(workspaceRoot, 'README.md');
        if (fs.existsSync(readmePath)) {
            const content = fs.readFileSync(readmePath, 'utf-8');
            items.push({
                id: this.generateId(),
                type: ContextSourceType.WORKSPACE,
                source: readmePath,
                content: content.substring(0, 2000), // Limit size
                metadata: { type: 'readme' },
                timestamp: Date.now(),
                relevance: 0.5
            });
        }

        // Open editors
        const openEditors = vscode.window.tabGroups.all
            .flatMap(group => group.tabs)
            .filter(tab => tab.input instanceof vscode.TabInputText)
            .map(tab => (tab.input as vscode.TabInputText).uri.fsPath);

        if (openEditors.length > 0) {
            items.push({
                id: this.generateId(),
                type: ContextSourceType.WORKSPACE,
                source: 'open editors',
                content: openEditors.join('\n'),
                metadata: { count: openEditors.length },
                timestamp: Date.now(),
                relevance: 0.6
            });
        }

        return items;
    }

    /**
     * Gather clipboard context
     */
    private async gatherClipboardContext(): Promise<ContextItem[]> {
        const items: ContextItem[] = [];

        try {
            const clipboardText = await vscode.env.clipboard.readText();
            if (clipboardText && clipboardText.trim().length > 0) {
                items.push({
                    id: this.generateId(),
                    type: ContextSourceType.CLIPBOARD,
                    source: 'clipboard',
                    content: clipboardText.substring(0, 5000), // Limit size
                    metadata: {
                        length: clipboardText.length
                    },
                    timestamp: Date.now(),
                    relevance: 0.4
                });
            }
        } catch {
            // Clipboard not available
        }

        return items;
    }

    /**
     * Add user input to context
     */
    async addUserInput(input: string, type: 'voice' | 'text' = 'text'): Promise<ContextItem> {
        const item: ContextItem = {
            id: this.generateId(),
            type: ContextSourceType.USER_INPUT,
            source: type,
            content: input,
            metadata: { inputType: type },
            timestamp: Date.now(),
            relevance: 1.0
        };

        if (this.activeContext) {
            this.activeContext.items.unshift(item);
        }

        return item;
    }

    /**
     * Add image to context
     */
    async addImage(imagePath: string, description?: string): Promise<ContextItem> {
        const imageData = fs.readFileSync(imagePath);
        const base64 = imageData.toString('base64');

        const item: ContextItem = {
            id: this.generateId(),
            type: ContextSourceType.IMAGE,
            source: imagePath,
            content: `data:image/${path.extname(imagePath).slice(1)};base64,${base64}`,
            metadata: {
                path: imagePath,
                size: imageData.length,
                description
            },
            timestamp: Date.now(),
            relevance: 0.9
        };

        if (this.activeContext) {
            this.activeContext.items.push(item);
        }

        return item;
    }

    /**
     * Add web content to context
     */
    async addWebContent(url: string, content: string, summary?: string): Promise<ContextItem> {
        const item: ContextItem = {
            id: this.generateId(),
            type: ContextSourceType.WEB,
            source: url,
            content,
            summary,
            metadata: { url },
            timestamp: Date.now(),
            relevance: 0.7
        };

        if (this.activeContext) {
            this.activeContext.items.push(item);
        }

        return item;
    }

    /**
     * Score relevance of context items
     */
    private async scoreRelevance(items: ContextItem[], task: string): Promise<void> {
        // Simple keyword-based relevance scoring
        const taskWords = task.toLowerCase().split(/\s+/).filter(w => w.length > 2);

        for (const item of items) {
            const content = typeof item.content === 'string' ? item.content.toLowerCase() : '';
            const source = item.source.toLowerCase();

            let score = item.relevance;

            // Boost for keyword matches
            for (const word of taskWords) {
                if (content.includes(word)) score += 0.1;
                if (source.includes(word)) score += 0.15;
            }

            // Boost for certain types based on task
            if (task.includes('error') || task.includes('fix') || task.includes('bug')) {
                if (item.type === ContextSourceType.DIAGNOSTICS) score += 0.2;
            }
            if (task.includes('commit') || task.includes('git')) {
                if (item.type === ContextSourceType.GIT) score += 0.2;
            }
            if (task.includes('refactor') || task.includes('improve')) {
                if (item.type === ContextSourceType.CODE) score += 0.1;
            }

            // Cap at 1.0
            item.relevance = Math.min(1.0, score);
        }
    }

    /**
     * Generate context summary
     */
    private async generateContextSummary(items: ContextItem[], task: string): Promise<string> {
        const summaryParts: string[] = [];

        // Group by type
        const byType = new Map<ContextSourceType, ContextItem[]>();
        for (const item of items) {
            if (!byType.has(item.type)) {
                byType.set(item.type, []);
            }
            byType.get(item.type)!.push(item);
        }

        // Summarize each type
        for (const [type, typeItems] of byType) {
            switch (type) {
                case ContextSourceType.CODE:
                    const files = typeItems.map(i => path.basename(i.source)).join(', ');
                    summaryParts.push(`Code files: ${files}`);
                    break;
                case ContextSourceType.DIAGNOSTICS:
                    const totalErrors = typeItems.reduce((sum, i) =>
                        sum + ((i.metadata.errors as number) || 0), 0);
                    const totalWarnings = typeItems.reduce((sum, i) =>
                        sum + ((i.metadata.warnings as number) || 0), 0);
                    summaryParts.push(`Diagnostics: ${totalErrors} errors, ${totalWarnings} warnings`);
                    break;
                case ContextSourceType.GIT:
                    summaryParts.push(`Git context available`);
                    break;
                case ContextSourceType.SELECTION:
                    summaryParts.push(`Selected text included`);
                    break;
                default:
                    summaryParts.push(`${type}: ${typeItems.length} items`);
            }
        }

        return `Task: ${task}\n\nContext summary:\n- ${summaryParts.join('\n- ')}`;
    }

    /**
     * Extract relevant files from context items
     */
    private extractRelevantFiles(items: ContextItem[]): string[] {
        const files = new Set<string>();

        for (const item of items) {
            if (item.type === ContextSourceType.CODE ||
                item.type === ContextSourceType.FILE) {
                if (fs.existsSync(item.source)) {
                    files.add(item.source);
                }
            }
        }

        return Array.from(files);
    }

    /**
     * Estimate tokens for context items
     */
    private estimateTokens(items: ContextItem[]): number {
        let totalChars = 0;

        for (const item of items) {
            if (typeof item.content === 'string') {
                totalChars += item.content.length;
            }
        }

        // Rough estimate: ~4 characters per token
        return Math.ceil(totalChars / 4);
    }

    /**
     * Build code context
     */
    private async buildCodeContext(): Promise<CodeContext> {
        const editor = vscode.window.activeTextEditor;

        return {
            file_path: editor?.document.uri.fsPath || '',
            language: editor?.document.languageId || '',
            selected_text: editor && !editor.selection.isEmpty
                ? editor.document.getText(editor.selection)
                : undefined,
            cursor_position: {
                line: editor?.selection.active.line || 0,
                character: editor?.selection.active.character || 0
            },
            visible_range: {
                start: editor?.visibleRanges[0]?.start.line || 0,
                end: editor?.visibleRanges[0]?.end.line || 0
            }
        };
    }

    /**
     * Get active context
     */
    getActiveContext(): AggregatedContext | undefined {
        return this.activeContext;
    }

    /**
     * Get context history
     */
    getContextHistory(sessionId: string): ContextItem[] | undefined {
        return this.contextHistory.get(sessionId);
    }

    /**
     * Enable/disable context source
     */
    setSourceEnabled(type: ContextSourceType, enabled: boolean): void {
        const source = this.sources.get(type);
        if (source) {
            source.enabled = enabled;
            this.log(`Context source ${type} ${enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate session ID
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Log message
     */
    private log(message: string, level: 'info' | 'error' = 'info'): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        this.outputChannel.appendLine(logMessage);

        if (level === 'error') {
            console.error(logMessage);
        }
    }

    /**
     * Dispose
     */
    dispose(): void {
        this.contextHistory.clear();
        this.outputChannel.dispose();
    }
}

/**
 * Register multi-modal context commands
 */
export function registerMultiModalContextCommands(
    context: vscode.ExtensionContext,
    bridge: InternalAgentBridge
): MultiModalContextProvider {
    const contextProvider = new MultiModalContextProvider(bridge);
    context.subscriptions.push(contextProvider);

    // Gather context for task
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.gatherContext', async () => {
            const task = await vscode.window.showInputBox({
                prompt: 'What are you trying to do?',
                placeHolder: 'e.g., "fix the authentication bug", "add validation to form"'
            });

            if (!task) return;

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Gathering context...',
                cancellable: false
            }, async () => {
                const ctx = await contextProvider.gatherContext({ task });

                const outputChannel = vscode.window.createOutputChannel('Task Context');
                outputChannel.clear();
                outputChannel.appendLine(ctx.summary);
                outputChannel.appendLine(`\n=== Relevant Files ===`);
                for (const file of ctx.relevantFiles) {
                    outputChannel.appendLine(`  ${file}`);
                }
                outputChannel.appendLine(`\n=== Context Items (${ctx.items.length}) ===`);
                for (const item of ctx.items.slice(0, 10)) {
                    outputChannel.appendLine(`  [${item.type}] ${item.source} (relevance: ${item.relevance.toFixed(2)})`);
                }
                outputChannel.show();
            });
        })
    );

    // Add image to context
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.addImageToContext', async () => {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                filters: { 'Images': ['png', 'jpg', 'jpeg', 'webp', 'gif'] }
            });

            if (!fileUri || fileUri.length === 0) return;

            const description = await vscode.window.showInputBox({
                prompt: 'Describe this image (optional)',
                placeHolder: 'e.g., "Screenshot of the error", "UI mockup"'
            });

            const item = await contextProvider.addImage(fileUri[0].fsPath, description);
            vscode.window.showInformationMessage(`Image added to context: ${path.basename(item.source)}`);
        })
    );

    // Show context sources
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.showContextSources', async () => {
            const ctx = contextProvider.getActiveContext();

            if (!ctx) {
                vscode.window.showInformationMessage('No active context. Run "Gather Context" first.');
                return;
            }

            const items = ctx.metadata.types.map(type => ({
                label: type,
                description: `${ctx.items.filter(i => i.type === type).length} items`
            }));

            await vscode.window.showQuickPick(items, {
                placeHolder: 'Context sources'
            });
        })
    );

    // Toggle context source
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.toggleContextSource', async () => {
            const sources = Object.values(ContextSourceType).map(type => ({
                label: type,
                picked: true // Would need to track actual state
            }));

            const selected = await vscode.window.showQuickPick(sources, {
                canPickMany: true,
                placeHolder: 'Select context sources to enable'
            });

            if (selected) {
                for (const type of Object.values(ContextSourceType)) {
                    const enabled = selected.some(s => s.label === type);
                    contextProvider.setSourceEnabled(type, enabled);
                }
                vscode.window.showInformationMessage(`Context sources updated`);
            }
        })
    );

    return contextProvider;
}
