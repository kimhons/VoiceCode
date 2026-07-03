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
 * Operations that require approval
 */
const HIGH_RISK_OPERATIONS = new Set([
  'file_operations.delete',
  'git_operations.force_push',
  'git_operations.reset_hard',
  'terminal_run.rm',
  'terminal_run.sudo',
  'multi_file_edit.delete',
]);

const MEDIUM_RISK_OPERATIONS = new Set([
  'file_operations.write',
  'git_operations.commit',
  'git_operations.push',
  'multi_file_edit.modify',
  'terminal_run.install',
]);

/**
 * Human Approval Service
 * Manages approval workflow for risky operations
 */
export class HumanApprovalService implements vscode.Disposable {
  private config: vscode.WorkspaceConfiguration;
  private telemetry: TelemetryService;
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private approvalHistory: Map<string, ApprovalResult> = new Map();
  private disposables: vscode.Disposable[] = [];

  // Auto-approval settings
  private autoApproveEnabled: boolean = false;
  private autoApproveLowRisk: boolean = false;
  private trustedOperations: Set<string> = new Set();

  // Event emitters
  private readonly _onApprovalRequested = new vscode.EventEmitter<ApprovalRequest>();
  private readonly _onApprovalGranted = new vscode.EventEmitter<{ request: ApprovalRequest; result: ApprovalResult }>();
  private readonly _onApprovalDenied = new vscode.EventEmitter<{ request: ApprovalRequest; result: ApprovalResult }>();

  public readonly onApprovalRequested = this._onApprovalRequested.event;
  public readonly onApprovalGranted = this._onApprovalGranted.event;
  public readonly onApprovalDenied = this._onApprovalDenied.event;

  constructor(
    config: vscode.WorkspaceConfiguration,
    telemetry: TelemetryService
  ) {
    this.config = config;
    this.telemetry = telemetry;

    // Load settings
    this.autoApproveEnabled = this.config.get<boolean>('autoApproveOperations', false);
    this.autoApproveLowRisk = this.config.get<boolean>('autoApproveLowRisk', true);
    this.trustedOperations = new Set(this.config.get<string[]>('trustedOperations', []));
  }

  /**
   * Request approval for an operation
   */
  public async requestApproval(
    operation: string,
    description: string,
    details: string,
    affectedFiles?: string[]
  ): Promise<boolean> {
    const riskLevel = this.assessRiskLevel(operation, affectedFiles);

    const request: ApprovalRequest = {
      id: `approval-${Date.now()}-${Math.random()}`,
      operation,
      description,
      details,
      riskLevel,
      affectedFiles,
      timestamp: new Date(),
    };

    this.pendingApprovals.set(request.id, request);
    this._onApprovalRequested.fire(request);

    // Check if auto-approval applies
    if (this.shouldAutoApprove(request)) {
      return this.grantApproval(request.id, 'Auto-approved');
    }

    // Request user approval
    const result = await this.promptUser(request);
    
    if (result.approved) {
      return this.grantApproval(request.id, result.reason);
    } else {
      return this.denyApproval(request.id, result.reason);
    }
  }

  /**
   * Check if operation should be auto-approved
   */
  private shouldAutoApprove(request: ApprovalRequest): boolean {
    // Check if auto-approve is enabled
    if (!this.autoApproveEnabled) {
      return false;
    }

    // Check if operation is trusted
    if (this.trustedOperations.has(request.operation)) {
      return true;
    }

    // Check if low-risk auto-approve is enabled
    if (this.autoApproveLowRisk && request.riskLevel === 'low') {
      return true;
    }

    return false;
  }

  /**
   * Assess risk level of an operation
   */
  private assessRiskLevel(operation: string, affectedFiles?: string[]): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: Multiple files or system operations
    if (affectedFiles && affectedFiles.length > 10) {
      return 'critical';
    }

    // High: Destructive operations
    if (HIGH_RISK_OPERATIONS.has(operation)) {
      return 'high';
    }

    // Medium: Modifying operations
    if (MEDIUM_RISK_OPERATIONS.has(operation)) {
      return 'medium';
    }

    // Low: Read-only or safe operations
    return 'low';
  }

  /**
   * Prompt user for approval
   */
  private async promptUser(request: ApprovalRequest): Promise<ApprovalResult> {
    const icon = this.getRiskIcon(request.riskLevel);
    const message = `${icon} ${request.description}`;
    
    let detailsMessage = request.details;
    if (request.affectedFiles && request.affectedFiles.length > 0) {
      detailsMessage += `\n\nAffected files (${request.affectedFiles.length}):\n`;
      detailsMessage += request.affectedFiles.slice(0, 5).map(f => `  • ${f}`).join('\n');
      if (request.affectedFiles.length > 5) {
        detailsMessage += `\n  ... and ${request.affectedFiles.length - 5} more`;
      }
    }

    const options: string[] = ['Approve', 'Deny', 'View Details'];
    
    if (request.riskLevel === 'low' || request.riskLevel === 'medium') {
      options.push('Always Allow');
    }

    const choice = await vscode.window.showWarningMessage(
      message,
      { modal: request.riskLevel === 'high' || request.riskLevel === 'critical' },
      ...options
    );

    if (choice === 'View Details') {
      await vscode.window.showInformationMessage(detailsMessage, { modal: true });
      // Ask again after showing details
      return this.promptUser(request);
    }

    if (choice === 'Always Allow') {
      this.trustedOperations.add(request.operation);
      await this.config.update('trustedOperations', Array.from(this.trustedOperations), vscode.ConfigurationTarget.Global);
      return { approved: true, timestamp: new Date(), reason: 'Always allowed' };
    }

    return {
      approved: choice === 'Approve',
      timestamp: new Date(),
      reason: choice === 'Approve' ? 'User approved' : 'User denied',
    };
  }

  /**
   * Get risk icon
   */
  private getRiskIcon(riskLevel: string): string {
    switch (riskLevel) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '❓';
    }
  }

  /**
   * Grant approval
   */
  private grantApproval(requestId: string, reason?: string): boolean {
    const request = this.pendingApprovals.get(requestId);
    if (!request) {
      return false;
    }

    const result: ApprovalResult = {
      approved: true,
      timestamp: new Date(),
      reason,
    };

    this.approvalHistory.set(requestId, result);
    this.pendingApprovals.delete(requestId);
    this._onApprovalGranted.fire({ request, result });

    this.telemetry.recordEvent('approval_granted', {
      operation: request.operation,
      riskLevel: request.riskLevel,
      reason: reason || '',
    });

    return true;
  }

  /**
   * Deny approval
   */
  private denyApproval(requestId: string, reason?: string): boolean {
    const request = this.pendingApprovals.get(requestId);
    if (!request) {
      return false;
    }

    const result: ApprovalResult = {
      approved: false,
      timestamp: new Date(),
      reason,
    };

    this.approvalHistory.set(requestId, result);
    this.pendingApprovals.delete(requestId);
    this._onApprovalDenied.fire({ request, result });

    this.telemetry.recordEvent('approval_denied', {
      operation: request.operation,
      riskLevel: request.riskLevel,
      reason: reason || '',
    });

    return false;
  }

  /**
   * Check if operation needs approval
   */
  public needsApproval(operation: string): boolean {
    // Check if operation is trusted
    if (this.trustedOperations.has(operation)) {
      return false;
    }

    // Check if it's a risky operation
    return HIGH_RISK_OPERATIONS.has(operation) || MEDIUM_RISK_OPERATIONS.has(operation);
  }

  /**
   * Get approval history
   */
  public getApprovalHistory(): Array<{ request: ApprovalRequest; result: ApprovalResult }> {
    const history: Array<{ request: ApprovalRequest; result: ApprovalResult }> = [];
    
    for (const [requestId, result] of this.approvalHistory) {
      const request = this.pendingApprovals.get(requestId);
      if (request) {
        history.push({ request, result });
      }
    }

    return history;
  }

  /**
   * Clear approval history
   */
  public clearHistory(): void {
    this.approvalHistory.clear();
    this.telemetry.recordEvent('approval_history_cleared');
  }

  /**
   * Reset trusted operations
   */
  public async resetTrustedOperations(): Promise<void> {
    this.trustedOperations.clear();
    await this.config.update('trustedOperations', [], vscode.ConfigurationTarget.Global);
    this.telemetry.recordEvent('trusted_operations_reset');
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this._onApprovalRequested.dispose();
    this._onApprovalGranted.dispose();
    this._onApprovalDenied.dispose();
  }
}

export default HumanApprovalService;
