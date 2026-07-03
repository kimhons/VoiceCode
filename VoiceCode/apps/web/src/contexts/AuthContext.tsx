/**
 * Authentication Context
 * Manages user authentication state and Supabase integration
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseService, UserProfile } from '../services/supabase.service';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseService();

  // Load user profile from database
  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await supabase.getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Don't throw - just log the error
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('Initializing auth...');

        // E2E test hook: allow fake auth via window flag/localStorage
        // SECURITY: Guarded by import.meta.env.DEV so Vite dead-code-eliminates
        // this entire block in production builds.
        if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_E2E_AUTH_BYPASS === 'true') {
          try {
            const win = typeof window !== 'undefined' ? (window as Window & { __E2E_FAKE_AUTH?: string }) : ({} as { __E2E_FAKE_AUTH?: string });
            const e2eFlag =
              win.__E2E_FAKE_AUTH === '1' ||
              (typeof localStorage !== 'undefined' &&
                localStorage.getItem('__E2E_FAKE_AUTH') === '1');
            if (e2eFlag) {
              const fakeUser = {
                id: 'e2e-user',
                email: 'e2e@example.com',
              } as unknown as User;
              if (mounted) {
                setUser(fakeUser);
                setIsLoading(false);
              }
              return;
            }
          } catch {
            // Ignore errors accessing window/localStorage (e.g., SSR, restricted contexts)
          }
        }

        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn(
              'Auth initialization timeout - setting loading to false'
            );
            setIsLoading(false);
          }
        }, 3000); // 3 second timeout

        // Check if Supabase is available
        if (!supabase.isAvailable()) {
          console.warn('Supabase not available - running in offline mode');
          clearTimeout(timeoutId);
          if (mounted) setIsLoading(false);
          return;
        }

        // Get current session
        const client = supabase.getClient();
        const {
          data: { session },
          error,
        } = await client.auth.getSession();

        clearTimeout(timeoutId);

        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('User session found:', session.user.email);
          if (mounted) {
            setUser(session.user);
            // Load profile but don't block on it
            loadUserProfile(session.user.id).catch((err) => {
              console.error('Profile load failed:', err);
            });
          }
        } else {
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        console.log('Auth initialization complete');
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    let subscription: { unsubscribe: () => void } | undefined;
    if (supabase.isAvailable()) {
      const client = supabase.getClient();
      const authListener = client.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event);

          if (mounted && session?.user) {
            setUser(session.user);
            await loadUserProfile(session.user.id);
          } else if (mounted) {
            setUser(null);
            setUserProfile(null);
          }
        }
      );
      subscription = authListener.data.subscription;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Sign in
  const signIn = async (email: string, password: string) => {
    // Demo mode when Supabase is not configured
    if (!supabase.isAvailable()) {
      console.log('Running in demo mode - Supabase not configured');
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Clear any old stored user and create fresh one for this email
      localStorage.removeItem('demo_user');

      // Allow any login in demo mode with superuser access
      const fullName = email
        .split('@')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const demoUser = {
        id: `demo-${Date.now()}`,
        email: email,
        user_metadata: { full_name: fullName },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      setUser(demoUser);

      // Set superuser profile for testing
      setUserProfile({
        id: demoUser.id,
        email: email,
        full_name: fullName,
        avatar_url:
          'https://ui-avatars.com/api/?name=' +
          encodeURIComponent(fullName) +
          '&background=6366f1&color=fff',
        subscription_tier: 'enterprise',
        role: 'superuser',
        usage_stats: {
          total_transcripts: 127,
          total_duration: 84600,
          total_words: 45230,
          monthly_transcripts: 42,
          monthly_duration: 28800,
          last_used_at: new Date().toISOString(),
        },
        settings: {
          default_language: 'en-US',
          default_professional_mode: 'medical',
          auto_sync: true,
          offline_mode: false,
          notifications_enabled: true,
          theme: 'dark',
        },
        created_at: new Date(
          Date.now() - 90 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      });
      return;
    }

    // SupabaseService.signIn returns a Session
    const session = await supabase.signIn(email, password);
    if (session?.user) {
      setUser(session.user);
      await loadUserProfile(session.user.id);
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, fullName: string) => {
    // Demo mode when Supabase is not configured
    if (!supabase.isAvailable()) {
      console.log('Running in demo mode - Supabase not configured');
      // Simulate signup delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create a demo user
      const demoUser = {
        id: `demo-${Date.now()}`,
        email: email,
        user_metadata: { full_name: fullName },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;

      // Store in localStorage for persistence
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      setUser(demoUser);

      // Create demo profile with superuser access for testing
      setUserProfile({
        id: demoUser.id,
        email: email,
        full_name: fullName,
        avatar_url:
          'https://ui-avatars.com/api/?name=' +
          encodeURIComponent(fullName) +
          '&background=6366f1&color=fff',
        subscription_tier: 'enterprise',
        role: 'superuser',
        usage_stats: {
          total_transcripts: 127,
          total_duration: 84600,
          total_words: 45230,
          monthly_transcripts: 42,
          monthly_duration: 28800,
          last_used_at: new Date().toISOString(),
        },
        settings: {
          default_language: 'en-US',
          default_professional_mode: 'medical',
          auto_sync: true,
          offline_mode: false,
          notifications_enabled: true,
          theme: 'dark',
        },
        created_at: new Date(
          Date.now() - 90 * 24 * 60 * 60 * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      });
      return;
    }

    const user = await supabase.signUp(email, password, fullName);

    if (user) {
      setUser(user);
      await loadUserProfile(user.id);
    }
  };

  // Sign out
  const signOut = async () => {
    if (!supabase.isAvailable()) {
      throw new Error('Authentication service not available');
    }

    await supabase.signOut();
    setUser(null);
    setUserProfile(null);
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
