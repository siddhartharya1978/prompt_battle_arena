// Complete model registry with full Groq support and competitive diversity
export interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: string;
  available: boolean;
  premium: boolean;
  strengths: string[];
  pricing: number; // cost per 1k tokens
  speed: 'fast' | 'medium' | 'slow';
  quality: 'high' | 'medium' | 'standard';
}

export const AVAILABLE_MODELS: Model[] = [
  // Groq Models - Fast and Competitive
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    provider: 'Groq',
    description: 'Ultra-fast responses with good quality',
    icon: '⚡',
    available: true,
    premium: false,
    strengths: ['speed', 'general', 'coding'],
    pricing: 0.0001,
    speed: 'fast',
    quality: 'medium'
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    provider: 'Groq',
    description: 'Large model with excellent reasoning',
    icon: '🦙',
    available: true,
    premium: false,
    strengths: ['reasoning', 'analysis', 'creative'],
    pricing: 0.0005,
    speed: 'medium',
    quality: 'high'
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill 70B',
    provider: 'Groq',
    description: 'Advanced reasoning and problem-solving',
    icon: '🧠',
    available: true,
    premium: false,
    strengths: ['math', 'technical', 'reasoning'],
    pricing: 0.0006,
    speed: 'medium',
    quality: 'high'
  },
  {
    id: 'meta-llama/llama-guard-4-12b',
    name: 'Llama Guard 4 12B',
    provider: 'Groq',
    description: 'Safety-focused with strong guardrails',
    icon: '🛡️',
    available: true,
    premium: false,
    strengths: ['safety', 'moderation', 'analysis'],
    pricing: 0.0002,
    speed: 'fast',
    quality: 'medium'
  },
  {
    id: 'qwen/qwen3-32b',
    name: 'Qwen 3 32B',
    provider: 'Groq',
    description: 'Multilingual powerhouse with strong reasoning',
    icon: '🌐',
    available: true,
    premium: false,
    strengths: ['multilingual', 'reasoning', 'creative'],
    pricing: 0.0005,
    speed: 'medium',
    quality: 'high'
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick 17B',
    provider: 'Groq',
    description: 'Latest Llama 4 with enhanced instruction following',
    icon: '🚀',
    available: true,
    premium: true,
    strengths: ['instruction', 'creative', 'technical'],
    pricing: 0.0004,
    speed: 'fast',
    quality: 'high'
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    provider: 'Groq',
    description: 'Optimized for exploration and discovery',
    icon: '🔍',
    available: true,
    premium: true,
    strengths: ['research', 'analysis', 'exploration'],
    pricing: 0.0004,
    speed: 'fast',
    quality: 'high'
  },
  {
    id: 'moonshotai/kimi-k2-instruct',
    name: 'Kimi K2 Instruct',
    provider: 'Groq',
    description: 'Advanced instruction-following model',
    icon: '🌙',
    available: true,
    premium: true,
    strengths: ['instruction', 'reasoning', 'creative'],
    pricing: 0.0007,
    speed: 'medium',
    quality: 'high'
  }
];

// Intelligent model selection based on prompt analysis
export const selectOptimalModels = (prompt: string, category: string, battleType: 'prompt' | 'response'): string[] => {
  const availableModels = AVAILABLE_MODELS.filter(m => m.available);
  
  if (availableModels.length === 0) {
    return [];
  }

  // Analyze prompt characteristics
  const promptLower = prompt.toLowerCase();
  const isCreative = promptLower.includes('creative') || promptLower.includes('story') || promptLower.includes('poem') || category === 'creative';
  const isTechnical = promptLower.includes('code') || promptLower.includes('technical') || promptLower.includes('programming') || category === 'technical';
  const isMath = promptLower.includes('math') || promptLower.includes('calculate') || promptLower.includes('solve') || category === 'math';
  const isAnalysis = promptLower.includes('analyze') || promptLower.includes('compare') || promptLower.includes('research') || category === 'analysis';

  // Score models based on prompt characteristics
  const modelScores = availableModels.map(model => {
    let score = 5; // Base score
    
    // Add points for relevant strengths
    if (isCreative && model.strengths.includes('creative')) score += 3;
    if (isTechnical && model.strengths.includes('technical')) score += 3;
    if (isMath && model.strengths.includes('math')) score += 3;
    if (isAnalysis && model.strengths.includes('analysis')) score += 3;
    if (model.strengths.includes('reasoning')) score += 2;
    if (model.strengths.includes('general')) score += 1;
    
    // Quality bonus
    if (model.quality === 'high') score += 2;
    
    // Speed consideration for prompt battles
    if (battleType === 'prompt' && model.speed === 'fast') score += 1;
    
    // Diversity bonus (prefer different providers)
    if (model.provider !== 'Groq') score += 1;
    
    return { model, score };
  });

  // Sort by score and select top 3 diverse models
  const sortedModels = modelScores.sort((a, b) => b.score - a.score);
  const selected: string[] = [];
  const usedProviders = new Set<string>();

  // First pass: select best model from each provider
  for (const { model } of sortedModels) {
    if (selected.length >= 3) break;
    if (!usedProviders.has(model.provider)) {
      selected.push(model.id);
      usedProviders.add(model.provider);
    }
  }

  // Second pass: fill remaining slots with highest scoring models
  for (const { model } of sortedModels) {
    if (selected.length >= 3) break;
    if (!selected.includes(model.id)) {
      selected.push(model.id);
    }
  }

  return selected.slice(0, 3);
};

export const getModelInfo = (modelId: string): Model => {
  return AVAILABLE_MODELS.find(m => m.id === modelId) || {
    id: modelId,
    name: modelId,
    provider: 'Unknown',
    description: 'Unknown model',
    icon: '🤖',
    available: false,
    premium: false,
    strengths: [],
    pricing: 0.001,
    speed: 'medium',
    quality: 'medium'
  };
};

export const getAutoSelectionReason = (prompt: string, category: string, selectedModels: string[]): string => {
  const models = selectedModels.map(getModelInfo);
  const promptLower = prompt.toLowerCase();
  
  let reason = `Selected ${models.length} models for ${category} prompt: `;
  
  const reasons: string[] = [];
  
  if (promptLower.includes('creative') || category === 'creative') {
    reasons.push('Creative models for imaginative responses');
  }
  if (promptLower.includes('technical') || category === 'technical') {
    reasons.push('Technical specialists for accurate solutions');
  }
  if (promptLower.includes('math') || category === 'math') {
    reasons.push('Math-focused models for precise calculations');
  }
  if (promptLower.includes('analyze') || category === 'analysis') {
    reasons.push('Analysis experts for deep insights');
  }
  
  if (reasons.length === 0) {
    reasons.push('Balanced mix of reasoning, creativity, and speed');
  }
  
  reason += reasons.join(', ') + '. ';
  
  // Add diversity reasoning
  const providers = [...new Set(models.map(m => m.provider))];
  if (providers.length > 1) {
    reason += `Diverse providers (${providers.join(', ')}) for varied approaches.`;
  }
  
  return reason;
};