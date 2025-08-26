import React, { createContext, useContext, useState, useEffect } from 'react';
import { bulletproofSupabase } from '../lib/supabase-bulletproof';
import { getProfile, updateProfile } from '../lib/auth';
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
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('🔐 [AuthContext] Initializing authentication...');
        
        // Get initial session
        const session = await bulletproofSupabase.getSession();
        
        if (session?.user && mounted) {
          console.log('✅ [Auth] Found Supabase session for user:', session.user.email);
          const result = await bulletproofSupabase.signIn(session.user.email!, 'session-restore');
          if (result.profile) {
            setUser(result.profile);
          }
        }
        if (session?.user && mounted) {
          console.log('✅ [AuthContext] Found existing session for:', session.user.email);
          
          try {
            const profile = await getProfile(session.user.id);
            if (profile && mounted) {
              console.log('✅ [AuthContext] Profile loaded:', profile.email);
              setUser(profile);
            } else {
              console.log('⚠️ [AuthContext] No profile found, clearing session');
              setUser(null);
            }
          } catch (profileError) {
            console.error('❌ [AuthContext] Profile loading failed:', profileError);
            if (mounted) setUser(null);
          }
        } else {
          console.log('ℹ️ [AuthContext] No existing session');
          if (mounted) setUser(null);
        }
      } catch (error) {
        console.error('❌ [AuthContext] Auth initialization failed:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes - PREVENT INFINITE LOOPS
    const client = bulletproofSupabase.getClient();
    if (!client) {
      setLoading(false);
      return;
    }
    
    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || !authInitialized) return;
      
      console.log('🔄 [AuthContext] Auth state change:', event, session?.user?.email);
      
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ [AuthContext] User signed in:', session.user.email);
          
          const profile = await getProfile(session.user.id);
          if (profile && mounted) {
            console.log('✅ [AuthContext] Profile loaded after sign in:', profile.email);
            setUser(profile);
          }
        } else if (event === 'SIGNED_OUT') {
        try {
          const result = await bulletproofSupabase.signIn(session.user.email!, 'auto-signin');
          if (result.profile) {
            setUser(result.profile);
          }
        } catch (error) {
          console.error('❌ [Auth] Auto sign-in failed:', error);
          setUser(null);
        }
          if (mounted) setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 [AuthContext] Token refreshed for:', session.user.email);
          // Don't reload profile on token refresh to prevent loops
        }
      } catch (error) {
        console.error('❌ [AuthContext] Auth state change error:', error);
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
      const result = await bulletproofSupabase.signIn(email, password);
      if (result.profile) {
        setUser(result.profile);
      }
    } catch (error) {
      console.error('❌ [AuthContext] Login failed:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setAuthLoading(true);
    try {
      const result = await bulletproofSupabase.signUp(email, password, name);
      if (result.profile) {
        setUser(result.profile);
      }
    } catch (error) {
      console.error('❌ [AuthContext] Registration failed:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      await bulletproofSupabase.signOut();
      setUser(null);
    } catch (error) {
      console.error('❌ [AuthContext] Logout failed:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      const updatedProfile = await bulletproofSupabase.updateProfile(user.id, updates);
      if (!updatedProfile) {
        throw new Error('Profile update returned null');
      }
      setUser(updatedProfile);
    } catch (error) {
      console.error('❌ [AuthContext] Profile update failed:', error);
      throw error;
    }
  };

  const incrementBattleUsage = async () => {
    if (!user) return;
    
    try {
      const newUsage = (user.battle_usage || 0) + 1;
      const updates = { battle_usage: newUsage };
      
      const updatedProfile = await bulletproofSupabase.updateProfile(user.id, updates);
      if (!updatedProfile) {
        throw new Error('Profile update returned null');
      }
      setUser(updatedProfile);
      console.log('✅ [AuthContext] Battle usage incremented:', newUsage);
    } catch (error) {
      console.error('❌ [AuthContext] Error incrementing usage:', error);
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