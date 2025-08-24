// Unified interfaces for the entire application
// All interfaces use camelCase for consistency

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  plan: 'free' | 'premium';
  role: 'user' | 'admin';
  battlesUsed: number;
  battlesLimit: number;
  lastResetAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: string;
  available: boolean;
  premium: boolean;
}

export interface BattleScore {
  accuracy: number;
  reasoning: number;
  structure: number;
  creativity: number;
  overall: number;
  notes: string;
}

export interface BattleResponse {
  id: string;
  battleId: string;
  modelId: string;
  response: string;
  latency: number;
  tokens: number;
  cost: number;
  createdAt: string;
}

export interface PromptEvolution {
  id: string;
  battleId: string;
  round: number;
  prompt: string;
  modelId: string;
  improvements: string[];
  score: number;
  createdAt: string;
}

export interface Battle {
  id: string;
  userId: string;
  battleType: 'prompt' | 'response';
  prompt: string;
  finalPrompt: string | null;
  promptCategory: string;
  models: string[];
  mode: 'standard' | 'turbo';
  battleMode: 'auto' | 'manual';
  rounds: number;
  maxTokens: number;
  temperature: number;
  status: 'running' | 'completed' | 'failed';
  winner: string | null;
  totalCost: number;
  autoSelectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  responses: BattleResponse[];
  scores: Record<string, BattleScore>;
  promptEvolution?: PromptEvolution[];
  roundResults?: any[]; // Store peer review round data
  globalConsensus?: boolean; // True if 10/10 consensus achieved
  plateauReason?: string; // Reason why battle stopped if not consensus
}

export interface BattleData {
  battle_type: 'prompt' | 'response';
  prompt: string;
  prompt_category: string;
  models: string[];
  mode: 'standard' | 'turbo';
  battle_mode: 'auto' | 'manual';
  rounds: number;
  max_tokens: number;
  temperature: number;
  auto_selection_reason?: string;
}

// Database transformation utilities
export const transformProfileFromDB = (dbProfile: any): Profile => ({
  id: dbProfile.id,
  email: dbProfile.email,
  name: dbProfile.name,
  avatarUrl: dbProfile.avatar_url,
  plan: dbProfile.plan,
  role: dbProfile.role,
  battlesUsed: dbProfile.battles_used || 0,
  battlesLimit: dbProfile.battles_limit || 3,
  lastResetAt: dbProfile.last_reset_at,
  createdAt: dbProfile.created_at,
  updatedAt: dbProfile.updated_at
});

export const transformBattleFromDB = (dbBattle: any): Battle => ({
  id: dbBattle.id,
  userId: dbBattle.user_id,
  battleType: dbBattle.battle_type,
  prompt: dbBattle.prompt,
  finalPrompt: dbBattle.final_prompt,
  promptCategory: dbBattle.prompt_category,
  models: dbBattle.models || [],
  mode: dbBattle.mode,
  battleMode: dbBattle.battle_mode,
  rounds: dbBattle.rounds || 1,
  maxTokens: dbBattle.max_tokens || 500,
  temperature: dbBattle.temperature || 0.7,
  status: dbBattle.status,
  winner: dbBattle.winner,
  totalCost: dbBattle.total_cost || 0,
  autoSelectionReason: dbBattle.auto_selection_reason,
  createdAt: dbBattle.created_at,
  updatedAt: dbBattle.updated_at,
  responses: (dbBattle.battle_responses || []).map((r: any) => ({
    id: r.id,
    battleId: r.battle_id,
    modelId: r.model_id,
    response: r.response || '',
    latency: r.latency || 0,
    tokens: r.tokens || 0,
    cost: r.cost || 0,
    createdAt: r.created_at
  })),
  scores: (dbBattle.battle_scores || []).reduce((acc: Record<string, BattleScore>, s: any) => {
    if (s && s.model_id) {
      acc[s.model_id] = {
        accuracy: s.accuracy || 0,
        reasoning: s.reasoning || 0,
        structure: s.structure || 0,
        creativity: s.creativity || 0,
        overall: s.overall || 0,
        notes: s.notes || ''
      };
    }
    return acc;
  }, {}),
  promptEvolution: (dbBattle.prompt_evolution || []).map((p: any) => ({
    id: p.id,
    battleId: p.battle_id,
    round: p.round || 1,
    prompt: p.prompt || '',
    modelId: p.model_id,
    improvements: p.improvements || [],
    score: p.score || 0,
    createdAt: p.created_at
  }))
});