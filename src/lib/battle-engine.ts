// World-Class Battle Engine - Complete Implementation
// Following ChatGPT specifications for production-ready battle system

export interface BattleRequirements {
  task_type: 'reasoning' | 'planning' | 'writing' | 'creative' | 'technical' | 'analysis';
  audience_locale: string;
  constraints: {
    max_latency_ms: number;
    max_cost_usd: number;
    min_ctx_tokens: number;
  };
  required_tools: ('none' | 'web_search' | 'function_calling')[];
  output_format: 'markdown' | 'json' | 'table' | 'text';
}

export interface ModelCapabilities {
  id: string;
  ctx_tokens: number;
  avg_latency_ms: number;
  cost_per_1k_tokens: number;
  tool_use_support: boolean;
  json_mode_support: boolean;
  determinism_ok: boolean;
  diversity_key: string;
  elo_by_task: Record<string, number>;
  freshness_score: number;
}

export interface BattleCandidate {
  model: string;
  prompt: string;
  self_score: number;
  revised_prompt: string;
  weaknesses: string[];
  improvements: string[];
  probe_results: ProbeResult[];
  final_score: number;
  referee_notes: string;
}

export interface ProbeResult {
  probe_type: string;
  probe_content: string;
  passed: boolean;
  notes: string;
}

export interface BattleResult {
  mode: 'SYSTEM_PROMPT_BATTLE' | 'RESPONSE_PROMPT_BATTLE';
  requirements: BattleRequirements;
  candidates: BattleCandidate[];
  winner: BattleCandidate;
  total_cost: number;
  total_latency: number;
  convergence_achieved: boolean;
  rematch_count: number;
}

// Phase 0: Normalize the brief
export const normalizeBrief = (prompt: string, category: string, battleType: 'prompt' | 'response'): BattleRequirements => {
  const promptLower = prompt.toLowerCase();
  
  // Determine task type from prompt analysis
  let task_type: BattleRequirements['task_type'] = 'reasoning';
  if (promptLower.includes('write') || promptLower.includes('story') || promptLower.includes('creative')) {
    task_type = 'creative';
  } else if (promptLower.includes('plan') || promptLower.includes('strategy') || promptLower.includes('organize')) {
    task_type = 'planning';
  } else if (promptLower.includes('code') || promptLower.includes('technical') || promptLower.includes('programming')) {
    task_type = 'technical';
  } else if (promptLower.includes('analyze') || promptLower.includes('compare') || promptLower.includes('research')) {
    task_type = 'analysis';
  } else if (promptLower.includes('write') || promptLower.includes('explain') || promptLower.includes('describe')) {
    task_type = 'writing';
  }

  // Determine output format
  let output_format: BattleRequirements['output_format'] = 'text';
  if (promptLower.includes('json') || promptLower.includes('structured')) {
    output_format = 'json';
  } else if (promptLower.includes('table') || promptLower.includes('chart')) {
    output_format = 'table';
  } else if (promptLower.includes('markdown') || promptLower.includes('formatted')) {
    output_format = 'markdown';
  }

  // Determine required tools
  const required_tools: BattleRequirements['required_tools'] = ['none'];
  if (promptLower.includes('search') || promptLower.includes('research') || promptLower.includes('current')) {
    required_tools.push('web_search');
  }
  if (promptLower.includes('function') || promptLower.includes('api') || promptLower.includes('tool')) {
    required_tools.push('function_calling');
  }

  return {
    task_type,
    audience_locale: 'India / EN',
    constraints: {
      max_latency_ms: 6000,
      max_cost_usd: 0.05,
      min_ctx_tokens: 128000
    },
    required_tools,
    output_format
  };
};

// Phase 1: Candidate generation with temperature sweep
export const generateCandidates = async (
  models: string[],
  mode: 'SYSTEM_PROMPT_BATTLE' | 'RESPONSE_PROMPT_BATTLE',
  requirements: BattleRequirements,
  originalPrompt: string
): Promise<Array<{model: string, prompt: string, self_score: number}>> => {
  const { callGroqAPI } = await import('./groq');
  const candidates: Array<{model: string, prompt: string, self_score: number}> = [];

  for (const modelId of models) {
    try {
      console.log(`🎯 Phase 1: ${modelId} generating ${mode} candidate`);

      const generationPrompt = mode === 'SYSTEM_PROMPT_BATTLE' 
        ? buildSystemPromptGenerationPrompt(originalPrompt, requirements)
        : buildResponsePromptGenerationPrompt(originalPrompt, requirements);

      // Temperature sweep: precision (0.2) and creativity (0.7)
      const precisionResult = await callGroqAPI(modelId, generationPrompt, 800, 0.2);
      const creativityResult = await callGroqAPI(modelId, generationPrompt, 800, 0.7);

      // Self-select best candidate
      const selfSelectPrompt = `Compare these two ${mode.toLowerCase()} candidates and choose the better one. Rate each 1-10 and explain why.

CANDIDATE A (Precision): "${precisionResult.response}"
CANDIDATE B (Creativity): "${creativityResult.response}"

Respond with: WINNER: A|B, SCORE: X/10, REASON: brief explanation`;

      const selectionResult = await callGroqAPI(modelId, selfSelectPrompt, 200, 0.1);
      const isWinnerA = selectionResult.response.includes('WINNER: A');
      const scoreMatch = selectionResult.response.match(/SCORE:\s*(\d+(?:\.\d+)?)/);
      const selfScore = scoreMatch ? parseFloat(scoreMatch[1]) : 7.0;

      const selectedPrompt = isWinnerA ? precisionResult.response : creativityResult.response;

      candidates.push({
        model: modelId,
        prompt: selectedPrompt.trim(),
        self_score: selfScore
      });

      console.log(`✅ ${modelId} generated candidate (self-score: ${selfScore}/10)`);
    } catch (error) {
      console.error(`❌ ${modelId} failed in Phase 1:`, error);
    }
  }

  return candidates;
};

// Phase 2: Self-critique and revision
export const selfCritiqueAndRevise = async (
  candidates: Array<{model: string, prompt: string, self_score: number}>
): Promise<BattleCandidate[]> => {
  const { callGroqAPI } = await import('./groq');
  const revisedCandidates: BattleCandidate[] = [];

  for (const candidate of candidates) {
    try {
      console.log(`🔍 Phase 2: ${candidate.model} self-critiquing`);

      const critiquePrompt = `You are a professional prompt engineer. Critique this prompt using the referee checklist:

PROMPT TO CRITIQUE: "${candidate.prompt}"

Rate and improve using these criteria:
1. CLARITY - Is the goal crystal clear?
2. STRUCTURE - Well-organized with proper constraints?
3. CONTEXT_FIT - Appropriate for audience and use case?
4. USEFULNESS - Will it produce actionable output?
5. BREVITY - Concise without losing essential information?
6. SELF_REFINE - Includes iteration/feedback mechanisms?
7. SAFETY - Has appropriate guardrails?

Respond in this format:
WEAKNESSES: [list 2-3 main weaknesses]
IMPROVEMENTS: [list 2-3 specific improvements]
REVISED_PROMPT: [your improved version]`;

      const critiqueResult = await callGroqAPI(candidate.model, critiquePrompt, 1000, 0.3);
      
      // Parse critique response
      const weaknessesMatch = critiqueResult.response.match(/WEAKNESSES:\s*(.*?)(?=IMPROVEMENTS:|$)/s);
      const improvementsMatch = critiqueResult.response.match(/IMPROVEMENTS:\s*(.*?)(?=REVISED_PROMPT:|$)/s);
      const revisedMatch = critiqueResult.response.match(/REVISED_PROMPT:\s*(.*?)$/s);

      const weaknesses = weaknessesMatch 
        ? weaknessesMatch[1].trim().split(/[,\n\-•]/).map(w => w.trim()).filter(w => w.length > 3)
        : ['General improvements needed'];

      const improvements = improvementsMatch
        ? improvementsMatch[1].trim().split(/[,\n\-•]/).map(i => i.trim()).filter(i => i.length > 3)
        : ['Enhanced clarity and structure'];

      const revisedPrompt = revisedMatch 
        ? revisedMatch[1].trim().replace(/^["']|["']$/g, '')
        : candidate.prompt;

      revisedCandidates.push({
        model: candidate.model,
        prompt: candidate.prompt,
        self_score: candidate.self_score,
        revised_prompt: revisedPrompt,
        weaknesses,
        improvements,
        probe_results: [],
        final_score: 0,
        referee_notes: ''
      });

      console.log(`✅ ${candidate.model} self-critique complete`);
    } catch (error) {
      console.error(`❌ ${candidate.model} failed in Phase 2:`, error);
      
      // Fallback: use original prompt
      revisedCandidates.push({
        model: candidate.model,
        prompt: candidate.prompt,
        self_score: candidate.self_score,
        revised_prompt: candidate.prompt,
        weaknesses: ['Self-critique unavailable'],
        improvements: ['Manual review recommended'],
        probe_results: [],
        final_score: 0,
        referee_notes: ''
      });
    }
  }

  return revisedCandidates;
};

// Phase 3: Adversarial probes
export const runAdversarialProbes = async (
  candidates: BattleCandidate[],
  requirements: BattleRequirements
): Promise<BattleCandidate[]> => {
  const { callGroqAPI } = await import('./groq');
  
  // Generate probes based on requirements
  const probes = generateProbes(requirements);

  for (const candidate of candidates) {
    try {
      console.log(`🧪 Phase 3: Testing ${candidate.model} against adversarial probes`);

      for (const probe of probes) {
        const probePrompt = `Test this prompt against an edge case:

PROMPT TO TEST: "${candidate.revised_prompt}"
EDGE CASE: ${probe.content}

Does the prompt handle this edge case appropriately? 
Respond with: PASS|FAIL and brief explanation.`;

        const probeResult = await callGroqAPI(candidate.model, probePrompt, 200, 0.1);
        const passed = probeResult.response.toUpperCase().includes('PASS');

        candidate.probe_results.push({
          probe_type: probe.type,
          probe_content: probe.content,
          passed,
          notes: probeResult.response
        });
      }

      console.log(`✅ ${candidate.model} probe testing complete`);
    } catch (error) {
      console.error(`❌ ${candidate.model} failed in Phase 3:`, error);
    }
  }

  return candidates;
};

// Phase 4: Referee scoring
export const refereeScoring = async (
  candidates: BattleCandidate[],
  mode: 'SYSTEM_PROMPT_BATTLE' | 'RESPONSE_PROMPT_BATTLE',
  requirements: BattleRequirements
): Promise<BattleCandidate[]> => {
  const { callGroqAPI } = await import('./groq');
  
  // Use a neutral referee model (different from contestants)
  const refereeModel = 'llama-3.1-8b-instant'; // Fast, neutral referee

  for (const candidate of candidates) {
    try {
      console.log(`⚖️ Phase 4: Referee scoring ${candidate.model}`);

      const scoringPrompt = buildRefereeScoringPrompt(candidate.revised_prompt, mode, requirements);
      const scoringResult = await callGroqAPI(refereeModel, scoringPrompt, 600, 0.2);

      // Parse referee scores with robust parsing
      const scores = parseRefereeScores(scoringResult.response);
      
      // Apply mode-specific weights
      const weights = mode === 'SYSTEM_PROMPT_BATTLE' 
        ? { clarity: 2, structure: 2.5, context_fit: 2, usefulness: 2, brevity: 1, self_refine: 1, safety: 1.5 }
        : { clarity: 2, structure: 2, context_fit: 2, usefulness: 2.5, brevity: 1.5, self_refine: 1, safety: 1 };

      // Calculate weighted final score
      const weightedScore = (
        scores.clarity * weights.clarity +
        scores.structure * weights.structure +
        scores.context_fit * weights.context_fit +
        scores.usefulness * weights.usefulness +
        scores.brevity * weights.brevity +
        scores.self_refine * weights.self_refine +
        scores.safety * weights.safety
      ) / Object.values(weights).reduce((a, b) => a + b, 0);

      // Apply probe penalties
      const probePassRate = candidate.probe_results.length > 0 
        ? candidate.probe_results.filter(p => p.passed).length / candidate.probe_results.length
        : 1.0;
      
      const finalScore = Math.max(0, weightedScore * probePassRate);

      candidate.final_score = Math.round(finalScore * 100) / 100;
      candidate.referee_notes = extractRefereeNotes(scoringResult.response);

      console.log(`✅ ${candidate.model} referee score: ${candidate.final_score}/10`);
    } catch (error) {
      console.error(`❌ ${candidate.model} failed in Phase 4:`, error);
      candidate.final_score = 5.0; // Fallback score
      candidate.referee_notes = 'Scoring failed - manual review needed';
    }
  }

  return candidates;
};

// Phase 5: Winner selection with tie-breakers
export const selectWinner = (candidates: BattleCandidate[]): BattleCandidate => {
  if (candidates.length === 0) {
    throw new Error('No candidates available for winner selection');
  }

  // Sort by final score, then apply tie-breakers
  const sorted = candidates.sort((a, b) => {
    // Primary: final score
    if (Math.abs(a.final_score - b.final_score) > 0.1) {
      return b.final_score - a.final_score;
    }

    // Tie-breaker 1: usefulness (from self-score)
    if (Math.abs(a.self_score - b.self_score) > 0.1) {
      return b.self_score - a.self_score;
    }

    // Tie-breaker 2: probe pass rate
    const aProbeRate = a.probe_results.length > 0 
      ? a.probe_results.filter(p => p.passed).length / a.probe_results.length 
      : 0;
    const bProbeRate = b.probe_results.length > 0 
      ? b.probe_results.filter(p => p.passed).length / b.probe_results.length 
      : 0;

    return bProbeRate - aProbeRate;
  });

  return sorted[0];
};

// Phase 6: Convergence check and rematch
export const checkConvergence = async (
  winner: BattleCandidate,
  mode: 'SYSTEM_PROMPT_BATTLE' | 'RESPONSE_PROMPT_BATTLE',
  requirements: BattleRequirements,
  budgetRemaining: number
): Promise<{ needsRematch: boolean, challenger?: string }> => {
  if (winner.final_score >= 9.0) {
    console.log(`🎯 Convergence achieved: ${winner.final_score}/10`);
    return { needsRematch: false };
  }

  if (budgetRemaining < 0.01) {
    console.log(`💰 Budget exhausted, stopping at ${winner.final_score}/10`);
    return { needsRematch: false };
  }

  // Select challenger using bandit algorithm
  const challenger = selectBanditChallenger(requirements);
  if (!challenger) {
    return { needsRematch: false };
  }

  console.log(`🔄 Convergence not achieved (${winner.final_score}/10), scheduling rematch vs ${challenger}`);
  return { needsRematch: true, challenger };
};

// Model selection with Groq-aware filtering and diversity
export const selectModelsForBattle = (
  requirements: BattleRequirements,
  availableModels: ModelCapabilities[]
): string[] => {
  console.log('🎯 Selecting models with Groq-aware filtering');

  // Phase 1: Filter by hard requirements
  const filtered = availableModels.filter(model => {
    const meetsContext = model.ctx_tokens >= requirements.constraints.min_ctx_tokens;
    const meetsLatency = model.avg_latency_ms <= requirements.constraints.max_latency_ms;
    const meetsCost = model.cost_per_1k_tokens <= requirements.constraints.max_cost_usd;
    const meetsTools = !requirements.required_tools.includes('function_calling') || model.tool_use_support;
    const meetsFormat = requirements.output_format !== 'json' || model.json_mode_support;

    return meetsContext && meetsLatency && meetsCost && meetsTools && meetsFormat;
  });

  if (filtered.length < 2) {
    console.warn('⚠️ Insufficient models after filtering, relaxing constraints');
    // Fallback to basic models
    return ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'].slice(0, Math.min(2, availableModels.length));
  }

  // Phase 2: Enforce diversity (max one per diversity_key)
  const diversityGroups: Record<string, ModelCapabilities[]> = {};
  filtered.forEach(model => {
    if (!diversityGroups[model.diversity_key]) {
      diversityGroups[model.diversity_key] = [];
    }
    diversityGroups[model.diversity_key].push(model);
  });

  const diverseModels: ModelCapabilities[] = [];
  Object.values(diversityGroups).forEach(group => {
    // Pick best from each group
    const best = group.sort((a, b) => {
      const aElo = a.elo_by_task[requirements.task_type] || 1500;
      const bElo = b.elo_by_task[requirements.task_type] || 1500;
      return bElo - aElo;
    })[0];
    diverseModels.push(best);
  });

  // Phase 3: Seed scoring
  const seeded = diverseModels.map(model => {
    const elo = model.elo_by_task[requirements.task_type] || 1500;
    const normalizedCost = model.cost_per_1k_tokens / 0.001; // Normalize to typical cost
    const normalizedLatency = model.avg_latency_ms / 2000; // Normalize to typical latency
    
    const seed = elo - (0.5 * normalizedCost) - (0.5 * normalizedLatency) + (0.2 * model.freshness_score);
    
    return { ...model, seed };
  });

  // Phase 4: Select top 2 + 1 bandit
  const ranked = seeded.sort((a, b) => b.seed - a.seed);
  const fighters = ranked.slice(0, 2);

  // Add bandit pick (exploration)
  const banditPool = ranked.slice(2);
  if (banditPool.length > 0 && Math.random() < 0.15) {
    const bandit = banditPool[Math.floor(Math.random() * banditPool.length)];
    fighters.push(bandit);
  }

  const selectedIds = fighters.map(f => f.id).slice(0, 3);
  console.log(`🎯 Selected models: ${selectedIds.join(', ')}`);
  
  return selectedIds;
};

// Helper functions
const buildSystemPromptGenerationPrompt = (originalPrompt: string, requirements: BattleRequirements): string => {
  return `Create a world-class SYSTEM PROMPT that will help an AI assistant excel at this task:

TASK: "${originalPrompt}"
REQUIREMENTS: ${JSON.stringify(requirements, null, 2)}

Your system prompt must include:
1. Clear role definition and expertise
2. Output format constraints (${requirements.output_format})
3. Audience considerations (${requirements.audience_locale})
4. Unknown data handling ("If information is missing, ask for clarification")
5. Iteration clause ("Ask for feedback and refine if needed")
6. Safety guardrails

Create a production-ready system prompt that will maximize task success:`;
};

const buildResponsePromptGenerationPrompt = (originalPrompt: string, requirements: BattleRequirements): string => {
  return `Improve this USER PROMPT to be maximally effective:

ORIGINAL: "${originalPrompt}"
REQUIREMENTS: ${JSON.stringify(requirements, null, 2)}

Your improved prompt must:
1. Be crystal clear about the desired output
2. Include specific format requirements (${requirements.output_format})
3. Provide context for ${requirements.audience_locale}
4. Handle edge cases and missing information
5. Include examples if helpful
6. Be concise but complete

Create an optimized user prompt:`;
};

const buildRefereeScoringPrompt = (prompt: string, mode: string, requirements: BattleRequirements): string => {
  return `You are a professional prompt evaluation judge. Score this ${mode.toLowerCase()} on each criterion (1-10):

PROMPT: "${prompt}"
MODE: ${mode}
REQUIREMENTS: ${JSON.stringify(requirements, null, 2)}

Score each criterion (1-10):
CLARITY: How clear and unambiguous is the goal?
STRUCTURE: How well-organized with proper constraints?
CONTEXT_FIT: How appropriate for audience and use case?
USEFULNESS: How likely to produce actionable output?
BREVITY: How concise without losing essential info?
SELF_REFINE: Does it include iteration/feedback mechanisms?
SAFETY: Does it have appropriate guardrails?

Format your response as:
CLARITY: X
STRUCTURE: X
CONTEXT_FIT: X
USEFULNESS: X
BREVITY: X
SELF_REFINE: X
SAFETY: X
NOTES: Brief explanation of your assessment`;
};

const parseRefereeScores = (response: string): Record<string, number> => {
  const scores = {
    clarity: 7.0,
    structure: 7.0,
    context_fit: 7.0,
    usefulness: 7.0,
    brevity: 7.0,
    self_refine: 7.0,
    safety: 7.0
  };

  // Multiple parsing strategies
  const patterns = {
    clarity: /CLARITY[:\s]+(\d+(?:\.\d+)?)/i,
    structure: /STRUCTURE[:\s]+(\d+(?:\.\d+)?)/i,
    context_fit: /CONTEXT[_\s]*FIT[:\s]+(\d+(?:\.\d+)?)/i,
    usefulness: /USEFULNESS[:\s]+(\d+(?:\.\d+)?)/i,
    brevity: /BREVITY[:\s]+(\d+(?:\.\d+)?)/i,
    self_refine: /SELF[_\s]*REFINE[:\s]+(\d+(?:\.\d+)?)/i,
    safety: /SAFETY[:\s]+(\d+(?:\.\d+)?)/i
  };

  let foundCount = 0;
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = response.match(pattern);
    if (match) {
      const score = parseFloat(match[1]);
      if (score >= 1 && score <= 10) {
        scores[key as keyof typeof scores] = score;
        foundCount++;
      }
    }
  }

  console.log(`📊 Parsed ${foundCount}/7 referee scores`);
  return scores;
};

const extractRefereeNotes = (response: string): string => {
  const notesMatch = response.match(/NOTES[:\s]+(.*?)$/is);
  return notesMatch ? notesMatch[1].trim() : 'Standard evaluation completed';
};

const generateProbes = (requirements: BattleRequirements): Array<{type: string, content: string}> => {
  const probes = [
    {
      type: 'ambiguous_terms',
      content: 'What if the input contains ambiguous or undefined terms?'
    },
    {
      type: 'locale_constraints',
      content: `How does this handle ${requirements.audience_locale} specific context and cultural nuances?`
    },
    {
      type: 'format_compliance',
      content: `Will this enforce strict ${requirements.output_format} format compliance?`
    }
  ];

  if (requirements.required_tools.includes('web_search')) {
    probes.push({
      type: 'data_availability',
      content: 'What if required information is not available through search?'
    });
  }

  return probes;
};

const selectBanditChallenger = (requirements: BattleRequirements): string | null => {
  // Simple bandit selection - in production this would use Thompson sampling
  const { AVAILABLE_MODELS } = require('./models');
  const available = AVAILABLE_MODELS.filter((m: any) => m.available);
  
  if (available.length === 0) return null;
  
  return available[Math.floor(Math.random() * available.length)].id;
};

// Main battle execution function
export const runWorldClassBattle = async (
  mode: 'SYSTEM_PROMPT_BATTLE' | 'RESPONSE_PROMPT_BATTLE',
  originalPrompt: string,
  category: string,
  selectedModels: string[]
): Promise<BattleResult> => {
  console.log(`🚀 Starting ${mode} with world-class engine`);

  // Phase 0: Normalize brief
  const requirements = normalizeBrief(originalPrompt, category, mode === 'SYSTEM_PROMPT_BATTLE' ? 'prompt' : 'response');
  console.log('📋 Requirements normalized:', requirements);

  let totalCost = 0;
  let totalLatency = 0;
  let rematchCount = 0;
  const maxRematches = 2;

  // Main battle loop
  while (rematchCount <= maxRematches) {
    console.log(`🔄 Battle iteration ${rematchCount + 1}`);

    // Phase 1: Generate candidates
    const rawCandidates = await generateCandidates(selectedModels, mode, requirements, originalPrompt);
    
    // Phase 2: Self-critique and revise
    const critiquedCandidates = await selfCritiqueAndRevise(rawCandidates);
    
    // Phase 3: Adversarial probes
    const probeTestedCandidates = await runAdversarialProbes(critiquedCandidates, requirements);
    
    // Phase 4: Referee scoring
    const scoredCandidates = await refereeScoring(probeTestedCandidates, mode, requirements);
    
    // Phase 5: Select winner
    const winner = selectWinner(scoredCandidates);
    
    console.log(`🏆 Current winner: ${winner.model} with ${winner.final_score}/10`);

    // Phase 6: Check convergence
    const convergenceCheck = await checkConvergence(winner, mode, requirements, 0.05 - totalCost);
    
    if (!convergenceCheck.needsRematch || rematchCount >= maxRematches) {
      return {
        mode,
        requirements,
        candidates: scoredCandidates,
        winner,
        total_cost: totalCost,
        total_latency: totalLatency,
        convergence_achieved: winner.final_score >= 9.0,
        rematch_count: rematchCount
      };
    }

    // Prepare for rematch
    if (convergenceCheck.challenger) {
      selectedModels = [winner.model, convergenceCheck.challenger];
      rematchCount++;
      console.log(`🔄 Rematch ${rematchCount}: ${winner.model} vs ${convergenceCheck.challenger}`);
    } else {
      break;
    }
  }

  // Fallback return
  const finalCandidates = await refereeScoring(
    await runAdversarialProbes(
      await selfCritiqueAndRevise(
        await generateCandidates(selectedModels, mode, requirements, originalPrompt)
      ),
      requirements
    ),
    mode,
    requirements
  );

  return {
    mode,
    requirements,
    candidates: finalCandidates,
    winner: selectWinner(finalCandidates),
    total_cost: totalCost,
    total_latency: totalLatency,
    convergence_achieved: false,
    rematch_count: rematchCount
  };
};