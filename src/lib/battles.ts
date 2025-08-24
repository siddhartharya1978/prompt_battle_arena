import { supabase } from './supabase';
import { callGroqAPI } from './groq';
import { Battle, BattleData, BattleResponse, BattleScore, transformBattleFromDB } from '../types';

export const createBattle = async (battleData: BattleData): Promise<Battle> => {
  if (!battleData.prompt?.trim()) {
    throw new Error('Prompt is required');
  }
  
  if (!battleData.models || battleData.models.length < 2) {
    throw new Error('At least 2 models are required');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const battleId = `battle_${Date.now()}`;
  
  // Create battle responses
  const responses: BattleResponse[] = [];
  let totalCost = 0;

  for (const modelId of battleData.models) {
    try {
      const result = await callGroqAPI(modelId, battleData.prompt, battleData.max_tokens, battleData.temperature);
      
      const response: BattleResponse = {
        id: `response_${Date.now()}_${modelId}`,
        battleId,
        modelId,
        response: result.response,
        latency: result.latency,
        tokens: result.tokens,
        cost: result.cost,
        createdAt: new Date().toISOString()
      };
      
      responses.push(response);
      totalCost += result.cost;
    } catch (error) {
      console.error(`Error with model ${modelId}:`, error);
    }
  }

  // Generate scores
  const scores: Record<string, BattleScore> = {};
  for (const response of responses) {
    scores[response.modelId] = {
      accuracy: 7 + Math.random() * 2,
      reasoning: 7 + Math.random() * 2,
      structure: 7 + Math.random() * 2,
      creativity: 7 + Math.random() * 2,
      overall: 7 + Math.random() * 2,
      notes: 'Good response with solid performance.'
    };
  }

  // Determine winner
  const winner = Object.entries(scores).reduce((best, [modelId, score]) => {
    return !best || score.overall > scores[best].overall ? modelId : best;
  }, '');

  const battle: Battle = {
    id: battleId,
    userId: user.id,
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
    status: 'completed',
    winner,
    totalCost,
    autoSelectionReason: battleData.auto_selection_reason,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    responses,
    scores
  };

  // Store in demo cache
  const demoCache = JSON.parse(localStorage.getItem('demo_battles') || '[]');
  demoCache.unshift(battle);
  localStorage.setItem('demo_battles', JSON.stringify(demoCache));

  return battle;
};

export const getUserBattles = async (): Promise<Battle[]> => {
  const demoCache = JSON.parse(localStorage.getItem('demo_battles') || '[]');
  return demoCache;
};

export const getBattle = async (battleId: string): Promise<Battle | null> => {
  const demoCache = JSON.parse(localStorage.getItem('demo_battles') || '[]');
  return demoCache.find((b: Battle) => b.id === battleId) || null;
};