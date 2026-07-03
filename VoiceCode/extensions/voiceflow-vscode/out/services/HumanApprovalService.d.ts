/**
 * Human Approval Service
 * Provides human-in-the-loop approval gates for destructive operations
 * Prevents accidental file deletion, git operations, etc.
 */
import * as vscode from 'vscode';
import { TelemetryService } from './TelemetryService';
/**
 * Approval request
 */
export interface ApprovalRequest {
    id: string;
    operation: string;
    description: string;
    details: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    affectedFiles?: string[];
    timestamp: Date;
}
/**
 * Approval result
 */
export interface ApprovalResult {
    approved: boolean;
    timestamp: Date;
    reason?: string;
}
/**
 * Human Approval Service
 * Manages approval workflow for risky operations
 */
export declare class HumanApprovalService implements vscode.Disposable {
    private config;
    private telemetry;
    private pendingApprovals;
    private approvalHistory;
    private disposables;
    private autoApproveEnabled;
    private autoApproveLowRisk;
    private trustedOperations;
    private readonly _onApprovalRequested;
    private readonly _onApprovalGranted;
    private readonly _onApprovalDenied;
    readonly onApprovalRequested: vscode.Event<ApprovalRequest>;
    readonly onApprovalGranted: vscode.Event<{
        request: ApprovalRequest;
        result: ApprovalResult;
    }>;
    readonly onApprovalDenied: vscode.Event<{
        request: ApprovalRequest;
        result: ApprovalResult;
    }>;
    constructor(config: vscode.WorkspaceConfiguration, telemetry: TelemetryService);
    /**
     * Request approval for an operation
     */
    requestApproval(operation: string, description: string, details: string, affectedFiles?: string[]): Promise<boolean>;
    /**
     * Check if operation should be auto-approved
     */
    private shouldAutoApprove;
    /**
     * Assess risk level of an operation
     */
    private assessRiskLevel;
    /**
     * Prompt user for approval
     */
    private promptUser;
    /**
     * Get risk icon
     */
    private getRiskIcon;
    /**
     * Grant approval
     */
    private grantApproval;
    /**
     * Deny approval
     */
    private denyApproval;
    /**
     * Check if operation needs approval
     */
    needsApproval(operation: string): boolean;
    /**
     * Get approval history
     */
    getApprovalHistory(): Array<{
        request: ApprovalRequest;
        result: ApprovalResult;
    }>;
    /**
     * Clear approval history
     */
    clearHistory(): void;
    /**
     * Reset trusted operations
     */
    resetTrustedOperations(): Promise<void>;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default HumanApprovalService;
//# sourceMappingURL=HumanApprovalService.d.ts.map