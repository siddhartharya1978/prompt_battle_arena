import { supabase } from './supabase';
import { Profile } from '../types';

export const signUp = async (email: string, password: string, name: string) => {
  if (!email || !email.trim()) {
    throw new Error('Email is required');
  }
  
  if (!password || !password.trim()) {
    throw new Error('Password is required');
  }
  
  if (!name || !name.trim()) {
    throw new Error('Name is required');
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password: password.trim(),
    options: {
      data: {
        name: name.trim(),
        full_name: name.trim(),
      }
    }
  });

  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  if (!email || !email.trim()) {
    throw new Error('Email is required');
  }
  
  if (!password || !password.trim()) {
    throw new Error('Password is required');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim()
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No profile found
    }
    throw error;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatarUrl: data.avatar_url,
    plan: data.plan,
    role: data.role,
    battlesUsed: data.battles_used || 0,
    battlesLimit: data.battles_limit || 3,
    lastResetAt: data.last_reset_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
  if (updates.battlesUsed !== undefined) dbUpdates.battles_used = updates.battlesUsed;
  
  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatarUrl: data.avatar_url,
    plan: data.plan,
    role: data.role,
    battlesUsed: data.battles_used || 0,
    battlesLimit: data.battles_limit || 3,
    lastResetAt: data.last_reset_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};