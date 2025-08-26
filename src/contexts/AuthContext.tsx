import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { signUp, signIn, signOut, getProfile, updateProfile } from '../lib/auth';
import { Profile, transformProfileFromDB } from '../types';
import toast from 'react-hot-toast';
import { dataPersistenceManager } from '../lib/data-persistence';

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
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      setAuthLoading(true);
      try {
        console.log('🔍 [Auth] Checking existing session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('✅ [Auth] Found Supabase session for user:', session.user.email);
          await loadUserProfile(session.user);
        } else {
          console.log('📝 [Auth] No active Supabase session found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ [Auth] Session check error:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setAuthLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [Auth] Auth state changed:', event, session?.user?.email || 'no user');
      setAuthLoading(true);
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      console.log('👤 [Auth] Loading profile for user:', authUser.id);
      const profile = await getProfile(authUser.id);
      if (profile) {
        setUser(profile);
        console.log('✅ [Auth] Profile loaded successfully:', profile.email);
      } else {
        console.warn('⚠️ [Auth] No profile found for user:', authUser.id);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ [Auth] Error loading profile:', error);
      toast.error('Failed to load user profile');
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    setAuthLoading(true);
    try {

      console.log('🔐 [Auth] Attempting login for:', email);
      
      // Use real Supabase authentication for ALL users (including demo accounts)
      try {
        const { user: authUser } = await signIn(email.trim(), password);
        if (authUser) {
          console.log('✅ [Auth] Supabase login successful for:', authUser.email);
          await loadUserProfile(authUser);
        } else {
          console.warn('⚠️ [Auth] Login returned no user');
          throw new Error('Login failed - no user returned');
        }
      } catch (supabaseError) {
        console.error('❌ [Auth] Supabase authentication failed:', supabaseError);
        throw new Error(`Authentication failed: ${supabaseError.message}`);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setAuthLoading(true);
    try {
      console.log('📝 [Auth] Attempting registration for:', email);
      const { user: authUser } = await signUp(email, password, name);
      if (authUser) {
        console.log('✅ [Auth] Registration successful for:', authUser.email);
        await loadUserProfile(authUser);
      } else {
        console.warn('⚠️ [Auth] Registration returned no user');
        throw new Error('Registration failed - no user returned');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    console.log('🚪 [Auth] Logging out user:', user?.email);
    setAuthLoading(true);
    try {
      // Clear user state immediately for responsive UI
      setUser(null);
      
      // Sign out from Supabase
      await signOut();
      
      // Clear any cached data
      localStorage.removeItem('demo_battles');
      
      // Clear any pending operations
      Object.keys(localStorage).forEach(key => {
        if (key.includes('_profile_updates') || key.includes('_battles_used') || key.includes('checkpoint_')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('✅ [Auth] Logout completed successfully');
    } finally {
      setAuthLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    console.log('👤 [Auth] Updating profile for user:', user.id);
    
    try {
      // Use Supabase for ALL users
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      
      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedProfile = transformProfileFromDB(data);
      setUser(updatedProfile);
      console.log('✅ [Auth] Profile updated successfully');
    } catch (error) {
      console.error('❌ [Auth] Profile update failed:', error);
      // Revert optimistic update
      setUser(user);
      throw error;
    }
  };

  const incrementBattleUsage = async () => {
    if (!user) return;

    console.log('📊 [Auth] Incrementing battle usage for user:', user.id);
    
    try {
      // Use resilient data persistence manager
      const result = await dataPersistenceManager.incrementBattleUsage(
        user.id, 
        user.battlesUsed, 
        user.battlesLimit
      );
      
      if (result.success) {
        // Optimistic update to UI
        setUser(prev => prev ? {
          ...prev,
          battlesUsed: result.newUsage,
          updatedAt: new Date().toISOString()
        } : null);
        console.log('✅ [Auth] Battle usage incremented to:', result.newUsage);
      } else {
        console.warn('⚠️ [Auth] Battle usage increment failed, but continuing with battle');
        // Don't block the user - just log the issue
      }
    } catch (error) {
      console.error('❌ [Auth] Error incrementing battle usage:', error);
      // Don't throw - we don't want to block battle creation for usage tracking issues
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