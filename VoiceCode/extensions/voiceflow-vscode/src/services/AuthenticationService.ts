/**
 * Authentication Service
 * Handles user authentication and tier management with Supabase
 */

import * as vscode from 'vscode';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ServiceTier } from '../utils/ServiceLoader';

// Re-export ServiceTier as UserTier for backward compatibility
export { ServiceTier as UserTier } from '../utils/ServiceLoader';

export interface UserProfile {
  id: string;
  email: string;
  tier: ServiceTier;
  displayName?: string;
  avatarUrl?: string;
}

export class AuthenticationService {
  private supabase?: SupabaseClient;
  private currentUser?: UserProfile;
  private context?: vscode.ExtensionContext;
  private initializationWarning?: string;

  constructor() {
    // Validate and initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    // Validate environment variables
    const missingVars: string[] = [];
    if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
    if (!supabaseKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

    if (missingVars.length > 0) {
      this.initializationWarning = `Missing environment variables: ${missingVars.join(', ')}. Authentication features will be limited to guest mode.`;
      console.warn(`[AuthenticationService] ${this.initializationWarning}`);
    } else {
      try {
        this.supabase = createClient(supabaseUrl!, supabaseKey!);
        console.log('[AuthenticationService] Supabase client initialized successfully');
      } catch (error) {
        this.initializationWarning = `Failed to initialize Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[AuthenticationService] ${this.initializationWarning}`);
      }
    }
  }

  /**
   * Check if Supabase is properly configured
   */
  isSupabaseConfigured(): boolean {
    return this.supabase !== undefined;
  }

  /**
   * Get initialization warning if any
   */
  getInitializationWarning(): string | undefined {
    return this.initializationWarning;
  }

  /**
   * Initialize with extension context
   */
  initialize(context: vscode.ExtensionContext): void {
    this.context = context;

    // Show warning if Supabase is not configured
    if (this.initializationWarning) {
      vscode.window.showWarningMessage(
        `VoiceFlow Pro: ${this.initializationWarning}`
      );
    }
  }

  /**
   * Sign in user
   */
  async signIn(): Promise<UserProfile | null> {
    // For now, return a mock FREE tier user
    // In production, this would integrate with Supabase auth
    this.currentUser = {
      id: 'guest',
      email: 'guest@voiceflow.pro',
      tier: ServiceTier.FREE,
      displayName: 'Guest User',
    };

    // Store in global state
    if (this.context) {
      await this.context.globalState.update('voiceflow.user', this.currentUser);
    }

    vscode.window.showInformationMessage(
      `Welcome to VoiceFlow Pro! Signed in as ${this.currentUser.email}`
    );

    return this.currentUser;
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    this.currentUser = undefined;

    if (this.context) {
      await this.context.globalState.update('voiceflow.user', undefined);
    }

    vscode.window.showInformationMessage('Signed out of VoiceFlow Pro');
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Check global state
    if (this.context) {
      const stored = this.context.globalState.get<UserProfile>('voiceflow.user');
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
  async getUserTier(): Promise<ServiceTier> {
    const user = await this.getCurrentUser();
    return user?.tier || ServiceTier.FREE;
  }

  /**
   * Check if user has Pro or Enterprise tier
   */
  async hasPremiumTier(): Promise<boolean> {
    const tier = await this.getUserTier();
    return tier === ServiceTier.PRO || tier === ServiceTier.ENTERPRISE;
  }

  /**
   * Check if user has Enterprise tier
   */
  async hasEnterpriseTier(): Promise<boolean> {
    const tier = await this.getUserTier();
    return tier === ServiceTier.ENTERPRISE;
  }

  /**
   * Upgrade tier (for testing)
   */
  async upgradeTier(newTier: ServiceTier): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No user signed in');
    }

    this.currentUser.tier = newTier;

    if (this.context) {
      await this.context.globalState.update('voiceflow.user', this.currentUser);
    }

    vscode.window.showInformationMessage(
      `Upgraded to ${newTier} tier! Reload window to apply changes.`
    );
  }

  /**
   * Store API key securely using VS Code SecretStorage
   */
  async storeApiKey(provider: string, key: string): Promise<void> {
    if (!this.context) {
      throw new Error('AuthenticationService not initialized with context');
    }
    await this.context.secrets.store(`voicecode.${provider}ApiKey`, key);
  }

  /**
   * Get API key from SecretStorage
   */
  async getApiKey(provider: string): Promise<string | undefined> {
    if (!this.context) {
      throw new Error('AuthenticationService not initialized with context');
    }
    
    // Try SecretStorage first
    let apiKey = await this.context.secrets.get(`voicecode.${provider}ApiKey`);
    
    // Fallback to settings for migration (deprecated)
    if (!apiKey) {
      const config = vscode.workspace.getConfiguration('voicecode');
      apiKey = config.get<string>(`${provider}ApiKey`);
      
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
  async deleteApiKey(provider: string): Promise<void> {
    if (!this.context) {
      throw new Error('AuthenticationService not initialized with context');
    }
    await this.context.secrets.delete(`voicecode.${provider}ApiKey`);
  }

  /**
   * Check if API key exists for provider
   */
  async hasApiKey(provider: string): Promise<boolean> {
    const key = await this.getApiKey(provider);
    return !!key;
  }
}
