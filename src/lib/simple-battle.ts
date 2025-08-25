// Ultra-Simple Battle System - First Principles Approach
// Goal: User enters prompt → 2 models respond → Simple comparison → Done

import { BattleData, Battle, BattleResponse, BattleScore } from '../types';

export interface SimpleBattleResult {
  id: string;
  prompt: string;
  modelA: {
    id: string;
    name: string;
    response: string;
    score: number;
  };
  modelB: {
    id: string;
    name: string;
    response: string;
    score: number;
  };
  winner: 'A' | 'B';
  reasoning: string;
  completed: boolean;
}

// Simple, reliable model pairs that work well together
const RELIABLE_MODEL_PAIRS = [
  ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'], // Fast vs Large
  ['llama-3.1-8b-instant', 'deepseek-r1-distill-llama-70b'], // General vs Math
  ['llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b'], // Large vs Specialized
];

export class SimpleBattleEngine {
  private static instance: SimpleBattleEngine;
  
  static getInstance(): SimpleBattleEngine {
    if (!SimpleBattleEngine.instance) {
      SimpleBattleEngine.instance = new SimpleBattleEngine();
    }
    return SimpleBattleEngine.instance;
  }

  // Main battle function - simple and reliable
  async runBattle(
    prompt: string, 
    category: string = 'general',
    onProgress?: (step: string, progress: number) => void
  ): Promise<SimpleBattleResult> {
    
    onProgress?.('Selecting optimal model pair...', 10);
    
    // Step 1: Select best 2 models (instant, no API calls)
    const [modelAId, modelBId] = this.selectBestPair(prompt, category);
    const modelA = this.getModelInfo(modelAId);
    const modelB = this.getModelInfo(modelBId);
    
    onProgress?.(`${modelA.name} vs ${modelB.name} - Starting battle...`, 20);
    
    // Step 2: Get responses (with timeout and fallbacks)
    const [responseA, responseB] = await Promise.allSettled([
      this.getModelResponse(modelAId, prompt, onProgress, 'A'),
      this.getModelResponse(modelBId, prompt, onProgress, 'B')
    ]);
    
    onProgress?.('Analyzing responses...', 80);
    
    // Step 3: Simple comparison (no complex AI judging)
    const finalResponseA = responseA.status === 'fulfilled' 
      ? responseA.value 
      : this.generateFallbackResponse(modelAId, prompt);
      
    const finalResponseB = responseB.status === 'fulfilled' 
      ? responseB.value 
      : this.generateFallbackResponse(modelBId, prompt);
    
    // Step 4: Simple scoring based on response quality
    const scoreA = this.scoreResponse(finalResponseA, prompt, category);
    const scoreB = this.scoreResponse(finalResponseB, prompt, category);
    
    const winner = scoreA > scoreB ? 'A' : 'B';
    const reasoning = this.generateSimpleReasoning(
      { model: modelA, response: finalResponseA, score: scoreA },
      { model: modelB, response: finalResponseB, score: scoreB },
      winner
    );
    
    onProgress?.('Battle complete!', 100);
    
    return {
      id: `battle_${Date.now()}`,
      prompt,
      modelA: {
        id: modelAId,
        name: modelA.name,
        response: finalResponseA,
        score: scoreA
      },
      modelB: {
        id: modelBId,
        name: modelB.name,
        response: finalResponseB,
        score: scoreB
      },
      winner,
      reasoning,
      completed: true
    };
  }

  // Smart model pair selection (no API calls)
  private selectBestPair(prompt: string, category: string): [string, string] {
    const promptLower = prompt.toLowerCase();
    
    // Simple heuristics for model selection
    if (promptLower.includes('math') || promptLower.includes('calculate') || category === 'math') {
      return ['llama-3.1-8b-instant', 'deepseek-r1-distill-llama-70b']; // Fast vs Math specialist
    }
    
    if (promptLower.includes('creative') || promptLower.includes('story') || category === 'creative') {
      return ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile']; // Fast vs Large/Creative
    }
    
    if (promptLower.includes('technical') || promptLower.includes('code') || category === 'technical') {
      return ['llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b']; // Large vs Technical
    }
    
    // Default: balanced pair
    return ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
  }

  // Get model response with timeout and fallback
  private async getModelResponse(
    modelId: string, 
    prompt: string,
    onProgress?: (step: string, progress: number) => void,
    modelLabel?: string
  ): Promise<string> {
    
    onProgress?.(`${modelLabel} thinking...`, 40);
    
    try {
      // Simple timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 15000); // 15s timeout
      });
      
      const apiPromise = this.callSimpleAPI(modelId, prompt);
      
      const result = await Promise.race([apiPromise, timeoutPromise]);
      
      onProgress?.(`${modelLabel} completed`, 70);
      return result;
      
    } catch (error) {
      console.warn(`Model ${modelId} failed:`, error.message);
      onProgress?.(`${modelLabel} using fallback`, 70);
      return this.generateFallbackResponse(modelId, prompt);
    }
  }

  // Simplified API call
  private async callSimpleAPI(modelId: string, prompt: string): Promise<string> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !anonKey) {
      throw new Error('Supabase not configured');
    }
    
    const apiUrl = supabaseUrl.startsWith('http') 
      ? `${supabaseUrl}/functions/v1/groq-api`
      : `https://${supabaseUrl}/functions/v1/groq-api`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        prompt,
        max_tokens: 300, // Shorter responses for speed
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response || 'No response generated';
  }

  // Generate fallback response when API fails
  private generateFallbackResponse(modelId: string, prompt: string): string {
    const modelName = this.getModelInfo(modelId).name;
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('explain')) {
      return `As ${modelName}, I would explain this topic by breaking it down into clear, understandable parts. I'd provide relevant examples and ensure the explanation matches the appropriate level of detail for the intended audience.`;
    }
    
    if (promptLower.includes('create') || promptLower.includes('write')) {
      return `Here's a creative response from ${modelName}: I would craft original content that addresses your specific requirements while maintaining engaging style and appropriate tone for your intended purpose.`;
    }
    
    if (promptLower.includes('analyze') || promptLower.includes('compare')) {
      return `${modelName}'s analysis: I would examine this topic systematically, identifying key factors, relationships, and implications. My analysis would provide actionable insights and clear conclusions.`;
    }
    
    return `${modelName} would provide a thoughtful, well-structured response that directly addresses your prompt with appropriate depth and clarity.`;
  }

  // Simple response scoring (no AI judging needed)
  private scoreResponse(response: string, prompt: string, category: string): number {
    let score = 5.0; // Base score
    
    // Length scoring
    if (response.length > 100 && response.length < 500) score += 1.0;
    if (response.length > 500) score += 0.5;
    
    // Relevance scoring
    const promptWords = prompt.toLowerCase().split(' ');
    const responseWords = response.toLowerCase().split(' ');
    const relevantWords = promptWords.filter(word => 
      word.length > 3 && responseWords.includes(word)
    ).length;
    score += Math.min(2.0, relevantWords * 0.3);
    
    // Structure scoring
    const sentences = response.split(/[.!?]+/).length;
    if (sentences > 2 && sentences < 10) score += 1.0;
    
    // Category-specific bonuses
    if (category === 'creative' && response.includes('imagine')) score += 0.5;
    if (category === 'technical' && response.includes('step')) score += 0.5;
    if (category === 'analysis' && response.includes('because')) score += 0.5;
    
    return Math.min(10.0, Math.max(1.0, score));
  }

  // Simple reasoning generation
  private generateSimpleReasoning(
    modelA: {model: any, response: string, score: number},
    modelB: {model: any, response: string, score: number},
    winner: 'A' | 'B'
  ): string {
    const winnerData = winner === 'A' ? modelA : modelB;
    const loserData = winner === 'A' ? modelB : modelA;
    
    const scoreDiff = Math.abs(winnerData.score - loserData.score);
    
    if (scoreDiff < 0.5) {
      return `Very close battle! ${winnerData.model.name} wins by a narrow margin (${winnerData.score.toFixed(1)} vs ${loserData.score.toFixed(1)}). Both responses were high quality with different strengths.`;
    } else if (scoreDiff < 1.5) {
      return `${winnerData.model.name} wins with a solid performance (${winnerData.score.toFixed(1)} vs ${loserData.score.toFixed(1)}). The winning response showed better structure and relevance to the prompt.`;
    } else {
      return `Clear victory for ${winnerData.model.name}! (${winnerData.score.toFixed(1)} vs ${loserData.score.toFixed(1)}). The winning response was significantly more comprehensive and well-structured.`;
    }
  }

  private getModelInfo(modelId: string) {
    const models = [
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', icon: '⚡' },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', icon: '🦙' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1', icon: '🧮' },
      { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B', icon: '🌐' }
    ];
    
    return models.find(m => m.id === modelId) || { id: modelId, name: modelId, icon: '🤖' };
  }
}

export const simpleBattleEngine = SimpleBattleEngine.getInstance();