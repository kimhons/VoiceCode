/**
 * Billing Service (PRO TIER)
 * Manages subscriptions, payments, and billing operations
 */
export interface SubscriptionInfo {
    tier: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
}
export interface UsageMetrics {
    transcriptionMinutes: number;
    apiCalls: number;
    storageUsedMB: number;
    limit: {
        transcriptionMinutes: number;
        apiCalls: number;
        storageUsedMB: number;
    };
}
export declare class BillingService {
    /**
     * Get current subscription info
     */
    getSubscriptionInfo(): Promise<SubscriptionInfo>;
    /**
     * Get usage metrics for current billing period
     */
    getUsageMetrics(): Promise<UsageMetrics>;
    /**
     * Show billing dashboard
     */
    showDashboard(): Promise<void>;
    /**
     * Upgrade subscription
     */
    upgrade(): Promise<void>;
    /**
     * Cancel subscription
     */
    cancel(): Promise<void>;
}
//# sourceMappingURL=BillingService.d.ts.map