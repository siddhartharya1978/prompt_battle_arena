import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { signIn, signUp, signOut, getProfile, updateProfile } from '../lib/auth';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../lib/auth';

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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await getProfile(userId);
      if (profile) {
        // Check if daily reset is needed
        const today = new Date().toISOString().split('T')[0];
        if (profile.last_reset_at !== today) {
          const updatedProfile = await updateProfile(userId, {
            battles_used: 0,
            last_reset_at: today,
          });
          setUser(updatedProfile);
        } else {
          setUser(profile);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Handle demo logins
      if (email === 'demo@example.com' && password === 'demo123') {
        // Set demo user directly for development
        const demoUser = {
          id: 'demo-user-id',
          email: 'demo@example.com',
          name: 'Demo User',
          avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
          plan: 'free' as const,
          role: 'user' as const,
          battles_used: 2,
          battles_limit: 3,
          last_reset_at: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUser(demoUser);
        setAuthUser({ id: 'demo-user-id', email: 'demo@example.com' } as any);
        return;
      } else if (email === 'admin@pba.com' && password === 'admin123') {
        // Set demo admin directly for development
        const demoAdmin = {
          id: 'demo-admin-id',
          email: 'admin@pba.com',
          name: 'Admin User',
          avatar_url: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
          plan: 'premium' as const,
          role: 'admin' as const,
          battles_used: 0,
          battles_limit: -1,
          last_reset_at: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUser(demoAdmin);
        setAuthUser({ id: 'demo-admin-id', email: 'admin@pba.com' } as any);
        return;
      }

      await signIn(email, password);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      await signUp(email, password, name);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setAuthUser(null);
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