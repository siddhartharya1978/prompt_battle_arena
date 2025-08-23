import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { signIn, signUp, signOut, getProfile, updateProfile } from '../lib/auth';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../lib/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: Profile | null;
  authUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  resetDailyUsage: () => void;
  incrementBattleUsage: () => void;
  updateUserProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authTimeout, setAuthTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) {
        setAuthUser(session.user);
        loadUserProfile(session.user.id);
      } else if (mounted) {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;
        
        if (session?.user) {
          setAuthUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          setAuthUser(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    console.log('Loading profile for user:', userId);
    try {
      const profile = await getProfile(userId);
      console.log('Profile loaded:', profile);
      if (profile) {
        setUser(profile);
      } else {
        console.warn('No profile found for user:', userId);
        // Profile should be created automatically by Supabase trigger
        // If not found, wait a moment and try again
        setTimeout(() => loadUserProfile(userId), 1000);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };


  const login = async (email: string, password: string) => {
    setLoading(true);
    
    // Set timeout for login attempt
    const timeout = setTimeout(() => {
      setLoading(false);
      toast.error('Login timeout. Please try again.');
    }, 30000); // 30 second timeout
    
    setAuthTimeout(timeout);
    
    try {
      console.log('Attempting login for:', email);
      const { data, error } = await signIn(email, password);
      
      if (error) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Login failed');
      }
      
      console.log('Login successful:', data.user?.id);
      
      // Don't set loading to false here - let the auth state change handle it
    } catch (error: any) {
      setLoading(false);
      const message = error.message || 'Login failed';
      console.log('Login error message:', message);
      toast.error(message);
      throw error;
    } finally {
      if (authTimeout) {
        clearTimeout(authTimeout);
        setAuthTimeout(null);
      }
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    
    // Set timeout for registration attempt
    const timeout = setTimeout(() => {
      setLoading(false);
      toast.error('Registration timeout. Please try again.');
    }, 30000); // 30 second timeout
    
    setAuthTimeout(timeout);
    
    try {
      console.log('Attempting registration for:', email);
      const { data, error } = await signUp(email, password, name);
      
      if (error) {
        console.error('Registration error:', error);
        throw new Error(error.message || 'Registration failed');
      }
      
      console.log('Registration successful:', data.user?.id);
      
      // Don't set loading to false here - let the auth state change handle it
    } catch (error: any) {
      setLoading(false);
      const message = error.message || 'Registration failed';
      console.log('Registration error message:', message);
      toast.error(message);
      throw error;
    } finally {
      if (authTimeout) {
        clearTimeout(authTimeout);
        setAuthTimeout(null);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setAuthUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      setUser(null);
      setAuthUser(null);
    }
  };

  const resetDailyUsage = async () => {
    if (user && authUser) {
      const today = new Date().toISOString().split('T')[0];
      const updatedProfile = await updateProfile(authUser.id, {
        battles_used: 0,
        last_reset_at: today,
      });
      setUser(updatedProfile);
    }
  };

  const incrementBattleUsage = async () => {
    if (user && authUser && user.battles_used < user.battles_limit) {
      const updatedProfile = await updateProfile(authUser.id, {
        battles_used: user.battles_used + 1,
      });
      setUser(updatedProfile);
    }
  };

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (authUser) {
      const updatedProfile = await updateProfile(authUser.id, updates);
      setUser(updatedProfile);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      authUser,
      login,
      register,
      logout,
      isAuthenticated: !!authUser,
      loading,
      resetDailyUsage,
      incrementBattleUsage,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}