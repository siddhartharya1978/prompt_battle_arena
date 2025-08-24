// Supreme Prompt Battle Arena - Complete Model Registry
export interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: string;
  available: boolean;
  premium: boolean;
  status: 'production' | 'preview';
  contextWindow: number;
  maxCompletionTokens: number;
  maxFileSize: string;
  benchmarkStrengths: string[];
  knownFor: string[];
  reliability: 'high' | 'medium' | 'experimental';
  pricing: number; // cost per 1k tokens
  speed: 'fast' | 'medium' | 'slow';
  quality: 'high' | 'medium' | 'standard';
  strengths: string[];
}

export const AVAILABLE_MODELS: Model[] = [
  // Meta Llama Models
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    provider: 'Meta',
    description: 'Ultra-fast responses with excellent quality',
    icon: '⚡',
    available: true,
    premium: false,
    status: 'production',
    contextWindow: 131072,
    maxCompletionTokens: 8192,
    maxFileSize: '25MB',
    benchmarkStrengths: ['Speed', 'General reasoning', 'Code generation'],
    knownFor: ['fast', 'general', 'coding', 'efficient'],
    reliability: 'high',
    pricing: 0.05,
    speed: 'fast',
    quality: 'high',
    strengths: ['speed', 'general', 'coding']
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    provider: 'Meta',
    description: 'Large model with exceptional reasoning capabilities',
    icon: '🦙',
    available: true,
    premium: false,
    status: 'production',
    contextWindow: 131072,
    maxCompletionTokens: 32768,
    maxFileSize: '25MB',
    benchmarkStrengths: ['Complex reasoning', 'Long-form content', 'Analysis'],
    knownFor: ['reasoning', 'analysis', 'creative', 'versatile'],
    reliability: 'high',
    pricing: 0.27,
    speed: 'medium',
    quality: 'high',
    strengths: ['reasoning', 'analysis', 'creative']
  },
  {
    id: 'meta-llama/llama-guard-4-12b',
    name: 'Llama Guard 4 12B',
    provider: 'Meta',
    description: 'Safety-focused model with strong content moderation',
    icon: '🛡️',
    available: true,
    premium: false,
    status: 'production',
    contextWindow: 8192,
    maxCompletionTokens: 4096,
    maxFileSize: '25MB',
    benchmarkStrengths: ['Safety classification', 'Content moderation'],
    knownFor: ['safety', 'moderation', 'compliance-optimized', 'factual'],
    reliability: 'high',
    pricing: 0.1,
    speed: 'fast',
    quality: 'medium',
    strengths: ['safety', 'moderation', 'analysis']
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick 17B',
    provider: 'Meta',
    description: 'Latest Llama 4 with enhanced instruction following',
    icon: '🚀',
    available: true,
    premium: true,
    status: 'preview',
    contextWindow: 131072,
    maxCompletionTokens: 8192,
    maxFileSize: '25MB',
    benchmarkStrengths: ['Instruction following', 'Creative tasks'],
    knownFor: ['instruction', 'creative', 'technical', 'cutting-edge'],
    reliability: 'experimental',
    pricing: 0.2,
    speed: 'fast',
    quality: 'high',
    strengths: ['instruction', 'creative', 'technical']
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    provider: 'Meta',
    description: 'Optimized for exploration and discovery tasks',
    icon: '🔍',
    available: true,
    premium: true,
    status: 'preview',
    contextWindow: 131072,
    maxCompletionTokens: 8192,
    maxFileSize: '25MB',
    benchmarkStrengths: ['Research tasks', 'Information discovery'],
    knownFor: ['research', 'analysis', 'exploration', 'discovery'],
    reliability: 'experimental',
    pricing: 0.2,
    speed: 'fast',
    quality: 'high',
    strengths: ['research', 'analysis', 'exploration']
  },
  {
    id: 'meta-llama/llama-prompt-guard-2-22m',
    name: 'Llama Prompt Guard 2 22M',
    provider: 'Meta',
    description: 'Lightweight prompt injection detection model',
    icon: '🔒',
    available: true,
    premium: false,
    status: 'production',
    contextWindow: 4096,
    maxCompletionTokens: 1024,
    maxFileSize: '10MB',
    benchmarkStrengths: ['Prompt injection detection', 'Security analysis'],
    knownFor: ['security', 'prompt-safety', 'lightweight', 'fast'],
    reliability: 'high',
    pricing: 0.02,
    speed: 'fast',
    quality: 'medium',
    strengths: ['safety', 'security', 'analysis']
  },
  {
    id: 'meta-llama/llama-prompt-guard-2-86m',
    name: 'Llama Prompt Guard 2 86M',
    provider: 'Meta',
    description: 'Enhanced prompt injection detection with better accuracy',
    icon: '🔐',
    available: true,
    premium: false,
    status: 'production',
    contextWindow: 4096,
    maxCompletionTokens: 1024,
    maxFileSize: '10MB',
    benchmarkStrengths: ['Advanced prompt injection detection', 'Security analysis'],
    knownFor: ['security', 'prompt-safety', 'enhanced-detection', 'reliable'],
    reliability: 'high',
    pricing: 0.03,
    speed: 'fast',
    quality: 'medium',
    strengths: ['safety', 'security', 'analysis']
  },
  // OpenAI Models
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    provider: 'OpenAI',
    description: 'Large open-source GPT model with strong performance',
    icon: '🧠',
    available: true,
    premium: true,
    status: 'preview',
    contextWindow: 32768,
    maxCompletionTokens: 16384,
    maxFileSize: '25MB',
    benchmarkStrengths: ['General intelligence', 'Complex reasoning'],
    knownFor: ['reasoning', 'creative', 'general', 'large-scale'],
    reliability: 'experimental',
    pricing: 0.5,
    speed: 'slow',
    quality: 'high',
    strengths: ['reasoning', 'creative', 'general']
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    provider: 'OpenAI',
    description: 'Efficient open-source GPT model for general tasks',
    icon: '🤖',
    available: true,
    premium: false,
    status: 'preview',
    contextWindow: 16384,
    maxCompletionTokens: 8192,
    maxFileSize: '25MB',
    benchmarkStrengths: ['Balanced performance', 'Efficiency'],
    knownFor: ['balanced', 'efficient', 'general', 'reliable'],
    reliability: 'medium',
    pricing: 0.15,
    speed: 'medium',
    quality: 'medium',
    strengths: ['general', 'balanced', 'efficient']
  },
  // DeepSeek Models
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill 70B',
    provider: 'DeepSeek/Meta',
    description: 'Advanced reasoning model with mathematical capabilities',
    icon: '🧮',
    available: true,
    premium: false,
    status: 'production',
    contextWindow: 65536,
    maxCompletionTokens: 16384,
    maxFileSize: '25MB',
    benchmarkStrengths: ['Mathematical reasoning', 'Problem solving', 'Logic'],
    knownFor: ['math', 'technical', 'reasoning', 'problem-solving'],
    reliability: 'high',
    pricing: 0.27,
    speed: 'medium',
    quality: 'high',
    strengths: ['math', 'technical', 'reasoning']
  },
  // Moonshot AI Models
  {
    id: 'moonshotai/kimi-k2-instruct',
    name: 'Kimi K2 Instruct',
    provider: 'Moonshot AI',
    description: 'Advanced instruction-following model with long context',
    icon: '🌙',
    available: true,
    premium: true,
    status: 'preview',
    contextWindow: 200000,
    maxCompletionTokens: 32768,
    maxFileSize: '50MB',
    benchmarkStrengths: ['Long-context understanding', 'Instruction following'],
    knownFor: ['long-context', 'instruction', 'reasoning', 'creative'],
    reliability: 'medium',
    pricing: 0.3,
    speed: 'medium',
    quality: 'high',
    strengths: ['instruction', 'reasoning', 'creative']
  },
  // Alibaba Cloud Models
  {
    id: 'qwen/qwen3-32b',
    name: 'Qwen 3 32B',
    provider: 'Alibaba Cloud',
    description: 'Multilingual powerhouse with strong reasoning capabilities',
    icon: '🌐',
    available: true,
    premium: false,
    status: 'production',
    contextWindow: 32768,
    maxCompletionTokens: 16384,
    maxFileSize: '25MB',
    benchmarkStrengths: ['Multilingual tasks', 'Cross-cultural reasoning'],
    knownFor: ['multilingual', 'reasoning', 'creative', 'cultural-aware'],
    reliability: 'high',
    pricing: 0.27,
    speed: 'medium',
    quality: 'high',
    strengths: ['multilingual', 'reasoning', 'creative']
  }
];

// Intelligent model selection for Auto Mode
export const selectOptimalModels = (prompt: string, category: string, battleType: 'prompt' | 'response'): {
  selected: string[];
  rationale: string;
  deselected: Array<{modelId: string, reason: string}>;
} => {
  const availableModels = AVAILABLE_MODELS.filter(m => m.available);
  
  if (availableModels.length === 0) {
    throw new Error('No models available. Please check your API configuration.');
  }

  // SUPREME INTELLIGENT ANALYSIS - Analyze prompt characteristics with explicit logic
  const promptLower = prompt.toLowerCase();
  const promptLength = prompt.length;
  const wordCount = prompt.split(' ').length;
  
  const isCreative = promptLower.includes('creative') || promptLower.includes('story') || 
                    promptLower.includes('poem') || category === 'creative';
  const isTechnical = promptLower.includes('code') || promptLower.includes('technical') || 
                     promptLower.includes('programming') || category === 'technical';
  const isMath = promptLower.includes('math') || promptLower.includes('calculate') || 
                promptLower.includes('solve') || category === 'math';
  const isAnalysis = promptLower.includes('analyze') || promptLower.includes('compare') || 
                    promptLower.includes('research') || category === 'analysis';
  const isLongForm = promptLength > 500 || promptLower.includes('detailed') || 
                    promptLower.includes('comprehensive');
  const isSafety = promptLower.includes('safety') || promptLower.includes('harmful') || 
                  promptLower.includes('appropriate');
  const isScientific = promptLower.includes('scientific') || promptLower.includes('research') ||
                      promptLower.includes('academic') || promptLower.includes('study');
  const isCompliance = promptLower.includes('legal') || promptLower.includes('policy') ||
                      promptLower.includes('regulation') || promptLower.includes('compliance');

  // SUPREME SCORING - Explicit, justifiable model scoring
  const modelScores = availableModels.map(model => {
    let score = 5; // Base score
    let reasons: string[] = [];
    let exclusionReasons: string[] = [];
    
    // TECHNICAL/SCIENTIFIC PROMPTS - Prefer larger reasoning models
    if (isTechnical || isScientific || isMath) {
      if (model.id.includes('70b') || model.id.includes('120b')) {
        score += 5;
        reasons.push('Large parameter count for complex reasoning');
      }
      if (model.knownFor.includes('technical') || model.knownFor.includes('reasoning')) {
        score += 4;
        reasons.push('Specialized in technical/reasoning tasks');
      }
      if (model.id.includes('deepseek')) {
        score += 3;
        reasons.push('DeepSeek models excel at mathematical reasoning');
      }
    }
    
    // CREATIVE PROMPTS - Mix of creative and diverse models
    if (isCreative && model.knownFor.includes('creative')) {
      score += 5;
      reasons.push('Specialized creative capabilities');
      if (model.id.includes('8b') || model.id.includes('7b')) {
        score += 2;
        reasons.push('Smaller models often more creative/diverse');
      }
    }
    
    // SAFETY/COMPLIANCE - Prefer guard models and stable models
    if (isSafety || isCompliance) {
      if (model.id.includes('guard') || model.id.includes('llama-2')) {
        score += 6;
        reasons.push('Specialized safety/compliance model');
      }
      if (model.reliability === 'high' && model.status === 'production') {
        score += 3;
        reasons.push('High reliability for safety-critical tasks');
      }
    }
    
    // LONG-FORM CONTENT - Prefer high context window models
    if (isLongForm || wordCount > 100) {
      if (model.contextWindow > 100000) {
        score += 4;
        reasons.push('Large context window for long-form content');
      }
      if (model.knownFor.includes('long-context')) {
        score += 3;
        reasons.push('Optimized for long-context understanding');
      }
    }
    
    // DIVERSITY BONUS - Prefer different architectures/providers
    const providerBonus = {
      'Meta': 1,
      'OpenAI': 2, // Slightly prefer for diversity
      'DeepSeek/Meta': 2,
      'Moonshot AI': 3, // High diversity bonus
      'Alibaba Cloud': 3 // High diversity bonus
    };
    score += providerBonus[model.provider] || 0;
    if (providerBonus[model.provider] > 1) {
      reasons.push(`Provider diversity bonus (${model.provider})`);
    }
    
    // RELIABILITY AND STATUS ADJUSTMENTS
    if (model.reliability === 'high' && model.status === 'production') {
      score += 2;
      reasons.push('High reliability production model');
    } else if (model.reliability === 'experimental') {
      score -= 2;
      exclusionReasons.push('Experimental reliability may affect consistency');
    }
    
    // SPEED CONSIDERATIONS
    if (battleType === 'prompt' && model.speed === 'fast') {
      score += 1;
      reasons.push('Fast response time for iterative refinement');
    }
    
    // EXCLUDE SPECIALIZED MODELS FOR GENERAL TASKS
    if (!isSafety && !isCompliance && model.id.includes('guard')) {
      score -= 5;
      exclusionReasons.push('Guard model not suitable for general tasks');
    }
    
    // EXCLUDE VERY SMALL MODELS FOR COMPLEX TASKS
    if ((isTechnical || isScientific || isMath) && model.id.includes('22m')) {
      score -= 4;
      exclusionReasons.push('Too small for complex reasoning tasks');
    }
    
    return { 
      model, 
      score, 
      reasons: reasons.length > 0 ? reasons : ['General capabilities'],
      exclusionReasons
    };
  });
    
  // SUPREME SELECTION - Sort by score and ensure diversity
  const sortedModels = modelScores.sort((a, b) => b.score - a.score);
  const selected: Array<{modelId: string, reasons: string[], score: number}> = [];
  const deselected: Array<{modelId: string, reason: string}> = [];
  
  // INTELLIGENT SELECTION WITH DIVERSITY CONSTRAINTS
  for (const { model, score, reasons, exclusionReasons } of sortedModels) {
    if (selected.length >= 3) {
      deselected.push({
        modelId: model.id,
        reason: `Score: ${score.toFixed(1)}/10 - Not in top 3 selections`
      });
      continue;
    }
    
    // Check exclusion reasons
    if (exclusionReasons.length > 0) {
      deselected.push({
        modelId: model.id,
        reason: exclusionReasons[0]
      });
      continue;
    }

    // DIVERSITY CHECK - Ensure architectural diversity
    const sameProviderCount = selected.filter(s => {
      const selectedModel = AVAILABLE_MODELS.find(m => m.id === s.modelId);
      return selectedModel?.provider === model.provider;
    }).length;
    
    const sameArchitectureCount = selected.filter(s => {
      const selectedModel = AVAILABLE_MODELS.find(m => m.id === s.modelId);
      const selectedSize = selectedModel?.id.match(/(\d+)b/)?.[1];
      const currentSize = model.id.match(/(\d+)b/)?.[1];
      return selectedSize === currentSize;
    }).length;

    if (sameProviderCount >= 2 && selected.length < 3) {
      deselected.push({
        modelId: model.id,
        reason: `Provider diversity - already have ${sameProviderCount} ${model.provider} models`
      });
      continue;
    }
    
    if (sameArchitectureCount >= 2 && selected.length < 3) {
      deselected.push({
        modelId: model.id,
        reason: `Architecture diversity - need different model sizes`
      });
      continue;
    }
    
    selected.push({ modelId: model.id, reasons, score });
  }

  // BUILD DETAILED RATIONALE WITH FULL JUSTIFICATION
  const selectedModelNames = selected.map(s => {
    const model = AVAILABLE_MODELS.find(m => m.id === s.modelId);
    return model?.name || s.modelId;
  });

  let rationale = `INTELLIGENT MODEL SELECTION ANALYSIS:\n\n`;
  rationale += `PROMPT ANALYSIS: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"\n`;
  rationale += `- Category: ${category}\n`;
  rationale += `- Type: ${battleType} battle\n`;
  rationale += `- Length: ${wordCount} words, ${promptLength} characters\n`;
  rationale += `- Characteristics: `;
  
  const characteristics: string[] = [];
  if (isCreative) characteristics.push('Creative');
  if (isTechnical) characteristics.push('Technical');
  if (isMath) characteristics.push('Mathematical');
  if (isAnalysis) characteristics.push('Analytical');
  if (isLongForm) characteristics.push('Long-form');
  if (isSafety) characteristics.push('Safety-sensitive');
  if (isScientific) characteristics.push('Scientific');
  if (isCompliance) characteristics.push('Compliance-related');
  
  rationale += characteristics.length > 0 ? characteristics.join(', ') : 'General purpose';
  rationale += `\n\nSELECTED MODELS (${selected.length}/3):\n`;
  
  selected.forEach((s, index) => {
    const model = AVAILABLE_MODELS.find(m => m.id === s.modelId);
    rationale += `${index + 1}. ${model?.name} (Score: ${s.score.toFixed(1)}/10)\n`;
    rationale += `   Reasons: ${s.reasons.join(', ')}\n`;
  });
  
  if (deselected.length > 0) {
    rationale += `\nDESELECTED MODELS (${deselected.length}):\n`;
    deselected.slice(0, 5).forEach((d, index) => {
      const model = AVAILABLE_MODELS.find(m => m.id === d.modelId);
      rationale += `${index + 1}. ${model?.name}: ${d.reason}\n`;
    });
    if (deselected.length > 5) {
      rationale += `... and ${deselected.length - 5} others\n`;
    }
  }
  
  rationale += `\nSELECTION STRATEGY: Maximize architectural diversity, task-specific expertise, and reliability while ensuring competitive peer review dynamics.`;

  return {
    selected: selected.map(s => s.modelId),
    rationale,
    deselected
  };
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
    status: 'preview',
    contextWindow: 4096,
    maxCompletionTokens: 1024,
    maxFileSize: '10MB',
    benchmarkStrengths: ['Unknown'],
    knownFor: ['unknown'],
    reliability: 'experimental',
    pricing: 0.001,
    speed: 'medium',
    quality: 'medium',
    strengths: []
  };
};

export const getAutoSelectionReason = (prompt: string, category: string, selectedModels: string[]): string => {
  const result = selectOptimalModels(prompt, category, 'response');
  return result.rationale;
};