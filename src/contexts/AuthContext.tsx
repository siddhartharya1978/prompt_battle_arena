import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AuthContext] Session error:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
            setAuthInitialized(true);
          }
          return;
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
          console.log('👋 [AuthContext] User signed out');
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
      console.log('🔐 [AuthContext] Attempting login for:', email);
      
      const { signIn } = await import('../lib/auth');
      const { user: authUser } = await signIn(email, password);
      
      if (authUser) {
        console.log('✅ [AuthContext] Login successful for:', authUser.email);
        
        const profile = await getProfile(authUser.id);
        if (profile) {
          console.log('✅ [AuthContext] Profile loaded:', profile.email);
          setUser(profile);
        } else {
          console.error('❌ [AuthContext] No profile found for user:', authUser.id);
          throw new Error('Profile not found. Please contact support.');
        }
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
      console.log('📝 [AuthContext] Attempting registration for:', email);
      
      const { signUp } = await import('../lib/auth');
      const result = await signUp(email, password, name);
      
      console.log('✅ [AuthContext] Registration successful for:', email);
      
      // Don't automatically set user - wait for email confirmation
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
      console.log('👋 [AuthContext] Logging out user:', user?.email);
      
      const { signOut } = await import('../lib/auth');
      await signOut();
      setUser(null);
      
      console.log('✅ [AuthContext] Logout successful');
    } catch (error) {
      console.error('❌ [AuthContext] Logout error:', error);
      // Force logout even if API fails
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      console.log('📝 [AuthContext] Updating profile for:', user.email);
      
      const updatedProfile = await updateProfile(user.id, updates);
      setUser(updatedProfile);
      
      console.log('✅ [AuthContext] Profile updated successfully');
    } catch (error) {
      console.error('❌ [AuthContext] Profile update error:', error);
      throw error;
    }
  };

  const incrementBattleUsage = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      let newUsage = user.battlesUsed;
      
      // Reset usage if it's a new day
      if (user.lastResetAt !== today) {
        newUsage = 1;
      } else {
        newUsage = Math.min(user.battlesUsed + 1, user.battlesLimit);
      }

      const updatedProfile = await updateProfile(user.id, {
        battlesUsed: newUsage,
        lastResetAt: today
      });
      
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