"use strict";
/**
 * Human Approval Service
 * Provides human-in-the-loop approval gates for destructive operations
 * Prevents accidental file deletion, git operations, etc.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HumanApprovalService = void 0;
const vscode = __importStar(require("vscode"));
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
class HumanApprovalService {
    config;
    telemetry;
    pendingApprovals = new Map();
    approvalHistory = new Map();
    disposables = [];
    // Auto-approval settings
    autoApproveEnabled = false;
    autoApproveLowRisk = false;
    trustedOperations = new Set();
    // Event emitters
    _onApprovalRequested = new vscode.EventEmitter();
    _onApprovalGranted = new vscode.EventEmitter();
    _onApprovalDenied = new vscode.EventEmitter();
    onApprovalRequested = this._onApprovalRequested.event;
    onApprovalGranted = this._onApprovalGranted.event;
    onApprovalDenied = this._onApprovalDenied.event;
    constructor(config, telemetry) {
        this.config = config;
        this.telemetry = telemetry;
        // Load settings
        this.autoApproveEnabled = this.config.get('autoApproveOperations', false);
        this.autoApproveLowRisk = this.config.get('autoApproveLowRisk', true);
        this.trustedOperations = new Set(this.config.get('trustedOperations', []));
    }
    /**
     * Request approval for an operation
     */
    async requestApproval(operation, description, details, affectedFiles) {
        const riskLevel = this.assessRiskLevel(operation, affectedFiles);
        const request = {
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
        }
        else {
            return this.denyApproval(request.id, result.reason);
        }
    }
    /**
     * Check if operation should be auto-approved
     */
    shouldAutoApprove(request) {
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
    assessRiskLevel(operation, affectedFiles) {
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
    async promptUser(request) {
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
        const options = ['Approve', 'Deny', 'View Details'];
        if (request.riskLevel === 'low' || request.riskLevel === 'medium') {
            options.push('Always Allow');
        }
        const choice = await vscode.window.showWarningMessage(message, { modal: request.riskLevel === 'high' || request.riskLevel === 'critical' }, ...options);
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
    getRiskIcon(riskLevel) {
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
    grantApproval(requestId, reason) {
        const request = this.pendingApprovals.get(requestId);
        if (!request) {
            return false;
        }
        const result = {
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
    denyApproval(requestId, reason) {
        const request = this.pendingApprovals.get(requestId);
        if (!request) {
            return false;
        }
        const result = {
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
    needsApproval(operation) {
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
    getApprovalHistory() {
        const history = [];
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
    clearHistory() {
        this.approvalHistory.clear();
        this.telemetry.recordEvent('approval_history_cleared');
    }
    /**
     * Reset trusted operations
     */
    async resetTrustedOperations() {
        this.trustedOperations.clear();
        await this.config.update('trustedOperations', [], vscode.ConfigurationTarget.Global);
        this.telemetry.recordEvent('trusted_operations_reset');
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this._onApprovalRequested.dispose();
        this._onApprovalGranted.dispose();
        this._onApprovalDenied.dispose();
    }
}
exports.HumanApprovalService = HumanApprovalService;
exports.default = HumanApprovalService;
//# sourceMappingURL=HumanApprovalService.js.map