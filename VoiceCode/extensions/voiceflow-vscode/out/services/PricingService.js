"use strict";
/**
 * Pricing Service
 * Manages usage-based pricing model with tiered levels
 * Enforces usage limits and handles tier upgrades
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
exports.PricingService = exports.PRICING_TIERS = void 0;
const vscode = __importStar(require("vscode"));
const ServiceLoader_1 = require("../utils/ServiceLoader");
/**
 * Usage-based pricing tiers
 */
exports.PRICING_TIERS = {
    [ServiceLoader_1.ServiceTier.FREE]: {
        id: ServiceLoader_1.ServiceTier.FREE,
        name: 'free',
        displayName: 'Free',
        monthlyPrice: 0,
        yearlyPrice: 0,
        limits: {
            voiceMinutesPerMonth: 50,
            aiRequestsPerMonth: 75,
            aiRequestsPerDay: 5,
            tokensPerMonth: 175000, // 175K tokens (75 req × 2,300 avg)
            tokensPerRequest: 4000,
            concurrentRequests: 1,
            conversationHistoryDays: 7,
            codebaseIndexSizeMB: 10,
            maxAgents: 3,
            maxToolChains: 1,
            supportLevel: 'community',
        },
        features: [
            'Basic voice recognition (Whisper-tiny)',
            '75 AI requests/month',
            '175K tokens/month',
            '3 internal agents',
            'Basic voice commands',
            'Community support',
            '7-day conversation history',
        ],
    },
    [ServiceLoader_1.ServiceTier.BASIC]: {
        id: ServiceLoader_1.ServiceTier.BASIC,
        name: 'basic',
        displayName: 'Basic',
        monthlyPrice: 19.99,
        yearlyPrice: 199.99,
        limits: {
            voiceMinutesPerMonth: 150,
            aiRequestsPerMonth: 750,
            aiRequestsPerDay: 35,
            tokensPerMonth: 1750000, // 1.75M tokens
            tokensPerRequest: 8000,
            concurrentRequests: 3,
            conversationHistoryDays: 30,
            codebaseIndexSizeMB: 50,
            maxAgents: 5,
            maxToolChains: 3,
            supportLevel: 'email',
        },
        features: [
            'Advanced voice recognition (Whisper-base)',
            '750 AI requests/month',
            '1.75M tokens/month',
            '5 agents (3 internal + 2 external)',
            'Voice settings management',
            'Email support',
            '30-day conversation history',
            'Cost tracking',
        ],
    },
    [ServiceLoader_1.ServiceTier.STANDARD]: {
        id: ServiceLoader_1.ServiceTier.STANDARD,
        name: 'standard',
        displayName: 'Standard',
        monthlyPrice: 39.99,
        yearlyPrice: 399.99,
        popular: true,
        limits: {
            voiceMinutesPerMonth: 300,
            aiRequestsPerMonth: 1500,
            aiRequestsPerDay: 75,
            tokensPerMonth: 3750000, // 3.75M tokens
            tokensPerRequest: 16000,
            concurrentRequests: 5,
            conversationHistoryDays: 90,
            codebaseIndexSizeMB: 100,
            maxAgents: 10,
            maxToolChains: 10,
            supportLevel: 'email',
        },
        features: [
            'Advanced voice recognition (Whisper-small)',
            '1,500 AI requests/month',
            '3.75M tokens/month',
            '10 agents (5 internal + 5 external)',
            'Multi-agent orchestration',
            'Voice settings management',
            'Cloud sync',
            'Voice training',
            'Email support',
            '90-day conversation history',
            'Cost tracking & budgets',
        ],
    },
    [ServiceLoader_1.ServiceTier.PRO]: {
        id: ServiceLoader_1.ServiceTier.PRO,
        name: 'pro',
        displayName: 'Pro',
        monthlyPrice: 99.99,
        yearlyPrice: 999.99,
        limits: {
            voiceMinutesPerMonth: 1000,
            aiRequestsPerMonth: 4000,
            aiRequestsPerDay: 150,
            tokensPerMonth: 10000000, // 10M tokens
            tokensPerRequest: 32000,
            concurrentRequests: 10,
            conversationHistoryDays: 180,
            codebaseIndexSizeMB: 500,
            maxAgents: 15,
            maxToolChains: 25,
            supportLevel: 'priority',
        },
        features: [
            'Premium voice recognition (Whisper-medium)',
            '4,000 AI requests/month',
            '10M tokens/month',
            '15 agents (all internal + external)',
            'Advanced multi-agent workflows',
            'Voice settings management',
            'Cloud sync',
            'Voice training',
            'Priority support',
            '180-day conversation history',
            'Advanced cost tracking',
            'Custom integrations',
        ],
    },
    [ServiceLoader_1.ServiceTier.ENTERPRISE]: {
        id: ServiceLoader_1.ServiceTier.ENTERPRISE,
        name: 'enterprise',
        displayName: 'Enterprise',
        monthlyPrice: 299,
        yearlyPrice: 2999,
        limits: {
            voiceMinutesPerMonth: 3000,
            aiRequestsPerMonth: 12000,
            aiRequestsPerDay: 400,
            tokensPerMonth: 30000000, // 30M tokens
            tokensPerRequest: 128000,
            concurrentRequests: 20,
            conversationHistoryDays: 365,
            codebaseIndexSizeMB: 2000,
            maxAgents: -1, // Unlimited
            maxToolChains: -1, // Unlimited
            supportLevel: 'dedicated',
        },
        features: [
            'Premium voice recognition (Whisper-large + Deepgram)',
            '12,000 AI requests/month',
            '30M tokens/month',
            'Unlimited agents',
            'Advanced multi-agent workflows',
            'Team collaboration',
            'Multi-window support',
            'Custom voice models',
            'Dedicated support',
            '1-year conversation history',
            'Advanced cost tracking',
            'Custom integrations',
            'SSO & security features',
            'White-glove onboarding',
            'Custom pricing available',
        ],
    },
};
/**
 * Pricing Service
 * Manages tier limits, usage tracking, and upgrade flows
 */
class PricingService {
    context;
    config;
    telemetry;
    currentTier = ServiceLoader_1.ServiceTier.FREE;
    currentUsage;
    disposables = [];
    // Event emitters
    _onLimitReached = new vscode.EventEmitter();
    _onTierChanged = new vscode.EventEmitter();
    onLimitReached = this._onLimitReached.event;
    onTierChanged = this._onTierChanged.event;
    constructor(context, config, telemetry, currentTier = ServiceLoader_1.ServiceTier.FREE) {
        this.context = context;
        this.config = config;
        this.telemetry = telemetry;
        this.currentTier = currentTier;
        // Initialize usage tracking
        this.currentUsage = this.loadUsage();
        // Reset usage at the start of each month
        this.scheduleMonthlyReset();
    }
    /**
     * Get pricing tier configuration
     */
    getTierConfig(tier) {
        return exports.PRICING_TIERS[tier];
    }
    /**
     * Get current tier
     */
    getCurrentTier() {
        return this.currentTier;
    }
    /**
     * Get current usage
     */
    getCurrentUsage() {
        return { ...this.currentUsage };
    }
    /**
     * Check if usage is within limits
     */
    checkLimit(limitType, amount = 1) {
        const tierConfig = this.getTierConfig(this.currentTier);
        const limit = tierConfig.limits[limitType];
        // -1 means unlimited
        if (limit === -1) {
            return {
                allowed: true,
                remaining: -1,
                limit: -1,
                percentage: 0,
            };
        }
        let currentUsageValue = 0;
        // Map limit type to current usage
        switch (limitType) {
            case 'voiceMinutesPerMonth':
                currentUsageValue = this.currentUsage.voiceMinutes;
                break;
            case 'aiRequestsPerMonth':
            case 'aiRequestsPerDay':
                currentUsageValue = this.currentUsage.aiRequests;
                break;
            case 'tokensPerMonth':
            case 'tokensPerRequest':
                currentUsageValue = this.currentUsage.tokensUsed;
                break;
        }
        const remaining = Math.max(0, limit - currentUsageValue);
        const allowed = currentUsageValue + amount <= limit;
        const percentage = limit > 0 ? (currentUsageValue / limit) * 100 : 0;
        return {
            allowed,
            remaining,
            limit,
            percentage,
        };
    }
    /**
     * Record usage
     */
    async recordUsage(type, amount) {
        let limitType;
        let allowed = true;
        switch (type) {
            case 'voice':
                limitType = 'voiceMinutesPerMonth';
                const voiceCheck = this.checkLimit(limitType, amount);
                if (!voiceCheck.allowed) {
                    this.handleLimitReached('voice minutes', voiceCheck);
                    return false;
                }
                this.currentUsage.voiceMinutes += amount;
                break;
            case 'ai_request':
                limitType = 'aiRequestsPerMonth';
                const requestCheck = this.checkLimit(limitType, amount);
                if (!requestCheck.allowed) {
                    this.handleLimitReached('AI requests', requestCheck);
                    return false;
                }
                this.currentUsage.aiRequests += amount;
                break;
            case 'tokens':
                limitType = 'tokensPerMonth';
                const tokenCheck = this.checkLimit(limitType, amount);
                if (!tokenCheck.allowed) {
                    this.handleLimitReached('tokens', tokenCheck);
                    return false;
                }
                this.currentUsage.tokensUsed += amount;
                break;
        }
        // Save usage
        await this.saveUsage();
        // Check for warnings (80% and 90% thresholds)
        const check = this.checkLimit(limitType);
        if (check.percentage >= 80 && check.percentage < 90) {
            this.showUsageWarning(limitType, check.percentage);
        }
        else if (check.percentage >= 90) {
            this.showUsageCritical(limitType, check.percentage);
        }
        return true;
    }
    /**
     * Handle limit reached
     */
    handleLimitReached(limitName, check) {
        this._onLimitReached.fire({ limit: limitName, tier: this.currentTier });
        const tierConfig = this.getTierConfig(this.currentTier);
        const nextTier = this.getNextTier();
        vscode.window.showWarningMessage(`You've reached your ${tierConfig.displayName} tier limit for ${limitName} (${check.limit} per month). Upgrade to continue.`, 'Upgrade', 'View Usage').then(selection => {
            if (selection === 'Upgrade') {
                this.showUpgradeOptions();
            }
            else if (selection === 'View Usage') {
                this.showUsageDashboard();
            }
        });
        this.telemetry.recordEvent('usage_limit_reached', {
            tier: this.currentTier,
            limitType: limitName,
            limit: check.limit,
        });
    }
    /**
     * Show usage warning (80% threshold)
     */
    showUsageWarning(limitType, percentage) {
        const tierConfig = this.getTierConfig(this.currentTier);
        vscode.window.showInformationMessage(`You've used ${Math.round(percentage)}% of your ${tierConfig.displayName} tier ${limitType} limit.`, 'View Usage', 'Upgrade').then(selection => {
            if (selection === 'View Usage') {
                this.showUsageDashboard();
            }
            else if (selection === 'Upgrade') {
                this.showUpgradeOptions();
            }
        });
    }
    /**
     * Show usage critical (90% threshold)
     */
    showUsageCritical(limitType, percentage) {
        const tierConfig = this.getTierConfig(this.currentTier);
        vscode.window.showWarningMessage(`⚠️ You've used ${Math.round(percentage)}% of your ${tierConfig.displayName} tier ${limitType} limit. Consider upgrading.`, 'Upgrade Now', 'View Usage').then(selection => {
            if (selection === 'Upgrade Now') {
                this.showUpgradeOptions();
            }
            else if (selection === 'View Usage') {
                this.showUsageDashboard();
            }
        });
    }
    /**
     * Get next tier
     */
    getNextTier() {
        if (this.currentTier === ServiceLoader_1.ServiceTier.FREE)
            return ServiceLoader_1.ServiceTier.PRO;
        if (this.currentTier === ServiceLoader_1.ServiceTier.PRO)
            return ServiceLoader_1.ServiceTier.ENTERPRISE;
        return null;
    }
    /**
     * Show upgrade options
     */
    async showUpgradeOptions() {
        const currentConfig = this.getTierConfig(this.currentTier);
        const items = [];
        // Add higher tiers
        if (this.currentTier !== ServiceLoader_1.ServiceTier.PRO) {
            const proConfig = this.getTierConfig(ServiceLoader_1.ServiceTier.PRO);
            items.push({
                label: `$(star) ${proConfig.displayName}`,
                description: `$${proConfig.monthlyPrice}/month`,
                detail: `${proConfig.limits.aiRequestsPerMonth} AI requests/month • ${proConfig.limits.voiceMinutesPerMonth} voice minutes • ${proConfig.features.length} features`,
            });
        }
        if (this.currentTier !== ServiceLoader_1.ServiceTier.ENTERPRISE) {
            const enterpriseConfig = this.getTierConfig(ServiceLoader_1.ServiceTier.ENTERPRISE);
            items.push({
                label: `$(organization) ${enterpriseConfig.displayName}`,
                description: `$${enterpriseConfig.monthlyPrice}/month`,
                detail: 'Unlimited requests • Unlimited voice • Premium support • Team features',
            });
        }
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Choose a plan to upgrade',
            title: 'Upgrade VoiceCode',
        });
        if (selected) {
            vscode.env.openExternal(vscode.Uri.parse('https://voicecode.pro/pricing'));
            this.telemetry.recordEvent('upgrade_initiated', {
                currentTier: this.currentTier,
                targetTier: selected.label.includes('Pro') ? 'pro' : 'enterprise',
            });
        }
    }
    /**
     * Show usage dashboard
     */
    async showUsageDashboard() {
        const tierConfig = this.getTierConfig(this.currentTier);
        const usage = this.currentUsage;
        const voiceCheck = this.checkLimit('voiceMinutesPerMonth');
        const requestCheck = this.checkLimit('aiRequestsPerMonth');
        const tokenCheck = this.checkLimit('tokensPerMonth');
        const message = [
            `**${tierConfig.displayName} Tier Usage**`,
            '',
            `Voice Minutes: ${usage.voiceMinutes}/${voiceCheck.limit === -1 ? '∞' : voiceCheck.limit} (${Math.round(voiceCheck.percentage)}%)`,
            `AI Requests: ${usage.aiRequests}/${requestCheck.limit === -1 ? '∞' : requestCheck.limit} (${Math.round(requestCheck.percentage)}%)`,
            `Tokens: ${usage.tokensUsed.toLocaleString()}/${tokenCheck.limit === -1 ? '∞' : tokenCheck.limit.toLocaleString()} (${Math.round(tokenCheck.percentage)}%)`,
            '',
            `Period: ${usage.period.start.toLocaleDateString()} - ${usage.period.end.toLocaleDateString()}`,
        ].join('\n');
        const action = await vscode.window.showInformationMessage(message, { modal: false }, 'Upgrade', 'Close');
        if (action === 'Upgrade') {
            this.showUpgradeOptions();
        }
    }
    /**
     * Load usage from storage
     */
    loadUsage() {
        const stored = this.context.globalState.get('voicecode.usage');
        if (stored && new Date(stored.period.end) > new Date()) {
            return {
                ...stored,
                period: {
                    start: new Date(stored.period.start),
                    end: new Date(stored.period.end),
                },
            };
        }
        // Create new period
        return this.createNewPeriod();
    }
    /**
     * Save usage to storage
     */
    async saveUsage() {
        await this.context.globalState.update('voicecode.usage', this.currentUsage);
    }
    /**
     * Create new billing period
     */
    createNewPeriod() {
        const now = new Date();
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1); // First day of next month
        return {
            voiceMinutes: 0,
            aiRequests: 0,
            tokensUsed: 0,
            storageUsedMB: 0,
            period: {
                start: now,
                end: periodEnd,
            },
        };
    }
    /**
     * Reset usage (monthly)
     */
    async resetUsage() {
        this.currentUsage = this.createNewPeriod();
        await this.saveUsage();
        this.telemetry.recordEvent('usage_reset', {
            tier: this.currentTier,
        });
        console.log('[PricingService] Usage reset for new billing period');
    }
    /**
     * Schedule monthly reset
     */
    scheduleMonthlyReset() {
        // Check daily if we need to reset
        const checkReset = () => {
            const now = new Date();
            if (now >= this.currentUsage.period.end) {
                this.resetUsage();
            }
        };
        // Check every 6 hours
        const interval = setInterval(checkReset, 6 * 60 * 60 * 1000);
        this.disposables.push({ dispose: () => clearInterval(interval) });
        // Check immediately
        checkReset();
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this._onLimitReached.dispose();
        this._onTierChanged.dispose();
    }
}
exports.PricingService = PricingService;
exports.default = PricingService;
//# sourceMappingURL=PricingService.js.map