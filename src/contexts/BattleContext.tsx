import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserBattles, getBattle as getBattleAPI } from '../lib/battles';
import { ResilientBattleEngine } from '../lib/battles-resilient';
import { AVAILABLE_MODELS, selectOptimalModels, getAutoSelectionReason } from '../lib/models';
import { Battle, BattleData, Model } from '../types';
import { BattleProgress } from '../lib/battle-progress';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { dataPersistenceManager } from '../lib/data-persistence';
import { supabase } from '../lib/supabase';

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
    
    // Skip Supabase for demo users - they use localStorage only
    if (user.id === 'demo-user-id' || user.id === 'admin-user-id') {
      try {
        setLoading(true);
        const localBattles = await getUserBattles();
        setBattles(localBattles || []);
        console.log(`📱 Demo user: Loaded ${localBattles?.length || 0} battles from localStorage`);
      } catch (error) {
        console.error('Error loading demo battles from localStorage:', error);
        setBattles([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    try {
      setLoading(true);
      
      // Try to load from Supabase first, then fallback to localStorage
      let userBattles: Battle[] = [];
      
      try {
        console.log('🔍 Loading battles from Supabase for user:', user.id);
        const { data, error } = await supabase
          .from('battles')
          .select(`
            *,
            battle_responses(*),
            battle_scores(*),
            prompt_evolution(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ Supabase battles query failed:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log(`✅ Loaded ${data.length} battles from Supabase`);
          userBattles = data.map(transformBattleFromDB);
        } else {
          console.log('📝 No battles found in Supabase, checking localStorage');
        }
      } catch (supabaseError) {
        console.error('Supabase query failed, using localStorage:', supabaseError);
      }
      
      // Fallback to localStorage if Supabase fails or no data
      if (userBattles.length === 0) {
        const localBattles = await getUserBattles();
        userBattles = localBattles || [];
        console.log(`📱 Loaded ${userBattles.length} battles from localStorage`);
      }
      
      setBattles(userBattles || []);
    } catch (error) {
      console.error('Error refreshing battles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBattle = async (battleData: BattleData): Promise<Battle> => {
    const progressCallback = (progress: BattleProgress) => {
      setBattleProgress(progress);
      // No more toast spam - all progress shown in thinking interface
    };
    
    try {
      const battleEngine = new ResilientBattleEngine(progressCallback);
      const battle = await battleEngine.createBattle(battleData);
      
      // Save battle with resilient persistence
      const saveResult = await dataPersistenceManager.saveBattle(battle);
      if (!saveResult.success) {
        console.warn('Battle save failed, but battle completed successfully');
      }
      
      setBattleProgress(null);
      
      // Show final success message
      const winnerModel = AVAILABLE_MODELS.find(m => m.id === battle.winner);
      const winnerScore = battle.scores[battle.winner]?.overall || 0;
      
      // Single success toast
      toast.success(`🏆 Battle Complete! Winner: ${winnerModel?.name} (${winnerScore}/10)`, { duration: 3000 });
      
      await refreshBattles();
      return battle;
      
    } catch (error) {
      setBattleProgress(null);
      toast.error(`Battle failed: ${error.message}`, { duration: 6000 });
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