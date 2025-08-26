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
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      if (!mounted) return;
      
      try {
        console.log('🔍 [Auth] Checking existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [Auth] Session check error:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        
        if (session?.user && mounted) {
          console.log('✅ [Auth] Found Supabase session for user:', session.user.email);
          await loadUserProfile(session.user);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔄 [Auth] Auth state changed:', event, session?.user?.email || 'no user');
      
      if (event === 'SIGNED_IN' && session?.user) {
        setAuthLoading(true);
        await loadUserProfile(session.user);
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

  const loadUserProfile = async (authUser: User) => {
    try {
      console.log('👤 [Auth] Loading profile for user:', authUser.id);
      const profile = await getProfile(authUser.id);
      if (profile) {
        setUser(profile);
        console.log('✅ [Auth] Profile loaded successfully:', profile.email);
      } else {
        console.warn('⚠️ [Auth] No profile found, creating one for user:', authUser.id);
        // Create missing profile for existing auth user
        const newProfile = {
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.name || authUser.email!.split('@')[0],
          avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
          plan: 'free' as const,
          role: authUser.email === 'admin@pba.com' ? 'admin' as const : 'user' as const,
          battles_used: 0,
          battles_limit: authUser.email === 'admin@pba.com' ? 999 : 3,
          last_reset_at: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        try {
          const { error: insertError } = await supabase.from('profiles').insert(newProfile);
          if (insertError) {
            console.error('❌ [Auth] Failed to create profile:', insertError);
            // Set user anyway with basic data
            setUser({
              id: authUser.id,
              email: authUser.email!,
              name: authUser.user_metadata?.name || authUser.email!.split('@')[0],
              avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
              plan: 'free',
              role: 'user',
              battlesUsed: 0,
              battlesLimit: 3,
              lastResetAt: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          } else {
            console.log('✅ [Auth] Profile created successfully for existing user');
            setUser({
              id: authUser.id,
              email: authUser.email!,
              name: newProfile.name,
              avatarUrl: newProfile.avatar_url,
              plan: newProfile.plan,
              role: newProfile.role,
              battlesUsed: newProfile.battles_used,
              battlesLimit: newProfile.battles_limit,
              lastResetAt: newProfile.last_reset_at,
              createdAt: newProfile.created_at,
              updatedAt: newProfile.updated_at
            });
          }
        } catch (profileCreateError) {
          console.error('❌ [Auth] Profile creation failed:', profileCreateError);
          // Set user anyway with basic data to prevent infinite loading
          setUser({
            id: authUser.id,
            email: authUser.email!,
            name: authUser.user_metadata?.name || authUser.email!.split('@')[0],
            avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
            plan: 'free',
            role: 'user',
            battlesUsed: 0,
            battlesLimit: 3,
            lastResetAt: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('❌ [Auth] Error loading profile:', error);
      // Don't show error toast and don't set user to null - this causes infinite loading
      // Instead, create a basic user profile to allow login to complete
      console.log('🔄 [Auth] Creating fallback user profile due to error');
      setUser({
        id: authUser.id,
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.email!.split('@')[0],
        avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
        plan: 'free',
        role: 'user',
        battlesUsed: 0,
        battlesLimit: 3,
        lastResetAt: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  const login = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      console.log('🔐 [Auth] Attempting login for:', email);
      
      const { user: authUser } = await signIn(email.trim(), password);
      if (authUser) {
        console.log('✅ [Auth] Supabase login successful for:', authUser.email);
        // Profile will be loaded via onAuthStateChange
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