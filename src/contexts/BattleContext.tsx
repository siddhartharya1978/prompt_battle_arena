import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserBattles, getBattle as getBattleAPI } from '../lib/battles';
import { ResilientBattleEngine } from '../lib/battles-resilient';
import { AVAILABLE_MODELS, selectOptimalModels, getAutoSelectionReason } from '../lib/models';
import { Battle, BattleData, Model } from '../types';
import { BattleProgress } from '../lib/battle-progress';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface BattleContextType {
  battles: Battle[];
  models: Model[];
  loading: boolean;
  battleProgress: BattleProgress | null;
  createBattle: (battleData: BattleData) => Promise<Battle>;
  getBattle: (battleId: string) => Battle | null;
  refreshBattles: () => Promise<void>;
  selectOptimalModels: (prompt: string, category: string, battleType: 'prompt' | 'response') => string[];
  getAutoSelectionReason: (prompt: string, category: string, selectedModels: string[]) => string;
}

const BattleContext = createContext<BattleContextType | null>(null);

export function BattleProvider({ children }: { children: React.ReactNode }) {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(false);
  const [battleProgress, setBattleProgress] = useState<BattleProgress | null>(null);
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
    let progressToastId: string | null = null;
    
    const progressCallback = (progress: BattleProgress) => {
      setBattleProgress(progress);
      
      // Update toast with current progress
      const message = `${progress.phase}: ${progress.step} (${progress.progress}%)`;
      
      if (progressToastId) {
        toast.loading(message, { id: progressToastId });
      } else {
        progressToastId = toast.loading(message);
      }
      
      // Show errors as they happen
      if (progress.errors.length > 0) {
        const latestError = progress.errors[progress.errors.length - 1];
        toast.error(`Error: ${latestError}`, { duration: 3000 });
      }
      
      // Show warnings
      if (progress.warnings.length > 0) {
        const latestWarning = progress.warnings[progress.warnings.length - 1];
        toast(`⚠️ ${latestWarning}`, { duration: 2000 });
      }
    };
    
    try {
      const battleEngine = new ResilientBattleEngine(progressCallback);
      const battle = await battleEngine.createBattle(battleData);
      
      // Dismiss progress toast and show success
      if (progressToastId) {
        toast.dismiss(progressToastId);
      }
      
      setBattleProgress(null);
      
      // Show final success message
      const winnerModel = AVAILABLE_MODELS.find(m => m.id === battle.winner);
      const winnerScore = battle.scores[battle.winner]?.overall || 0;
      
      if (battle.battleType === 'prompt') {
        toast.success(
          winnerScore >= 10 
            ? `🎯 Perfect 10/10 prompt achieved by ${winnerModel?.name}!`
            : `🔄 Best refinement: ${winnerScore}/10 by ${winnerModel?.name}`
        );
      } else {
        toast.success(`🏆 Winner: ${winnerModel?.name} with ${winnerScore}/10!`);
      }
      
      await refreshBattles();
      return battle;
      
    } catch (error) {
      if (progressToastId) {
        toast.dismiss(progressToastId);
      }
      setBattleProgress(null);
      throw error;
    }
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
    battleProgress,
    createBattle,
    getBattle,
    refreshBattles,
    selectOptimalModels,
    getAutoSelectionReason
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