import { supabase } from './supabase';
import { Profile, transformProfileFromDB } from '../types';

export const signUp = async (email: string, password: string, name: string) => {
  // Validate inputs
  if (!email?.trim()) {
    throw new Error('Email is required');
  }
  
  if (!password?.trim()) {
    throw new Error('Password is required');
  }
  
  if (!name?.trim()) {
    throw new Error('Name is required');
  }
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        full_name: name,
      },
      emailRedirectTo: undefined, // Disable email confirmation
    },
  });

  if (error) throw error;
  
  // Create profile immediately after signup
  if (data.user && !data.user.email_confirmed_at) {
    // For demo purposes, we'll create the profile immediately
    try {
      const profileData = {
        id: data.user.id,
        email: data.user.email!,
        name: name,
        avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
        plan: 'free' as const,
        role: data.user.email === 'admin@pba.com' ? 'admin' as const : 'user' as const,
        battles_used: 0,
        battles_limit: data.user.email === 'admin@pba.com' ? 999 : 3,
        last_reset_at: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await supabase.from('profiles').insert(profileData);
    } catch (profileError) {
      console.error('Error creating profile during signup:', profileError);
    }
  }
  
  return data;
};

export const signIn = async (email: string, password: string) => {
  // Validate inputs
  if (!email?.trim()) {
    throw new Error('Email is required');
  }
  
  if (!password?.trim()) {
    throw new Error('Password is required');
  }
  
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

export const getProfile = async (userId: string): Promise<Profile | null> => {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data ? transformProfileFromDB(data) : null;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  if (!userId) throw new Error('User ID is required');
  
  // Convert camelCase to snake_case for database
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
  if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.battlesUsed !== undefined) dbUpdates.battles_used = updates.battlesUsed;
  if (updates.battlesLimit !== undefined) dbUpdates.battles_limit = updates.battlesLimit;
  
  const { data, error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return transformProfileFromDB(data);
};

export const updateProfileWithAvatar = async (
  userId: string,
  updates: Partial<Profile>,
  avatarFile?: File
) => {
  let finalUpdates = { ...updates };

  if (avatarFile) {
    try {
      // Import uploadAvatar function dynamically to avoid circular dependencies
      const { uploadAvatar } = await import('./storage');
      const avatarUrl = await uploadAvatar(avatarFile, userId);
      finalUpdates.avatar_url = avatarUrl;
    } catch (error) {
      console.error('Avatar upload failed:', error);
      // Continue with profile update even if avatar upload fails
    }
  }

  // Convert camelCase updates to snake_case for database
  const dbUpdates: any = {};
  if (finalUpdates.name !== undefined) dbUpdates.name = finalUpdates.name;
  if (finalUpdates.avatarUrl !== undefined) dbUpdates.avatar_url = finalUpdates.avatarUrl;
  
  return updateProfile(userId, finalUpdates);
};