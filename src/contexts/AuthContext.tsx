import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>;
  incrementBattleUsage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔍 [Auth] Initializing authentication...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          console.log('✅ [Auth] Found session for:', session.user.email);
          await loadUserProfile(session.user.id);
        } else {
          console.log('📝 [Auth] No active session found');
        }
      } catch (error) {
        console.error('❌ [Auth] Initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const loadUserProfile = async (userId: string) => {
      try {
        console.log('👤 [Auth] Loading profile for user:', userId);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('📝 [Auth] No profile found, creating one...');
            await createUserProfile(userId);
          } else {
            throw error;
          }
        } else if (data && mounted) {
          console.log('✅ [Auth] Profile loaded successfully');
          setUser({
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
          });
        }
      } catch (error) {
        console.error('❌ [Auth] Profile loading failed:', error);
        if (mounted) {
          setUser(null);
        }
      }
    };

    const createUserProfile = async (userId: string) => {
      try {
        const { data: authUser } = await supabase.auth.getUser();
        if (!authUser.user) throw new Error('No auth user found');

        const profileData = {
          id: userId,
          email: authUser.user.email!,
          name: authUser.user.user_metadata?.name || authUser.user.email!.split('@')[0],
          avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
          plan: 'free',
          role: authUser.user.email === 'admin@pba.com' ? 'admin' : 'user',
          battles_used: 0,
          battles_limit: authUser.user.email === 'admin@pba.com' ? 999 : 3,
          last_reset_at: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        if (error) throw error;

        if (mounted) {
          setUser({
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
          });
        }

        console.log('✅ [Auth] Profile created successfully');
      } catch (error) {
        console.error('❌ [Auth] Profile creation failed:', error);
        if (mounted) {
          setUser(null);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔄 [Auth] Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      console.log('🔐 [Auth] Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('No user returned from authentication');
      }

      console.log('✅ [Auth] Login successful');
      // Profile will be loaded via onAuthStateChange
    } catch (error) {
      console.error('❌ [Auth] Login failed:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setAuthLoading(true);
    try {
      console.log('📝 [Auth] Attempting registration for:', email);
      
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
        throw new Error(error.message);
      }

      console.log('✅ [Auth] Registration successful');
      // Profile will be created via onAuthStateChange
    } catch (error) {
      console.error('❌ [Auth] Registration failed:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      console.log('🚪 [Auth] Logging out...');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ [Auth] Logout error:', error);
      }
      
      setUser(null);
      console.log('✅ [Auth] Logout successful');
    } catch (error) {
      console.error('❌ [Auth] Logout failed:', error);
      setUser(null); // Clear user anyway
    } finally {
      setAuthLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
      if (updates.battlesUsed !== undefined) dbUpdates.battles_used = updates.battlesUsed;
      
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser({
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
      });

      console.log('✅ [Auth] Profile updated successfully');
    } catch (error) {
      console.error('❌ [Auth] Profile update failed:', error);
      throw error;
    }
  };

  const incrementBattleUsage = async () => {
    if (!user) return;

    try {
      const newUsage = Math.min(user.battlesUsed + 1, user.battlesLimit);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          battles_used: newUsage,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ [Auth] Usage increment failed:', error);
        return;
      }

      setUser(prev => prev ? {
        ...prev,
        battlesUsed: newUsage,
        updatedAt: new Date().toISOString()
      } : null);

      console.log('✅ [Auth] Battle usage incremented');
    } catch (error) {
      console.error('❌ [Auth] Error incrementing usage:', error);
    }
  };

  const value = {
    user,
    loading,
    authLoading,
    login,
    register,
    logout,
    updateUserProfile,
    incrementBattleUsage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}