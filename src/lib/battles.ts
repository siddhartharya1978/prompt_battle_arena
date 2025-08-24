import { callGroqAPI } from './groq';
import { Battle, BattleData, BattleResponse, BattleScore, PromptEvolution } from '../types';
import { AVAILABLE_MODELS, getModelInfo, selectOptimalModels, getAutoSelectionReason } from './models';

// REAL 10/10 PROMPT OPTIMIZATION ENGINE - NO MOCKS, NO SHORTCUTS
export const createBattle = async (battleData: BattleData): Promise<Battle> => {
  console.log('🚀 STARTING REAL 10/10 OPTIMIZATION BATTLE:', battleData);
  
  if (!battleData.prompt?.trim()) {
    throw new Error('Prompt is required');
  }
  
  if (!battleData.models || battleData.models.length < 2) {
    throw new Error('At least 2 models are required');
  }

  const battleId = `battle_${Date.now()}`;
  let totalCost = 0;
  const responses: BattleResponse[] = [];
  const promptEvolution: PromptEvolution[] = [];
  
  try {
    if (battleData.battle_type === 'prompt') {
      // REAL PROMPT OPTIMIZATION LOOP - CONTINUES UNTIL 10/10 ACHIEVED
      console.log('🔄 STARTING REAL 10/10 PROMPT OPTIMIZATION ENGINE');
      
      let currentPrompt = battleData.prompt;
      let bestScore = 0;
      let bestPrompt = currentPrompt;
      let bestModelId = '';
      let round = 1;
      const maxRounds = 50; // Increased safety limit - we want to reach 10/10
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 5; // Allow more attempts before giving up
      
      // Add initial prompt to evolution with baseline score
      const initialScore = await scorePromptQuality(currentPrompt, battleData.prompt_category, '');
      totalCost += 0.01; // Estimate for scoring call
      
      promptEvolution.push({
        id: `evolution_${Date.now()}_0`,
        battleId,
        round: 1,
        prompt: currentPrompt,
        modelId: 'initial',
        improvements: ['Original prompt'],
        score: initialScore.overall,
        createdAt: new Date().toISOString()
      });
      
      bestScore = initialScore.overall;
      console.log(`📊 INITIAL PROMPT SCORE: ${bestScore}/10`);

      // CORE OPTIMIZATION LOOP - CONTINUES UNTIL 10/10 OR NO FURTHER IMPROVEMENT POSSIBLE
      while (bestScore < 9.9 && round <= maxRounds && consecutiveFailures < maxConsecutiveFailures) {
        console.log(`🔄 OPTIMIZATION ROUND ${round} - Current Best: ${bestScore}/10`);
        
        let roundImproved = false;
        const roundResults: Array<{modelId: string, prompt: string, score: number, improvements: string[]}> = [];
        
        // Each model attempts to improve the current best prompt
        for (const modelId of battleData.models) {
          try {
            console.log(`🤖 ${modelId} attempting to improve prompt (current best: ${bestScore}/10)...`);
            
            // Create competitive refinement prompt
            const refinementPrompt = `You are an expert prompt engineer in a competitive optimization challenge. Your goal is to improve the following prompt to achieve a perfect 10/10 score.

CURRENT PROMPT TO IMPROVE: "${currentPrompt}"
CURRENT SCORE: ${bestScore}/10
CATEGORY: ${battleData.prompt_category}

Your task is to create a significantly improved version that:
1. Is more specific, clear, and actionable than the current version
2. Includes better context, examples, or constraints where helpful
3. Uses more effective phrasing and structure
4. Addresses any weaknesses in the current prompt
5. Aims for a perfect 10/10 score in clarity, specificity, structure, and effectiveness

            totalCost += result.cost;
            
            const refinedPrompt = result.response.trim();
            
            // Check if model claims it cannot improve
            if (refinedPrompt.startsWith('CANNOT_IMPROVE')) {
              console.log('[ERROR] ' + modelId + ' cannot improve further: ' + refinedPrompt);
              continue;
            }
            
            // Score the refined prompt
            const score = await scorePromptQuality(refinedPrompt, battleData.prompt_category, currentPrompt);
            totalCost += 0.01; // Estimate for scoring call
            
            console.log(`📊 ${modelId} refined prompt score: ${score.overall}/10`);
            
            // Generate improvements list
            const improvements = await generateImprovementsList(currentPrompt, refinedPrompt);
            
            roundResults.push({
              modelId,
              prompt: refinedPrompt,
              score: score.overall,
              improvements
            });
            
            // Add to evolution
            promptEvolution.push({
              id: `evolution_${Date.now()}_${round}_${modelId}`,
              battleId,
              round: round + 1,
              prompt: refinedPrompt,
              modelId,
              improvements,
              score: score.overall,
              createdAt: new Date().toISOString()
            });
            
            // Check if this is the new best
            if (score.overall > bestScore) {
              bestScore = score.overall;
              bestPrompt = refinedPrompt;
              bestModelId = modelId;
              roundImproved = true;
              console.log(`🏆 NEW BEST PROMPT: ${bestScore}/10 by ${modelId}`);
              
              // If we achieved 10/10, we're done!
              if (score.overall >= 9.9) {
                console.log(`🎯 PERFECT 10/10 PROMPT ACHIEVED by ${modelId}!`);
                break;
              }
            }
            
          } catch (error) {
            console.error(`❌ Error with model ${modelId} in round ${round}:`, error);
            // Continue with other models
          }
        }
        
        // Check if we achieved 10/10
        if (bestScore >= 9.9) {
          console.log(`🎉 OPTIMIZATION COMPLETE: Perfect 10/10 prompt achieved in ${round} rounds!`);
          break;
        }
        
        // Check if any model improved this round
        if (!roundImproved) {
          consecutiveFailures++;
          console.log(`⚠️ No improvement in round ${round}. Consecutive failures: ${consecutiveFailures}/${maxConsecutiveFailures}`);
        } else {
          consecutiveFailures = 0; // Reset failure counter
          currentPrompt = bestPrompt; // Use the best prompt for next round
        }
        
        round++;
      }
      
      // Final status logging
      if (bestScore >= 9.9) {
        console.log(`🎉 SUCCESS: Perfect 10/10 prompt achieved by ${bestModelId} in ${round - 1} rounds!`);
      } else if (consecutiveFailures >= maxConsecutiveFailures) {
        console.log(`⚠️ OPTIMIZATION PLATEAU: No model could improve further after ${consecutiveFailures} attempts. Best score: ${bestScore}/10`);
      } else if (round > maxRounds) {
        console.log(`⚠️ MAX ROUNDS REACHED: Stopped after ${maxRounds} rounds. Best score: ${bestScore}/10`);
      }
      
      // Create final battle object for prompt battle
      const battle: Battle = {
        id: battleId,
        userId: 'current-user-id',
        battleType: 'prompt',
        prompt: battleData.prompt,
        finalPrompt: bestPrompt,
        promptCategory: battleData.prompt_category,
        models: battleData.models,
        mode: battleData.mode,
        battleMode: battleData.battle_mode,
        rounds: round - 1,
        maxTokens: battleData.max_tokens,
        temperature: battleData.temperature,
        status: 'completed',
        winner: bestModelId,
        totalCost,
        autoSelectionReason: battleData.auto_selection_reason,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: [], // Prompt battles don't have responses
        scores: generatePromptScores(promptEvolution, battleData.models),
        promptEvolution
      };
      
      // Store battle in localStorage for demo
      storeBattleInCache(battle);
      
      return battle;
      
    } else {
      // RESPONSE BATTLE: Real competitive response generation
      console.log('🔄 EXECUTING REAL RESPONSE GENERATION BATTLE');
      
      for (const modelId of battleData.models) {
        try {
          console.log(`🤖 Calling model: ${modelId}`);
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
          
          console.log(`✅ Model ${modelId} responded (${result.tokens} tokens, $${result.cost})`);
          
        } catch (error) {
          console.error(`❌ Error with model ${modelId}:`, error);
          throw new Error(`Failed to get response from ${modelId}: ${error.message}`);
        }
      }
      
      if (responses.length === 0) {
        throw new Error('No models were able to generate responses. Please check your API configuration.');
      }
      
      // Generate competitive scores using AI
      const scores = await generateCompetitiveScores(responses, battleData.prompt, battleData.prompt_category);
      
      // Determine winner based on overall scores
      const winner = Object.entries(scores).reduce((best, [modelId, score]) => {
        return !best || score.overall > scores[best].overall ? modelId : best;
      }, '');
      
      console.log(`🏆 WINNER: ${winner} with score ${scores[winner]?.overall}/10`);
      
      const battle: Battle = {
        id: battleId,
        userId: 'current-user-id',
        battleType: 'response',
        prompt: battleData.prompt,
        finalPrompt: null,
        promptCategory: battleData.prompt_category,
        models: battleData.models,
        mode: battleData.mode,
        battleMode: battleData.battle_mode,
        rounds: 1,
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
      
      // Store battle in localStorage for demo
      storeBattleInCache(battle);
      
      return battle;
    }
    
  } catch (error) {
    console.error('❌ BATTLE EXECUTION FAILED:', error);
    throw error;
  }
};

// Real AI-powered prompt quality scoring
const scorePromptQuality = async (prompt: string, category: string, originalPrompt: string): Promise<BattleScore> => {
  try {
    const scoringPrompt = `You are an expert prompt evaluator. Score this prompt on a scale of 1-10 for each category. Be strict - only award 10/10 for truly perfect prompts that cannot be improved.

Prompt to evaluate: "${prompt}"
${originalPrompt ? `Original prompt: "${originalPrompt}"` : ''}
Category: ${category}

Rate the prompt on:
1. CLARITY (1-10): How clear and unambiguous is the prompt? 10/10 means crystal clear with no possible confusion.
2. SPECIFICITY (1-10): How specific and detailed are the instructions? 10/10 means perfectly specific with all necessary details.
3. STRUCTURE (1-10): How well-structured and organized is the prompt? 10/10 means perfect logical flow and organization.
4. EFFECTIVENESS (1-10): How likely is this prompt to produce high-quality responses? 10/10 means guaranteed excellent results.

STRUCTURE: [score]
EFFECTIVENESS: [score]
NOTES: [brief explanation of the scores and any areas for improvement]`;

    const result = await callGroqAPI('llama-3.3-70b-versatile', scoringPrompt, 200, 0.1);
    
    // Parse the response
    const lines = result.response.split('\n');
    let clarity = 6, specificity = 6, structure = 6, effectiveness = 6;
    let notes = 'AI-generated scoring';
    
    for (const line of lines) {
      if (line.includes('CLARITY:')) {
        clarity = parseFloat(line.split(':')[1].trim()) || 6;
      } else if (line.includes('SPECIFICITY:')) {
        specificity = parseFloat(line.split(':')[1].trim()) || 6;
      } else if (line.includes('STRUCTURE:')) {
        structure = parseFloat(line.split(':')[1].trim()) || 6;
      } else if (line.includes('EFFECTIVENESS:')) {
        effectiveness = parseFloat(line.split(':')[1].trim()) || 6;
      } else if (line.includes('NOTES:')) {
        notes = line.split(':')[1].trim() || notes;
      }
    }
    
    const overall = (clarity + specificity + structure + effectiveness) / 4;
    
    return {
      accuracy: clarity,
      reasoning: specificity,
      structure: structure,
      creativity: effectiveness,
      overall: Math.round(overall * 10) / 10,
      notes
    };
  } catch (error) {
    console.error('Error scoring prompt quality:', error);
    // Fallback to basic scoring if AI scoring fails
    return {
      accuracy: 6,
      reasoning: 6,
      structure: 6,
      creativity: 6,
      overall: 6,
      notes: 'Fallback scoring due to API error'
    };
  }
};

// Generate improvements list using AI analysis
const generateImprovementsList = async (originalPrompt: string, refinedPrompt: string): Promise<string[]> => {
  try {
    const analysisPrompt = `Compare these two prompts and identify the specific improvements made in the refined version.

Original: "${originalPrompt}"
Refined: "${refinedPrompt}"

List the specific improvements made (e.g., "Added specific examples", "Improved clarity", "Better structure", etc.). 
Respond with a comma-separated list of improvements, maximum 5 items.`;

    const result = await callGroqAPI('llama-3.1-8b-instant', analysisPrompt, 100, 0.1);
    
    const improvements = result.response
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, 5);
    
    return improvements.length > 0 ? improvements : ['General refinement'];
  } catch (error) {
    console.error('Error generating improvements list:', error);
    return ['General refinement'];
  }
};

// Generate competitive scores for response battles using AI
const generateCompetitiveScores = async (responses: BattleResponse[], prompt: string, category: string): Promise<Record<string, BattleScore>> => {
  const scores: Record<string, BattleScore> = {};
  
  for (const response of responses) {
    try {
      const model = getModelInfo(response.modelId);
      
      const scoringPrompt = `You are an expert AI response evaluator. Score this response on a scale of 1-10 for each category:

Original prompt: "${prompt}"
Category: ${category}
Response to evaluate: "${response.response}"
Model: ${model.name}

Rate the response on:
1. ACCURACY (1-10): How accurate and factually correct is the response?
2. REASONING (1-10): How well does it demonstrate logical reasoning?
3. STRUCTURE (1-10): How well-organized and coherent is the response?
4. CREATIVITY (1-10): How creative and engaging is the response?

Respond in this exact format:
ACCURACY: [score]
REASONING: [score]
STRUCTURE: [score]
CREATIVITY: [score]
NOTES: [brief explanation of the scores]`;

      const result = await callGroqAPI('llama-3.3-70b-versatile', scoringPrompt, 200, 0.1);
      
      // Parse the response
      const lines = result.response.split('\n');
      let accuracy = 7, reasoning = 7, structure = 7, creativity = 7;
      let notes = 'AI-generated scoring';
      
      for (const line of lines) {
        if (line.includes('ACCURACY:')) {
          accuracy = parseFloat(line.split(':')[1].trim()) || 7;
        } else if (line.includes('REASONING:')) {
          reasoning = parseFloat(line.split(':')[1].trim()) || 7;
        } else if (line.includes('STRUCTURE:')) {
          structure = parseFloat(line.split(':')[1].trim()) || 7;
        } else if (line.includes('CREATIVITY:')) {
          creativity = parseFloat(line.split(':')[1].trim()) || 7;
        } else if (line.includes('NOTES:')) {
          notes = line.split(':')[1].trim() || notes;
        }
      }
      
      const overall = (accuracy + reasoning + structure + creativity) / 4;
      
      scores[response.modelId] = {
        accuracy: Math.round(accuracy * 10) / 10,
        reasoning: Math.round(reasoning * 10) / 10,
        structure: Math.round(structure * 10) / 10,
        creativity: Math.round(creativity * 10) / 10,
        overall: Math.round(overall * 10) / 10,
        notes
      };
    } catch (error) {
      console.error(`Error scoring response for ${response.modelId}:`, error);
      // Fallback scoring
      scores[response.modelId] = {
        accuracy: 7,
        reasoning: 7,
        structure: 7,
        creativity: 7,
        overall: 7,
        notes: 'Fallback scoring due to API error'
      };
    }
  }
  
  return scores;
};

// Generate scores for prompt battles
const generatePromptScores = (promptEvolution: PromptEvolution[], models: string[]): Record<string, BattleScore> => {
  const scores: Record<string, BattleScore> = {};
  
  for (const modelId of models) {
    const modelEvolutions = promptEvolution.filter(e => e.modelId === modelId);
    const bestEvolution = modelEvolutions.reduce((best, current) => 
      current.score > best.score ? current : best, modelEvolutions[0]);
    
    if (bestEvolution) {
      scores[modelId] = {
        accuracy: bestEvolution.score,
        reasoning: bestEvolution.score,
        structure: bestEvolution.score,
        creativity: bestEvolution.score,
        overall: bestEvolution.score,
        notes: `Best refinement achieved: ${bestEvolution.improvements.join(', ')}`
      };
    }
  }
  
  return scores;
};

// Store battle in localStorage for demo
const storeBattleInCache = (battle: Battle) => {
  try {
    const demoCache = JSON.parse(localStorage.getItem('demo_battles') || '[]');
    demoCache.unshift(battle);
    // Keep only last 50 battles
    if (demoCache.length > 50) {
      demoCache.splice(50);
    }
    localStorage.setItem('demo_battles', JSON.stringify(demoCache));
  } catch (error) {
    console.error('Error storing battle in cache:', error);
  }
};

// Demo data management
export const getUserBattles = async (): Promise<Battle[]> => {
  try {
    const demoCache = JSON.parse(localStorage.getItem('demo_battles') || '[]');
    return demoCache;
  } catch (error) {
    console.error('Error loading battles from cache:', error);
    return [];
  }
};

export const getBattle = async (battleId: string): Promise<Battle | null> => {
  try {
    const demoCache = JSON.parse(localStorage.getItem('demo_battles') || '[]');
    return demoCache.find((b: Battle) => b.id === battleId) || null;
  } catch (error) {
    console.error('Error loading battle from cache:', error);
    return null;
  }
};