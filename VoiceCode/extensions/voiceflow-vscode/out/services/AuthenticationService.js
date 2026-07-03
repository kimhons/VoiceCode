"use strict";
/**
 * Authentication Service
 * Handles user authentication and tier management with Supabase
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
exports.AuthenticationService = exports.UserTier = void 0;
const vscode = __importStar(require("vscode"));
const supabase_js_1 = require("@supabase/supabase-js");
const ServiceLoader_1 = require("../utils/ServiceLoader");
// Re-export ServiceTier as UserTier for backward compatibility
var ServiceLoader_2 = require("../utils/ServiceLoader");
Object.defineProperty(exports, "UserTier", { enumerable: true, get: function () { return ServiceLoader_2.ServiceTier; } });
class AuthenticationService {
    supabase;
    currentUser;
    context;
    initializationWarning;
    constructor() {
        // Validate and initialize Supabase client
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
        // Validate environment variables
        const missingVars = [];
        if (!supabaseUrl)
            missingVars.push('VITE_SUPABASE_URL');
        if (!supabaseKey)
            missingVars.push('VITE_SUPABASE_ANON_KEY');
        if (missingVars.length > 0) {
            this.initializationWarning = `Missing environment variables: ${missingVars.join(', ')}. Authentication features will be limited to guest mode.`;
            console.warn(`[AuthenticationService] ${this.initializationWarning}`);
        }
        else {
            try {
                this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
                console.log('[AuthenticationService] Supabase client initialized successfully');
            }
            catch (error) {
                this.initializationWarning = `Failed to initialize Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`;
                console.error(`[AuthenticationService] ${this.initializationWarning}`);
            }
        }
    }
    /**
     * Check if Supabase is properly configured
     */
    isSupabaseConfigured() {
        return this.supabase !== undefined;
    }
    /**
     * Get initialization warning if any
     */
    getInitializationWarning() {
        return this.initializationWarning;
    }
    /**
     * Initialize with extension context
     */
    initialize(context) {
        this.context = context;
        // Show warning if Supabase is not configured
        if (this.initializationWarning) {
            vscode.window.showWarningMessage(`VoiceFlow Pro: ${this.initializationWarning}`);
        }
    }
    /**
     * Sign in user
     */
    async signIn() {
        // For now, return a mock FREE tier user
        // In production, this would integrate with Supabase auth
        this.currentUser = {
            id: 'guest',
            email: 'guest@voiceflow.pro',
            tier: ServiceLoader_1.ServiceTier.FREE,
            displayName: 'Guest User',
        };
        // Store in global state
        if (this.context) {
            await this.context.globalState.update('voiceflow.user', this.currentUser);
        }
        vscode.window.showInformationMessage(`Welcome to VoiceFlow Pro! Signed in as ${this.currentUser.email}`);
        return this.currentUser;
    }
    /**
     * Sign out user
     */
    async signOut() {
        this.currentUser = undefined;
        if (this.context) {
            await this.context.globalState.update('voiceflow.user', undefined);
        }
        vscode.window.showInformationMessage('Signed out of VoiceFlow Pro');
    }
    /**
     * Get current user
     */
    async getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }
        // Check global state
        if (this.context) {
            const stored = this.context.globalState.get('voiceflow.user');
            if (stored) {
                this.currentUser = stored;
                return stored;
            }
        }
        // Auto sign-in as guest for development
        return this.signIn();
    }
    /**
     * Get user tier
     */
    async getUserTier() {
        const user = await this.getCurrentUser();
        return user?.tier || ServiceLoader_1.ServiceTier.FREE;
    }
    /**
     * Check if user has Pro or Enterprise tier
     */
    async hasPremiumTier() {
        const tier = await this.getUserTier();
        return tier === ServiceLoader_1.ServiceTier.PRO || tier === ServiceLoader_1.ServiceTier.ENTERPRISE;
    }
    /**
     * Check if user has Enterprise tier
     */
    async hasEnterpriseTier() {
        const tier = await this.getUserTier();
        return tier === ServiceLoader_1.ServiceTier.ENTERPRISE;
    }
    /**
     * Upgrade tier (for testing)
     */
    async upgradeTier(newTier) {
        if (!this.currentUser) {
            throw new Error('No user signed in');
        }
        this.currentUser.tier = newTier;
        if (this.context) {
            await this.context.globalState.update('voiceflow.user', this.currentUser);
        }
        vscode.window.showInformationMessage(`Upgraded to ${newTier} tier! Reload window to apply changes.`);
    }
    /**
     * Store API key securely using VS Code SecretStorage
     */
    async storeApiKey(provider, key) {
        if (!this.context) {
            throw new Error('AuthenticationService not initialized with context');
        }
        await this.context.secrets.store(`voicecode.${provider}ApiKey`, key);
    }
    /**
     * Get API key from SecretStorage
     */
    async getApiKey(provider) {
        if (!this.context) {
            throw new Error('AuthenticationService not initialized with context');
        }
        // Try SecretStorage first
        let apiKey = await this.context.secrets.get(`voicecode.${provider}ApiKey`);
        // Fallback to settings for migration (deprecated)
        if (!apiKey) {
            const config = vscode.workspace.getConfiguration('voicecode');
            apiKey = config.get(`${provider}ApiKey`);
            // Migrate to SecretStorage if found in settings
            if (apiKey) {
                await this.storeApiKey(provider, apiKey);
                // Clear from settings
                await config.update(`${provider}ApiKey`, undefined, vscode.ConfigurationTarget.Global);
                console.log(`[AuthenticationService] Migrated ${provider} API key to SecretStorage`);
            }
        }
        return apiKey;
    }
    /**
     * Delete API key from SecretStorage
     */
    async deleteApiKey(provider) {
        if (!this.context) {
            throw new Error('AuthenticationService not initialized with context');
        }
        await this.context.secrets.delete(`voicecode.${provider}ApiKey`);
    }
    /**
     * Check if API key exists for provider
     */
    async hasApiKey(provider) {
        const key = await this.getApiKey(provider);
        return !!key;
    }
}
exports.AuthenticationService = AuthenticationService;
//# sourceMappingURL=AuthenticationService.js.map