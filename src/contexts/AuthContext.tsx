import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  plan: 'free' | 'premium';
  role: 'user' | 'admin';
  battles_used: number;
  battles_limit: number;
  created_at: string;
}

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
    // Check for demo session first
    const demoSession = localStorage.getItem('demo_session');
    if (demoSession) {
      try {
        const { user: demoUser, timestamp } = JSON.parse(demoSession);
        // Check if demo session is still valid (24 hours)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setUser(demoUser);
          setAuthUser({
            id: demoUser.id,
            email: demoUser.email,
            user_metadata: { name: demoUser.name },
            app_metadata: {},
            aud: 'authenticated',
            created_at: demoUser.created_at,
            updated_at: demoUser.updated_at
          } as any);
          setLoading(false);
          return;
        } else {
          // Remove expired demo session
          localStorage.removeItem('demo_session');
        }
      } catch (e) {
        localStorage.removeItem('demo_session');
      }
    }

    // Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user || null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Clear demo session when real auth changes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          localStorage.removeItem('demo_session');
        }
        
        setAuthUser(session?.user || null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    // Skip loading profile for demo users
    const demoSession = localStorage.getItem('demo_session');
    if (demoSession) {
      return;
    }
    
    if (!userId) {
      console.warn('No userId provided to loadProfile');
      return;
    }
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setUser({
          ...data,
          avatar_url: data.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face'
        });
      } else {
        console.warn('No profile found for user:', userId);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Don't throw error, just log it
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // First try normal Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // If normal auth fails, check if it's a demo account and handle fallback
        if (isDemoAccount(email, password)) {
          await handleDemoAccountLogin(email, password);
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Clear demo session
    localStorage.removeItem('demo_session');
    
    // Clear state
    setUser(null);
    setAuthUser(null);
    
    // Sign out from Supabase (if there's a real session)
    await supabase.auth.signOut();
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

  // Helper function to check if credentials match demo accounts
  const isDemoAccount = (email: string, password: string): boolean => {
    const demoAccounts = [
      { email: 'demo@example.com', password: 'demo123' },
      { email: 'admin@pba.com', password: 'admin123' }
    ];
    
    return demoAccounts.some(account => 
      account.email === email && account.password === password
    );
  };

  // Handle demo account login when Supabase auth fails
  const handleDemoAccountLogin = async (email: string, password: string) => {
    // Create a mock user session for demo purposes
    const mockUser = {
      id: email === 'admin@pba.com' ? 'admin-demo-id' : 'demo-user-id',
      email,
      name: email === 'admin@pba.com' ? 'Demo Admin' : 'Demo User',
      avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
      plan: 'free' as const,
      role: email === 'admin@pba.com' ? 'admin' as const : 'user' as const,
      battles_used: 0,
      battles_limit: email === 'admin@pba.com' ? 999 : 3,
      last_reset_at: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Set the mock user data
    setUser(mockUser);
    setAuthUser({
      id: mockUser.id,
      email: mockUser.email,
      user_metadata: { name: mockUser.name },
      app_metadata: {},
      aud: 'authenticated',
      created_at: mockUser.created_at,
      updated_at: mockUser.updated_at
    } as any);

    // Store demo session in localStorage for persistence
    localStorage.setItem('demo_session', JSON.stringify({
      user: mockUser,
      timestamp: Date.now()
    }));
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