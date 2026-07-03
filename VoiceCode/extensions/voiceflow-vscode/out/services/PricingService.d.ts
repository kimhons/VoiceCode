/**
 * Pricing Service
 * Manages usage-based pricing model with tiered levels
 * Enforces usage limits and handles tier upgrades
 */
import * as vscode from 'vscode';
import { ServiceTier } from '../utils/ServiceLoader';
import { TelemetryService } from './TelemetryService';
/**
 * Pricing tier configuration
 */
export interface PricingTier {
    id: ServiceTier;
    name: string;
    displayName: string;
    monthlyPrice: number;
    yearlyPrice: number;
    limits: UsageLimits;
    features: string[];
    popular?: boolean;
}
/**
 * Usage limits per tier
 */
export interface UsageLimits {
    voiceMinutesPerMonth: number;
    aiRequestsPerMonth: number;
    aiRequestsPerDay: number;
    tokensPerMonth: number;
    tokensPerRequest: number;
    concurrentRequests: number;
    conversationHistoryDays: number;
    codebaseIndexSizeMB: number;
    maxAgents: number;
    maxToolChains: number;
    supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
}
/**
 * Current usage tracking
 */
export interface CurrentUsage {
    voiceMinutes: number;
    aiRequests: number;
    tokensUsed: number;
    storageUsedMB: number;
    period: {
        start: Date;
        end: Date;
    };
}
/**
 * Usage-based pricing tiers
 */
export declare const PRICING_TIERS: Record<ServiceTier, PricingTier>;
/**
 * Pricing Service
 * Manages tier limits, usage tracking, and upgrade flows
 */
export declare class PricingService implements vscode.Disposable {
    private context;
    private config;
    private telemetry;
    private currentTier;
    private currentUsage;
    private disposables;
    private readonly _onLimitReached;
    private readonly _onTierChanged;
    readonly onLimitReached: vscode.Event<{
        limit: string;
        tier: ServiceTier;
    }>;
    readonly onTierChanged: vscode.Event<ServiceTier>;
    constructor(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration, telemetry: TelemetryService, currentTier?: ServiceTier);
    /**
     * Get pricing tier configuration
     */
    getTierConfig(tier: ServiceTier): PricingTier;
    /**
     * Get current tier
     */
    getCurrentTier(): ServiceTier;
    /**
     * Get current usage
     */
    getCurrentUsage(): CurrentUsage;
    /**
     * Check if usage is within limits
     */
    checkLimit(limitType: keyof UsageLimits, amount?: number): {
        allowed: boolean;
        remaining: number;
        limit: number;
        percentage: number;
    };
    /**
     * Record usage
     */
    recordUsage(type: 'voice' | 'ai_request' | 'tokens', amount: number): Promise<boolean>;
    /**
     * Handle limit reached
     */
    private handleLimitReached;
    /**
     * Show usage warning (80% threshold)
     */
    private showUsageWarning;
    /**
     * Show usage critical (90% threshold)
     */
    private showUsageCritical;
    /**
     * Get next tier
     */
    private getNextTier;
    /**
     * Show upgrade options
     */
    showUpgradeOptions(): Promise<void>;
    /**
     * Show usage dashboard
     */
    showUsageDashboard(): Promise<void>;
    /**
     * Load usage from storage
     */
    private loadUsage;
    /**
     * Save usage to storage
     */
    private saveUsage;
    /**
     * Create new billing period
     */
    private createNewPeriod;
    /**
     * Reset usage (monthly)
     */
    private resetUsage;
    /**
     * Schedule monthly reset
     */
    private scheduleMonthlyReset;
    /**
     * Dispose resources
     */
    dispose(): void;
}
export default PricingService;
//# sourceMappingURL=PricingService.d.ts.map