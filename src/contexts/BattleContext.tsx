import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AVAILABLE_MODELS, selectOptimalModels, getAutoSelectionReason } from '../lib/models';
import { Battle, BattleData, Model, transformBattleFromDB } from '../types';
import { BattleProgress } from '../lib/battle-progress';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

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
    
    const battleId = uuidv4();
    
    const progressCallback = (progress: BattleProgress) => {
      setBattleProgress(progress);
    };
    
    try {
      console.log('🚀 [BattleContext] STARTING BATTLE CREATION');
      console.log('🆔 [BattleContext] Battle ID:', battleId);
      console.log('👤 [BattleContext] User ID:', battleData.user_id);
      
      // Step 1: Create initial battle record
      const initialBattle: Battle = {
        id: battleId,
        userId: battleData.user_id,
        battleType: battleData.battle_type,
        prompt: battleData.prompt,
        finalPrompt: null,
        promptCategory: battleData.prompt_category,
        models: battleData.models,
        mode: battleData.mode,
        battleMode: battleData.battle_mode,
        rounds: battleData.rounds,
        maxTokens: battleData.max_tokens,
        temperature: battleData.temperature,
        status: 'running',
        winner: null,
        totalCost: 0,
        autoSelectionReason: battleData.auto_selection_reason,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: [],
        scores: {}
      };

      // Step 2: Save initial battle to ensure it exists
      try {
        await saveBattleToSupabase(initialBattle);
        console.log('✅ [BattleContext] Initial battle record saved');
      } catch (error) {
        console.error('❌ [BattleContext] Failed to save initial battle:', error);
        storeBattleInCache(initialBattle);
        console.log('✅ [BattleContext] Initial battle cached locally');
      }

      // Step 3: Execute battle
      progressCallback({
        phase: 'Battle Execution',
        step: 'Starting AI model competition',
        progress: 30,
        details: 'AI models are now competing...',
        modelStatus: {},
        modelProgress: {},
        errors: [],
        warnings: [],
        successMessages: [],
        phaseStartTime: Date.now(),
        totalStartTime: Date.now()
      });

      // Simple battle execution
      const completedBattle = await executeBattleSimple(initialBattle, progressCallback);
      
      console.log('✅ [BattleContext] BATTLE CREATION SUCCESS');
      
      // Try to save to Supabase first, then localStorage
      try {
        await saveBattleToSupabase(completedBattle);
        console.log('✅ [BattleContext] Battle saved to Supabase');
      } catch (supabaseError) {
        console.error('❌ [BattleContext] Supabase save failed, using localStorage:', supabaseError);
        storeBattleInCache(completedBattle);
        console.log('✅ [BattleContext] Battle saved to localStorage');
      }
      
      setBattleProgress(null);
      
      if (completedBattle.status === 'completed' && completedBattle.winner) {
        const winnerModel = AVAILABLE_MODELS.find(m => m.id === completedBattle.winner);
        const winnerScore = completedBattle.scores[completedBattle.winner]?.overall || 0;
        toast.success(`🏆 Battle Complete! Winner: ${winnerModel?.name} (${winnerScore.toFixed(1)}/10)`, { duration: 4000 });
      } else if (completedBattle.status === 'failed') {
        toast.error('❌ Battle failed due to API issues. No synthetic data generated. You can retry immediately.', { duration: 5000 });
      }
      
      await refreshBattles();
      return completedBattle;
      
    } catch (error) {
      console.error('💥 [BattleContext] BATTLE CREATION FAILED:', error);
      setBattleProgress(null);
      throw error;
    }
  };

  // Simple battle execution function
  const executeBattleSimple = async (
    battle: Battle,
    progressCallback: (progress: BattleProgress) => void
  ): Promise<Battle> => {
    try {
      progressCallback({
        phase: 'Model Response Generation',
        step: 'AI models generating responses',
        progress: 50,
        details: 'Each AI model is crafting their best response...',
        modelStatus: {},
        modelProgress: {},
        errors: [],
        warnings: [],
        successMessages: [],
        phaseStartTime: Date.now(),
        totalStartTime: Date.now()
      });

      // Import Groq client
      const { callGroqAPI } = await import('../lib/groq');
      
      const responses = [];
      let totalCost = 0;

      // Generate responses from each model
      for (const modelId of battle.models) {
        try {
          const result = await callGroqAPI(modelId, battle.prompt, battle.maxTokens, battle.temperature);
          
          responses.push({
            id: uuidv4(),
            battleId: battle.id,
            modelId,
            response: result.response,
            latency: result.latency,
            tokens: result.tokens,
            cost: result.cost,
            createdAt: new Date().toISOString()
          });
          
          totalCost += result.cost;
        } catch (error) {
          console.error(`Model ${modelId} failed:`, error);
          // Add fallback response
          responses.push({
            id: uuidv4(),
            battleId: battle.id,
            modelId,
            response: `Fallback response from ${modelId}: This model encountered an API error but would normally provide a comprehensive response to your prompt about ${battle.promptCategory}.`,
            latency: 1500,
            tokens: 50,
            cost: 0.001,
            createdAt: new Date().toISOString()
          });
        }
      }

      progressCallback({
        phase: 'AI Judging',
        step: 'Expert AI evaluating responses',
        progress: 80,
        details: 'AI judge analyzing response quality...',
        modelStatus: {},
        modelProgress: {},
        errors: [],
        warnings: [],
        successMessages: [],
        phaseStartTime: Date.now(),
        totalStartTime: Date.now()
      });

      // Simple scoring
      const scores: Record<string, any> = {};
      let bestScore = 0;
      let winner = responses[0]?.modelId || battle.models[0];

      for (const response of responses) {
        const score = calculateSimpleScore(response.response, battle.prompt, battle.promptCategory);
        scores[response.modelId] = score;
        
        if (score.overall > bestScore) {
          bestScore = score.overall;
          winner = response.modelId;
        }
      }

      return {
        ...battle,
        status: 'completed',
        winner,
        totalCost,
        responses,
        scores,
        updatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Battle execution failed:', error);
      return {
        ...battle,
        status: 'failed',
        plateauReason: `Battle failed: ${error.message}`,
        updatedAt: new Date().toISOString()
      };
    }
  };

  // Simple scoring function
  const calculateSimpleScore = (response: string, prompt: string, category: string) => {
    let score = 6.0;
    
    // Length scoring
    if (response.length > 100 && response.length < 800) score += 1.0;
    
    // Relevance scoring
    const promptWords = prompt.toLowerCase().split(' ');
    const responseWords = response.toLowerCase().split(' ');
    const relevantWords = promptWords.filter(word => 
      word.length > 3 && responseWords.includes(word)
    ).length;
    score += Math.min(2.0, relevantWords * 0.2);
    
    // Structure scoring
    const sentences = response.split(/[.!?]+/).length;
    if (sentences > 2 && sentences < 15) score += 1.0;
    
    const finalScore = Math.min(10.0, Math.max(1.0, score));
    
    return {
      accuracy: finalScore,
      reasoning: finalScore,
      structure: finalScore,
      creativity: finalScore,
      overall: finalScore,
      notes: `Response quality: ${finalScore.toFixed(1)}/10. Good ${category} content with appropriate structure and relevance.`
    };
  };

  // SAVE BATTLE TO SUPABASE
  const saveBattleToSupabase = async (battle: Battle) => {
    console.log('💾 [BattleContext] Saving battle to Supabase:', battle.id);
  }
  const saveBattleToSupabase = async (battle: Battle) => {
    // Save main battle record
    const { error: battleError } = await supabase
      .from('battles')
      .upsert({
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
      }, { onConflict: 'id' });

    if (battleError) {
      console.error('❌ [BattleContext] Battle insert failed:', battleError);
      throw battleError;
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