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
        // Create demo user if doesn't exist
        try {
          await signUp(email, password, 'Demo User');
        } catch (error) {
          // User might already exist, try to sign in
        }
      } else if (email === 'admin@pba.com' && password === 'admin123') {
        // Create admin user if doesn't exist
        try {
          const { user: newUser } = await signUp(email, password, 'Admin User');
          if (newUser) {
            // Update to admin role
            await updateProfile(newUser.id, { role: 'admin', plan: 'premium' });
          }
        } catch (error) {
          // User might already exist, try to sign in
        }
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
    const today = new Date().toISOString().split('T')[0];
    if (userData.lastResetAt !== today) {
      userData.battlesUsed = 0;
      userData.lastResetAt = today;
    }
    
    setUser(userData);
    localStorage.setItem('pba_user', JSON.stringify(userData));
    
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('pba_onboarding_seen');
    if (!hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pba_user');
  };

  const resetDailyUsage = () => {
    if (user) {
      const updatedUser = {
        ...user,
        battlesUsed: 0,
        lastResetAt: new Date().toISOString().split('T')[0]
      };
      setUser(updatedUser);
      localStorage.setItem('pba_user', JSON.stringify(updatedUser));
    }
  };

  const incrementBattleUsage = () => {
    if (user && user.battlesUsed < user.battlesLimit) {
      const updatedUser = {
        ...user,
        battlesUsed: user.battlesUsed + 1
      };
      setUser(updatedUser);
      localStorage.setItem('pba_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      resetDailyUsage,
      incrementBattleUsage
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