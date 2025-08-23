import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: 'free' | 'premium';
  role: 'user' | 'admin';
  battlesUsed: number;
  battlesLimit: number;
  joinedAt: string;
  lastResetAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  resetDailyUsage: () => void;
  incrementBattleUsage: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const mockUser: User = {
  id: 'user_1',
  name: 'Arjun Sharma',
  email: 'arjun@example.com',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
  plan: 'free',
  role: 'user',
  battlesUsed: 2,
  battlesLimit: 3,
  joinedAt: '2024-01-15T10:30:00.000Z',
  lastResetAt: new Date().toISOString().split('T')[0]
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('pba_user');
    const hasSeenOnboarding = localStorage.getItem('pba_onboarding_seen');
    
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      // Check if daily reset is needed
      const today = new Date().toISOString().split('T')[0];
      if (userData.lastResetAt !== today) {
        userData.battlesUsed = 0;
        userData.lastResetAt = today;
        localStorage.setItem('pba_user', JSON.stringify(userData));
      }
      setUser(userData);
      
      // Show onboarding for first-time users
      if (!hasSeenOnboarding) {
        setTimeout(() => setShowOnboarding(true), 1000);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in real app would validate credentials
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let userData = { ...mockUser };
    
    // Check if admin login
    if (email === 'admin@pba.com' && password === 'admin123') {
      userData = { ...userData, role: 'admin', name: 'Admin User', plan: 'premium' };
    }
    
    // Reset daily usage if needed
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