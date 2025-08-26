import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import toast from 'react-hot-toast';

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

  // Initialize auth - check for existing session
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔍 [Auth] Checking for existing session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [Auth] Session check failed:', error);
          if (mounted) setLoading(false);
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ [Auth] Found session for:', session.user.email);
          await loadProfile(session.user.id, session.user.email || '');
        } else {
          console.log('📝 [Auth] No session found');
        }
      } catch (error) {
        console.error('❌ [Auth] Init error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const loadProfile = async (userId: string, email: string) => {
      try {
        console.log('👤 [Auth] Loading profile for:', userId);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('📝 [Auth] Creating new profile...');
          await createProfile(userId, email);
          return;
        }

        if (error) {
          console.error('❌ [Auth] Profile load error:', error);
          return;
        }

        if (data && mounted) {
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
          console.log('✅ [Auth] Profile loaded');
        }
      } catch (error) {
        console.error('❌ [Auth] Profile loading failed:', error);
      }
    };

    const createProfile = async (userId: string, email: string) => {
      try {
        const profileData = {
          id: userId,
          email: email,
          name: email.split('@')[0],
          avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
          plan: 'free',
          role: email === 'admin@pba.com' ? 'admin' : 'user',
          battles_used: 0,
          battles_limit: email === 'admin@pba.com' ? 999 : 3,
          last_reset_at: new Date().toISOString().split('T')[0]
        };

        const { data, error } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        if (error) {
          console.error('❌ [Auth] Profile creation failed:', error);
          return;
        }

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
          console.log('✅ [Auth] Profile created');
        }
      } catch (error) {
        console.error('❌ [Auth] Profile creation error:', error);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('🔄 [Auth] Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        await loadProfile(session.user.id, session.user.email || '');
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
      console.log('🔐 [Auth] Login attempt for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) {
        throw new Error(error.message);
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
      console.log('📝 [Auth] Registration for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            name: name.trim(),
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ [Auth] Registration successful');
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ [Auth] Logout error:', error);
      }
      setUser(null);
      console.log('✅ [Auth] Logout successful');
    } catch (error) {
      console.error('❌ [Auth] Logout failed:', error);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

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
    } catch (error) {
      console.error('❌ [Auth] Error incrementing usage:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      authLoading,
      login,
      register,
      logout,
      updateUserProfile,
      incrementBattleUsage,
    }}>
      {children}
    </AuthContext.Provider>
  );
}