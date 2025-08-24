import { callGroqAPI } from './groq';
import { Battle, BattleData, BattleResponse, BattleScore, PromptEvolution } from '../types';
import { AVAILABLE_MODELS, getModelInfo, selectOptimalModels, getAutoSelectionReason } from './models';

// SUPREME PEER REVIEW RUBRIC - 8 Criteria Scoring System
interface PeerReview {
  reviewerId: string;
  targetId: string;
  scores: {
    clarity: number;
    specificity: number;
    completeness: number;
    actionability: number;
    conciseness: number;
    contextCoverage: number;
    noRedundancy: number;
    tailoredToIntent: number;
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

// SUPREME PROMPT BATTLE - TRUE PEER ADVERSARIAL SYSTEM
export const createBattle = async (battleData: BattleData): Promise<Battle> => {
  console.log('🚀 SUPREME BATTLE ARENA: STARTING TRUE PEER ADVERSARIAL BATTLE');
  
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
      console.log('🎯 STARTING TRUE PEER ADVERSARIAL PROMPT OPTIMIZATION');
      
      let currentChampionPrompt = battleData.prompt;
      let round = 1;
      const maxRounds = 100;
      let consecutivePlateauRounds = 0;
      const maxPlateauRounds = 8;
      let globalConsensus = false;
      let currentBestScore = 0;
      
      // Add initial prompt to evolution
      promptEvolution.push({
        id: `evolution_${Date.now()}_0`,
        battleId,
        round: 0,
        prompt: currentChampionPrompt,
        modelId: 'initial',
        improvements: ['Original user prompt'],
        score: 0,
        createdAt: new Date().toISOString()
      });
      
      console.log(`🏁 ROUND 0: BASELINE PROMPT: "${currentChampionPrompt}"`);

      // SUPREME PEER ADVERSARIAL LOOP
      while (!globalConsensus && currentBestScore < 10.0 && round <= maxRounds && consecutivePlateauRounds < maxPlateauRounds) {
        console.log(`\n🔥 ROUND ${round} - CURRENT CHAMPION: "${currentChampionPrompt.substring(0, 100)}..."`);
        console.log(`📊 CURRENT BEST SCORE: ${currentBestScore}/10`);
        
        // Each model attempts to improve the current champion prompt
        const contestants: Array<{modelId: string, output: string}> = [];
        
        for (const modelId of battleData.models) {
          try {
            console.log(`⚔️ ${modelId} attempting to improve champion prompt...`);
            
            const competitivePrompt = `You are competing in the SUPREME PROMPT BATTLE ARENA. Your mission: create a significantly improved version of the current champion prompt.

CURRENT CHAMPION PROMPT TO IMPROVE:
"${currentChampionPrompt}"

CURRENT CHAMPION SCORE: ${currentBestScore}/10
CATEGORY: ${battleData.prompt_category}
ROUND: ${round}

YOUR TASK: Create a meaningfully improved version that will be peer-reviewed by other AI models using this STRICT 8-CRITERIA RUBRIC:

1. CLARITY (1-10): Crystal clear, zero ambiguity
2. SPECIFICITY (1-10): Precise, detailed instructions  
3. COMPLETENESS (1-10): Nothing important missing
4. ACTIONABILITY (1-10): Clear steps/requirements
5. CONCISENESS (1-10): No unnecessary words
6. CONTEXT COVERAGE (1-10): Addresses all relevant aspects
7. NO REDUNDANCY (1-10): No repetitive elements
8. TAILORED TO INTENT (1-10): Perfect fit for intended purpose

CRITICAL INSTRUCTIONS:
- If you cannot meaningfully improve the champion prompt, respond EXACTLY: "CANNOT_IMPROVE_FURTHER"
- Otherwise, respond with ONLY the improved prompt between these markers:
[IMPROVED_PROMPT_STARTS_HERE]
Your improved prompt here
[IMPROVED_PROMPT_ENDS_HERE]

This is competitive - other models will critique your work against the 8-criteria rubric!`;

            const result = await callGroqAPI(modelId, competitivePrompt, 800, 0.2);
            totalCost += result.cost;
            
            const response = result.response.trim();
            
            if (response.includes('CANNOT_IMPROVE_FURTHER')) {
              console.log(`🛑 ${modelId} cannot improve further - plateau signal`);
              continue;
            }
            
            // Extract improved prompt using delimiters
            const startMarker = '[IMPROVED_PROMPT_STARTS_HERE]';
            const endMarker = '[IMPROVED_PROMPT_ENDS_HERE]';
            const startIndex = response.indexOf(startMarker);
            const endIndex = response.indexOf(endMarker);
            
            if (startIndex === -1 || endIndex === -1) {
              console.log(`❌ ${modelId} failed to use proper delimiters`);
              continue;
            }
            
            const improvedPrompt = response.substring(startIndex + startMarker.length, endIndex).trim();
            
            if (!improvedPrompt || improvedPrompt.length < 10) {
              console.log(`❌ ${modelId} produced invalid improvement`);
              continue;
            }
            
            contestants.push({ modelId, output: improvedPrompt });
            console.log(`✅ ${modelId} submitted improvement: "${improvedPrompt.substring(0, 80)}..."`);
            
          } catch (error) {
            console.error(`💥 ${modelId} failed in round ${round}:`, error);
          }
        }
        
        if (contestants.length === 0) {
          console.log(`🛑 ROUND ${round}: No contestants - plateau detected`);
          consecutivePlateauRounds++;
          continue;
        }
        
        // CONDUCT PEER REVIEW FOR THIS ROUND
        console.log(`👥 PEER REVIEW: ${contestants.length} contestants, ${battleData.models.length} reviewers`);
        const roundReviewResult = await conductPeerReviewRound(
          contestants,
          battleData.models,
          battleData.prompt_category,
          'prompt',
          round
        );
        totalCost += roundReviewResult.cost;
        roundResults.push(roundReviewResult.roundResult);
        
        const roundChampion = roundReviewResult.roundResult.champion;
        const roundChampionScore = roundReviewResult.roundResult.championScore;
        
        console.log(`🏆 ROUND ${round} CHAMPION: ${roundChampion} with score ${roundChampionScore}/10`);
        
        // Check for TRUE 10/10 CONSENSUS (all reviewers agree on 10/10)
        const championContestant = roundReviewResult.roundResult.contestants.find(c => c.modelId === roundChampion);
        const allReviewsArePerfect = championContestant?.peerReviews.every(review => review.overallScore >= 10.0) || false;
        
        if (allReviewsArePerfect && roundChampionScore >= 10.0) {
          console.log(`🎯 TRUE 10/10 CONSENSUS ACHIEVED by ${roundChampion}!`);
          globalConsensus = true;
          currentChampionPrompt = championContestant?.output || currentChampionPrompt;
          currentBestScore = roundChampionScore;
          
          // Add final evolution entry
          promptEvolution.push({
            id: `evolution_${Date.now()}_${round}`,
            battleId,
            round: round,
            prompt: currentChampionPrompt,
            modelId: roundChampion,
            improvements: ['Achieved 10/10 consensus - no further improvement possible'],
            score: currentBestScore,
            createdAt: new Date().toISOString()
          });
          
          break;
        }
        
        // Check for improvement
        if (roundChampionScore > currentBestScore + 0.05) {
          console.log(`📈 IMPROVEMENT: New champion score ${roundChampionScore}/10 by ${roundChampion}`);
          currentBestScore = roundChampionScore;
          currentChampionPrompt = championContestant?.output || currentChampionPrompt;
          consecutivePlateauRounds = 0;
          
          // Generate improvements list
          const improvements = await generateImprovementsList(
            promptEvolution[promptEvolution.length - 1]?.prompt || battleData.prompt,
            currentChampionPrompt
          );
          
          promptEvolution.push({
            id: `evolution_${Date.now()}_${round}`,
            battleId,
            round: round,
            prompt: currentChampionPrompt,
            modelId: roundChampion,
            improvements,
            score: currentBestScore,
            createdAt: new Date().toISOString()
          });
        } else {
          console.log(`📊 ROUND ${round}: No significant improvement - plateau count: ${consecutivePlateauRounds + 1}`);
          consecutivePlateauRounds++;
        }
        
        round++;
      }
      
      // Final status logging
      const finalChampion = promptEvolution[promptEvolution.length - 1]?.modelId || 'initial';
      if (globalConsensus) {
        console.log(`🎉 SUPREME VICTORY: Perfect 10/10 consensus achieved by ${finalChampion}!`);
      } else if (consecutivePlateauRounds >= maxPlateauRounds) {
        console.log(`🛑 SUPREME PLATEAU: No further improvement possible. Best score: ${currentBestScore}/10`);
      } else if (round > maxRounds) {
        console.log(`⏰ SUPREME LIMIT: Stopped after ${maxRounds} rounds. Best score: ${currentBestScore}/10`);
      }
      
      // Create final battle object for prompt battle
      const battle: Battle = {
        id: battleId,
        userId: 'current-user-id',
        battleType: 'prompt',
        prompt: battleData.prompt,
        finalPrompt: currentChampionPrompt,
        promptCategory: battleData.prompt_category,
        models: battleData.models,
        mode: battleData.mode,
        battleMode: battleData.battle_mode,
        rounds: round - 1,
        maxTokens: battleData.max_tokens,
        temperature: battleData.temperature,
        status: 'completed',
        winner: finalChampion,
        totalCost,
        autoSelectionReason: battleData.auto_selection_reason,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: [],
        scores: generatePromptScores(roundResults, battleData.models),
        promptEvolution,
        roundResults,
        globalConsensus,
        plateauReason: !globalConsensus ? (
          consecutivePlateauRounds >= maxPlateauRounds 
            ? `Plateau detected: No improvement for ${consecutivePlateauRounds} consecutive rounds`
            : round > maxRounds 
            ? `Maximum rounds (${maxRounds}) reached`
            : 'Unknown termination reason'
        ) : undefined
      };
      
      // Store battle in localStorage for demo
      storeBattleInCache(battle);
      
      return battle;
      
    } else {
      // SUPREME RESPONSE BATTLE WITH PEER REVIEW
      console.log('🎯 SUPREME RESPONSE BATTLE: PEER ADVERSARIAL RESPONSE GENERATION');
      
      const contestants: Array<{modelId: string, output: string}> = [];
      
      for (const modelId of battleData.models) {
        try {
          console.log(`⚔️ ${modelId} generating response`);
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
          console.error(`💥 ${modelId} failed:`, error);
        }
      }
      
      if (contestants.length === 0) {
        throw new Error('No models generated responses. Check API configuration.');
      }
      
      // CONDUCT PEER REVIEW FOR RESPONSES
      console.log(`👥 PEER REVIEW: ${contestants.length} responses, ${battleData.models.length} reviewers`);
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
      
      console.log(`🏆 CHAMPION: ${winner} with score ${reviewResult.roundResult.championScore}/10`);
      
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
        roundResults,
        globalConsensus: reviewResult.roundResult.championScore >= 10.0,
        plateauReason: undefined
      };
      
      // Store battle in localStorage for demo
      storeBattleInCache(battle);
      
      return battle;
    }
    
  } catch (error) {
    console.error('💥 BATTLE EXECUTION FAILED:', error);
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
  
  console.log(`👥 CONDUCTING PEER REVIEW ROUND ${round}`);
  
  // Each model reviews each contestant (except themselves)
  for (const reviewerModelId of allModels) {
    for (const contestant of contestants) {
      if (contestant.modelId === reviewerModelId) continue; // No self-review
      
      try {
        console.log(`🔍 ${reviewerModelId} reviewing ${contestant.modelId}'s ${battleType}`);
        const review = await generatePeerReview(
          reviewerModelId,
          contestant.output,
          contestant.modelId,
          category,
          battleType
        );
        allReviews.push(review);
        cost += 0.02; // Estimate for review call
        console.log(`✅ ${reviewerModelId} scored ${contestant.modelId}: ${review.overallScore}/10`);
      } catch (error) {
        console.error(`❌ Peer review failed: ${reviewerModelId} reviewing ${contestant.modelId}:`, error);
        throw error; // Don't continue with failed reviews
      }
    }
  }
  
  // Calculate average scores for each contestant
  const contestantResults = contestants.map(contestant => {
    const reviews = allReviews.filter(r => r.targetId === contestant.modelId);
    const avgScore = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.overallScore, 0) / reviews.length
      : 0;
    
    console.log(`📊 ${contestant.modelId} average score: ${avgScore}/10 (from ${reviews.length} reviews)`);
    
    return {
      modelId: contestant.modelId,
      output: contestant.output,
      peerReviews: reviews,
      averageScore: Math.round(avgScore * 100) / 100
    };
  });
  
  // Find champion
  const champion = contestantResults.reduce((best, current) => 
    current.averageScore > best.averageScore ? current : best
  );
  
  console.log(`🏆 ROUND ${round} CHAMPION: ${champion.modelId} with ${champion.averageScore}/10`);
  
  // Check for TRUE 10/10 CONSENSUS (all reviews are 10/10)
  const championReviews = champion.peerReviews;
  const consensus = championReviews.length > 0 && 
    championReviews.every(r => r.overallScore >= 10.0) &&
    champion.averageScore >= 10.0;
  
  if (consensus) {
    console.log(`🎯 TRUE 10/10 CONSENSUS: All ${championReviews.length} reviewers scored ${champion.modelId} as 10/10!`);
  }
  
  // Check for plateau (all scores very close)
  const scores = contestantResults.map(c => c.averageScore);
  const plateauDetected = scores.length > 1 && 
    Math.max(...scores) - Math.min(...scores) <= 0.1;
  
  if (plateauDetected) {
    console.log(`📊 PLATEAU DETECTED: Score range only ${Math.max(...scores) - Math.min(...scores)}`);
  }
  
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

// Generate detailed peer review using AI with STRICT 8-CRITERIA RUBRIC
const generatePeerReview = async (
  reviewerModelId: string,
  targetOutput: string,
  targetModelId: string,
  category: string,
  battleType: 'prompt' | 'response'
): Promise<PeerReview> => {
  const reviewPrompt = `CRITICAL: You MUST respond ONLY with the structured format below. NO conversational text, NO thinking aloud, NO explanations before the format. Start your response immediately with "CLARITY:" and follow the exact format.

You are a peer reviewer in the SUPREME PROMPT BATTLE ARENA. Evaluate this ${battleType} using the STRICT 8-CRITERIA RUBRIC.

${battleType.toUpperCase()} TO REVIEW: "${targetOutput}"
CATEGORY: ${category}
CREATED BY: ${targetModelId}

SUPREME 8-CRITERIA SCORING RUBRIC (1-10 scale, be EXTREMELY strict):
1. CLARITY: Crystal clear, zero ambiguity (10 = impossible to misunderstand)
2. SPECIFICITY: Precise, detailed instructions (10 = all necessary details included)
3. COMPLETENESS: Nothing important missing (10 = comprehensive coverage)
4. ACTIONABILITY: Clear steps/requirements (10 = perfectly actionable)
5. CONCISENESS: No unnecessary words (10 = perfectly concise)
6. CONTEXT_COVERAGE: Addresses all relevant aspects (10 = complete context coverage)
7. NO_REDUNDANCY: No repetitive elements (10 = zero redundancy)
8. TAILORED_TO_INTENT: Perfect fit for intended purpose (10 = perfectly tailored)

CRITICAL: Be EXTREMELY strict. Only award 10/10 for truly perfect aspects that cannot be improved.

RESPOND IN EXACT FORMAT (no deviation allowed, start immediately with CLARITY):
CLARITY: [score]
SPECIFICITY: [score]
COMPLETENESS: [score]
ACTIONABILITY: [score]
CONCISENESS: [score]
CONTEXT_COVERAGE: [score]
NO_REDUNDANCY: [score]
TAILORED_TO_INTENT: [score]
CRITIQUE: [detailed explanation of scores and specific areas for improvement]
IMPROVEMENTS: [comma-separated list of specific improvements needed]`;

  try {
    const result = await callGroqAPI(reviewerModelId, reviewPrompt, 400, 0.1);
    
    // Parse response with STRICT validation
    const lines = result.response.split('\n');
    const scores = {
      clarity: 0,
      specificity: 0,
      completeness: 0,
      actionability: 0,
      conciseness: 0,
      contextCoverage: 0,
      noRedundancy: 0,
      tailoredToIntent: 0
    };
    let critique = '';
    let improvements: string[] = [];
    
    let foundScores = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('CLARITY:')) {
        scores.clarity = parseFloat(trimmedLine.split(':')[1].trim()) || 0;
        foundScores++;
      } else if (trimmedLine.startsWith('SPECIFICITY:')) {
        scores.specificity = parseFloat(trimmedLine.split(':')[1].trim()) || 0;
        foundScores++;
      } else if (trimmedLine.startsWith('COMPLETENESS:')) {
        scores.completeness = parseFloat(trimmedLine.split(':')[1].trim()) || 0;
        foundScores++;
      } else if (trimmedLine.startsWith('ACTIONABILITY:')) {
        scores.actionability = parseFloat(trimmedLine.split(':')[1].trim()) || 0;
        foundScores++;
      } else if (trimmedLine.startsWith('CONCISENESS:')) {
        scores.conciseness = parseFloat(trimmedLine.split(':')[1].trim()) || 0;
        foundScores++;
      } else if (trimmedLine.startsWith('CONTEXT_COVERAGE:')) {
        scores.contextCoverage = parseFloat(trimmedLine.split(':')[1].trim()) || 0;
        foundScores++;
      } else if (trimmedLine.startsWith('NO_REDUNDANCY:')) {
        scores.noRedundancy = parseFloat(trimmedLine.split(':')[1].trim()) || 0;
        foundScores++;
      } else if (trimmedLine.startsWith('TAILORED_TO_INTENT:')) {
        scores.tailoredToIntent = parseFloat(trimmedLine.split(':')[1].trim()) || 0;
        foundScores++;
      } else if (trimmedLine.startsWith('CRITIQUE:')) {
        critique = trimmedLine.split(':').slice(1).join(':').trim();
      } else if (trimmedLine.startsWith('IMPROVEMENTS:')) {
        const improvementText = trimmedLine.split(':').slice(1).join(':').trim();
        improvements = improvementText.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
    }
    
    // STRICT VALIDATION: Must have all 8 scores
    if (foundScores < 8) {
      throw new Error(`Peer review format error: Only found ${foundScores}/8 required scores. Response: ${result.response}`);
    }
    
    // Validate score ranges
    Object.entries(scores).forEach(([key, value]) => {
      if (value < 1 || value > 10) {
        throw new Error(`Invalid score for ${key}: ${value}. Must be between 1-10.`);
      }
    });
    
    const overallScore = (scores.clarity + scores.specificity + scores.completeness + 
                         scores.actionability + scores.conciseness + scores.contextCoverage + 
                         scores.noRedundancy + scores.tailoredToIntent) / 8;
    
    return {
      reviewerId: reviewerModelId,
      targetId: targetModelId,
      scores,
      overallScore: Math.round(overallScore * 100) / 100,
      critique: critique || 'No critique provided',
      improvements: improvements.length > 0 ? improvements : ['No specific improvements listed']
    };
  } catch (error) {
    console.error(`💥 Peer review generation failed for ${reviewerModelId}:`, error);
    throw error; // Don't use fallback - surface the error
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
        completeness: acc.completeness + review.scores.completeness,
        actionability: acc.actionability + review.scores.actionability,
        conciseness: acc.conciseness + review.scores.conciseness,
        contextCoverage: acc.contextCoverage + review.scores.contextCoverage,
        noRedundancy: acc.noRedundancy + review.scores.noRedundancy,
        tailoredToIntent: acc.tailoredToIntent + review.scores.tailoredToIntent
      }), {
        clarity: 0, specificity: 0, completeness: 0, actionability: 0,
        conciseness: 0, contextCoverage: 0, noRedundancy: 0, tailoredToIntent: 0
      });
      
      const reviewCount = bestReviews.length;
      scores[modelId] = {
        accuracy: Math.round((avgScores.clarity / reviewCount) * 100) / 100,
        reasoning: Math.round((avgScores.specificity / reviewCount) * 100) / 100,
        structure: Math.round((avgScores.completeness / reviewCount) * 100) / 100,
        creativity: Math.round((avgScores.tailoredToIntent / reviewCount) * 100) / 100,
        overall: bestScore,
        notes: `Peer-reviewed by ${reviewCount} models. Best critiques: ${bestReviews.map(r => r.critique.substring(0, 50)).join('; ')}`
      };
    } else {
      scores[modelId] = {
        accuracy: 0,
        reasoning: 0,
        structure: 0,
        creativity: 0,
        overall: 0,
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
        completeness: acc.completeness + review.scores.completeness,
        actionability: acc.actionability + review.scores.actionability,
        conciseness: acc.conciseness + review.scores.conciseness,
        contextCoverage: acc.contextCoverage + review.scores.contextCoverage,
        noRedundancy: acc.noRedundancy + review.scores.noRedundancy,
        tailoredToIntent: acc.tailoredToIntent + review.scores.tailoredToIntent
      }), {
        clarity: 0, specificity: 0, completeness: 0, actionability: 0,
        conciseness: 0, contextCoverage: 0, noRedundancy: 0, tailoredToIntent: 0
      });
      
      const reviewCount = contestant.peerReviews.length;
      scores[contestant.modelId] = {
        accuracy: Math.round((avgScores.clarity / reviewCount) * 100) / 100,
        reasoning: Math.round((avgScores.specificity / reviewCount) * 100) / 100,
        structure: Math.round((avgScores.completeness / reviewCount) * 100) / 100,
        creativity: Math.round((avgScores.tailoredToIntent / reviewCount) * 100) / 100,
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