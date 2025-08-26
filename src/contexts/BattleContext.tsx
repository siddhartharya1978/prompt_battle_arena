import React, { createContext, useContext, useState, useEffect } from 'react';
import { ResilientBattleEngine } from '../lib/battles-resilient';
import { AVAILABLE_MODELS, selectOptimalModels, getAutoSelectionReason } from '../lib/models';
import { Battle, BattleData, Model, transformBattleFromDB } from '../types';
import { BattleProgress } from '../lib/battle-progress';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { dataPersistenceManager } from '../lib/data-persistence';
import { bulletproofSupabase } from '../lib/supabase-bulletproof';

// Fallback function for getting battles from localStorage
const getUserBattles = async (): Promise<Battle[]> => {
  try {
    const demoCache = JSON.parse(localStorage.getItem('demo_battles') || '[]');
    return demoCache;
  } catch (error) {
    console.error('Error loading battles from cache:', error);
    return [];
  }
};

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
      console.log('🔍 [BattleContext] Loading battles for user:', user.id);
      
      let userBattles: Battle[] = [];
      
      try {
        const result = await bulletproofSupabase.getBattles(user.id);
        if (result.error) {
          console.error('❌ [BattleContext] Supabase battles query failed:', result.error);
          throw new Error(result.error);
        }
        
        if (result.battles && result.battles.length > 0) {
          console.log(`✅ [BattleContext] Loaded ${result.battles.length} battles from Supabase`);
          userBattles = result.battles;
        } else {
          console.log('📝 [BattleContext] No battles found in Supabase, checking localStorage');
          // For demo users or new users, check localStorage as fallback
          const localBattles = await getUserBattles();
          userBattles = localBattles || [];
          console.log(`📱 [BattleContext] Loaded ${userBattles.length} battles from localStorage fallback`);
        }
      } catch (supabaseError) {
        console.error('❌ [BattleContext] Supabase query failed, using localStorage:', supabaseError);
        const localBattles = await getUserBattles();
        userBattles = localBattles || [];
        console.log(`📱 [BattleContext] Fallback: Loaded ${userBattles.length} battles from localStorage`);
      }
      
      setBattles(userBattles || []);
    } catch (error) {
      console.error('❌ [BattleContext] Error refreshing battles:', error);
      setBattles([]);
    } finally {
      setLoading(false);
    }
  };

  const createBattle = async (battleData: BattleData): Promise<Battle> => {
    if (!battleData || !battleData.prompt || !battleData.models) {
      throw new Error('Invalid battle configuration provided');
    }
    
    const progressCallback = (progress: BattleProgress) => {
      setBattleProgress(progress);
    };
    
    try {
      console.log('🚀 [BattleContext] STARTING BATTLE CREATION');
      console.log('🚀 [BattleContext] Battle Type:', battleData.battle_type);
      console.log('🚀 [BattleContext] Models:', battleData.models);
      console.log('🚀 [BattleContext] Prompt:', battleData.prompt.substring(0, 100) + '...');
      
      const battleEngine = new ResilientBattleEngine(progressCallback);
      const battle = await battleEngine.createBattle(battleData);
      
      console.log('✅ [BattleContext] BATTLE CREATION SUCCESS');
      console.log('✅ [BattleContext] Battle ID:', battle.id);
      console.log('✅ [BattleContext] Winner:', battle.winner);
      console.log('✅ [BattleContext] Status:', battle.status);
      
      // Save battle with resilient persistence
      const saveResult = await bulletproofSupabase.saveBattle(battle);
      if (!saveResult.success) {
        console.warn('⚠️ [BattleContext] Battle save failed, but battle completed successfully');
        toast.success('🏆 Battle completed! (Note: Save to database failed, but results are cached locally)', { duration: 4000 });
      } else {
        console.log('✅ [BattleContext] Battle saved successfully');
      }
      
      setBattleProgress(null);
      
      // Show success message only for completed battles
      if (battle.status === 'completed' && battle.winner) {
        const winnerModel = AVAILABLE_MODELS.find(m => m.id === battle.winner);
        const winnerScore = battle.scores[battle.winner]?.overall || 0;
        toast.success(`🏆 Battle Complete! Winner: ${winnerModel?.name} (${winnerScore.toFixed(1)}/10)`, { duration: 4000 });
      } else if (battle.status === 'failed') {
        toast.error('❌ Battle failed due to API issues. No synthetic data generated. You can retry immediately.', { duration: 5000 });
      }
      
      await refreshBattles();
      return battle;
      
    } catch (error) {
      console.error('💥 [BattleContext] BATTLE CREATION FAILED:', error);
      setBattleProgress(null);
      
      // Enhanced error messaging for better UX
      if (error.message.includes('rate limit')) {
        toast.error('🚫 API rate limit reached. Please wait 30 seconds and try again.', { duration: 6000 });
      } else if (error.message.includes('timeout')) {
        toast.error('⏱️ Request timed out. The API is slow - please try again.', { duration: 5000 });
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        toast.error('🌐 Network issue. Please check your connection and try again.', { duration: 5000 });
      } else {
        toast.error(`❌ Battle failed: ${error.message}`, { duration: 6000 });
      }
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