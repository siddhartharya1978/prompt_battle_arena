import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  plan: 'free' | 'premium';
  role: 'user' | 'admin';
  battles_used: number;
  battles_limit: number;
  last_reset_at: string;
  created_at: string;
  updated_at: string;
}

export const signUp = async (email: string, password: string, name: string) => {
  console.log('signUp called with:', { email, name });
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        full_name: name,
        display_name: name,
      },
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
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}
export const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) throw error;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  console.log('getProfile called for userId:', userId);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('getProfile error:', error);
    if (error.code !== 'PGRST116') { // Not found error
      console.error('Unexpected error fetching profile:', error);
    }
    return null;
  }

  console.log('getProfile successful:', data);
  return data;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProfileWithAvatar = async (
  userId: string, 
  updates: Partial<Profile>, 
  avatarFile?: File
) => {
  let avatarUrl = updates.avatar_url;

  if (avatarFile) {
    const { uploadAvatar } = await import('./storage');
    const { publicUrl } = await uploadAvatar(avatarFile, userId);
    avatarUrl = publicUrl;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, avatar_url: avatarUrl })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const incrementBattleUsage = async (userId: string) => {
  const { error } = await supabase.rpc('increment_battle_usage', {
    user_id: userId
  });

  if (error) throw error;
};

// Create RPC function for incrementing battle usage
export const createIncrementBattleUsageFunction = async () => {
  const { error } = await supabase.rpc('create_increment_function');
  if (error) console.error('Error creating increment function:', error);
};