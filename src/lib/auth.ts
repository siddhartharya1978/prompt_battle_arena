import { supabase } from './supabase';

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
    },
  });

  if (error) throw error;
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
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

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
  let finalUpdates = { ...updates };

  if (avatarFile) {
    try {
      // Import uploadAvatar function dynamically to avoid circular dependencies
      const { uploadAvatar } = await import('./storage');
      const avatarUrl = await uploadAvatar(userId, avatarFile);
      finalUpdates.avatar_url = avatarUrl;
    } catch (error) {
      console.error('Avatar upload failed:', error);
      // Continue with profile update even if avatar upload fails
    }
  }

  return updateProfile(userId, finalUpdates);
};