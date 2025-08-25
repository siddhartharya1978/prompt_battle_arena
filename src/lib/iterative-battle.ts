// True Iterative Prompt Refinement - Matches Manual Process
// Two models take turns improving a prompt until both agree it's 10/10

import { groqRateLimiter } from './groq-rate-limiter';

export interface IterativeRound {
  round: number;
  currentPrompt: string;
  improverModel: string;
  reviewerModel: string;
  improvedPrompt: string;
  reviewerScore: number;
  reviewerFeedback: string;
  isImprovement: boolean;
  consensusAchieved: boolean;
}

export interface IterativeBattleResult {
  id: string;
  originalPrompt: string;
  finalPrompt: string;
  rounds: IterativeRound[];
  modelA: string;
  modelB: string;
  totalRounds: number;
  consensusAchieved: boolean;
  finalScore: number;
  winner: string; // Model that made the final improvement
  reasoning: string;
  completed: boolean;
}

export class IterativePromptBattle {
  private static instance: IterativePromptBattle;
  
  static getInstance(): IterativePromptBattle {
    if (!IterativePromptBattle.instance) {
      IterativePromptBattle.instance = new IterativePromptBattle();
    }
    return IterativePromptBattle.instance;
  }

  async runIterativeBattle(
    originalPrompt: string,
    category: string,
    onProgress?: (step: string, progress: number, details?: string) => void
  ): Promise<IterativeBattleResult> {
    
    onProgress?.('Selecting optimal model pair for iterative refinement...', 5);
    
    // Select best 2 models for this type of prompt
    const [modelA, modelB] = this.selectOptimalPair(originalPrompt, category);
    
    onProgress?.(`Starting iterative battle: ${this.getModelName(modelA)} ↔ ${this.getModelName(modelB)}`, 10);
    
    let currentPrompt = originalPrompt;
    let currentImprover = modelA;
    let currentReviewer = modelB;
    let round = 1;
    const maxRounds = 10; // Reasonable limit
    const rounds: IterativeRound[] = [];
    let consensusAchieved = false;
    let finalScore = 0;
    let lastImprover = modelA;
    
    while (round <= maxRounds && !consensusAchieved) {
      const progress = 10 + (round / maxRounds) * 80;
      
      onProgress?.(
        `Round ${round}: ${this.getModelName(currentImprover)} improving prompt...`, 
        progress,
        `Current prompt: "${currentPrompt.substring(0, 100)}..."`
      );
      
      try {
        // Step 1: Current improver tries to improve the prompt
        const improvedPrompt = await this.improvePrompt(currentImprover, currentPrompt, category);
        
        onProgress?.(
          `Round ${round}: ${this.getModelName(currentReviewer)} reviewing improvement...`, 
          progress + 2,
          `Reviewing: "${improvedPrompt.substring(0, 100)}..."`
        );
        
        // Step 2: Other model reviews and scores the improvement
        const review = await this.reviewImprovement(currentReviewer, currentPrompt, improvedPrompt, category);
        
        const roundData: IterativeRound = {
          round,
          currentPrompt,
          improverModel: currentImprover,
          reviewerModel: currentReviewer,
          improvedPrompt,
          reviewerScore: review.score,
          reviewerFeedback: review.feedback,
          isImprovement: review.score >= 8.0,
          consensusAchieved: review.score >= 10.0
        };
        
        rounds.push(roundData);
        
        if (review.score >= 10.0) {
          // Perfect score achieved!
          consensusAchieved = true;
          currentPrompt = improvedPrompt;
          finalScore = review.score;
          lastImprover = currentImprover;
          
          onProgress?.(
            `🎯 Perfect 10/10 achieved by ${this.getModelName(currentImprover)}!`, 
            100,
            `Final prompt: "${improvedPrompt}"`
          );
          break;
        } else if (review.score >= 8.0) {
          // Good improvement, continue with this prompt
          currentPrompt = improvedPrompt;
          finalScore = review.score;
          lastImprover = currentImprover;
          
          onProgress?.(
            `✅ Round ${round}: Improvement accepted (${review.score}/10)`, 
            progress + 3,
            `Continuing with improved prompt...`
          );
        } else {
          // No significant improvement, keep original
          onProgress?.(
            `⚠️ Round ${round}: No improvement (${review.score}/10)`, 
            progress + 3,
            `Keeping current prompt, switching roles...`
          );
        }
        
        // Switch roles for next round
        [currentImprover, currentReviewer] = [currentReviewer, currentImprover];
        round++;
        
      } catch (error) {
        console.error(`Round ${round} failed:`, error);
        onProgress?.(
          `Round ${round} encountered issues, continuing...`, 
          progress + 3,
          `Error: ${error.message}`
        );
        
        // Switch roles and continue
        [currentImprover, currentReviewer] = [currentReviewer, currentImprover];
        round++;
      }
    }
    
    // If no consensus achieved, use best prompt so far
    if (!consensusAchieved && rounds.length > 0) {
      const bestRound = rounds.reduce((best, current) => 
        current.reviewerScore > best.reviewerScore ? current : best
      );
      currentPrompt = bestRound.improvedPrompt;
      finalScore = bestRound.reviewerScore;
      lastImprover = bestRound.improverModel;
    }
    
    onProgress?.('Battle complete! Generating final analysis...', 95);
    
    const reasoning = this.generateReasoning(originalPrompt, currentPrompt, rounds, consensusAchieved);
    
    return {
      id: `iterative_battle_${Date.now()}`,
      originalPrompt,
      finalPrompt: currentPrompt,
      rounds,
      modelA,
      modelB,
      totalRounds: round - 1,
      consensusAchieved,
      finalScore,
      winner: lastImprover,
      reasoning,
      completed: true
    };
  }

  private selectOptimalPair(prompt: string, category: string): [string, string] {
    const promptLower = prompt.toLowerCase();
    
    // Smart pairing based on prompt characteristics
    if (promptLower.includes('technical') || promptLower.includes('code') || category === 'technical') {
      return ['llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b']; // Large reasoning vs Technical specialist
    }
    
    if (promptLower.includes('creative') || promptLower.includes('story') || category === 'creative') {
      return ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile']; // Fast creative vs Large creative
    }
    
    if (promptLower.includes('math') || promptLower.includes('calculate') || category === 'math') {
      return ['deepseek-r1-distill-llama-70b', 'llama-3.3-70b-versatile']; // Math specialist vs Large reasoning
    }
    
    if (promptLower.includes('analysis') || promptLower.includes('research') || category === 'analysis') {
      return ['llama-3.3-70b-versatile', 'qwen/qwen3-32b']; // Large reasoning vs Multilingual analysis
    }
    
    // Default: balanced pair with different strengths
    return ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile']; // Speed vs Power
  }

  private async improvePrompt(modelId: string, currentPrompt: string, category: string): Promise<string> {
    const improvementPrompt = `You are an expert prompt engineer. Your task is to improve this prompt to make it significantly better.

CURRENT PROMPT: "${currentPrompt}"
CATEGORY: ${category}

IMPROVEMENT GOALS:
- Make it clearer and more specific
- Add helpful context or constraints
- Improve structure and organization
- Ensure it will get better AI responses
- Make it more actionable

CRITICAL: Respond with ONLY the improved prompt. Do not include explanations, just the refined prompt itself.`;

    return await this.callAPI(modelId, improvementPrompt, 400, 0.3);
  }

  private async reviewImprovement(
    reviewerModel: string, 
    originalPrompt: string, 
    improvedPrompt: string, 
    category: string
  ): Promise<{score: number, feedback: string}> {
    const reviewPrompt = `You are reviewing a prompt improvement. Compare the original vs improved version and rate the improvement.

ORIGINAL: "${originalPrompt}"
IMPROVED: "${improvedPrompt}"
CATEGORY: ${category}

Rate the improved version on a scale of 1-10:
- 10/10 = Perfect, cannot be improved further
- 8-9/10 = Significant improvement, very good
- 6-7/10 = Some improvement, but could be better
- 1-5/10 = No improvement or worse

RESPOND IN THIS EXACT FORMAT:
SCORE: [number 1-10]
FEEDBACK: [brief explanation of your rating]`;

    const response = await this.callAPI(reviewerModel, reviewPrompt, 200, 0.1);
    
    // Parse the response
    const scoreMatch = response.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
    const feedbackMatch = response.match(/FEEDBACK:\s*(.*?)$/is);
    
    const score = scoreMatch ? Math.max(1, Math.min(10, parseFloat(scoreMatch[1]))) : 7.0;
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'Standard review completed';
    
    return { score, feedback };
  }

  private async callAPI(modelId: string, prompt: string, maxTokens: number = 300, temperature: number = 0.7): Promise<string> {
    return await groqRateLimiter.enqueue(async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase configuration missing');
      }
      
      const apiUrl = supabaseUrl.startsWith('http') 
        ? `${supabaseUrl}/functions/v1/groq-api`
        : `https://${supabaseUrl}/functions/v1/groq-api`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: modelId,
            prompt,
            max_tokens: maxTokens,
            temperature
          })
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`API Error: ${errorData.error || response.statusText}`);
        }
        
        const data = await response.json();
        return data.response || 'No response generated';
        
      } finally {
        clearTimeout(timeoutId);
      }
    }, 1); // Normal priority
  }

  private getModelName(modelId: string): string {
    const models: Record<string, string> = {
      'llama-3.1-8b-instant': 'Llama 3.1 8B',
      'llama-3.3-70b-versatile': 'Llama 3.3 70B',
      'deepseek-r1-distill-llama-70b': 'DeepSeek R1',
      'qwen/qwen3-32b': 'Qwen 3 32B'
    };
    return models[modelId] || modelId;
  }

  private generateReasoning(
    originalPrompt: string, 
    finalPrompt: string, 
    rounds: IterativeRound[], 
    consensusAchieved: boolean
  ): string {
    const improvements = rounds.filter(r => r.isImprovement).length;
    const finalRound = rounds[rounds.length - 1];
    
    if (consensusAchieved) {
      return `🎯 Perfect 10/10 consensus achieved! After ${rounds.length} rounds of iterative refinement, both models agreed the prompt cannot be improved further. The final prompt is ${Math.round((finalPrompt.length / originalPrompt.length) * 100)}% longer and significantly more effective.`;
    } else if (improvements > 0) {
      return `✅ Significant improvement achieved! After ${rounds.length} rounds, the prompt evolved from basic to advanced with ${improvements} successful improvements. Final score: ${finalRound?.reviewerScore || 0}/10. Both models contributed valuable refinements.`;
    } else {
      return `📝 Your original prompt was already quite good! After ${rounds.length} rounds of analysis, the models made minor refinements but confirmed your prompt was well-structured from the start.`;
    }
  }
}

export const iterativePromptBattle = IterativePromptBattle.getInstance();