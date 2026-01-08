/**
 * Supabase Service
 * Handles all Supabase client operations
 */

import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { SUPABASE_URL, SUPABASE_ANON_KEY, STORAGE_KEYS } from '@/config/constants';
import 'react-native-url-polyfill/auto';

// Type Definitions
export interface Transcript {
  id: string;
  user_id: string;
  audio_url: string;
  text: string;
  content: string; // Alias for text
  title?: string;
  duration: number;
  language?: string;
  professional_mode?: string;
  word_count?: number;
  confidence?: number;
  speakers?: Speaker[];
  is_deleted?: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SpeakerSegment {
  start: number;
  end: number;
  text: string;
}

export interface Speaker {
  id: string;
  name: string;
  color?: string;
  segments?: SpeakerSegment[];
}

// Export getSupabaseService for compatibility
export const getSupabaseService = () => supabase;

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

// Initialize Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Authentication Methods
 */

export const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'voicecode://reset-password',
  });

  if (error) throw error;
};

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

/**
 * Profile Methods
 */

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const updateProfile = async (userId: string, updates: Record<string, any>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Transcription Methods
 */

export const getTranscriptions = async (userId: string, limit = 50, offset = 0) => {
  const { data, error } = await supabase
    .from('transcriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
};

export const getTranscription = async (id: string) => {
  const { data, error } = await supabase
    .from('transcriptions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createTranscription = async (transcription: {
  user_id: string;
  audio_url: string;
  text: string;
  duration: number;
  language?: string;
  metadata?: Record<string, any>;
}) => {
  const { data, error } = await supabase
    .from('transcriptions')
    .insert(transcription)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTranscription = async (id: string, updates: Record<string, any>) => {
  const { data, error } = await supabase
    .from('transcriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTranscription = async (id: string) => {
  const { error } = await supabase
    .from('transcriptions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Storage Methods
 */

export const uploadAudio = async (
  userId: string,
  audioUri: string,
  fileName: string
): Promise<string> => {
  // Read file as blob
  const response = await fetch(audioUri);
  const blob = await response.blob();

  const filePath = `${userId}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from('audio-recordings')
    .upload(filePath, blob, {
      contentType: 'audio/m4a',
      upsert: false,
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('audio-recordings')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const deleteAudio = async (filePath: string) => {
  const { error } = await supabase.storage
    .from('audio-recordings')
    .remove([filePath]);

  if (error) throw error;
};

/**
 * Subscription Methods
 */

export const getSubscription = async (userId: string) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
};

/**
 * Search Methods
 */

export const searchTranscripts = async (userId: string, query: string, limit = 20) => {
  const { data, error } = await supabase
    .from('transcriptions')
    .select('*')
    .eq('user_id', userId)
    .or(`text.ilike.%${query}%,metadata->>title.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

export default supabase;

