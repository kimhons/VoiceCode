/**
 * Authentication Context
 * Manages user authentication state and Supabase integration
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
        try {
          const win: any = typeof window !== 'undefined' ? window : {};
          const e2eFlag = win.__E2E_FAKE_AUTH === '1' || (typeof localStorage !== 'undefined' && localStorage.getItem('__E2E_FAKE_AUTH') === '1');
          if (e2eFlag) {
            const fakeUser = { id: 'e2e-user', email: 'e2e@example.com' } as unknown as User;
            if (mounted) {
              setUser(fakeUser);
              setIsLoading(false);
            }
            return;
          }
        } catch {
          // Ignore errors accessing window/localStorage (e.g., SSR, restricted contexts)
        }

        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Auth initialization timeout - setting loading to false');
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
        const { data: { session }, error } = await client.auth.getSession();

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
            loadUserProfile(session.user.id).catch(err => {
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
    let subscription: any;
    if (supabase.isAvailable()) {
      const client = supabase.getClient();
      const authListener = client.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);

        if (mounted && session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else if (mounted) {
          setUser(null);
          setUserProfile(null);
        }
      });
      subscription = authListener.data.subscription;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Sign in
  const signIn = async (email: string, password: string) => {
    if (!supabase.isAvailable()) {
      throw new Error('Authentication service not available. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
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
    if (!supabase.isAvailable()) {
      throw new Error('Authentication service not available. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
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

