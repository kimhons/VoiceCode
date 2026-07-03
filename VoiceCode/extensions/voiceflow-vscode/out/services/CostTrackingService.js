"use strict";
/**
 * Cost Tracking Service
 * Tracks API costs, token usage, and enforces budget limits
 * Prevents runaway API costs
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
exports.CostTrackingService = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Pricing information (per 1M tokens)
 */
const PRICING = {
    'gpt-4o': { prompt: 2.50, completion: 10.00 },
    'gpt-4o-mini': { prompt: 0.15, completion: 0.60 },
    'gpt-4-turbo': { prompt: 10.00, completion: 30.00 },
    'gpt-4': { prompt: 30.00, completion: 60.00 },
    'gpt-3.5-turbo': { prompt: 0.50, completion: 1.50 },
    'claude-3-5-sonnet-20241022': { prompt: 3.00, completion: 15.00 },
    'claude-3-opus': { prompt: 15.00, completion: 75.00 },
    'claude-3-sonnet': { prompt: 3.00, completion: 15.00 },
    'claude-3-haiku': { prompt: 0.25, completion: 1.25 },
    'text-embedding-3-small': { prompt: 0.02, completion: 0 },
    'text-embedding-3-large': { prompt: 0.13, completion: 0 },
};
/**
 * Cost Tracking Service
 * Monitors API usage and enforces budget limits
 */
class CostTrackingService {
    usageHistory = [];
    context;
    config;
    telemetry;
    disposables = [];
    // Budget tracking
    dailyBudget = 0;
    monthlyBudget = 0;
    currentDailyCost = 0;
    currentMonthlyCost = 0;
    lastResetDate = new Date();
    // Event emitters
    _onUsageRecorded = new vscode.EventEmitter();
    _onBudgetAlert = new vscode.EventEmitter();
    _onBudgetExceeded = new vscode.EventEmitter();
    onUsageRecorded = this._onUsageRecorded.event;
    onBudgetAlert = this._onBudgetAlert.event;
    onBudgetExceeded = this._onBudgetExceeded.event;
    constructor(context, config, telemetry) {
        this.context = context;
        this.config = config;
        this.telemetry = telemetry;
        // Load configuration
        this.dailyBudget = this.config.get('dailyBudgetLimit', 5.0); // $5/day default
        this.monthlyBudget = this.config.get('monthlyBudgetLimit', 100.0); // $100/month default
        // Load existing usage
        this.loadUsageHistory();
        // Calculate current costs
        this.calculateCurrentCosts();
        // Setup daily reset
        this.setupDailyReset();
    }
    /**
     * Record token usage
     */
    recordUsage(provider, model, promptTokens, completionTokens, operation) {
        const totalTokens = promptTokens + completionTokens;
        const estimatedCost = this.calculateCost(model, promptTokens, completionTokens);
        const usage = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            provider,
            model,
            promptTokens,
            completionTokens,
            totalTokens,
            estimatedCost,
            operation,
        };
        this.usageHistory.push(usage);
        this.currentDailyCost += estimatedCost;
        this.currentMonthlyCost += estimatedCost;
        this._onUsageRecorded.fire(usage);
        // Check budget limits
        this.checkBudgetLimits();
        // Periodically save
        if (this.usageHistory.length % 10 === 0) {
            this.saveUsageHistory();
        }
        this.telemetry.recordEvent('token_usage_recorded', {
            provider,
            model,
            totalTokens,
            estimatedCost,
            operation,
        });
        return usage;
    }
    /**
     * Calculate cost for a model
     */
    calculateCost(model, promptTokens, completionTokens) {
        const pricing = PRICING[model] || PRICING['gpt-4o-mini']; // Default to cheapest
        const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
        const completionCost = (completionTokens / 1_000_000) * pricing.completion;
        return promptCost + completionCost;
    }
    /**
     * Check if operation is within budget
     */
    canAfford(model, estimatedTokens) {
        const estimatedCost = this.calculateCost(model, estimatedTokens, estimatedTokens);
        // Check daily budget
        if (this.dailyBudget > 0 && this.currentDailyCost + estimatedCost > this.dailyBudget) {
            return false;
        }
        // Check monthly budget
        if (this.monthlyBudget > 0 && this.currentMonthlyCost + estimatedCost > this.monthlyBudget) {
            return false;
        }
        return true;
    }
    /**
     * Check budget limits and emit alerts
     */
    checkBudgetLimits() {
        // Check daily budget
        if (this.dailyBudget > 0) {
            const dailyPercentage = (this.currentDailyCost / this.dailyBudget) * 100;
            if (dailyPercentage >= 100) {
                const alert = {
                    level: 'exceeded',
                    currentCost: this.currentDailyCost,
                    budgetLimit: this.dailyBudget,
                    percentage: dailyPercentage,
                    message: `Daily budget exceeded: $${this.currentDailyCost.toFixed(2)} / $${this.dailyBudget.toFixed(2)}`,
                };
                this._onBudgetExceeded.fire(alert);
                this.showBudgetNotification(alert);
            }
            else if (dailyPercentage >= 90) {
                const alert = {
                    level: 'critical',
                    currentCost: this.currentDailyCost,
                    budgetLimit: this.dailyBudget,
                    percentage: dailyPercentage,
                    message: `Daily budget at ${dailyPercentage.toFixed(0)}%: $${this.currentDailyCost.toFixed(2)} / $${this.dailyBudget.toFixed(2)}`,
                };
                this._onBudgetAlert.fire(alert);
            }
            else if (dailyPercentage >= 75) {
                const alert = {
                    level: 'warning',
                    currentCost: this.currentDailyCost,
                    budgetLimit: this.dailyBudget,
                    percentage: dailyPercentage,
                    message: `Daily budget at ${dailyPercentage.toFixed(0)}%: $${this.currentDailyCost.toFixed(2)} / $${this.dailyBudget.toFixed(2)}`,
                };
                this._onBudgetAlert.fire(alert);
            }
        }
        // Check monthly budget
        if (this.monthlyBudget > 0) {
            const monthlyPercentage = (this.currentMonthlyCost / this.monthlyBudget) * 100;
            if (monthlyPercentage >= 100) {
                const alert = {
                    level: 'exceeded',
                    currentCost: this.currentMonthlyCost,
                    budgetLimit: this.monthlyBudget,
                    percentage: monthlyPercentage,
                    message: `Monthly budget exceeded: $${this.currentMonthlyCost.toFixed(2)} / $${this.monthlyBudget.toFixed(2)}`,
                };
                this._onBudgetExceeded.fire(alert);
                this.showBudgetNotification(alert);
            }
        }
    }
    /**
     * Show budget notification
     */
    showBudgetNotification(alert) {
        const message = alert.message;
        if (alert.level === 'exceeded') {
            vscode.window.showErrorMessage(message, 'View Usage', 'Increase Budget').then(action => {
                if (action === 'View Usage') {
                    this.showUsageDashboard();
                }
                else if (action === 'Increase Budget') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'voicecode.dailyBudgetLimit');
                }
            });
        }
        else if (alert.level === 'critical') {
            vscode.window.showWarningMessage(message, 'View Usage').then(action => {
                if (action === 'View Usage') {
                    this.showUsageDashboard();
                }
            });
        }
    }
    /**
     * Show usage dashboard
     */
    showUsageDashboard() {
        const summary = this.getSummary('today');
        const panel = vscode.window.createWebviewPanel('voicecodeCostDashboard', 'VoiceCode Cost Dashboard', vscode.ViewColumn.One, {});
        panel.webview.html = this.generateDashboardHTML(summary);
    }
    /**
     * Generate dashboard HTML
     */
    generateDashboardHTML(summary) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .stat { margin: 10px 0; padding: 10px; background: #f0f0f0; border-radius: 5px; }
          .stat-label { font-weight: bold; }
          .stat-value { font-size: 1.2em; color: #007acc; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #007acc; color: white; }
        </style>
      </head>
      <body>
        <h1>Cost Dashboard</h1>
        <div class="stat">
          <span class="stat-label">Total Cost:</span>
          <span class="stat-value">$${summary.totalCost.toFixed(2)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total Tokens:</span>
          <span class="stat-value">${summary.totalTokens.toLocaleString()}</span>
        </div>
        <h2>By Provider</h2>
        <table>
          <tr><th>Provider</th><th>Tokens</th><th>Cost</th></tr>
          ${Object.entries(summary.byProvider).map(([provider, data]) => `
            <tr>
              <td>${provider}</td>
              <td>${data.tokens.toLocaleString()}</td>
              <td>$${data.cost.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;
    }
    /**
     * Get cost summary for a period
     */
    getSummary(period) {
        const now = new Date();
        let startDate;
        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                startDate = new Date(0);
        }
        const filteredUsage = this.usageHistory.filter(u => u.timestamp >= startDate);
        const summary = {
            totalTokens: 0,
            totalCost: 0,
            byProvider: {},
            byModel: {},
            byOperation: {},
            period: { start: startDate, end: now },
        };
        for (const usage of filteredUsage) {
            summary.totalTokens += usage.totalTokens;
            summary.totalCost += usage.estimatedCost;
            // By provider
            if (!summary.byProvider[usage.provider]) {
                summary.byProvider[usage.provider] = { tokens: 0, cost: 0 };
            }
            summary.byProvider[usage.provider].tokens += usage.totalTokens;
            summary.byProvider[usage.provider].cost += usage.estimatedCost;
            // By model
            if (!summary.byModel[usage.model]) {
                summary.byModel[usage.model] = { tokens: 0, cost: 0 };
            }
            summary.byModel[usage.model].tokens += usage.totalTokens;
            summary.byModel[usage.model].cost += usage.estimatedCost;
            // By operation
            if (!summary.byOperation[usage.operation]) {
                summary.byOperation[usage.operation] = { tokens: 0, cost: 0 };
            }
            summary.byOperation[usage.operation].tokens += usage.totalTokens;
            summary.byOperation[usage.operation].cost += usage.estimatedCost;
        }
        return summary;
    }
    /**
     * Calculate current costs
     */
    calculateCurrentCosts() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        this.currentDailyCost = this.usageHistory
            .filter(u => u.timestamp >= today)
            .reduce((sum, u) => sum + u.estimatedCost, 0);
        this.currentMonthlyCost = this.usageHistory
            .filter(u => u.timestamp >= thisMonth)
            .reduce((sum, u) => sum + u.estimatedCost, 0);
    }
    /**
     * Setup daily reset timer
     */
    setupDailyReset() {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        setTimeout(() => {
            this.resetDailyBudget();
            // Setup recurring daily reset
            setInterval(() => this.resetDailyBudget(), 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    }
    /**
     * Reset daily budget
     */
    resetDailyBudget() {
        this.currentDailyCost = 0;
        this.lastResetDate = new Date();
        this.telemetry.recordEvent('daily_budget_reset', {
            previousCost: this.currentDailyCost,
        });
    }
    /**
     * Load usage history from storage
     */
    async loadUsageHistory() {
        try {
            const saved = this.context.globalState.get('tokenUsageHistory');
            if (saved) {
                this.usageHistory = saved.map(u => ({
                    ...u,
                    timestamp: new Date(u.timestamp),
                }));
                console.log(`[CostTracking] Loaded ${this.usageHistory.length} usage records`);
            }
        }
        catch (error) {
            console.error('[CostTracking] Failed to load usage history:', error);
        }
    }
    /**
     * Save usage history to storage
     */
    async saveUsageHistory() {
        try {
            // Keep only last 1000 records
            const recentUsage = this.usageHistory.slice(-1000);
            await this.context.globalState.update('tokenUsageHistory', recentUsage);
            console.log(`[CostTracking] Saved ${recentUsage.length} usage records`);
        }
        catch (error) {
            console.error('[CostTracking] Failed to save usage history:', error);
        }
    }
    /**
     * Export usage data
     */
    exportUsage() {
        return [...this.usageHistory];
    }
    /**
     * Clear usage history
     */
    async clearHistory() {
        this.usageHistory = [];
        this.currentDailyCost = 0;
        this.currentMonthlyCost = 0;
        await this.context.globalState.update('tokenUsageHistory', undefined);
        this.telemetry.recordEvent('usage_history_cleared');
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this._onUsageRecorded.dispose();
        this._onBudgetAlert.dispose();
        this._onBudgetExceeded.dispose();
    }
}
exports.CostTrackingService = CostTrackingService;
exports.default = CostTrackingService;
//# sourceMappingURL=CostTrackingService.js.map