import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { bulletproofSupabase } from '../lib/supabase-bulletproof';
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
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      if (!mounted) return;
      
      try {
        console.log('🔍 [Auth] Checking existing session...');
        const session = await bulletproofSupabase.getSession();
        
        if (session?.user && mounted) {
          console.log('✅ [Auth] Found Supabase session for user:', session.user.email);
          // Directly fetch profile for existing session - no re-authentication needed
          const profile = await bulletproofSupabase.getProfile(session.user.id);
          if (profile) {
            setUser(profile);
            console.log('✅ [Auth] Profile loaded for existing session');
          } else {
            console.log('📝 [Auth] No profile found, user needs to complete setup');
            setUser(null);
          }
        } else {
          console.log('📝 [Auth] No active Supabase session found');
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ [Auth] Session check error:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setSessionChecked(true);
        }
      }
    };

    checkSession();

    // Listen for auth changes with proper cleanup
    const client = bulletproofSupabase.getClient();
    if (!client) {
      setLoading(false);
      return;
    }
    
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔄 [Auth] Auth state changed:', event, session?.user?.email || 'no user');
      
      if (event === 'SIGNED_IN' && session?.user) {
        setAuthLoading(true);
        try {
          // For auth state changes, just fetch the profile - don't re-authenticate
          const profile = await bulletproofSupabase.getProfile(session.user.id);
          if (profile) {
            setUser(profile);
            console.log('✅ [Auth] Profile loaded from auth state change');
          } else {
            console.log('📝 [Auth] No profile found during auth state change');
            setUser(null);
          }
        } catch (error) {
          console.error('❌ [Auth] Profile fetch failed during auth state change:', error);
          setUser(null);
        }
        setAuthLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 [Auth] User signed out, clearing state');
        setUser(null);
        setAuthLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 [Auth] Token refreshed');
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
      
      const result = await signIn(email.trim(), password);
      if (result.user && result.profile) {
        console.log('✅ [Auth] Login successful for:', result.user.email);
        setUser(result.profile);
      } else {
        throw new Error('Login failed - no user returned');
      }
    } catch (error: any) {
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
      const { user: authUser } = await signUp(email, password, name);
      if (authUser) {
        console.log('✅ [Auth] Registration successful for:', authUser.email);
        // Profile will be loaded via onAuthStateChange
      } else {
        throw new Error('Registration failed - no user returned');
      }
    } catch (error: any) {
      console.error('❌ [Auth] Registration failed:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    console.log('🚪 [Auth] Logging out user:', user?.email);
    setAuthLoading(true);
    
    try {
      // Step 1: Clear user state immediately for responsive UX
      console.log('🔄 [Auth] STEP 1: Clearing user state for immediate UX response');
      setUser(null);
      
      // Step 2: Sign out from Supabase
      console.log('🔄 [Auth] STEP 2: Signing out from Supabase auth service');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ [Auth] Supabase signOut error:', error);
        // Continue with cleanup even if Supabase fails
      } else {
        console.log('✅ [Auth] Supabase signOut successful');
      }
      
      // Step 3: Clear ALL cached data thoroughly
      console.log('🔄 [Auth] STEP 3: Clearing all cached data');
      try {
        localStorage.removeItem('demo_battles');
        localStorage.removeItem('pba_theme');
        
        // Clear any pending operations
        Object.keys(localStorage).forEach(key => {
          if (key.includes('_profile_updates') || 
              key.includes('_battles_used') || 
              key.includes('checkpoint_') ||
              key.includes('pba_') ||
              key.includes('user_') ||
              key.includes('demo_')) {
            localStorage.removeItem(key);
          }
        });
        console.log('✅ [Auth] All cached data cleared successfully');
      } catch (storageError) {
        console.error('❌ [Auth] Error clearing localStorage:', storageError);
        // Continue - this is not critical
      }
      
      console.log('🎉 [Auth] LOGOUT COMPLETED SUCCESSFULLY - User fully signed out');
    } catch (error) {
      console.error('❌ [Auth] Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      toast.error('Logout encountered issues but you have been signed out locally');
    } finally {
      setAuthLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    console.log('👤 [Auth] Updating profile for user:', user.id);
    
    // Optimistic update
    const optimisticUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
    setUser(optimisticUser);
    
    try {
      const updatedProfile = await bulletproofSupabase.updateProfile(user.id, updates);
      if (!updatedProfile) {
        throw new Error('Profile update returned null');
      }
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
    if (!user) {
      console.warn('⚠️ [Auth] No user logged in for battle usage increment');
      return;
    }

    console.log('📊 [Auth] Incrementing battle usage for user:', user.id);
    
    try {
      const result = await dataPersistenceManager.incrementBattleUsage(
        user.id, 
        user.battlesUsed, 
        user.battlesLimit
      );
      
      if (result.success) {
        setUser(prev => prev ? {
          ...prev,
          battlesUsed: result.newUsage,
          updatedAt: new Date().toISOString()
        } : null);
        console.log('✅ [Auth] Battle usage incremented to:', result.newUsage);
      } else {
        console.warn('⚠️ [Auth] Battle usage increment failed, but continuing with battle');
      }
    } catch (error) {
      console.error('❌ [Auth] Error incrementing battle usage:', error);
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