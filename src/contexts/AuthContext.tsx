import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { signIn, signUp, signOut, getProfile } from '../lib/auth';
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
      setAuthUser(session?.user || null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthUser(session?.user || null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const profile = await getProfile(userId);
      if (profile) {
        setUser({
          ...profile,
          avatar_url: profile.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      await signUp(email, password, name);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    await signOut();
  };

  const incrementBattleUsage = async () => {
    if (user && authUser && user.battles_used < user.battles_limit) {
      const { data } = await supabase
        .from('profiles')
        .update({ battles_used: user.battles_used + 1 })
        .eq('id', authUser.id)
        .select()
        .single();
      
      if (data) setUser(data);
    }
  };

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (authUser) {
      const { data } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authUser.id)
        .select()
        .single();
      
      if (data) setUser(data);
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