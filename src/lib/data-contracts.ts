// DATA CONTRACTS & SCHEMA DISCIPLINE - OMNI-AGENT NEXUS
// Complete API contracts with validation and type safety

export interface BattleCreateRequest {
  battle_type: 'prompt' | 'response';
  prompt: string; // min 10 chars, max 2000 chars
  prompt_category: string; // enum: general, creative, technical, analysis, etc.
  models: string[]; // exactly 2 models, must be from available list
  mode: 'standard' | 'turbo';
  battle_mode: 'auto' | 'manual';
  rounds: number; // 1-10 for response, 1-20 for prompt
  max_tokens: number; // 50-2000
  temperature: number; // 0.0-2.0
  auto_selection_reason?: string;
}

export interface BattleCreateResponse {
  success: boolean;
  battle_id: string;
  estimated_cost: number;
  estimated_duration_seconds: number;
  error?: ErrorResponse;
}

export interface BattleStatusResponse {
  battle_id: string;
  status: 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  current_phase: string;
  models_status: Record<string, 'pending' | 'running' | 'completed' | 'failed'>;
  estimated_completion: string; // ISO timestamp
  error?: ErrorResponse;
}

export interface BattleResultsResponse {
  battle: {
    id: string;
    user_id: string;
    battle_type: 'prompt' | 'response';
    prompt: string;
    final_prompt?: string; // Only for prompt battles
    prompt_category: string;
    models: string[];
    status: 'completed' | 'failed';
    winner?: string;
    total_cost: number;
    created_at: string;
    updated_at: string;
  };
  responses: Array<{
    id: string;
    model_id: string;
    response: string;
    latency: number;
    tokens: number;
    cost: number;
  }>;
  scores: Record<string, {
    accuracy: number; // 0-10
    reasoning: number; // 0-10
    structure: number; // 0-10
    creativity: number; // 0-10
    overall: number; // 0-10
    notes: string;
  }>;
  prompt_evolution?: Array<{
    round: number;
    prompt: string;
    model_id: string;
    improvements: string[];
    score: number;
  }>;
  ai_judge_reasoning: string;
  error?: ErrorResponse;
}

export interface ErrorResponse {
  code: string; // AUTH_001, CONFIG_002, NETWORK_003, etc.
  message: string; // User-friendly message
  details?: string; // Technical details for debugging
  retry_after?: number; // Seconds to wait before retry
  fallback_available: boolean;
}

export interface UserProfile {
  id: string; // UUID
  email: string; // Valid email format
  name: string; // 1-100 chars
  avatar_url?: string; // Valid URL or null
  plan: 'free' | 'premium';
  role: 'user' | admin';
  battles_used: number; // 0-999999
  battles_limit: number; // 3 for free, 999999 for premium
  last_reset_at: string; // ISO date
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// VALIDATION FUNCTIONS
export const validateBattleRequest = (request: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!request.prompt || typeof request.prompt !== 'string') {
    errors.push('Prompt is required and must be a string');
  } else if (request.prompt.length < 10) {
    errors.push('Prompt must be at least 10 characters long');
  } else if (request.prompt.length > 2000) {
    errors.push('Prompt must be less than 2000 characters');
  }

  if (!request.battle_type || !['prompt', 'response'].includes(request.battle_type)) {
    errors.push('Battle type must be either "prompt" or "response"');
  }

  if (!Array.isArray(request.models) || request.models.length !== 2) {
    errors.push('Exactly 2 models must be selected');
  }

  if (request.max_tokens && (request.max_tokens < 50 || request.max_tokens > 2000)) {
    errors.push('Max tokens must be between 50 and 2000');
  }

  if (request.temperature && (request.temperature < 0 || request.temperature > 2)) {
    errors.push('Temperature must be between 0.0 and 2.0');
  }

  return { valid: errors.length === 0, errors };
};

export const sanitizeUserInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 2000); // Limit length
};

// EXAMPLE PAYLOADS
export const EXAMPLE_BATTLE_REQUEST: BattleCreateRequest = {
  battle_type: 'response',
  prompt: 'Explain artificial intelligence in simple terms for beginners',
  prompt_category: 'explanation',
  models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'],
  mode: 'standard',
  battle_mode: 'auto',
  rounds: 1,
  max_tokens: 500,
  temperature: 0.7,
  auto_selection_reason: 'AI selected models based on prompt analysis'
};

export const EXAMPLE_BATTLE_RESPONSE: BattleCreateResponse = {
  success: true,
  battle_id: '550e8400-e29b-41d4-a716-446655440000',
  estimated_cost: 0.025,
  estimated_duration_seconds: 45
};