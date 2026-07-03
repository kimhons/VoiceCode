"use strict";
/**
 * Billing Service (PRO TIER)
 * Manages subscriptions, payments, and billing operations
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
exports.BillingService = void 0;
const vscode = __importStar(require("vscode"));
class BillingService {
    /**
     * Get current subscription info
     */
    async getSubscriptionInfo() {
        // Stub implementation
        return {
            tier: 'PRO',
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: false,
        };
    }
    /**
     * Get usage metrics for current billing period
     */
    async getUsageMetrics() {
        return {
            transcriptionMinutes: 45,
            apiCalls: 1250,
            storageUsedMB: 128,
            limit: {
                transcriptionMinutes: 300, // 5 hours
                apiCalls: 10000,
                storageUsedMB: 1024, // 1 GB
            },
        };
    }
    /**
     * Show billing dashboard
     */
    async showDashboard() {
        const info = await this.getSubscriptionInfo();
        const usage = await this.getUsageMetrics();
        vscode.window.showInformationMessage(`VoiceFlow Pro - ${info.tier} tier (${info.status})\\n` +
            `Usage: ${usage.transcriptionMinutes}/${usage.limit.transcriptionMinutes} minutes`);
    }
    /**
     * Upgrade subscription
     */
    async upgrade() {
        const result = await vscode.window.showInformationMessage('Upgrade to VoiceFlow Pro Enterprise?', 'Upgrade', 'Cancel');
        if (result === 'Upgrade') {
            vscode.env.openExternal(vscode.Uri.parse('https://voiceflow.pro/pricing'));
        }
    }
    /**
     * Cancel subscription
     */
    async cancel() {
        const result = await vscode.window.showWarningMessage('Cancel your VoiceFlow Pro subscription?', { modal: true }, 'Yes, Cancel', 'No');
        if (result === 'Yes, Cancel') {
            vscode.window.showInformationMessage('Subscription will be canceled at the end of the current period');
        }
    }
}
exports.BillingService = BillingService;
//# sourceMappingURL=BillingService.js.map