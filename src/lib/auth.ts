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

  console.log('🔐 [Auth] Attempting signup for:', email);

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

  if (error) {
    console.error('❌ [Auth] Signup error:', error);
    throw error;
  }
  
  console.log('✅ [Auth] Signup successful for:', email);
  return data;
};

export const signIn = async (email: string, password: string) => {
  if (!email || !email.trim()) {
    throw new Error('Email is required');
  }
  
  if (!password || !password.trim()) {
    throw new Error('Password is required');
  }

  console.log('🔐 [Auth] Attempting signin for:', email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim()
  });

  if (error) {
    console.error('❌ [Auth] Signin error:', error);
    
    // Provide helpful error messages
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    } else if (error.message.includes('Email not confirmed')) {
      throw new Error('Please check your email and click the confirmation link before signing in.');
    } else if (error.message.includes('Too many requests')) {
      throw new Error('Too many login attempts. Please wait a few minutes and try again.');
    }
    
    throw error;
  }

  console.log('✅ [Auth] Signin successful for:', email);
  return data;
};

export const signOut = async () => {
  console.log('👋 [Auth] Signing out...');
  
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('❌ [Auth] Signout error:', error);
    throw error;
  }
  
  console.log('✅ [Auth] Signout successful');
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  console.log('👤 [Auth] Loading profile for user:', userId);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('❌ [Auth] Profile query error:', error);
    throw error;
  }

  if (!data) {
    console.log('ℹ️ [Auth] No profile found for user:', userId);
    return null; // No profile found
  }

  console.log('✅ [Auth] Profile loaded for:', data.email);

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
  console.log('📝 [Auth] Updating profile for user:', userId);
  
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
  if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
  if (updates.battlesUsed !== undefined) dbUpdates.battles_used = updates.battlesUsed;
  if (updates.lastResetAt !== undefined) dbUpdates.last_reset_at = updates.lastResetAt;
  
  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('❌ [Auth] Profile update error:', error);
    throw error;
  }

  console.log('✅ [Auth] Profile updated successfully');

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