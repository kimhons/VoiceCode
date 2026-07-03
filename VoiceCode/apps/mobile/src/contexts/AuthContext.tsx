/**
 * Authentication Context
 * Manages user authentication state and operations
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  supabase,
  signIn as supabaseSignIn,
  signUp as supabaseSignUp,
  signOut as supabaseSignOut,
  resetPassword as supabaseResetPassword,
  getCurrentUser,
  getCurrentSession,
  getProfile,
} from '@/services/supabase.service';
import { STORAGE_KEYS, ENABLE_BIOMETRIC_AUTH } from '@/config/constants';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  authenticateWithBiometrics: () => Promise<boolean>;
  isBiometricEnabled: boolean;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
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
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  useEffect(() => {
    // Check initial session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    // Check biometric setting
    checkBiometricSetting();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const session = await getCurrentSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const checkBiometricSetting = async () => {
    try {
      const enabled = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
      setIsBiometricEnabled(enabled === 'true');
    } catch (error) {
      console.error('Error checking biometric setting:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user, session } = await supabaseSignIn(email, password);
      setUser(user);
      setSession(session);
      if (user) {
        await loadProfile(user.id);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      const { user, session } = await supabaseSignUp(email, password, metadata);
      setUser(user);
      setSession(session);
      if (user) {
        await loadProfile(user.id);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabaseSignOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await supabaseResetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    if (!ENABLE_BIOMETRIC_AUTH) {
      return false;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return false;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access VoiceCode',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

  const enableBiometric = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
      setIsBiometricEnabled(true);
    } catch (error) {
      console.error('Error enabling biometric:', error);
      throw error;
    }
  };

  const disableBiometric = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'false');
      setIsBiometricEnabled(false);
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
    authenticateWithBiometrics,
    isBiometricEnabled,
    enableBiometric,
    disableBiometric,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

