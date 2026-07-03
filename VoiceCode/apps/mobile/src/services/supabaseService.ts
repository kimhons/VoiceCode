/**
 * Supabase Service
 * Phase 2.3: Cloud Sync & Storage
 * 
 * Provides cloud storage, real-time sync, and collaboration features
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create and export supabase client for direct use
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types
export interface Transcript {
  id: string;
  user_id: string;
  title: string;
  content: string;
  language: string;
  professional_mode: string;
  duration: number;
  word_count: number;
  confidence: number;
  speakers?: Speaker[];
  metadata: TranscriptMetadata;
  created_at: string;
  updated_at: string;
  synced_at?: string;
  is_deleted: boolean;
}

export interface Speaker {
  id: number;
  name?: string;
  confidence: number;
  segments: SpeakerSegment[];
}

export interface SpeakerSegment {
  speaker: number;
  text: string;
  start: number;
  end: number;
  confidence: number;
}

export interface TranscriptMetadata {
  device: string;
  platform: string;
  version: string;
  tags?: string[];
  custom_vocabulary?: string[];
  [key: string]: any;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  usage_stats: UsageStats;
  settings: UserSettings;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  total_transcripts: number;
  total_duration: number;
  total_words: number;
  monthly_transcripts: number;
  monthly_duration: number;
  last_used_at?: string;
}

export interface UserSettings {
  default_language: string;
  default_professional_mode: string;
  auto_sync: boolean;
  offline_mode: boolean;
  notifications_enabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface CustomVocabularyEntry {
  id: string;
  user_id: string;
  name: string;
  terms: string[];
  professional_mode?: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase Service Class
 */
export class SupabaseService {
  private client: SupabaseClient | null = null;
  private currentUser: User | null = null;
  private isInitialized: boolean = false;

  constructor() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      this.initialize();
    }
  }

  /**
   * Initialize Supabase client
   */
  private initialize(): void {
    try {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });

      this.isInitialized = true;

      // Listen for auth changes
      this.client.auth.onAuthStateChange((event, session) => {
        this.currentUser = session?.user || null;
      });
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, fullName?: string): Promise<User> {
    if (!this.client) throw new Error('Supabase not initialized');

    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to create user');

    // Create user profile
    await this.createUserProfile(data.user.id, email, fullName);

    return data.user;
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<Session> {
    if (!this.client) throw new Error('Supabase not initialized');

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.session) throw new Error('Failed to create session');

    this.currentUser = data.user;
    return data.session;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    if (!this.client) throw new Error('Supabase not initialized');

    const { error } = await this.client.auth.signOut();
    if (error) throw error;

    this.currentUser = null;
  }

  /**
   * Create user profile
   */
  private async createUserProfile(
    userId: string,
    email: string,
    fullName?: string
  ): Promise<void> {
    if (!this.client) throw new Error('Supabase not initialized');

    const profile: Partial<UserProfile> = {
      id: userId,
      email,
      full_name: fullName,
      subscription_tier: 'free',
      usage_stats: {
        total_transcripts: 0,
        total_duration: 0,
        total_words: 0,
        monthly_transcripts: 0,
        monthly_duration: 0,
      },
      settings: {
        default_language: 'en',
        default_professional_mode: 'general',
        auto_sync: true,
        offline_mode: true,
        notifications_enabled: true,
        theme: 'auto',
      },
    };

    const { error } = await this.client
      .from('user_profiles')
      .insert(profile);

    if (error) throw error;
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId?: string): Promise<UserProfile | null> {
    if (!this.client) throw new Error('Supabase not initialized');

    const id = userId || this.currentUser?.id;
    if (!id) throw new Error('No user ID provided');

    const { data, error } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!this.client) throw new Error('Supabase not initialized');
    if (!this.currentUser) throw new Error('No user logged in');

    const { data, error } = await this.client
      .from('user_profiles')
      .update(updates)
      .eq('id', this.currentUser.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Save transcript to cloud
   */
  async saveTranscript(transcript: Omit<Transcript, 'id' | 'created_at' | 'updated_at'>): Promise<Transcript> {
    if (!this.client) throw new Error('Supabase not initialized');
    if (!this.currentUser) throw new Error('No user logged in');

    const { data, error } = await this.client
      .from('transcripts')
      .insert({
        ...transcript,
        user_id: this.currentUser.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get transcript by ID
   */
  async getTranscript(id: string): Promise<Transcript | null> {
    if (!this.client) throw new Error('Supabase not initialized');

    const { data, error } = await this.client
      .from('transcripts')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all transcripts for current user
   */
  async getTranscripts(limit: number = 50, offset: number = 0): Promise<Transcript[]> {
    if (!this.client) throw new Error('Supabase not initialized');
    if (!this.currentUser) throw new Error('No user logged in');

    const { data, error } = await this.client
      .from('transcripts')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Update transcript
   */
  async updateTranscript(id: string, updates: Partial<Transcript>): Promise<Transcript> {
    if (!this.client) throw new Error('Supabase not initialized');

    const { data, error } = await this.client
      .from('transcripts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete transcript (soft delete)
   */
  async deleteTranscript(id: string): Promise<void> {
    if (!this.client) throw new Error('Supabase not initialized');

    const { error } = await this.client
      .from('transcripts')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Search transcripts
   */
  async searchTranscripts(query: string, limit: number = 20): Promise<Transcript[]> {
    if (!this.client) throw new Error('Supabase not initialized');
    if (!this.currentUser) throw new Error('No user logged in');

    const { data, error } = await this.client
      .from('transcripts')
      .select('*')
      .eq('user_id', this.currentUser.id)
      .eq('is_deleted', false)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

// Export singleton instance
let supabaseInstance: SupabaseService | null = null;

export function getSupabaseService(): SupabaseService {
  if (!supabaseInstance) {
    supabaseInstance = new SupabaseService();
  }
  return supabaseInstance;
}

export default getSupabaseService;

