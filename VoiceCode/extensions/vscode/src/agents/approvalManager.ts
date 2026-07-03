/**
 * Human-in-the-Loop Approval Manager
 * Provides approval workflow for agent changes before they are applied
 * Matches Cline's approval capabilities for competitive parity
 */

import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { SubagentType, AgentResult, CodeContext } from '../types/agents';
import { InternalAgentBridge } from './internalAgentBridge';

/**
 * Status of an approval request
 */
export enum ApprovalStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EDITED = 'edited',
    EXPIRED = 'expired',
    AUTO_APPROVED = 'auto_approved'
}

/**
 * Severity level for approval requests
 */
export enum ApprovalSeverity {
    INFO = 'info',
    WARNING = 'warning',
    CRITICAL = 'critical'
}

/**
 * A proposed change to a file
 */
export interface ProposedChange {
    filePath: string;
    originalContent: string;
    proposedContent: string;
    diff: string;
    language: string;
    lineCount: number;
}

/**
 * An approval request for agent changes
 */
export interface ApprovalRequest {
    id: string;
    agentType: SubagentType;
    task: string;
    changes: ProposedChange[];
    confidence: number;
    severity: ApprovalSeverity;
    createdAt: Date;
    expiresAt?: Date;
    status: ApprovalStatus;
    context: CodeContext;
    agentResult: AgentResult;
    metadata: {
        sessionId?: string;
        executionTimeMs?: number;
        modelUsed?: string;
    };
}

/**
 * Decision made on an approval request
 */
export interface ApprovalDecision {
    requestId: string;
    status: ApprovalStatus;
    timestamp: Date;
    feedback?: string;
    editedChanges?: ProposedChange[];
    approvedBy: string;
}

/**
 * Configuration for the approval system
 */
export interface ApprovalConfig {
    /** Agent types that require approval */
    requireApprovalFor: SubagentType[];
    /** Confidence threshold for auto-approval (0.0 - 1.0) */
    autoApproveThreshold: number;
    /** Allow editing changes before approval */
    allowEdit: boolean;
    /** Show inline diff annotations */
    showInlineAnnotations: boolean;
    /** Timeout for approval requests in milliseconds */
    timeoutMs: number;
    /** Default severity for agents */
    defaultSeverity: Record<SubagentType, ApprovalSeverity>;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ApprovalConfig = {
    requireApprovalFor: [
        SubagentType.CODER,
        SubagentType.REFACTORER,
        SubagentType.SECURITY
    ],
    autoApproveThreshold: 0.95,
    allowEdit: true,
    showInlineAnnotations: true,
    timeoutMs: 300000, // 5 minutes
    defaultSeverity: {
        [SubagentType.PLANNER]: ApprovalSeverity.INFO,
        [SubagentType.EXPLORER]: ApprovalSeverity.INFO,
        [SubagentType.CODER]: ApprovalSeverity.WARNING,
        [SubagentType.REVIEWER]: ApprovalSeverity.INFO,
        [SubagentType.TESTER]: ApprovalSeverity.INFO,
        [SubagentType.DEBUGGER]: ApprovalSeverity.WARNING,
        [SubagentType.DOCUMENTER]: ApprovalSeverity.INFO,
        [SubagentType.REFACTORER]: ApprovalSeverity.WARNING,
        [SubagentType.SECURITY]: ApprovalSeverity.CRITICAL,
        [SubagentType.GENERAL]: ApprovalSeverity.INFO
    }
};

/**
 * ApprovalManager - Manages human-in-the-loop approval workflow
 */
export class ApprovalManager extends EventEmitter implements vscode.Disposable {
    private pendingRequests: Map<string, ApprovalRequest> = new Map();
    private config: ApprovalConfig;
    private disposables: vscode.Disposable[] = [];
    private outputChannel: vscode.OutputChannel;

    constructor(private context: vscode.ExtensionContext) {
        super();
        this.config = this.loadConfig();
        this.outputChannel = vscode.window.createOutputChannel('VoiceCode Approvals');
        this.disposables.push(this.outputChannel);

        // Listen for config changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('voicecode.approval')) {
                    this.config = this.loadConfig();
                    this.emit('configChanged', this.config);
                }
            })
        );
    }

    /**
     * Load configuration from VS Code settings
     */
    private loadConfig(): ApprovalConfig {
        const config = vscode.workspace.getConfiguration('voicecode.approval');

        return {
            requireApprovalFor: config.get<string[]>('requireFor', ['coder', 'refactorer', 'security'])
                .map(s => s as SubagentType),
            autoApproveThreshold: config.get<number>('autoApproveThreshold', 0.95),
            allowEdit: config.get<boolean>('allowEdit', true),
            showInlineAnnotations: config.get<boolean>('showInlineAnnotations', true),
            timeoutMs: config.get<number>('timeoutMs', 300000),
            defaultSeverity: DEFAULT_CONFIG.defaultSeverity
        };
    }

    /**
     * Check if an agent type requires approval
     */
    requiresApproval(agentType: SubagentType): boolean {
        return this.config.requireApprovalFor.includes(agentType);
    }

    /**
     * Check if a result should be auto-approved based on confidence
     */
    shouldAutoApprove(confidence: number): boolean {
        return confidence >= this.config.autoApproveThreshold;
    }

    /**
     * Create an approval request for agent changes
     */
    async createApprovalRequest(
        agentType: SubagentType,
        task: string,
        result: AgentResult,
        context: CodeContext
    ): Promise<ApprovalRequest> {
        const id = `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Extract proposed changes from the result
        const changes = await this.extractChanges(result, context);

        // Calculate confidence (from result or estimate)
        const confidence = result.confidence ?? this.estimateConfidence(result);

        const request: ApprovalRequest = {
            id,
            agentType,
            task,
            changes,
            confidence,
            severity: this.config.defaultSeverity[agentType] ?? ApprovalSeverity.INFO,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.config.timeoutMs),
            status: ApprovalStatus.PENDING,
            context,
            agentResult: result,
            metadata: {
                sessionId: context.workspace_root,
                executionTimeMs: result.execution_time_ms
            }
        };

        this.pendingRequests.set(id, request);
        this.emit('requestCreated', request);

        this.log(`Created approval request ${id} for ${agentType} agent`);

        // Set up expiration timeout
        setTimeout(() => {
            const req = this.pendingRequests.get(id);
            if (req && req.status === ApprovalStatus.PENDING) {
                req.status = ApprovalStatus.EXPIRED;
                this.emit('requestExpired', req);
                this.log(`Approval request ${id} expired`);
            }
        }, this.config.timeoutMs);

        return request;
    }

    /**
     * Request approval from the user
     * Returns a promise that resolves when the user makes a decision
     */
    async requestApproval(request: ApprovalRequest): Promise<ApprovalDecision> {
        // Check for auto-approval
        if (this.shouldAutoApprove(request.confidence)) {
            const decision: ApprovalDecision = {
                requestId: request.id,
                status: ApprovalStatus.AUTO_APPROVED,
                timestamp: new Date(),
                approvedBy: 'auto'
            };

            request.status = ApprovalStatus.AUTO_APPROVED;
            this.emit('autoApproved', request, decision);
            this.log(`Auto-approved request ${request.id} (confidence: ${request.confidence})`);

            return decision;
        }

        // Show approval UI
        return this.showApprovalDialog(request);
    }

    /**
     * Show the approval dialog to the user
     */
    private async showApprovalDialog(request: ApprovalRequest): Promise<ApprovalDecision> {
        return new Promise(async (resolve) => {
            // Build the message
            const changesSummary = request.changes.length === 1
                ? `1 file will be modified`
                : `${request.changes.length} files will be modified`;

            const severityIcon = {
                [ApprovalSeverity.INFO]: '$(info)',
                [ApprovalSeverity.WARNING]: '$(warning)',
                [ApprovalSeverity.CRITICAL]: '$(error)'
            }[request.severity];

            const message = `${severityIcon} ${request.agentType.toUpperCase()} Agent: ${changesSummary}\n\nTask: ${request.task}\nConfidence: ${(request.confidence * 100).toFixed(1)}%`;

            // Define buttons
            const approveBtn = 'Approve';
            const rejectBtn = 'Reject';
            const viewDiffBtn = 'View Diff';
            const editBtn = this.config.allowEdit ? 'Edit & Approve' : undefined;

            const buttons = [approveBtn, viewDiffBtn, editBtn, rejectBtn].filter(Boolean) as string[];

            // Show dialog
            const selected = await vscode.window.showInformationMessage(
                message,
                { modal: false },
                ...buttons
            );

            let decision: ApprovalDecision;

            switch (selected) {
                case approveBtn:
                    decision = {
                        requestId: request.id,
                        status: ApprovalStatus.APPROVED,
                        timestamp: new Date(),
                        approvedBy: 'user'
                    };
                    request.status = ApprovalStatus.APPROVED;
                    this.emit('approved', request, decision);
                    break;

                case viewDiffBtn:
                    // Show diff and re-prompt
                    await this.showDiffView(request);
                    decision = await this.showApprovalDialog(request);
                    break;

                case editBtn:
                    // Open editor for changes
                    const editedChanges = await this.openEditView(request);
                    if (editedChanges) {
                        decision = {
                            requestId: request.id,
                            status: ApprovalStatus.EDITED,
                            timestamp: new Date(),
                            approvedBy: 'user',
                            editedChanges
                        };
                        request.status = ApprovalStatus.EDITED;
                        this.emit('edited', request, decision);
                    } else {
                        // User cancelled edit, re-prompt
                        decision = await this.showApprovalDialog(request);
                    }
                    break;

                case rejectBtn:
                default:
                    decision = {
                        requestId: request.id,
                        status: ApprovalStatus.REJECTED,
                        timestamp: new Date(),
                        approvedBy: 'user'
                    };
                    request.status = ApprovalStatus.REJECTED;
                    this.emit('rejected', request, decision);
                    break;
            }

            this.log(`Request ${request.id} ${decision.status}`);
            resolve(decision);
        });
    }

    /**
     * Show diff view for the proposed changes
     */
    private async showDiffView(request: ApprovalRequest): Promise<void> {
        for (const change of request.changes) {
            const originalUri = vscode.Uri.parse(`voicecode-approval:original/${change.filePath}`);
            const proposedUri = vscode.Uri.parse(`voicecode-approval:proposed/${change.filePath}`);

            // Register content provider for this diff
            const provider = new ApprovalDiffContentProvider(change);
            const disposable = vscode.workspace.registerTextDocumentContentProvider(
                'voicecode-approval',
                provider
            );
            this.disposables.push(disposable);

            await vscode.commands.executeCommand(
                'vscode.diff',
                originalUri,
                proposedUri,
                `${change.filePath} (Approval Review)`
            );
        }
    }

    /**
     * Open edit view for modifying changes before approval
     */
    private async openEditView(request: ApprovalRequest): Promise<ProposedChange[] | null> {
        const editedChanges: ProposedChange[] = [];

        for (const change of request.changes) {
            // Create a temporary file with proposed content
            const tempUri = vscode.Uri.parse(`untitled:${change.filePath}.proposed`);
            const doc = await vscode.workspace.openTextDocument(tempUri);
            const editor = await vscode.window.showTextDocument(doc);

            // Insert proposed content
            await editor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(0, 0), change.proposedContent);
            });

            // Wait for user to save or close
            const saved = await new Promise<boolean>((resolve) => {
                const saveDisposable = vscode.workspace.onDidSaveTextDocument(savedDoc => {
                    if (savedDoc.uri.toString() === doc.uri.toString()) {
                        saveDisposable.dispose();
                        resolve(true);
                    }
                });

                const closeDisposable = vscode.workspace.onDidCloseTextDocument(closedDoc => {
                    if (closedDoc.uri.toString() === doc.uri.toString()) {
                        closeDisposable.dispose();
                        resolve(false);
                    }
                });

                this.disposables.push(saveDisposable, closeDisposable);
            });

            if (saved) {
                editedChanges.push({
                    ...change,
                    proposedContent: doc.getText(),
                    diff: this.computeDiff(change.originalContent, doc.getText())
                });
            } else {
                return null; // User cancelled
            }
        }

        return editedChanges;
    }

    /**
     * Extract proposed changes from an agent result
     */
    private async extractChanges(result: AgentResult, context: CodeContext): Promise<ProposedChange[]> {
        const changes: ProposedChange[] = [];

        if (result.code_blocks) {
            for (const block of result.code_blocks) {
                const filePath = block.file_path || context.file_path || 'untitled';

                // Get original content
                let originalContent = '';
                try {
                    const uri = vscode.Uri.file(filePath);
                    const doc = await vscode.workspace.openTextDocument(uri);
                    originalContent = doc.getText();
                } catch {
                    originalContent = context.selected_text || '';
                }

                changes.push({
                    filePath,
                    originalContent,
                    proposedContent: block.code,
                    diff: this.computeDiff(originalContent, block.code),
                    language: block.language || context.language || 'plaintext',
                    lineCount: block.code.split('\n').length
                });
            }
        }

        return changes;
    }

    /**
     * Compute a simple diff between two strings
     */
    private computeDiff(original: string, proposed: string): string {
        const originalLines = original.split('\n');
        const proposedLines = proposed.split('\n');

        const diff: string[] = [];
        const maxLines = Math.max(originalLines.length, proposedLines.length);

        for (let i = 0; i < maxLines; i++) {
            const origLine = originalLines[i];
            const propLine = proposedLines[i];

            if (origLine === undefined) {
                diff.push(`+ ${propLine}`);
            } else if (propLine === undefined) {
                diff.push(`- ${origLine}`);
            } else if (origLine !== propLine) {
                diff.push(`- ${origLine}`);
                diff.push(`+ ${propLine}`);
            }
        }

        return diff.join('\n');
    }

    /**
     * Estimate confidence from a result
     */
    private estimateConfidence(result: AgentResult): number {
        // Base confidence
        let confidence = 0.7;

        // Adjust based on result properties
        if (result.success) confidence += 0.1;
        if (result.code_blocks && result.code_blocks.length > 0) confidence += 0.05;
        if (result.error) confidence -= 0.2;

        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Get all pending approval requests
     */
    getPendingRequests(): ApprovalRequest[] {
        return Array.from(this.pendingRequests.values())
            .filter(r => r.status === ApprovalStatus.PENDING);
    }

    /**
     * Get a specific request by ID
     */
    getRequest(id: string): ApprovalRequest | undefined {
        return this.pendingRequests.get(id);
    }

    /**
     * Cancel a pending request
     */
    cancelRequest(id: string): void {
        const request = this.pendingRequests.get(id);
        if (request && request.status === ApprovalStatus.PENDING) {
            request.status = ApprovalStatus.REJECTED;
            this.emit('cancelled', request);
            this.log(`Cancelled approval request ${id}`);
        }
    }

    /**
     * Get current configuration
     */
    getConfig(): ApprovalConfig {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    async updateConfig(updates: Partial<ApprovalConfig>): Promise<void> {
        const config = vscode.workspace.getConfiguration('voicecode.approval');

        if (updates.requireApprovalFor !== undefined) {
            await config.update('requireFor', updates.requireApprovalFor, true);
        }
        if (updates.autoApproveThreshold !== undefined) {
            await config.update('autoApproveThreshold', updates.autoApproveThreshold, true);
        }
        if (updates.allowEdit !== undefined) {
            await config.update('allowEdit', updates.allowEdit, true);
        }
        if (updates.showInlineAnnotations !== undefined) {
            await config.update('showInlineAnnotations', updates.showInlineAnnotations, true);
        }
        if (updates.timeoutMs !== undefined) {
            await config.update('timeoutMs', updates.timeoutMs, true);
        }
    }

    /**
     * Log a message to the output channel
     */
    private log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.pendingRequests.clear();
        this.disposables.forEach(d => d.dispose());
        this.removeAllListeners();
    }
}

/**
 * Content provider for showing diffs in approval view
 */
class ApprovalDiffContentProvider implements vscode.TextDocumentContentProvider {
    constructor(private change: ProposedChange) {}

    provideTextDocumentContent(uri: vscode.Uri): string {
        if (uri.path.startsWith('original/')) {
            return this.change.originalContent;
        } else {
            return this.change.proposedContent;
        }
    }
}

// Singleton instance
let approvalManagerInstance: ApprovalManager | null = null;

/**
 * Get the singleton ApprovalManager instance
 */
export function getApprovalManager(context?: vscode.ExtensionContext): ApprovalManager {
    if (!approvalManagerInstance && context) {
        approvalManagerInstance = new ApprovalManager(context);
    }
    if (!approvalManagerInstance) {
        throw new Error('ApprovalManager not initialized. Call with context first.');
    }
    return approvalManagerInstance;
}

/**
 * Dispose the singleton instance
 */
export function disposeApprovalManager(): void {
    if (approvalManagerInstance) {
        approvalManagerInstance.dispose();
        approvalManagerInstance = null;
    }
}

/**
 * Register approval-related commands
 */
export function registerApprovalCommands(
    context: vscode.ExtensionContext,
    agentBridge: InternalAgentBridge
): ApprovalManager {
    const manager = getApprovalManager(context);

    // Command: Toggle approval mode
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.approval.toggle', async () => {
            const config = manager.getConfig();
            const enabled = config.requireApprovalFor.length > 0;

            if (enabled) {
                await manager.updateConfig({ requireApprovalFor: [] });
                vscode.window.showInformationMessage('VoiceCode: Approval mode disabled');
            } else {
                await manager.updateConfig({
                    requireApprovalFor: [
                        SubagentType.CODER,
                        SubagentType.REFACTORER,
                        SubagentType.SECURITY
                    ]
                });
                vscode.window.showInformationMessage('VoiceCode: Approval mode enabled');
            }
        })
    );

    // Command: Show pending approvals
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.approval.showPending', async () => {
            const pending = manager.getPendingRequests();

            if (pending.length === 0) {
                vscode.window.showInformationMessage('No pending approval requests');
                return;
            }

            const items = pending.map(r => ({
                label: `$(${r.severity === ApprovalSeverity.CRITICAL ? 'error' : r.severity === ApprovalSeverity.WARNING ? 'warning' : 'info'}) ${r.agentType}`,
                description: r.task.substring(0, 50),
                detail: `${r.changes.length} file(s) • ${(r.confidence * 100).toFixed(0)}% confidence`,
                request: r
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a pending approval to review'
            });

            if (selected) {
                await manager.requestApproval(selected.request);
            }
        })
    );

    // Command: Approve all pending
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.approval.approveAll', async () => {
            const pending = manager.getPendingRequests();

            if (pending.length === 0) {
                vscode.window.showInformationMessage('No pending approval requests');
                return;
            }

            const confirm = await vscode.window.showWarningMessage(
                `Approve all ${pending.length} pending requests?`,
                'Yes',
                'No'
            );

            if (confirm === 'Yes') {
                for (const request of pending) {
                    request.status = ApprovalStatus.APPROVED;
                    manager.emit('approved', request, {
                        requestId: request.id,
                        status: ApprovalStatus.APPROVED,
                        timestamp: new Date(),
                        approvedBy: 'user-bulk'
                    });
                }
                vscode.window.showInformationMessage(`Approved ${pending.length} requests`);
            }
        })
    );

    // Command: Reject all pending
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.approval.rejectAll', async () => {
            const pending = manager.getPendingRequests();

            if (pending.length === 0) {
                vscode.window.showInformationMessage('No pending approval requests');
                return;
            }

            const confirm = await vscode.window.showWarningMessage(
                `Reject all ${pending.length} pending requests?`,
                'Yes',
                'No'
            );

            if (confirm === 'Yes') {
                for (const request of pending) {
                    manager.cancelRequest(request.id);
                }
                vscode.window.showInformationMessage(`Rejected ${pending.length} requests`);
            }
        })
    );

    // Command: Configure approval settings
    context.subscriptions.push(
        vscode.commands.registerCommand('voicecode.approval.configure', async () => {
            const config = manager.getConfig();

            const options = [
                {
                    label: `$(gear) Auto-approve threshold: ${(config.autoApproveThreshold * 100).toFixed(0)}%`,
                    action: 'threshold'
                },
                {
                    label: `$(checklist) Required for: ${config.requireApprovalFor.join(', ') || 'None'}`,
                    action: 'agents'
                },
                {
                    label: `$(edit) Allow edit: ${config.allowEdit ? 'Yes' : 'No'}`,
                    action: 'edit'
                },
                {
                    label: `$(clock) Timeout: ${config.timeoutMs / 1000}s`,
                    action: 'timeout'
                }
            ];

            const selected = await vscode.window.showQuickPick(options, {
                placeHolder: 'Configure approval settings'
            });

            if (!selected) return;

            switch (selected.action) {
                case 'threshold':
                    const threshold = await vscode.window.showInputBox({
                        prompt: 'Enter auto-approve threshold (0-100%)',
                        value: (config.autoApproveThreshold * 100).toString(),
                        validateInput: v => {
                            const n = parseFloat(v);
                            if (isNaN(n) || n < 0 || n > 100) return 'Enter a number between 0 and 100';
                            return null;
                        }
                    });
                    if (threshold) {
                        await manager.updateConfig({ autoApproveThreshold: parseFloat(threshold) / 100 });
                    }
                    break;

                case 'agents':
                    const allAgents = Object.values(SubagentType).filter(a => a !== SubagentType.GENERAL);
                    const agentItems = allAgents.map(a => ({
                        label: a,
                        picked: config.requireApprovalFor.includes(a)
                    }));
                    const selectedAgents = await vscode.window.showQuickPick(agentItems, {
                        canPickMany: true,
                        placeHolder: 'Select agents that require approval'
                    });
                    if (selectedAgents) {
                        await manager.updateConfig({
                            requireApprovalFor: selectedAgents.map(a => a.label as SubagentType)
                        });
                    }
                    break;

                case 'edit':
                    await manager.updateConfig({ allowEdit: !config.allowEdit });
                    break;

                case 'timeout':
                    const timeout = await vscode.window.showInputBox({
                        prompt: 'Enter timeout in seconds',
                        value: (config.timeoutMs / 1000).toString(),
                        validateInput: v => {
                            const n = parseInt(v);
                            if (isNaN(n) || n < 10) return 'Enter a number >= 10';
                            return null;
                        }
                    });
                    if (timeout) {
                        await manager.updateConfig({ timeoutMs: parseInt(timeout) * 1000 });
                    }
                    break;
            }
        })
    );

    return manager;
}
