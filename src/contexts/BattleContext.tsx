import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ResilientBattleEngine } from '../lib/battles-resilient';
import { AVAILABLE_MODELS, selectOptimalModels, getAutoSelectionReason } from '../lib/models';
import { Battle, BattleData, Model, transformBattleFromDB } from '../types';
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
      console.log('🔍 [BattleContext] Loading battles for user:', user.id);
      
      // Try Supabase first
      const { data: battlesData, error } = await supabase
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
        console.error('❌ [BattleContext] Supabase battles query failed:', error);
        throw error;
      }

      if (battlesData) {
        const transformedBattles = battlesData.map(transformBattleFromDB);
        setBattles(transformedBattles);
        console.log(`✅ [BattleContext] Loaded ${transformedBattles.length} battles from Supabase`);
      }
      
    } catch (error) {
      console.error('❌ [BattleContext] Supabase query failed, using localStorage:', error);
      
      // Fallback to localStorage
      try {
        const localBattles = JSON.parse(localStorage.getItem('demo_battles') || '[]');
        setBattles(localBattles || []);
        console.log(`📱 [BattleContext] Loaded ${localBattles.length} battles from localStorage`);
      } catch (localError) {
        console.error('❌ [BattleContext] localStorage also failed:', localError);
        setBattles([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const createBattle = async (battleData: BattleData): Promise<Battle> => {
    if (!battleData || !battleData.prompt || !battleData.models) {
      throw new Error('Invalid battle configuration provided');
    }
    
    // Generate proper UUID for battle
    const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const progressCallback = (progress: BattleProgress) => {
      setBattleProgress(progress);
    };
    
    try {
      console.log('🚀 [BattleContext] STARTING BATTLE CREATION');
      console.log('🆔 [BattleContext] Battle ID:', battleId);
      console.log('👤 [BattleContext] User ID:', battleData.user_id);
      
      // Create battle with proper configuration
      const battle = await this.createBattleWithProperFlow(battleData, battleId, progressCallback);
      
      console.log('✅ [BattleContext] BATTLE CREATION SUCCESS');
      
      // Try to save to Supabase first, then localStorage
      try {
        await this.saveBattleToSupabase(battle);
        console.log('✅ [BattleContext] Battle saved to Supabase');
      } catch (supabaseError) {
        console.error('❌ [BattleContext] Supabase save failed, using localStorage:', supabaseError);
        this.storeBattleInCache(battle);
        console.log('✅ [BattleContext] Battle saved to localStorage');
      }
      
      setBattleProgress(null);
      
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
      throw error;
    }
  };

  const saveBattleToSupabase = async (battle: Battle) => {
  // SAVE BATTLE TO SUPABASE
  const saveBattleToSupabase = async (battle: Battle) => {
    console.log('💾 [BattleContext] Saving battle to Supabase:', battle.id);
    
    // Save main battle record
    const { error: battleError } = await supabase
      .from('battles')
      .insert({
        id: battle.id,
        user_id: battle.userId,
        battle_type: battle.battleType,
        prompt: battle.prompt,
        final_prompt: battle.finalPrompt,
        prompt_category: battle.promptCategory,
        models: battle.models,
        mode: battle.mode,
        battle_mode: battle.battleMode,
        rounds: battle.rounds,
        max_tokens: battle.maxTokens,
        temperature: battle.temperature,
        status: battle.status,
        winner: battle.winner,
        total_cost: battle.totalCost,
        auto_selection_reason: battle.autoSelectionReason
      });

    if (battleError) throw battleError;
      console.error('❌ [BattleContext] Battle insert failed:', battleError);
    }
    console.log('✅ [BattleContext] Battle record saved');

    // Save responses
    if (battle.responses && battle.responses.length > 0) {
      console.log('💾 [BattleContext] Saving responses:', battle.responses.length);
      const { error: responsesError } = await supabase
        .from('battle_responses')
        .insert(
          battle.responses.map(response => ({
            id: response.id,
            battle_id: response.battleId,
            model_id: response.modelId,
            response: response.response,
            latency: response.latency,
            tokens: response.tokens,
            cost: response.cost
          }))
        );

      if (responsesError) {
        console.error('❌ [BattleContext] Responses insert failed:', responsesError);
        throw responsesError;
      }
      console.log('✅ [BattleContext] Responses saved');
    }

    // Save scores
    if (battle.scores && Object.keys(battle.scores).length > 0) {
      console.log('💾 [BattleContext] Saving scores:', Object.keys(battle.scores).length);
      const scoreEntries = Object.entries(battle.scores).map(([modelId, score]) => ({
        id: `score_${Date.now()}_${modelId}`,
        battle_id: battle.id,
        model_id: modelId,
        accuracy: score.accuracy,
        reasoning: score.reasoning,
        structure: score.structure,
        creativity: score.creativity,
        overall: score.overall,
        notes: score.notes
      }));

      const { error: scoresError } = await supabase
        .from('battle_scores')
        .insert(scoreEntries);

      if (scoresError) {
        console.error('❌ [BattleContext] Scores insert failed:', scoresError);
        throw scoresError;
      }
      console.log('✅ [BattleContext] Scores saved');
    }

    // Save prompt evolution
    if (battle.promptEvolution && battle.promptEvolution.length > 0) {
      console.log('💾 [BattleContext] Saving prompt evolution:', battle.promptEvolution.length);
      const { error: evolutionError } = await supabase
        .from('prompt_evolution')
        .insert(
          battle.promptEvolution.map(evolution => ({
            id: evolution.id,
            battle_id: evolution.battleId,
            round: evolution.round,
            prompt: evolution.prompt,
            model_id: evolution.modelId,
            improvements: evolution.improvements,
            score: evolution.score
          }))
        );

      if (evolutionError) {
        console.error('❌ [BattleContext] Evolution insert failed:', evolutionError);
        throw evolutionError;
      }
      console.log('✅ [BattleContext] Prompt evolution saved');
    }
    
    console.log('🎉 [BattleContext] Battle completely saved to Supabase');
  };

  // STORE BATTLE IN CACHE
  const storeBattleInCache = (battle: Battle) => {
    try {
      const demoCache = JSON.parse(localStorage.getItem('demo_battles') || '[]');
      demoCache.unshift(battle);
      if (demoCache.length > 50) {
        demoCache.splice(50);
      }
      localStorage.setItem('demo_battles', JSON.stringify(demoCache));
      console.log('✅ [BattleContext] Battle cached locally');
    } catch (error) {
      console.error('Error storing battle in cache:', error);
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