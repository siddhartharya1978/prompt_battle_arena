import { bulletproofSupabase } from './supabase-bulletproof';
import { Profile } from '../types';

export const signUp = async (email: string, password: string, name: string) => {
  // Validate inputs
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

  const client = bulletproofSupabase.getClient();
  if (!client) {
    throw new Error('Supabase not initialized');
  }
  
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password: password.trim(),
    options: {
      data: {
        name: name.trim(),
        full_name: name.trim(),
      },
      emailRedirectTo: undefined, // Disable email confirmation
    },
  });

  if (error) throw error;
  
  // Create profile immediately after signup
  if (data.user) {
    try {
      const profileData = {
        id: data.user.id,
        email: data.user.email!,
        name: name.trim(),
        avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
        plan: 'free' as const,
        role: data.user.email === 'admin@pba.com' ? 'admin' as const : 'user' as const,
        battles_used: 0,
        battles_limit: data.user.email === 'admin@pba.com' ? 999 : 3,
        last_reset_at: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await client.from('profiles').insert(profileData);
    } catch (profileError) {
      console.error('Error creating profile during signup:', profileError);
      // Don't throw - user can still sign up
    }
  }
  
  return data;
};

export const signIn = async (email: string, password: string) => {
  // Validate inputs
  if (!email || !email.trim()) {
    throw new Error('Email is required');
  }
  
  if (!password || !password.trim()) {
    throw new Error('Password is required');
  }
  
  // Use bulletproof sign in
  return await bulletproofSupabase.signIn(email, password);
};

export const signOut = async () => {
  const result = await bulletproofSupabase.signOut();
  if (!result.success && result.error) {
    throw new Error(result.error);
  }
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  return await bulletproofSupabase.getProfile(userId);
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  return await bulletproofSupabase.updateProfile(userId, updates);
};