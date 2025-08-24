import React, { createContext, useContext, useState, useEffect } from 'react';
import { createBattle as createBattleAPI, getUserBattles, getBattle as getBattleAPI } from '../lib/battles';
import { Battle, BattleData, Model } from '../types';
import { useAuth } from './AuthContext';

interface BattleContextType {
  battles: Battle[];
  models: Model[];
  loading: boolean;
  createBattle: (battleData: BattleData) => Promise<Battle>;
  getBattle: (battleId: string) => Battle | null;
  refreshBattles: () => Promise<void>;
}

const BattleContext = createContext<BattleContextType | null>(null);

const AVAILABLE_MODELS: Model[] = [
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    description: 'Fast and efficient model',
    icon: '🦙',
    available: true,
    premium: false
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    description: 'Large model with excellent reasoning',
    icon: '🦙',
    available: true,
    premium: false
  }
];

export function BattleProvider({ children }: { children: React.ReactNode }) {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const refreshBattles = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userBattles = await getUserBattles();
      setBattles(userBattles || []);
    } catch (error) {
      console.error('Error refreshing battles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBattle = async (battleData: BattleData): Promise<Battle> => {
    const battle = await createBattleAPI(battleData);
    await refreshBattles();
    return battle;
  };

  const getBattle = (battleId: string): Battle | null => {
    return battles.find(b => b.id === battleId) || null;
  };

  useEffect(() => {
    if (user) {
      refreshBattles();
    }
  }, [user]);

  const value = {
    battles,
    models: AVAILABLE_MODELS,
    loading,
    createBattle,
    getBattle,
    refreshBattles
  };

  return (
    <BattleContext.Provider value={value}>
      {children}
    </BattleContext.Provider>
  );
}

export function useBattle() {
  const context = useContext(BattleContext);
  if (!context) {
    throw new Error('useBattle must be used within a BattleProvider');
  }
  return context;
}