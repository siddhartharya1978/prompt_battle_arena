import { callGroqAPI } from './groq';
import { Battle, BattleData, BattleResponse, BattleScore, PromptEvolution } from '../types';
import { AVAILABLE_MODELS, getModelInfo, selectOptimalModels, getAutoSelectionReason } from './models';

// SUPREME PEER REVIEW RUBRIC - 7 Criteria Scoring System
interface PeerReview {
  reviewerId: string;
  targetId: string;
  scores: {
    clarity: number;
    specificity: number;
    actionability: number;
    contextAlignment: number;
    completeness: number;
    uniqueCoverage: number;
    noFurtherImprovement: number;
  };
  overallScore: number;
  critique: string;
  improvements: string[];
}

interface RoundResult {
  round: number;
  contestants: Array<{
    modelId: string;
    output: string;
    peerReviews: PeerReview[];
    averageScore: number;
  }>;
  champion: string;
  championScore: number;
  consensus: boolean;
  plateauDetected: boolean;
}

// REAL 10/10 PROMPT OPTIMIZATION ENGINE - NO MOCKS, NO SHORTCUTS
export const createBattle = async (battleData: BattleData): Promise<Battle> => {
  console.log('SUPREME BATTLE ARENA: STARTING REAL 10/10 OPTIMIZATION BATTLE:', battleData);
  
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
  const roundResults: RoundResult[] = [];
  
  try {
    if (battleData.battle_type === 'prompt') {
      // SUPREME PEER ADVERSARIAL PROMPT OPTIMIZATION
      console.log('SUPREME OPTIMIZATION: STARTING REAL 10/10 PROMPT OPTIMIZATION ENGINE');
      
      let currentPrompt = battleData.prompt;
      let round = 1;
      const maxRounds = 100;
      let consecutivePlateauRounds = 0;
      const maxPlateauRounds = 5;
      let globalConsensus = false;
      
      // ROUND 1: Initial baseline with peer review
      console.log('SUPREME ROUND 1: ESTABLISHING BASELINE WITH PEER REVIEW');
      const initialRoundResult = await conductPeerReviewRound(
        [{ modelId: 'baseline', output: currentPrompt }],
        battleData.models,
        battleData.prompt_category,
        'prompt',
        1
      );
      totalCost += initialRoundResult.cost;
      roundResults.push(initialRoundResult.roundResult);
      
      promptEvolution.push({
        id: `evolution_${Date.now()}_0`,
        battleId,
        round: 1,
        prompt: currentPrompt,
        modelId: 'initial',
        improvements: ['Original prompt'],
        score: initialRoundResult.roundResult.championScore,
        createdAt: new Date().toISOString()
      });
      
      let currentBestScore = initialRoundResult.roundResult.championScore;
      console.log('SUPREME BASELINE: INITIAL PROMPT SCORE: ' + currentBestScore + '/10');

      // SUPREME PEER ADVERSARIAL LOOP
      while (!globalConsensus && currentBestScore < 9.9 && round <= maxRounds && consecutivePlateauRounds < maxPlateauRounds) {
        round++;
        console.log(`SUPREME ROUND ${round} - Current Champion Score: ${currentBestScore}/10`);
        
        // Each model attempts to improve the current champion
        const contestants: Array<{modelId: string, output: string}> = [];
        
        for (const modelId of battleData.models) {
          try {
            console.log(`SUPREME COMPETITOR: ${modelId} attempting to improve prompt...`);
            
            const competitivePrompt = `You are competing in the SUPREME PROMPT BATTLE ARENA. Your mission: create a significantly improved version of this prompt that will be peer-reviewed by other AI models.

CURRENT CHAMPION PROMPT: "${currentPrompt}"
CURRENT CHAMPION SCORE: ${currentBestScore}/10
CATEGORY: ${battleData.prompt_category}
ROUND: ${round}

PEER REVIEW CRITERIA (your output will be scored on):
1. CLARITY (1-10): Crystal clear, zero ambiguity
2. SPECIFICITY (1-10): Precise, detailed instructions
3. ACTIONABILITY (1-10): Clear steps/requirements
4. CONTEXT ALIGNMENT (1-10): Perfect fit for intended use
5. COMPLETENESS (1-10): Nothing important missing
6. UNIQUE COVERAGE (1-10): Addresses aspects others miss
7. NO FURTHER IMPROVEMENT (1-10): Approaching perfection

COMPETITIVE REQUIREMENTS:
- Create a MEANINGFULLY improved version (not minor tweaks)
- Target 10/10 across ALL criteria
- If you cannot improve meaningfully, respond: "CANNOT_IMPROVE_FURTHER"
- Otherwise, respond with ONLY the improved prompt

This is competitive - other models will critique your work!`;

            const result = await callGroqAPI(modelId, competitivePrompt, battleData.max_tokens, 0.3);
            totalCost += result.cost;
            
            const refinedPrompt = result.response.trim();
            
            if (refinedPrompt.includes('CANNOT_IMPROVE_FURTHER')) {
              console.log(`SUPREME PLATEAU: ${modelId} cannot improve further`);
              continue;
            }
            
            contestants.push({ modelId, output: refinedPrompt });
            
          } catch (error) {
            console.error(`SUPREME ERROR: ${modelId} failed in round ${round}:`, error);
          }
        }
        
        if (contestants.length === 0) {
          console.log('SUPREME PLATEAU: No contestants in round ' + round);
          consecutivePlateauRounds++;
          continue;
        }
        
        // CONDUCT PEER REVIEW FOR THIS ROUND
        console.log(`SUPREME PEER REVIEW: ${contestants.length} contestants, ${battleData.models.length} reviewers`);
        const roundReviewResult = await conductPeerReviewRound(
          contestants,
          battleData.models,
          battleData.prompt_category,
          'prompt',
          round
        );
        totalCost += roundReviewResult.cost;
        roundResults.push(roundReviewResult.roundResult);
        
        // Check for consensus (all reviewers agree on 10/10)
        if (roundReviewResult.roundResult.consensus && roundReviewResult.roundResult.championScore >= 9.9) {
          console.log(`SUPREME CONSENSUS: All models agree - 10/10 achieved by ${roundReviewResult.roundResult.champion}!`);
          globalConsensus = true;
          currentPrompt = roundReviewResult.roundResult.contestants.find(c => c.modelId === roundReviewResult.roundResult.champion)?.output || currentPrompt;
          break;
        }
        
        // Check for improvement
        if (roundReviewResult.roundResult.championScore > currentBestScore + 0.1) {
          console.log(`SUPREME IMPROVEMENT: New champion score ${roundReviewResult.roundResult.championScore}/10 by ${roundReviewResult.roundResult.champion}`);
          currentBestScore = roundReviewResult.roundResult.championScore;
          currentPrompt = roundReviewResult.roundResult.contestants.find(c => c.modelId === roundReviewResult.roundResult.champion)?.output || currentPrompt;
          consecutivePlateauRounds = 0;
          
          // Add to evolution
          const improvements = await generateImprovementsList(
            promptEvolution[promptEvolution.length - 1]?.prompt || battleData.prompt,
            currentPrompt
          );
          
          promptEvolution.push({
            id: `evolution_${Date.now()}_${round}`,
            battleId,
            round: round,
            prompt: currentPrompt,
            modelId: roundReviewResult.roundResult.champion,
            improvements,
            score: currentBestScore,
            createdAt: new Date().toISOString()
          });
        } else {
          console.log(`SUPREME PLATEAU: No significant improvement in round ${round}`);
          consecutivePlateauRounds++;
        }
      }
      
      // Final status logging
      const finalChampion = roundResults[roundResults.length - 1]?.champion || 'initial';
      if (globalConsensus) {
        console.log(`SUPREME VICTORY: Perfect consensus 10/10 achieved by ${finalChampion}!`);
      } else if (consecutivePlateauRounds >= maxPlateauRounds) {
        console.log(`SUPREME PLATEAU: No further improvement possible. Best score: ${currentBestScore}/10`);
      } else if (round > maxRounds) {
        console.log(`SUPREME LIMIT: Stopped after ${maxRounds} rounds. Best score: ${currentBestScore}/10`);
      }
      
      // Create final battle object for prompt battle
      const battle: Battle = {
        id: battleId,
        userId: 'current-user-id',
        battleType: 'prompt',
        prompt: battleData.prompt,
        finalPrompt: currentPrompt,
        promptCategory: battleData.prompt_category,
        models: battleData.models,
        mode: battleData.mode,
        battleMode: battleData.battle_mode,
        rounds: round,
        maxTokens: battleData.max_tokens,
        temperature: battleData.temperature,
        status: 'completed',
        winner: finalChampion,
        totalCost,
        autoSelectionReason: battleData.auto_selection_reason,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: [], // Prompt battles don't have responses
        scores: generatePromptScores(roundResults, battleData.models),
        promptEvolution,
        roundResults // Store peer review data
      };
      
      // Store battle in localStorage for demo
      storeBattleInCache(battle);
      
      return battle;
      
    } else {
      // SUPREME RESPONSE BATTLE WITH PEER REVIEW
      console.log('SUPREME RESPONSE BATTLE: PEER ADVERSARIAL RESPONSE GENERATION');
      
      const contestants: Array<{modelId: string, output: string}> = [];
      
      for (const modelId of battleData.models) {
        try {
          console.log(`SUPREME COMPETITOR: ${modelId} generating response`);
          const result = await callGroqAPI(modelId, battleData.prompt, battleData.max_tokens, battleData.temperature);
          
          contestants.push({ modelId, output: result.response });
          totalCost += result.cost;
          
          // Store response data
          responses.push({
            id: `response_${Date.now()}_${modelId}`,
            battleId,
            modelId,
            response: result.response,
            latency: result.latency,
            tokens: result.tokens,
            cost: result.cost,
            createdAt: new Date().toISOString()
          });
          
        } catch (error) {
          console.error(`SUPREME ERROR: ${modelId} failed:`, error);
        }
      }
      
      if (contestants.length === 0) {
        throw new Error('No models generated responses. Check API configuration.');
      }
      
      // CONDUCT PEER REVIEW FOR RESPONSES
      console.log(`SUPREME PEER REVIEW: ${contestants.length} responses, ${battleData.models.length} reviewers`);
      const reviewResult = await conductPeerReviewRound(
        contestants,
        battleData.models,
        battleData.prompt_category,
        'response',
        1
      );
      totalCost += reviewResult.cost;
      roundResults.push(reviewResult.roundResult);
      
      const winner = reviewResult.roundResult.champion;
      const scores = generateResponseScores(reviewResult.roundResult);
      
      console.log(`SUPREME CHAMPION: ${winner} with score ${reviewResult.roundResult.championScore}/10`);
      
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
        scores,
        roundResults
      };
      
      // Store battle in localStorage for demo
      storeBattleInCache(battle);
      
      return battle;
    }
    
  } catch (error) {
    console.error('SUPREME FAILURE: BATTLE EXECUTION FAILED:', error);
    throw error;
  }
};

// SUPREME PEER REVIEW SYSTEM - Conduct full peer review round
const conductPeerReviewRound = async (
  contestants: Array<{modelId: string, output: string}>,
  allModels: string[],
  category: string,
  battleType: 'prompt' | 'response',
  round: number
): Promise<{roundResult: RoundResult, cost: number}> => {
  let cost = 0;
  const allReviews: PeerReview[] = [];
  
  // Each model reviews each contestant (except themselves)
  for (const reviewerModelId of allModels) {
    for (const contestant of contestants) {
      if (contestant.modelId === reviewerModelId) continue; // No self-review
      
      try {
        const review = await generatePeerReview(
          reviewerModelId,
          contestant.output,
          contestant.modelId,
          category,
          battleType
        );
        allReviews.push(review);
        cost += 0.02; // Estimate for review call
      } catch (error) {
        console.error(`Peer review failed: ${reviewerModelId} reviewing ${contestant.modelId}:`, error);
      }
    }
  }
  
  // Calculate average scores for each contestant
  const contestantResults = contestants.map(contestant => {
    const reviews = allReviews.filter(r => r.targetId === contestant.modelId);
    const avgScore = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.overallScore, 0) / reviews.length
      : 0;
    
    return {
      modelId: contestant.modelId,
      output: contestant.output,
      peerReviews: reviews,
      averageScore: Math.round(avgScore * 10) / 10
    };
  });
  
  // Find champion
  const champion = contestantResults.reduce((best, current) => 
    current.averageScore > best.averageScore ? current : best
  );
  
  // Check for consensus (all reviews within 0.5 points and all >= 9.5)
  const championReviews = champion.peerReviews;
  const consensus = championReviews.length > 0 && 
    championReviews.every(r => r.overallScore >= 9.5) &&
    Math.max(...championReviews.map(r => r.overallScore)) - Math.min(...championReviews.map(r => r.overallScore)) <= 0.5;
  
  // Check for plateau (all scores very close)
  const scores = contestantResults.map(c => c.averageScore);
  const plateauDetected = scores.length > 1 && 
    Math.max(...scores) - Math.min(...scores) <= 0.2;
  
  const roundResult: RoundResult = {
    round,
    contestants: contestantResults,
    champion: champion.modelId,
    championScore: champion.averageScore,
    consensus,
    plateauDetected
  };
  
  return { roundResult, cost };
};

// Generate detailed peer review using AI
const generatePeerReview = async (
  reviewerModelId: string,
  targetOutput: string,
  targetModelId: string,
  category: string,
  battleType: 'prompt' | 'response'
): Promise<PeerReview> => {
  const reviewPrompt = `You are a peer reviewer in the SUPREME PROMPT BATTLE ARENA. Evaluate this ${battleType} using the 7-criteria rubric.

${battleType.toUpperCase()} TO REVIEW: "${targetOutput}"
CATEGORY: ${category}
CREATED BY: ${targetModelId}

SUPREME SCORING RUBRIC (1-10 scale, be EXTREMELY strict):
1. CLARITY: Crystal clear, zero ambiguity (10 = impossible to misunderstand)
2. SPECIFICITY: Precise, detailed instructions (10 = all necessary details included)
3. ACTIONABILITY: Clear steps/requirements (10 = perfectly actionable)
4. CONTEXT ALIGNMENT: Perfect fit for intended use (10 = ideal for category)
5. COMPLETENESS: Nothing important missing (10 = comprehensive coverage)
6. UNIQUE COVERAGE: Addresses aspects others miss (10 = unique valuable insights)
7. NO FURTHER IMPROVEMENT: Approaching perfection (10 = cannot be meaningfully improved)

RESPOND IN EXACT FORMAT:
CLARITY: [score]
SPECIFICITY: [score]
ACTIONABILITY: [score]
CONTEXT_ALIGNMENT: [score]
COMPLETENESS: [score]
UNIQUE_COVERAGE: [score]
NO_FURTHER_IMPROVEMENT: [score]
CRITIQUE: [detailed explanation of scores and specific areas for improvement]
IMPROVEMENTS: [comma-separated list of specific improvements needed]`;

  try {
    const result = await callGroqAPI(reviewerModelId, reviewPrompt, 300, 0.1);
    
    // Parse response
    const lines = result.response.split('\n');
    const scores = {
      clarity: 5,
      specificity: 5,
      actionability: 5,
      contextAlignment: 5,
      completeness: 5,
      uniqueCoverage: 5,
      noFurtherImprovement: 5
    };
    let critique = 'AI-generated review';
    let improvements: string[] = [];
    
    for (const line of lines) {
      if (line.includes('CLARITY:')) scores.clarity = parseFloat(line.split(':')[1].trim()) || 5;
      else if (line.includes('SPECIFICITY:')) scores.specificity = parseFloat(line.split(':')[1].trim()) || 5;
      else if (line.includes('ACTIONABILITY:')) scores.actionability = parseFloat(line.split(':')[1].trim()) || 5;
      else if (line.includes('CONTEXT_ALIGNMENT:')) scores.contextAlignment = parseFloat(line.split(':')[1].trim()) || 5;
      else if (line.includes('COMPLETENESS:')) scores.completeness = parseFloat(line.split(':')[1].trim()) || 5;
      else if (line.includes('UNIQUE_COVERAGE:')) scores.uniqueCoverage = parseFloat(line.split(':')[1].trim()) || 5;
      else if (line.includes('NO_FURTHER_IMPROVEMENT:')) scores.noFurtherImprovement = parseFloat(line.split(':')[1].trim()) || 5;
      else if (line.includes('CRITIQUE:')) critique = line.split(':')[1].trim() || critique;
      else if (line.includes('IMPROVEMENTS:')) {
        improvements = line.split(':')[1].trim().split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
    }
    
    const overallScore = (scores.clarity + scores.specificity + scores.actionability + 
                         scores.contextAlignment + scores.completeness + scores.uniqueCoverage + 
                         scores.noFurtherImprovement) / 7;
    
    return {
      reviewerId: reviewerModelId,
      targetId: targetModelId,
      scores,
      overallScore: Math.round(overallScore * 10) / 10,
      critique,
      improvements
    };
  } catch (error) {
    console.error(`Peer review generation failed for ${reviewerModelId}:`, error);
    // Fallback review
    return {
      reviewerId: reviewerModelId,
      targetId: targetModelId,
      scores: {
        clarity: 5,
        specificity: 5,
        actionability: 5,
        contextAlignment: 5,
        completeness: 5,
        uniqueCoverage: 5,
        noFurtherImprovement: 5
      },
      overallScore: 5,
      critique: 'Review generation failed - fallback scoring',
      improvements: ['Unable to generate specific improvements']
    };
  }
};

// Real AI-powered prompt quality scoring
const scorePromptQuality = async (prompt: string, category: string, originalPrompt: string): Promise<BattleScore> => {
  try {
    const scoringPrompt = `You are an expert prompt evaluator in the SUPREME PROMPT BATTLE ARENA. Score this prompt on a scale of 1-10 for each category. Be EXTREMELY strict - only award 10/10 for truly perfect prompts that cannot be improved.

Prompt to evaluate: "${prompt}"
${originalPrompt ? `Original prompt: "${originalPrompt}"` : ''}
Category: ${category}

SUPREME SCORING CRITERIA:
1. CLARITY (1-10): Crystal clear with zero ambiguity? 10/10 = impossible to misunderstand
2. SPECIFICITY (1-10): Perfectly detailed instructions? 10/10 = all necessary details included
3. STRUCTURE (1-10): Flawless organization and flow? 10/10 = perfect logical structure
4. EFFECTIVENESS (1-10): Guaranteed excellent results? 10/10 = cannot produce better outcomes

BE EXTREMELY STRICT. 9/10 should be rare, 10/10 should be perfect.
Respond in this exact format:
CLARITY: [score]
SPECIFICITY: [score]
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
      
      const scoringPrompt = `You are an expert AI response evaluator in the SUPREME PROMPT BATTLE ARENA. Score this response on a scale of 1-10 for each category:

Original prompt: "${prompt}"
Category: ${category}
Response to evaluate: "${response.response}"
Model: ${model.name}

SUPREME SCORING CRITERIA (BE EXTREMELY STRICT):
1. ACCURACY (1-10): How accurate and factually correct is the response?
2. REASONING (1-10): How well does it demonstrate logical reasoning?
3. STRUCTURE (1-10): How well-organized and coherent is the response?
4. CREATIVITY (1-10): How creative and engaging is the response?

BE EXTREMELY STRICT. 9/10 should be rare, 10/10 should be perfect.
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

// Generate scores for prompt battles from round results
const generatePromptScores = (roundResults: RoundResult[], models: string[]): Record<string, BattleScore> => {
  const scores: Record<string, BattleScore> = {};
  
  for (const modelId of models) {
    // Find best performance across all rounds
    let bestScore = 0;
    let bestReviews: PeerReview[] = [];
    
    for (const round of roundResults) {
      const contestant = round.contestants.find(c => c.modelId === modelId);
      if (contestant && contestant.averageScore > bestScore) {
        bestScore = contestant.averageScore;
        bestReviews = contestant.peerReviews;
      }
    }
    
    if (bestReviews.length > 0) {
      const avgScores = bestReviews.reduce((acc, review) => ({
        clarity: acc.clarity + review.scores.clarity,
        specificity: acc.specificity + review.scores.specificity,
        actionability: acc.actionability + review.scores.actionability,
        contextAlignment: acc.contextAlignment + review.scores.contextAlignment,
        completeness: acc.completeness + review.scores.completeness,
        uniqueCoverage: acc.uniqueCoverage + review.scores.uniqueCoverage,
        noFurtherImprovement: acc.noFurtherImprovement + review.scores.noFurtherImprovement
      }), {
        clarity: 0, specificity: 0, actionability: 0, contextAlignment: 0,
        completeness: 0, uniqueCoverage: 0, noFurtherImprovement: 0
      });
      
      const reviewCount = bestReviews.length;
      scores[modelId] = {
        accuracy: Math.round((avgScores.clarity / reviewCount) * 10) / 10,
        reasoning: Math.round((avgScores.specificity / reviewCount) * 10) / 10,
        structure: Math.round((avgScores.actionability / reviewCount) * 10) / 10,
        creativity: Math.round((avgScores.uniqueCoverage / reviewCount) * 10) / 10,
        overall: bestScore,
        notes: `Peer-reviewed by ${reviewCount} models. Best critiques: ${bestReviews.map(r => r.critique.substring(0, 50)).join('; ')}`
      };
    } else {
      scores[modelId] = {
        accuracy: 5,
        reasoning: 5,
        structure: 5,
        creativity: 5,
        overall: 5,
        notes: 'No peer reviews available'
      };
    }
  }
  
  return scores;
};

// Generate scores for response battles from round results
const generateResponseScores = (roundResult: RoundResult): Record<string, BattleScore> => {
  const scores: Record<string, BattleScore> = {};
  
  for (const contestant of roundResult.contestants) {
    if (contestant.peerReviews.length > 0) {
      const avgScores = contestant.peerReviews.reduce((acc, review) => ({
        clarity: acc.clarity + review.scores.clarity,
        specificity: acc.specificity + review.scores.specificity,
        actionability: acc.actionability + review.scores.actionability,
        contextAlignment: acc.contextAlignment + review.scores.contextAlignment,
        completeness: acc.completeness + review.scores.completeness,
        uniqueCoverage: acc.uniqueCoverage + review.scores.uniqueCoverage,
        noFurtherImprovement: acc.noFurtherImprovement + review.scores.noFurtherImprovement
      }), {
        clarity: 0, specificity: 0, actionability: 0, contextAlignment: 0,
        completeness: 0, uniqueCoverage: 0, noFurtherImprovement: 0
      });
      
      const reviewCount = contestant.peerReviews.length;
      scores[contestant.modelId] = {
        accuracy: Math.round((avgScores.clarity / reviewCount) * 10) / 10,
        reasoning: Math.round((avgScores.specificity / reviewCount) * 10) / 10,
        structure: Math.round((avgScores.actionability / reviewCount) * 10) / 10,
        creativity: Math.round((avgScores.uniqueCoverage / reviewCount) * 10) / 10,
        overall: contestant.averageScore,
        notes: `Peer-reviewed by ${reviewCount} models. ${contestant.peerReviews.map(r => r.critique.substring(0, 30)).join('; ')}`
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