/**
 * Authentication Service
 * Handles user authentication and tier management with Supabase
 */
import * as vscode from 'vscode';
import { ServiceTier } from '../utils/ServiceLoader';
export { ServiceTier as UserTier } from '../utils/ServiceLoader';
export interface UserProfile {
    id: string;
    email: string;
    tier: ServiceTier;
    displayName?: string;
    avatarUrl?: string;
}
export declare class AuthenticationService {
    private supabase?;
    private currentUser?;
    private context?;
    private initializationWarning?;
    constructor();
    /**
     * Check if Supabase is properly configured
     */
    isSupabaseConfigured(): boolean;
    /**
     * Get initialization warning if any
     */
    getInitializationWarning(): string | undefined;
    /**
     * Initialize with extension context
     */
    initialize(context: vscode.ExtensionContext): void;
    /**
     * Sign in user
     */
    signIn(): Promise<UserProfile | null>;
    /**
     * Sign out user
     */
    signOut(): Promise<void>;
    /**
     * Get current user
     */
    getCurrentUser(): Promise<UserProfile | null>;
    /**
     * Get user tier
     */
    getUserTier(): Promise<ServiceTier>;
    /**
     * Check if user has Pro or Enterprise tier
     */
    hasPremiumTier(): Promise<boolean>;
    /**
     * Check if user has Enterprise tier
     */
    hasEnterpriseTier(): Promise<boolean>;
    /**
     * Upgrade tier (for testing)
     */
    upgradeTier(newTier: ServiceTier): Promise<void>;
}
//# sourceMappingURL=AuthenticationService.d.ts.map