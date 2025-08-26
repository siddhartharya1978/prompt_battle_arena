import React, { createContext, useContext, useState, useEffect } from 'react';
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

// Demo users for offline mode
const DEMO_USERS = {
  'demo@example.com': {
    id: 'demo-user-id',
    email: 'demo@example.com',
    name: 'Demo User',
    avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
    plan: 'free' as const,
    role: 'user' as const,
    battlesUsed: 1,
    battlesLimit: 3,
    lastResetAt: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    password: 'demo123'
  },
  'admin@pba.com': {
    id: 'admin-user-id',
    email: 'admin@pba.com',
    name: 'Admin User',
    avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
    plan: 'premium' as const,
    role: 'admin' as const,
    battlesUsed: 5,
    battlesLimit: 999,
    lastResetAt: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    password: 'admin123'
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Initialize auth - check localStorage for demo session
  useEffect(() => {
    const initAuth = () => {
      try {
        console.log('🔍 [Auth] Checking for demo session...');
        
        const demoSession = localStorage.getItem('demo_session');
        if (demoSession) {
          const userData = JSON.parse(demoSession);
          console.log('✅ [Auth] Found demo session for:', userData.email);
          setUser(userData);
        } else {
          console.log('📝 [Auth] No demo session found');
        }
      } catch (error) {
        console.error('❌ [Auth] Init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      console.log('🔐 [Auth] Demo login attempt for:', email);
      
      const demoUser = DEMO_USERS[email as keyof typeof DEMO_USERS];
      
      if (!demoUser || demoUser.password !== password) {
        throw new Error('Invalid login credentials');
      }

      // Create user profile without password
      const { password: _, ...userProfile } = demoUser;
      
      // Store in localStorage
      localStorage.setItem('demo_session', JSON.stringify(userProfile));
      setUser(userProfile);
      
      console.log('✅ [Auth] Demo login successful');
    } catch (error) {
      console.error('❌ [Auth] Login failed:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setAuthLoading(true);
    try {
      console.log('📝 [Auth] Demo registration for:', email);
      
      // Create new demo user
      const newUser: Profile = {
        id: `user_${Date.now()}`,
        email: email.trim(),
        name: name.trim(),
        avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
        plan: 'free',
        role: 'user',
        battlesUsed: 0,
        battlesLimit: 3,
        lastResetAt: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('demo_session', JSON.stringify(newUser));
      setUser(newUser);
      
      console.log('✅ [Auth] Demo registration successful');
    } catch (error) {
      console.error('❌ [Auth] Registration failed:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      localStorage.removeItem('demo_session');
      setUser(null);
      console.log('✅ [Auth] Demo logout successful');
    } catch (error) {
      console.error('❌ [Auth] Logout failed:', error);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem('demo_session', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('❌ [Auth] Profile update failed:', error);
      throw error;
    }
  };

  const incrementBattleUsage = async () => {
    if (!user) return;

    try {
      const newUsage = Math.min(user.battlesUsed + 1, user.battlesLimit);
      const updatedUser = {
        ...user,
        battlesUsed: newUsage,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('demo_session', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('❌ [Auth] Error incrementing usage:', error);
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