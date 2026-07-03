/**
 * Cost Tracking Service
 * Tracks API costs, token usage, and enforces budget limits
 * Prevents runaway API costs
 */
import * as vscode from 'vscode';
import { TelemetryService } from './TelemetryService';
/**
 * Token usage record
 */
export interface TokenUsage {
    id: string;
    timestamp: Date;
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
    operation: string;
}
/**
 * Cost summary
 */
export interface CostSummary {
    totalTokens: number;
    totalCost: number;
    byProvider: Record<string, {
        tokens: number;
        cost: number;
    }>;
    byModel: Record<string, {
        tokens: number;
        cost: number;
    }>;
    byOperation: Record<string, {
        tokens: number;
        cost: number;
    }>;
    period: {
        start: Date;
        end: Date;
    };
}
/**
 * Budget alert
 */
export interface BudgetAlert {
    level: 'warning' | 'critical' | 'exceeded';
    currentCost: number;
    budgetLimit: number;
    percentage: number;
    message: string;
}
/**
 * Cost Tracking Service
 * Monitors API usage and enforces budget limits
 */
export declare class CostTrackingService implements vscode.Disposable {
    private usageHistory;
    private context;
    private config;
    private telemetry;
    private disposables;
    private dailyBudget;
    private monthlyBudget;
    private currentDailyCost;
    private currentMonthlyCost;
    private lastResetDate;
    private readonly _onUsageRecorded;
    private readonly _onBudgetAlert;
    private readonly _onBudgetExceeded;
    readonly onUsageRecorded: vscode.Event<TokenUsage>;
    readonly onBudgetAlert: vscode.Event<BudgetAlert>;
    readonly onBudgetExceeded: vscode.Event<BudgetAlert>;
    constructor(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration, telemetry: TelemetryService);
    /**
     * Record token usage
     */
    recordUsage(provider: string, model: string, promptTokens: number, completionTokens: number, operation: string): TokenUsage;
    /**
     * Calculate cost for a model
     */
    private calculateCost;
    /**
     * Check if operation is within budget
     */
    canAfford(model: string, estimatedTokens: number): boolean;
    /**
     * Check budget limits and emit alerts
     */
    private checkBudgetLimits;
    /**
     * Show budget notification
     */
    private showBudgetNotification;
    /**
     * Show usage dashboard
     */
    private showUsageDashboard;
    /**
     * Generate dashboard HTML
     */
    private generateDashboardHTML;
    /**
     * Get cost summary for a period
     */
    getSummary(period: 'today' | 'week' | 'month' | 'all'): CostSummary;
    /**
     * Calculate current costs
     */
    private calculateCurrentCosts;
    /**
     * Setup daily reset timer
     */
    private setupDailyReset;
    /**
     * Reset daily budget
     */
    private resetDailyBudget;
    /**
     * Load usage history from storage
     */
    private loadUsageHistory;
    /**
     * Save usage history to storage
     */
    private saveUsageHistory;
    /**
     * Export usage data
     */
    exportUsage(): TokenUsage[];
    /**
     * Clear usage history
     */
    clearHistory(): Promise<void>;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default CostTrackingService;
//# sourceMappingURL=CostTrackingService.d.ts.map