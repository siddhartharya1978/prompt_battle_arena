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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          // Check for demo session
          const demoSession = localStorage.getItem('demo_session');
          if (demoSession) {
            const demoUser = JSON.parse(demoSession);
            setUser(demoUser);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
        setAuthLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthLoading(true);
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('demo_session');
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      const profile = await getProfile(authUser.id);
      if (profile) {
        const transformedProfile = transformProfileFromDB(profile);
        setUser(transformedProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  const login = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      // Check for demo credentials
      if (email.trim().toLowerCase() === 'demo@example.com' && password === 'demo123') {
        const demoUser = {
          id: 'demo-user-id',
          email: 'demo@example.com',
          name: 'Demo User',
          avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
          plan: 'free' as const,
          role: 'user' as const,
          battlesUsed: 0,
          battlesLimit: 3,
          lastResetAt: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('demo_session', JSON.stringify(demoUser));
        setUser(demoUser);
        return;
      }

      if (email.trim().toLowerCase() === 'admin@pba.com' && password === 'admin123') {
        const adminUser = {
          id: 'admin-user-id',
          email: 'admin@pba.com',
          name: 'Admin User',
          avatarUrl: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
          plan: 'premium' as const,
          role: 'admin' as const,
          battlesUsed: 0,
          battlesLimit: 999,
          lastResetAt: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('demo_session', JSON.stringify(adminUser));
        setUser(adminUser);
        return;
      }

      // Real authentication
      try {
        const { user: authUser } = await signIn(email.trim(), password);
        if (authUser) {
          await loadUserProfile(authUser);
        }
      } catch (supabaseError) {
        throw new Error(`Supabase authentication failed:\n\n${supabaseError.message}`);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setAuthLoading(true);
    try {
      const { user: authUser } = await signUp(email, password, name);
      if (authUser) {
        await loadUserProfile(authUser);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      await signOut();
      setUser(null);
      localStorage.removeItem('demo_session');
    } finally {
      setAuthLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      // Handle demo users
      const demoSession = localStorage.getItem('demo_session');
      if (demoSession) {
        const updatedUser = {
          ...user,
          name: updates.name !== undefined ? updates.name : user.name,
          avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : user.avatarUrl,
          plan: updates.plan !== undefined ? updates.plan : user.plan,
          role: updates.role !== undefined ? updates.role : user.role,
          battlesUsed: updates.battlesUsed !== undefined ? updates.battlesUsed : user.battlesUsed,
          battlesLimit: updates.battlesLimit !== undefined ? updates.battlesLimit : user.battlesLimit,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('demo_session', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return;
      }

      // Real user update
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      
      const updatedProfile = await updateProfile(user.id, dbUpdates);
      const transformedProfile = transformProfileFromDB(updatedProfile);
      setUser(transformedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      // Revert optimistic update
      setUser(user);
      throw error;
    }
  };

  const incrementBattleUsage = async () => {
    if (!user) return;

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
      } else {
        console.warn('Battle usage increment failed, but continuing with battle');
        // Don't block the user - just log the issue
      }
    } catch (error) {
      console.error('Error incrementing battle usage:', error);
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