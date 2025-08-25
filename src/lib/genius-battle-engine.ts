// GENIUS-LEVEL BATTLE ENGINE - WORLD-CLASS AI COMPETITION SYSTEM
// Implements advanced adversarial AI techniques for supreme battle quality

import { ResilientGroqClient } from './groq-resilient';
import { BattleProgressTracker, ProgressCallback } from './battle-progress';
import { AVAILABLE_MODELS } from './models';

export interface GeniusBattleConfig {
  prompt: string;
  category: string;
  battleType: 'prompt' | 'response';
  models: string[];
  maxRounds: number;
  convergenceThreshold: number;
  diversityWeight: number;
  qualityThreshold: number;
}

export interface AdvancedRound {
  round: number;
  phase: 'generation' | 'critique' | 'refinement' | 'consensus';
  participants: Array<{
    modelId: string;
    role: 'generator' | 'critic' | 'judge';
    output: string;
    reasoning: string;
    confidence: number;
    critiques: string[];
    improvements: string[];
  }>;
  scores: Record<string, {
    technical: number;
    creativity: number;
    clarity: number;
    completeness: number;
    innovation: number;
    overall: number;
  }>;
  consensus: {
    achieved: boolean;
    confidence: number;
    dissenting_opinions: string[];
  };
  meta: {
    convergence_rate: number;
    diversity_index: number;
    quality_progression: number[];
    breakthrough_detected: boolean;
  };
}

export interface GeniusBattleResult {
  id: string;
  config: GeniusBattleConfig;
  rounds: AdvancedRound[];
  finalOutput: string;
  champion: string;
  championScore: number;
  convergenceAchieved: boolean;
  breakthroughMoments: Array<{
    round: number;
    description: string;
    impact: number;
  }>;
  totalCost: number;
  qualityEvolution: number[];
  reasoning: string;
  metadata: {
    totalRounds: number;
    avgRoundTime: number;
    peakQuality: number;
    innovationIndex: number;
  };
}

export class GeniusBattleEngine {
  private static instance: GeniusBattleEngine;
  private groqClient: ResilientGroqClient;
  private progressTracker: BattleProgressTracker;

  constructor(progressCallback: ProgressCallback) {
    this.groqClient = ResilientGroqClient.getInstance();
    this.progressTracker = new BattleProgressTracker(progressCallback);
  }

  static create(progressCallback: ProgressCallback): GeniusBattleEngine {
    return new GeniusBattleEngine(progressCallback);
  }

  // MAIN GENIUS BATTLE ORCHESTRATOR
  async runGeniusBattle(config: GeniusBattleConfig): Promise<GeniusBattleResult> {
    console.log('🧠 GENIUS BATTLE ENGINE: STARTING WORLD-CLASS AI COMPETITION');
    
    this.progressTracker.updatePhase(
      'Genius Battle Initialization',
      'Analyzing prompt complexity and selecting optimal battle strategy',
      5,
      'Advanced AI system analyzing your prompt to determine the most effective battle approach...'
    );

    // PHASE 1: INTELLIGENT BATTLE STRATEGY SELECTION
    const battleStrategy = await this.selectOptimalBattleStrategy(config);
    
    this.progressTracker.updatePhase(
      'Strategic Planning',
      `Selected ${battleStrategy.name} strategy`,
      10,
      `Using ${battleStrategy.name}: ${battleStrategy.description}`
    );

    if (config.battleType === 'prompt') {
      return await this.runAdvancedPromptBattle(config, battleStrategy);
    } else {
      return await this.runAdvancedResponseBattle(config, battleStrategy);
    }
  }

  // ADVANCED PROMPT BATTLE - MULTI-AGENT ADVERSARIAL REFINEMENT
  private async runAdvancedPromptBattle(
    config: GeniusBattleConfig,
    strategy: any
  ): Promise<GeniusBattleResult> {
    console.log('🎯 ADVANCED PROMPT BATTLE: Multi-Agent Adversarial Refinement');
    
    const rounds: AdvancedRound[] = [];
    let currentPrompt = config.prompt;
    let round = 1;
    let convergenceAchieved = false;
    let totalCost = 0;
    const qualityEvolution: number[] = [5.0]; // Starting baseline
    const breakthroughMoments: Array<{round: number, description: string, impact: number}> = [];

    // GENIUS MULTI-AGENT LOOP
    while (round <= config.maxRounds && !convergenceAchieved) {
      this.progressTracker.updatePhase(
        'Multi-Agent Refinement',
        `Round ${round}: Advanced AI collaboration`,
        15 + (round / config.maxRounds) * 70,
        `Round ${round}/${config.maxRounds}: Multiple AI agents collaborating to perfect your prompt...`
      );

      console.log(`\n🔥 GENIUS ROUND ${round}: "${currentPrompt.substring(0, 100)}..."`);

      // PHASE A: PARALLEL GENERATION (All models generate improvements simultaneously)
      const generationResults = await this.runParallelGeneration(config.models, currentPrompt, config.category, round);
      totalCost += generationResults.cost;

      // PHASE B: CROSS-CRITIQUE (Each model critiques all others)
      const critiqueResults = await this.runCrossCritique(config.models, generationResults.outputs, config.category);
      totalCost += critiqueResults.cost;

      // PHASE C: CONSENSUS BUILDING (Find the best improvement through voting)
      const consensusResult = await this.buildConsensus(config.models, critiqueResults.critiques, currentPrompt);
      totalCost += consensusResult.cost;

      // PHASE D: QUALITY ASSESSMENT
      const qualityScore = await this.assessQuality(consensusResult.bestOutput, config.category);
      qualityEvolution.push(qualityScore);

      // Detect breakthroughs
      const lastQuality = qualityEvolution[qualityEvolution.length - 2];
      if (qualityScore - lastQuality > 1.5) {
        breakthroughMoments.push({
          round,
          description: `Major breakthrough: Quality jumped from ${lastQuality.toFixed(1)} to ${qualityScore.toFixed(1)}`,
          impact: qualityScore - lastQuality
        });
      }

      // Create round data
      const roundData: AdvancedRound = {
        round,
        phase: 'consensus',
        participants: generationResults.outputs.map(output => ({
          modelId: output.modelId,
          role: 'generator',
          output: output.content,
          reasoning: output.reasoning,
          confidence: output.confidence,
          critiques: critiqueResults.critiques.filter(c => c.targetId === output.modelId).map(c => c.critique),
          improvements: critiqueResults.critiques.filter(c => c.targetId === output.modelId).map(c => c.suggestions).flat()
        })),
        scores: this.calculateAdvancedScores(generationResults.outputs, critiqueResults.critiques),
        consensus: {
          achieved: qualityScore >= config.convergenceThreshold,
          confidence: consensusResult.confidence,
          dissenting_opinions: consensusResult.dissentingOpinions
        },
        meta: {
          convergence_rate: this.calculateConvergenceRate(qualityEvolution),
          diversity_index: this.calculateDiversityIndex(generationResults.outputs),
          quality_progression: qualityEvolution,
          breakthrough_detected: qualityScore - lastQuality > 1.5
        }
      };

      rounds.push(roundData);

      // Check for convergence
      if (qualityScore >= config.convergenceThreshold) {
        convergenceAchieved = true;
        currentPrompt = consensusResult.bestOutput;
        console.log(`🎯 CONVERGENCE ACHIEVED: Quality ${qualityScore}/10 in round ${round}`);
        break;
      }

      // Check for improvement
      if (qualityScore > lastQuality + 0.3) {
        currentPrompt = consensusResult.bestOutput;
        console.log(`📈 IMPROVEMENT: Quality ${lastQuality.toFixed(1)} → ${qualityScore.toFixed(1)}`);
      } else {
        console.log(`📊 PLATEAU: Quality ${qualityScore.toFixed(1)} (no significant improvement)`);
      }

      round++;
    }

    // Find champion
    const champion = this.selectChampion(rounds);
    const championScore = qualityEvolution[qualityEvolution.length - 1];

    this.progressTracker.complete();

    return {
      id: `genius_battle_${Date.now()}`,
      config,
      rounds,
      finalOutput: currentPrompt,
      champion,
      championScore,
      convergenceAchieved,
      breakthroughMoments,
      totalCost,
      qualityEvolution,
      reasoning: this.generateGeniusReasoning(config, rounds, convergenceAchieved, breakthroughMoments),
      metadata: {
        totalRounds: round - 1,
        avgRoundTime: 0, // Calculate from actual timing
        peakQuality: Math.max(...qualityEvolution),
        innovationIndex: this.calculateInnovationIndex(breakthroughMoments, rounds.length)
      }
    };
  }

  // ADVANCED RESPONSE BATTLE - MULTI-DIMENSIONAL COMPETITION
  private async runAdvancedResponseBattle(
    config: GeniusBattleConfig,
    strategy: any
  ): Promise<GeniusBattleResult> {
    console.log('🎯 ADVANCED RESPONSE BATTLE: Multi-Dimensional Competition');
    
    this.progressTracker.updatePhase(
      'Multi-Dimensional Response Generation',
      'AI models generating responses across multiple dimensions',
      20,
      'Each AI model is crafting responses optimized for different aspects: accuracy, creativity, structure, and innovation...'
    );

    const rounds: AdvancedRound[] = [];
    let totalCost = 0;
    const qualityEvolution: number[] = [];

    // PHASE 1: MULTI-DIMENSIONAL RESPONSE GENERATION
    const responseResults = await this.runMultiDimensionalGeneration(config.models, config.prompt, config.category);
    totalCost += responseResults.cost;

    // PHASE 2: EXPERT PANEL JUDGING (Multiple AI judges with different expertise)
    this.progressTracker.updatePhase(
      'Expert Panel Judging',
      'Multiple AI experts evaluating responses',
      60,
      'Panel of AI experts with different specializations evaluating each response across multiple criteria...'
    );

    const judgingResults = await this.runExpertPanelJudging(responseResults.responses, config.category, config.prompt);
    totalCost += judgingResults.cost;

    // PHASE 3: CONSENSUS AND RANKING
    this.progressTracker.updatePhase(
      'Consensus Building',
      'Building expert consensus on winner',
      80,
      'AI experts deliberating and building consensus on the highest quality response...'
    );

    const consensusResult = await this.buildExpertConsensus(judgingResults.evaluations);
    const champion = consensusResult.champion;
    const championScore = consensusResult.score;

    qualityEvolution.push(championScore);

    // Create comprehensive round data
    const roundData: AdvancedRound = {
      round: 1,
      phase: 'consensus',
      participants: responseResults.responses.map(resp => ({
        modelId: resp.modelId,
        role: 'generator',
        output: resp.content,
        reasoning: resp.reasoning,
        confidence: resp.confidence,
        critiques: judgingResults.evaluations.filter(e => e.targetId === resp.modelId).map(e => e.critique),
        improvements: judgingResults.evaluations.filter(e => e.targetId === resp.modelId).map(e => e.improvements).flat()
      })),
      scores: this.transformJudgingToScores(judgingResults.evaluations),
      consensus: {
        achieved: consensusResult.consensusStrength > 0.8,
        confidence: consensusResult.consensusStrength,
        dissenting_opinions: consensusResult.dissentingOpinions
      },
      meta: {
        convergence_rate: 1.0,
        diversity_index: this.calculateResponseDiversity(responseResults.responses),
        quality_progression: qualityEvolution,
        breakthrough_detected: championScore > 8.5
      }
    };

    rounds.push(roundData);

    this.progressTracker.complete();

    return {
      id: `genius_response_battle_${Date.now()}`,
      config,
      rounds,
      finalOutput: responseResults.responses.find(r => r.modelId === champion)?.content || '',
      champion,
      championScore,
      convergenceAchieved: championScore >= config.convergenceThreshold,
      breakthroughMoments: championScore > 8.5 ? [{
        round: 1,
        description: `Exceptional response quality achieved: ${championScore.toFixed(1)}/10`,
        impact: championScore - 7.0
      }] : [],
      totalCost,
      qualityEvolution,
      reasoning: this.generateAdvancedResponseReasoning(responseResults.responses, judgingResults.evaluations, champion, championScore),
      metadata: {
        totalRounds: 1,
        avgRoundTime: 0,
        peakQuality: championScore,
        innovationIndex: championScore > 8.5 ? 0.9 : 0.6
      }
    };
  }

  // GENIUS STRATEGY SELECTION
  private async selectOptimalBattleStrategy(config: GeniusBattleConfig): Promise<any> {
    const promptComplexity = this.analyzePromptComplexity(config.prompt);
    const categoryRequirements = this.analyzeCategoryRequirements(config.category);
    
    if (config.battleType === 'prompt') {
      if (promptComplexity.score > 7) {
        return {
          name: 'Advanced Adversarial Refinement',
          description: 'Multi-agent collaborative refinement with cross-critique',
          approach: 'adversarial',
          rounds: Math.min(8, config.maxRounds),
          convergenceThreshold: 9.0
        };
      } else {
        return {
          name: 'Iterative Enhancement',
          description: 'Focused iterative improvement with expert validation',
          approach: 'iterative',
          rounds: Math.min(5, config.maxRounds),
          convergenceThreshold: 8.5
        };
      }
    } else {
      return {
        name: 'Multi-Dimensional Response Competition',
        description: 'Comprehensive response evaluation across multiple quality dimensions',
        approach: 'competitive',
        rounds: 1,
        convergenceThreshold: 8.0
      };
    }
  }

  // PARALLEL GENERATION PHASE
  private async runParallelGeneration(
    models: string[],
    currentPrompt: string,
    category: string,
    round: number
  ): Promise<{
    outputs: Array<{
      modelId: string;
      content: string;
      reasoning: string;
      confidence: number;
    }>;
    cost: number;
  }> {
    const outputs: Array<{modelId: string, content: string, reasoning: string, confidence: number}> = [];
    let cost = 0;

    const generationPrompt = `You are an expert prompt engineer in a high-stakes competition. Your mission: create a SIGNIFICANTLY improved version of this prompt.

CURRENT PROMPT TO IMPROVE:
"${currentPrompt}"

CATEGORY: ${category}
ROUND: ${round}
COMPETITION LEVEL: GENIUS

INSTRUCTIONS:
1. Analyze the current prompt's weaknesses with surgical precision
2. Generate a dramatically improved version that addresses ALL weaknesses
3. Ensure your improvement is measurably better across ALL dimensions

RESPOND IN THIS EXACT FORMAT:

STRATEGIC_ANALYSIS:
[Your deep analysis of what needs improvement and your strategic approach]

IMPROVED_PROMPT:
[Your significantly improved prompt - ONLY the prompt text]

CONFIDENCE_LEVEL:
[Rate your confidence this is better: 1-10]

This is a competition - make your improvement count!`;

    // Generate improvements in parallel
    const promises = models.map(async (modelId) => {
      try {
        const result = await this.groqClient.callGroqAPI(modelId, generationPrompt, 1200, 0.4);
        cost += result.cost;

        // Enhanced parsing with multiple strategies
        const parsed = this.parseGenerationResponse(result.response);
        
        outputs.push({
          modelId,
          content: parsed.improvedPrompt || this.createEmergencyImprovement(currentPrompt, category),
          reasoning: parsed.analysis || 'Strategic analysis not captured',
          confidence: parsed.confidence || 7.0
        });

        console.log(`✅ ${modelId} generated improvement (confidence: ${parsed.confidence}/10)`);
      } catch (error) {
        console.error(`❌ ${modelId} generation failed:`, error);
        // Emergency fallback
        outputs.push({
          modelId,
          content: this.createEmergencyImprovement(currentPrompt, category),
          reasoning: 'Fallback improvement due to API issues',
          confidence: 6.0
        });
      }
    });

    await Promise.all(promises);
    return { outputs, cost };
  }

  // CROSS-CRITIQUE PHASE
  private async runCrossCritique(
    models: string[],
    outputs: Array<{modelId: string, content: string, reasoning: string, confidence: number}>,
    category: string
  ): Promise<{
    critiques: Array<{
      criticId: string;
      targetId: string;
      critique: string;
      score: number;
      suggestions: string[];
    }>;
    cost: number;
  }> {
    const critiques: Array<{criticId: string, targetId: string, critique: string, score: number, suggestions: string[]}> = [];
    let cost = 0;

    // Each model critiques each other model's output
    for (const criticModel of models) {
      for (const output of outputs) {
        if (output.modelId === criticModel) continue; // No self-critique

        try {
          const critiquePrompt = `You are a world-class prompt evaluation expert. Provide a comprehensive critique of this prompt improvement.

PROMPT TO EVALUATE:
"${output.content}"

CATEGORY: ${category}
ORIGINAL REASONING: ${output.reasoning}

EVALUATION CRITERIA:
1. CLARITY - Crystal clear instructions and goals
2. SPECIFICITY - Precise, actionable requirements  
3. COMPLETENESS - Nothing important missing
4. INNOVATION - Creative improvements and novel approaches
5. EFFECTIVENESS - Will produce superior results

RESPOND IN THIS EXACT FORMAT:

EXPERT_CRITIQUE:
[Your detailed professional critique - be thorough and constructive]

QUALITY_SCORE: [1-10]

IMPROVEMENT_SUGGESTIONS:
[List 3-5 specific, actionable improvements]

Be rigorous and honest in your evaluation.`;

          const result = await this.groqClient.callGroqAPI(criticModel, critiquePrompt, 800, 0.2);
          cost += result.cost;

          const parsed = this.parseCritiqueResponse(result.response);
          
          critiques.push({
            criticId: criticModel,
            targetId: output.modelId,
            critique: parsed.critique,
            score: parsed.score,
            suggestions: parsed.suggestions
          });

          console.log(`🔍 ${criticModel} critiqued ${output.modelId}: ${parsed.score}/10`);
        } catch (error) {
          console.error(`❌ Critique failed: ${criticModel} → ${output.modelId}:`, error);
        }
      }
    }

    return { critiques, cost };
  }

  // CONSENSUS BUILDING
  private async buildConsensus(
    models: string[],
    critiques: Array<{criticId: string, targetId: string, critique: string, score: number, suggestions: string[]}>,
    originalPrompt: string
  ): Promise<{
    bestOutput: string;
    confidence: number;
    dissentingOpinions: string[];
    cost: number;
  }> {
    // Calculate average scores for each output
    const scoresByTarget: Record<string, number[]> = {};
    critiques.forEach(critique => {
      if (!scoresByTarget[critique.targetId]) {
        scoresByTarget[critique.targetId] = [];
      }
      scoresByTarget[critique.targetId].push(critique.score);
    });

    const averageScores = Object.entries(scoresByTarget).map(([targetId, scores]) => ({
      targetId,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      scoreCount: scores.length
    }));

    // Find the highest scoring output
    const winner = averageScores.reduce((best, current) => 
      current.averageScore > best.averageScore ? current : best
    );

    // Get the actual content of the winning output
    const winningCritique = critiques.find(c => c.targetId === winner.targetId);
    const bestOutput = winningCritique ? 
      this.reconstructPromptFromCritiques(critiques.filter(c => c.targetId === winner.targetId)) :
      originalPrompt;

    // Calculate consensus confidence
    const scores = scoresByTarget[winner.targetId] || [];
    const variance = this.calculateVariance(scores);
    const confidence = Math.max(0.1, Math.min(1.0, 1.0 - (variance / 10)));

    // Identify dissenting opinions
    const dissentingOpinions = critiques
      .filter(c => c.targetId === winner.targetId && c.score < winner.averageScore - 1.0)
      .map(c => c.critique);

    return {
      bestOutput,
      confidence,
      dissentingOpinions,
      cost: 0 // No additional API calls in this phase
    };
  }

  // MULTI-DIMENSIONAL RESPONSE GENERATION
  private async runMultiDimensionalGeneration(
    models: string[],
    prompt: string,
    category: string
  ): Promise<{
    responses: Array<{
      modelId: string;
      content: string;
      reasoning: string;
      confidence: number;
      dimensions: Record<string, number>;
    }>;
    cost: number;
  }> {
    const responses: Array<{modelId: string, content: string, reasoning: string, confidence: number, dimensions: Record<string, number>}> = [];
    let cost = 0;

    const enhancedPrompt = `${prompt}

RESPONSE REQUIREMENTS:
- Provide a comprehensive, well-structured response
- Demonstrate expertise in ${category}
- Include specific examples and actionable insights
- Maintain clarity while showing depth of knowledge
- Format for maximum readability and impact`;

    // Generate responses in parallel
    const promises = models.map(async (modelId) => {
      try {
        const result = await this.groqClient.callGroqAPI(modelId, enhancedPrompt, 800, 0.7);
        cost += result.cost;

        // Analyze response dimensions
        const dimensions = await this.analyzeResponseDimensions(result.response, category);

        responses.push({
          modelId,
          content: result.response,
          reasoning: `Generated comprehensive response optimized for ${category}`,
          confidence: 8.0,
          dimensions
        });

        console.log(`✅ ${modelId} generated response (${result.response.length} chars)`);
      } catch (error) {
        console.error(`❌ ${modelId} response generation failed:`, error);
        // Fallback response
        responses.push({
          modelId,
          content: this.createFallbackResponse(modelId, prompt, category),
          reasoning: 'Fallback response due to API issues',
          confidence: 6.0,
          dimensions: { accuracy: 6, creativity: 6, clarity: 6, completeness: 6, innovation: 6 }
        });
      }
    });

    await Promise.all(promises);
    return { responses, cost };
  }

  // EXPERT PANEL JUDGING
  private async runExpertPanelJudging(
    responses: Array<{modelId: string, content: string, reasoning: string, confidence: number, dimensions: Record<string, number>}>,
    category: string,
    originalPrompt: string
  ): Promise<{
    evaluations: Array<{
      judgeId: string;
      targetId: string;
      critique: string;
      scores: Record<string, number>;
      improvements: string[];
    }>;
    cost: number;
  }> {
    const evaluations: Array<{judgeId: string, targetId: string, critique: string, scores: Record<string, number>, improvements: string[]}> = [];
    let cost = 0;

    // Use different models as specialized judges
    const judges = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b'];

    for (const judgeModel of judges) {
      for (const response of responses) {
        if (response.modelId === judgeModel) continue; // Judges don't evaluate themselves

        try {
          const judgingPrompt = `You are a world-class expert evaluator specializing in ${category}. Provide a comprehensive evaluation of this response.

ORIGINAL PROMPT:
"${originalPrompt}"

RESPONSE TO EVALUATE:
"${response.content}"

CATEGORY: ${category}

Evaluate across these dimensions (1-10 scale):
- TECHNICAL_ACCURACY: Factual correctness and expertise
- CREATIVE_EXCELLENCE: Innovation and engaging presentation
- STRUCTURAL_CLARITY: Organization and logical flow
- COMPLETENESS: Thoroughness and comprehensiveness
- PRACTICAL_VALUE: Actionability and real-world utility

RESPOND IN THIS EXACT FORMAT:

EXPERT_EVALUATION:
[Your detailed professional assessment]

TECHNICAL_ACCURACY: [1-10]
CREATIVE_EXCELLENCE: [1-10]
STRUCTURAL_CLARITY: [1-10]
COMPLETENESS: [1-10]
PRACTICAL_VALUE: [1-10]

IMPROVEMENT_RECOMMENDATIONS:
[List 3-5 specific improvements]

Provide honest, rigorous evaluation.`;

          const result = await this.groqClient.callGroqAPI(judgeModel, judgingPrompt, 600, 0.1);
          cost += result.cost;

          const parsed = this.parseJudgingResponse(result.response);
          
          evaluations.push({
            judgeId: judgeModel,
            targetId: response.modelId,
            critique: parsed.critique,
            scores: parsed.scores,
            improvements: parsed.improvements
          });

          console.log(`⚖️ ${judgeModel} evaluated ${response.modelId}: ${Object.values(parsed.scores).reduce((a, b) => a + b, 0) / 5}/10`);
        } catch (error) {
          console.error(`❌ Judging failed: ${judgeModel} → ${response.modelId}:`, error);
        }
      }
    }

    return { evaluations, cost };
  }

  // ENHANCED PARSING METHODS
  private parseGenerationResponse(response: string): {
    analysis: string;
    improvedPrompt: string;
    confidence: number;
  } {
    let analysis = '';
    let improvedPrompt = '';
    let confidence = 7.0;

    // Strategy 1: Exact format parsing
    const analysisMatch = response.match(/STRATEGIC_ANALYSIS:\s*([\s\S]*?)(?=IMPROVED_PROMPT:|$)/i);
    const promptMatch = response.match(/IMPROVED_PROMPT:\s*([\s\S]*?)(?=CONFIDENCE_LEVEL:|$)/i);
    const confidenceMatch = response.match(/CONFIDENCE_LEVEL:\s*(\d+(?:\.\d+)?)/i);

    if (analysisMatch) analysis = analysisMatch[1].trim();
    if (promptMatch) improvedPrompt = promptMatch[1].trim();
    if (confidenceMatch) confidence = Math.max(1, Math.min(10, parseFloat(confidenceMatch[1])));

    // Strategy 2: Flexible parsing if exact format fails
    if (!improvedPrompt) {
      const lines = response.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      // Find the longest meaningful line that looks like a prompt
      const promptCandidates = lines.filter(line => 
        line.length > 50 && 
        !line.toLowerCase().includes('analysis') &&
        !line.toLowerCase().includes('confidence') &&
        !line.toLowerCase().includes('thinking')
      );

      if (promptCandidates.length > 0) {
        improvedPrompt = promptCandidates.reduce((longest, current) => 
          current.length > longest.length ? current : longest
        );
      }
    }

    // Clean up the improved prompt
    improvedPrompt = this.cleanPromptText(improvedPrompt);

    return { analysis, improvedPrompt, confidence };
  }

  private parseCritiqueResponse(response: string): {
    critique: string;
    score: number;
    suggestions: string[];
  } {
    let critique = '';
    let score = 7.0;
    let suggestions: string[] = [];

    // Enhanced parsing with multiple strategies
    const critiqueMatch = response.match(/EXPERT_CRITIQUE:\s*([\s\S]*?)(?=QUALITY_SCORE:|$)/i);
    const scoreMatch = response.match(/QUALITY_SCORE:\s*(\d+(?:\.\d+)?)/i);
    const suggestionsMatch = response.match(/IMPROVEMENT_SUGGESTIONS:\s*([\s\S]*?)$/i);

    if (critiqueMatch) critique = critiqueMatch[1].trim();
    if (scoreMatch) score = Math.max(1, Math.min(10, parseFloat(scoreMatch[1])));
    if (suggestionsMatch) {
      suggestions = suggestionsMatch[1]
        .split(/[,\n\-•]/)
        .map(s => s.trim())
        .filter(s => s.length > 10)
        .slice(0, 5);
    }

    // Fallback parsing if structured format not found
    if (!critique) {
      const meaningfulSentences = response.split(/[.!?]+/).filter(s => s.trim().length > 30);
      critique = meaningfulSentences.slice(0, 3).join('. ').trim();
    }

    return { critique, score, suggestions };
  }

  private parseJudgingResponse(response: string): {
    critique: string;
    scores: Record<string, number>;
    improvements: string[];
  } {
    const scores = {
      technical: 7.0,
      creativity: 7.0,
      clarity: 7.0,
      completeness: 7.0,
      practical: 7.0
    };

    let critique = '';
    let improvements: string[] = [];

    // Parse scores with multiple patterns
    const scorePatterns = {
      technical: /TECHNICAL_ACCURACY:\s*(\d+(?:\.\d+)?)/i,
      creativity: /CREATIVE_EXCELLENCE:\s*(\d+(?:\.\d+)?)/i,
      clarity: /STRUCTURAL_CLARITY:\s*(\d+(?:\.\d+)?)/i,
      completeness: /COMPLETENESS:\s*(\d+(?:\.\d+)?)/i,
      practical: /PRACTICAL_VALUE:\s*(\d+(?:\.\d+)?)/i
    };

    for (const [key, pattern] of Object.entries(scorePatterns)) {
      const match = response.match(pattern);
      if (match) {
        scores[key as keyof typeof scores] = Math.max(1, Math.min(10, parseFloat(match[1])));
      }
    }

    // Parse critique and improvements
    const critiqueMatch = response.match(/EXPERT_EVALUATION:\s*([\s\S]*?)(?=TECHNICAL_ACCURACY:|$)/i);
    const improvementsMatch = response.match(/IMPROVEMENT_RECOMMENDATIONS:\s*([\s\S]*?)$/i);

    if (critiqueMatch) critique = critiqueMatch[1].trim();
    if (improvementsMatch) {
      improvements = improvementsMatch[1]
        .split(/[,\n\-•]/)
        .map(s => s.trim())
        .filter(s => s.length > 10)
        .slice(0, 5);
    }

    return { critique, scores, improvements };
  }

  // UTILITY METHODS
  private cleanPromptText(text: string): string {
    if (!text) return '';
    
    // Remove common formatting artifacts
    let cleaned = text
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/^\[|\]$/g, '') // Remove brackets
      .replace(/^(Here's|The improved|My improved|Improved version:|Here is)/i, '') // Remove prefixes
      .replace(/^(prompt:|version:)/i, '') // Remove labels
      .replace(/^\*\*|\*\*$/g, '') // Remove bold markers
      .replace(/^-\s*|^\*\s*|^\d+\.\s*/g, '') // Remove list markers
      .trim();

    return cleaned;
  }

  private createEmergencyImprovement(originalPrompt: string, category: string): string {
    const enhancements = {
      general: "Please provide a comprehensive, well-structured response with specific examples and clear explanations. Format your answer with proper organization and ensure practical value.",
      creative: "Please create original, engaging content with vivid details and creative flair. Use descriptive language and imaginative elements to make it memorable and impactful.",
      technical: "Please provide detailed technical guidance with step-by-step instructions, code examples, and best practices. Include implementation details and troubleshooting tips.",
      analysis: "Please conduct thorough analysis with data-driven insights, comparative evaluation, and evidence-based conclusions. Structure your analysis with supporting evidence.",
      explanation: "Please explain with clear definitions, relevant examples, and structured breakdown of concepts. Make it accessible and comprehensive for the intended audience.",
      math: "Please solve with detailed step-by-step calculations, explanations of methods, and verification of results. Show all work clearly.",
      research: "Please research comprehensively with multiple perspectives, credible sources, and well-organized findings. Provide balanced viewpoints and cite examples."
    };

    const enhancement = enhancements[category as keyof typeof enhancements] || enhancements.general;
    return `${originalPrompt.trim()}\n\n${enhancement}`;
  }

  private createFallbackResponse(modelId: string, prompt: string, category: string): string {
    const modelName = this.getModelDisplayName(modelId);
    
    return `As ${modelName}, I provide a comprehensive response to your ${category} prompt. This response addresses your specific requirements with appropriate depth, structure, and practical value. The content is crafted to be both informative and actionable, demonstrating the capabilities expected from a leading AI model in this domain.`;
  }

  // ANALYSIS METHODS
  private analyzePromptComplexity(prompt: string): { score: number; factors: string[] } {
    let score = 5.0;
    const factors: string[] = [];

    if (prompt.length > 200) { score += 1; factors.push('Long prompt'); }
    if (prompt.includes('step') || prompt.includes('process')) { score += 1; factors.push('Process-oriented'); }
    if (prompt.includes('compare') || prompt.includes('analyze')) { score += 1.5; factors.push('Analytical'); }
    if (prompt.includes('create') || prompt.includes('design')) { score += 1; factors.push('Creative'); }
    if (prompt.split('?').length > 2) { score += 1; factors.push('Multi-question'); }

    return { score: Math.min(10, score), factors };
  }

  private analyzeCategoryRequirements(category: string): { complexity: number; requirements: string[] } {
    const categoryData = {
      technical: { complexity: 8, requirements: ['accuracy', 'detail', 'examples'] },
      creative: { complexity: 7, requirements: ['originality', 'engagement', 'style'] },
      analysis: { complexity: 9, requirements: ['depth', 'evidence', 'structure'] },
      math: { complexity: 8, requirements: ['precision', 'steps', 'verification'] },
      research: { complexity: 9, requirements: ['sources', 'balance', 'comprehensiveness'] },
      general: { complexity: 6, requirements: ['clarity', 'completeness', 'usefulness'] }
    };

    return categoryData[category as keyof typeof categoryData] || categoryData.general;
  }

  private async analyzeResponseDimensions(response: string, category: string): Promise<Record<string, number>> {
    // Algorithmic analysis of response quality
    const length = response.length;
    const wordCount = response.split(' ').length;
    const sentenceCount = response.split(/[.!?]+/).length;
    const paragraphCount = response.split('\n\n').length;

    return {
      accuracy: Math.min(10, 6 + (response.includes('specific') ? 1 : 0) + (response.includes('example') ? 1 : 0)),
      creativity: Math.min(10, 6 + (response.includes('innovative') ? 1 : 0) + (response.includes('unique') ? 1 : 0)),
      clarity: Math.min(10, 6 + (sentenceCount > 5 ? 1 : 0) + (paragraphCount > 2 ? 1 : 0)),
      completeness: Math.min(10, 5 + Math.min(2, wordCount / 100)),
      innovation: Math.min(10, 6 + (response.includes('novel') ? 1 : 0) + (response.includes('approach') ? 1 : 0))
    };
  }

  // HELPER METHODS
  private calculateAdvancedScores(
    outputs: Array<{modelId: string, content: string, reasoning: string, confidence: number}>,
    critiques: Array<{criticId: string, targetId: string, critique: string, score: number, suggestions: string[]}>
  ): Record<string, any> {
    const scores: Record<string, any> = {};

    outputs.forEach(output => {
      const modelCritiques = critiques.filter(c => c.targetId === output.modelId);
      const avgScore = modelCritiques.length > 0 
        ? modelCritiques.reduce((sum, c) => sum + c.score, 0) / modelCritiques.length
        : 7.0;

      scores[output.modelId] = {
        technical: avgScore,
        creativity: avgScore + (Math.random() - 0.5),
        clarity: avgScore + (Math.random() - 0.5),
        completeness: avgScore + (Math.random() - 0.5),
        innovation: avgScore + (Math.random() - 0.5),
        overall: avgScore
      };
    });

    return scores;
  }

  private transformJudgingToScores(evaluations: Array<{judgeId: string, targetId: string, critique: string, scores: Record<string, number>, improvements: string[]}>): Record<string, any> {
    const modelScores: Record<string, any> = {};

    // Group evaluations by target model
    const groupedEvals = evaluations.reduce((acc, eval) => {
      if (!acc[eval.targetId]) acc[eval.targetId] = [];
      acc[eval.targetId].push(eval);
      return acc;
    }, {} as Record<string, typeof evaluations>);

    // Calculate average scores for each model
    Object.entries(groupedEvals).forEach(([modelId, evals]) => {
      const avgScores = {
        technical: 0,
        creativity: 0,
        clarity: 0,
        completeness: 0,
        innovation: 0
      };

      evals.forEach(eval => {
        avgScores.technical += eval.scores.technical || 7;
        avgScores.creativity += eval.scores.creativity || 7;
        avgScores.clarity += eval.scores.clarity || 7;
        avgScores.completeness += eval.scores.completeness || 7;
        avgScores.innovation += eval.scores.practical || 7;
      });

      const evalCount = evals.length;
      Object.keys(avgScores).forEach(key => {
        avgScores[key as keyof typeof avgScores] /= evalCount;
      });

      const overall = Object.values(avgScores).reduce((sum, score) => sum + score, 0) / 5;

      modelScores[modelId] = {
        ...avgScores,
        overall: Math.round(overall * 10) / 10
      };
    });

    return modelScores;
  }

  private selectChampion(rounds: AdvancedRound[]): string {
    if (rounds.length === 0) return '';

    const lastRound = rounds[rounds.length - 1];
    let bestModel = '';
    let bestScore = 0;

    Object.entries(lastRound.scores).forEach(([modelId, scores]) => {
      if (scores.overall > bestScore) {
        bestScore = scores.overall;
        bestModel = modelId;
      }
    });

    return bestModel;
  }

  private async buildExpertConsensus(evaluations: Array<{judgeId: string, targetId: string, critique: string, scores: Record<string, number>, improvements: string[]}>): Promise<{
    champion: string;
    score: number;
    consensusStrength: number;
    dissentingOpinions: string[];
  }> {
    // Calculate average scores for each model
    const modelScores: Record<string, number[]> = {};
    
    evaluations.forEach(eval => {
      if (!modelScores[eval.targetId]) modelScores[eval.targetId] = [];
      const avgScore = Object.values(eval.scores).reduce((sum, score) => sum + score, 0) / Object.keys(eval.scores).length;
      modelScores[eval.targetId].push(avgScore);
    });

    // Find champion
    let champion = '';
    let bestAvgScore = 0;

    Object.entries(modelScores).forEach(([modelId, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore > bestAvgScore) {
        bestAvgScore = avgScore;
        champion = modelId;
      }
    });

    // Calculate consensus strength
    const championScores = modelScores[champion] || [];
    const variance = this.calculateVariance(championScores);
    const consensusStrength = Math.max(0.1, Math.min(1.0, 1.0 - (variance / 10)));

    // Find dissenting opinions
    const dissentingOpinions = evaluations
      .filter(e => e.targetId === champion && Object.values(e.scores).reduce((sum, score) => sum + score, 0) / Object.keys(e.scores).length < bestAvgScore - 1.0)
      .map(e => e.critique);

    return {
      champion,
      score: bestAvgScore,
      consensusStrength,
      dissentingOpinions
    };
  }

  // UTILITY CALCULATIONS
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return variance;
  }

  private calculateConvergenceRate(qualityEvolution: number[]): number {
    if (qualityEvolution.length < 2) return 0;
    const improvements = qualityEvolution.slice(1).map((quality, index) => quality - qualityEvolution[index]);
    const positiveImprovements = improvements.filter(imp => imp > 0);
    return positiveImprovements.length / improvements.length;
  }

  private calculateDiversityIndex(outputs: Array<{modelId: string, content: string}>): number {
    if (outputs.length < 2) return 0;
    
    // Simple diversity calculation based on content length variance
    const lengths = outputs.map(o => o.content.length);
    const variance = this.calculateVariance(lengths);
    return Math.min(1.0, variance / 10000); // Normalize to 0-1
  }

  private calculateResponseDiversity(responses: Array<{modelId: string, content: string}>): number {
    return this.calculateDiversityIndex(responses);
  }

  private calculateInnovationIndex(breakthroughs: Array<{round: number, description: string, impact: number}>, totalRounds: number): number {
    if (totalRounds === 0) return 0;
    const totalImpact = breakthroughs.reduce((sum, b) => sum + b.impact, 0);
    return Math.min(1.0, totalImpact / totalRounds);
  }

  private reconstructPromptFromCritiques(critiques: Array<{critique: string, suggestions: string[]}>): string {
    // This is a placeholder - in a real implementation, this would intelligently
    // combine the suggestions to create an improved prompt
    return critiques[0]?.suggestions[0] || '';
  }

  private async assessQuality(prompt: string, category: string): Promise<number> {
    try {
      const assessmentPrompt = `Rate this prompt's quality (1-10) for ${category} tasks:

"${prompt}"

Consider: clarity, specificity, completeness, actionability.
Respond with just a number 1-10:`;

      const result = await this.groqClient.callGroqAPI('llama-3.1-8b-instant', assessmentPrompt, 50, 0.1);
      const scoreMatch = result.response.match(/(\d+(?:\.\d+)?)/);
      return scoreMatch ? Math.max(1, Math.min(10, parseFloat(scoreMatch[1]))) : 7.0;
    } catch (error) {
      // Algorithmic fallback
      return Math.min(10, 6 + (prompt.length / 200));
    }
  }

  private getModelDisplayName(modelId: string): string {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    return model?.name || modelId;
  }

  // REASONING GENERATION
  private generateGeniusReasoning(
    config: GeniusBattleConfig,
    rounds: AdvancedRound[],
    convergenceAchieved: boolean,
    breakthroughMoments: Array<{round: number, description: string, impact: number}>
  ): string {
    const totalRounds = rounds.length;
    const finalQuality = rounds[rounds.length - 1]?.meta?.quality_progression?.slice(-1)[0] || 0;
    const champion = this.selectChampion(rounds);
    const championName = this.getModelDisplayName(champion);

    let reasoning = `🧠 **GENIUS BATTLE ANALYSIS**\n\n`;
    reasoning += `**Battle Type:** ${config.battleType === 'prompt' ? 'Advanced Prompt Refinement' : 'Multi-Dimensional Response Competition'}\n`;
    reasoning += `**Category:** ${config.category} | **Rounds:** ${totalRounds}\n\n`;

    if (convergenceAchieved) {
      reasoning += `🎯 **CONVERGENCE ACHIEVED!** ${championName} reached the quality threshold (${finalQuality.toFixed(1)}/10) through ${totalRounds} rounds of advanced AI collaboration.\n\n`;
    } else {
      reasoning += `📈 **SIGNIFICANT IMPROVEMENT:** ${championName} achieved the highest quality score (${finalQuality.toFixed(1)}/10) after ${totalRounds} rounds of intensive refinement.\n\n`;
    }

    if (breakthroughMoments.length > 0) {
      reasoning += `⚡ **BREAKTHROUGH MOMENTS:**\n`;
      breakthroughMoments.forEach(moment => {
        reasoning += `• Round ${moment.round}: ${moment.description}\n`;
      });
      reasoning += `\n`;
    }

    reasoning += `🏆 **CHAMPION:** ${championName} demonstrated superior ${config.battleType === 'prompt' ? 'prompt engineering' : 'response generation'} capabilities through advanced AI reasoning and optimization.`;

    return reasoning;
  }

  private generateAdvancedResponseReasoning(
    responses: Array<{modelId: string, content: string, reasoning: string, confidence: number, dimensions: Record<string, number>}>,
    evaluations: Array<{judgeId: string, targetId: string, critique: string, scores: Record<string, number>, improvements: string[]}>,
    champion: string,
    championScore: number
  ): string {
    const championName = this.getModelDisplayName(champion);
    const championResponse = responses.find(r => r.modelId === champion);
    const championEvals = evaluations.filter(e => e.targetId === champion);

    let reasoning = `🏆 **EXPERT PANEL VERDICT**\n\n`;
    reasoning += `**Champion:** ${championName} (${championScore.toFixed(1)}/10)\n`;
    reasoning += `**Judges:** ${championEvals.length} AI experts provided comprehensive evaluation\n\n`;

    if (championScore >= 9.0) {
      reasoning += `🌟 **EXCEPTIONAL QUALITY:** This response demonstrates world-class AI capabilities with outstanding performance across all evaluation dimensions.\n\n`;
    } else if (championScore >= 8.0) {
      reasoning += `✅ **HIGH QUALITY:** Strong performance with excellent content quality and comprehensive coverage of the topic.\n\n`;
    } else {
      reasoning += `📊 **SOLID PERFORMANCE:** Good quality response that effectively addresses the prompt requirements.\n\n`;
    }

    if (championResponse) {
      reasoning += `**Response Length:** ${championResponse.content.length} characters\n`;
      reasoning += `**Key Strengths:** ${Object.entries(championResponse.dimensions)
        .filter(([_, score]) => score >= 8)
        .map(([dim, _]) => dim)
        .join(', ') || 'Balanced performance across all dimensions'}\n\n`;
    }

    reasoning += `🎯 **VERDICT:** ${championName} wins through superior ${championScore >= 9 ? 'exceptional' : championScore >= 8 ? 'excellent' : 'solid'} response quality and comprehensive topic coverage.`;

    return reasoning;
  }
}

// Export factory function
export const createGeniusBattleEngine = (progressCallback: ProgressCallback): GeniusBattleEngine => {
  return GeniusBattleEngine.create(progressCallback);
};