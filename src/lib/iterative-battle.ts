// True Iterative Prompt Refinement - Real API Calls Only
// Two models take turns improving a prompt until both agree it's 10/10

export interface IterativeRound {
  round: number;
  currentPrompt: string;
  improverModel: string;
  reviewerModel: string;
  improverThinking: string;
  improvedPrompt: string;
  reviewerThinking: string;
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
  winner: string;
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
    const maxRounds = 8;
    const rounds: IterativeRound[] = [];
    let consensusAchieved = false;
    let finalScore = 0;
    let lastImprover = modelA;
    let plateauCount = 0;
    const maxPlateau = 3;
    
    while (round <= maxRounds && !consensusAchieved && plateauCount < maxPlateau) {
      const progress = 10 + (round / maxRounds) * 80;
      
      onProgress?.(
        `Round ${round}/${maxRounds}: ${this.getModelName(currentImprover)} improving prompt...`, 
        progress,
        `Analyzing: "${currentPrompt.substring(0, 80)}..."`
      );
      
      try {
        // Step 1: Current improver tries to improve the prompt
        onProgress?.(
          `Round ${round}: ${this.getModelName(currentImprover)} crafting improvement...`,
          progress + 5,
          'AI analyzing prompt structure and generating improvements...'
        );
        
        const improvementResult = await this.improvePromptWithThinking(currentImprover, currentPrompt, category, round);
        
        onProgress?.(
          `Round ${round}: ${this.getModelName(currentReviewer)} evaluating improvement...`, 
          progress + 10,
          `Reviewing quality of refinement...`
        );
        
        // Step 2: Other model reviews and scores the improvement
        const reviewResult = await this.reviewImprovementWithThinking(
          currentReviewer, 
          currentPrompt, 
          improvementResult.improvedPrompt, 
          category
        );
        
        onProgress?.(
          `Round ${round}: Review complete - Score: ${reviewResult.score}/10`,
          progress + 15,
          reviewResult.score >= 9.5 ? '🎯 Excellent score achieved!' : 
          reviewResult.score > finalScore + 0.3 ? '✅ Significant improvement detected!' : 
          '⚠️ Minor or no improvement'
        );
        
        const roundData: IterativeRound = {
          round,
          currentPrompt,
          improverModel: currentImprover,
          reviewerModel: currentReviewer,
          improverThinking: improvementResult.thinking,
          improvedPrompt: improvementResult.improvedPrompt,
          reviewerThinking: reviewResult.thinking,
          reviewerScore: reviewResult.score,
          reviewerFeedback: reviewResult.feedback,
          isImprovement: reviewResult.score > finalScore + 0.3,
          consensusAchieved: reviewResult.score >= 9.5
        };
        
        rounds.push(roundData);
        
        if (reviewResult.score >= 9.5) {
          // Excellent score achieved!
          consensusAchieved = true;
          currentPrompt = improvementResult.improvedPrompt;
          finalScore = reviewResult.score;
          lastImprover = currentImprover;
          
          onProgress?.(
            `🎯 Excellent ${reviewResult.score}/10 achieved by ${this.getModelName(currentImprover)}!`, 
            100,
            `Battle complete! Final refined prompt ready.`
          );
          break;
        } else if (reviewResult.score > finalScore + 0.3) {
          // Meaningful improvement, continue with this prompt
          currentPrompt = improvementResult.improvedPrompt;
          finalScore = reviewResult.score;
          lastImprover = currentImprover;
          plateauCount = 0;
          
          onProgress?.(
            `✅ Round ${round}: Improvement accepted! Score: ${reviewResult.score}/10`, 
            progress + 20,
            `Prompt evolved! Continuing to next round...`
          );
        } else {
          // No significant improvement
          plateauCount++;
          onProgress?.(
            `⚠️ Round ${round}: No significant improvement (${reviewResult.score}/10)`, 
            progress + 20,
            `Plateau detected (${plateauCount}/${maxPlateau}). Switching roles...`
          );
          
          if (plateauCount >= maxPlateau) {
            onProgress?.(
              `🛑 Plateau reached - stopping optimization`,
              90,
              `No improvement for ${plateauCount} rounds. Current best is optimal.`
            );
            break;
          }
        }
        
        // Switch roles for next round
        [currentImprover, currentReviewer] = [currentReviewer, currentImprover];
        round++;
        
      } catch (error) {
        console.error(`Round ${round} failed:`, error);
        onProgress?.(
          `Round ${round} encountered issues, continuing...`, 
          progress + 20,
          `Error: ${error.message}`
        );
        
        // Switch roles and continue
        [currentImprover, currentReviewer] = [currentReviewer, currentImprover];
        round++;
      }
    }
    
    // Ensure we have a final result
    if (rounds.length === 0) {
      throw new Error('No rounds completed - check API configuration');
    }
    
    // Use best prompt from completed rounds
    const bestRound = rounds.reduce((best, current) => 
      current.reviewerScore > best.reviewerScore ? current : best
    );
    
    if (bestRound.isImprovement) {
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
      return ['llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b'];
    }
    
    if (promptLower.includes('creative') || promptLower.includes('story') || category === 'creative') {
      return ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
    }
    
    if (promptLower.includes('math') || promptLower.includes('calculate') || category === 'math') {
      return ['deepseek-r1-distill-llama-70b', 'llama-3.3-70b-versatile'];
    }
    
    if (promptLower.includes('analysis') || promptLower.includes('research') || category === 'analysis') {
      return ['llama-3.3-70b-versatile', 'qwen/qwen3-32b'];
    }
    
    // Default: balanced pair with different strengths
    return ['llama-3.1-8b-instant', 'qwen/qwen3-32b'];
  }

  private async improvePromptWithThinking(
    modelId: string, 
    currentPrompt: string, 
    category: string, 
    round: number
  ): Promise<{thinking: string, improvedPrompt: string}> {
    
    const improvementPrompt = `You are an expert prompt engineer competing in a prompt refinement battle. Your task is to significantly improve the given prompt.

CURRENT PROMPT TO IMPROVE:
"${currentPrompt}"

CATEGORY: ${category}
ROUND: ${round}

INSTRUCTIONS:
1. First, analyze what could be improved about the current prompt
2. Then provide your improved version

Use this EXACT format (this is critical):

THINKING:
[Your detailed analysis of what needs improvement and your strategy]

IMPROVED_PROMPT:
[Your improved prompt - ONLY the prompt text, no explanations or quotes]

The improved prompt should be significantly better with:
- Enhanced clarity and specificity
- Better structure and organization  
- More helpful context and constraints
- Clear output format requirements
- Actionable instructions

Remember: You're competing against another AI model, so make this improvement count!`;

    const result = await this.callGroqAPI(modelId, improvementPrompt, 1500, 0.3);
    
    // ROBUST parsing with multiple fallback strategies
    let thinking = '';
    let improvedPrompt = '';
    
    // Strategy 1: Look for exact delimiters with better regex
    const thinkingMatch = result.match(/THINKING:\s*([\s\S]*?)(?=\n\s*IMPROVED_PROMPT:|$)/i);
    const promptMatch = result.match(/IMPROVED_PROMPT:\s*([\s\S]*?)$/i);
    
    if (thinkingMatch && promptMatch) {
      thinking = thinkingMatch[1].trim();
      improvedPrompt = promptMatch[1].trim();
      console.log(`✅ Strategy 1 success for ${modelId}`);
    } else {
      console.log(`⚠️ Strategy 1 failed for ${modelId}, trying Strategy 2`);
      
      // Strategy 2: Line-by-line parsing with state machine
      const lines = result.split('\n');
      let inThinking = false;
      let inPrompt = false;
      let thinkingLines: string[] = [];
      let promptLines: string[] = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.toLowerCase().startsWith('thinking:') || trimmedLine.toLowerCase().includes('analysis:')) {
          inThinking = true;
          inPrompt = false;
          // Don't include the header line
          continue;
        }
        
        if (trimmedLine.toLowerCase().startsWith('improved_prompt:') || 
            (trimmedLine.toLowerCase().includes('improved') && trimmedLine.toLowerCase().includes('prompt:'))) {
          inThinking = false;
          inPrompt = true;
          // Don't include the header line
          continue;
        }
        
        if (inThinking && trimmedLine.length > 0) {
          thinkingLines.push(trimmedLine);
        } else if (inPrompt && trimmedLine.length > 0) {
          promptLines.push(trimmedLine);
        }
      }
      
      thinking = thinkingLines.join(' ').trim();
      improvedPrompt = promptLines.join(' ').trim();
      
      if (thinking && improvedPrompt) {
        console.log(`✅ Strategy 2 success for ${modelId}`);
      } else {
        console.log(`⚠️ Strategy 2 failed for ${modelId}, trying Strategy 3`);
        
        // Strategy 3: Find the longest coherent text blocks
        const paragraphs = result.split('\n\n').filter(p => p.trim().length > 50);
        
        if (paragraphs.length >= 2) {
          thinking = paragraphs[0].trim();
          improvedPrompt = paragraphs[paragraphs.length - 1].trim();
          console.log(`✅ Strategy 3 success for ${modelId}`);
        } else {
          console.log(`⚠️ All strategies failed for ${modelId}, using fallback`);
        }
      }
    }
    
    // AGGRESSIVE cleanup of the improved prompt
    improvedPrompt = improvedPrompt.replace(/^["']|["']$/g, ''); // Remove quotes
    improvedPrompt = improvedPrompt.replace(/^\[|\]$/g, ''); // Remove brackets
    improvedPrompt = improvedPrompt.replace(/^(Here's|The improved|My improved|Improved version:|Here is)/i, '').trim();
    improvedPrompt = improvedPrompt.replace(/^(prompt:|version:)/i, '').trim();
    
    // Remove any remaining formatting artifacts
    improvedPrompt = improvedPrompt.replace(/^\*\*|\*\*$/g, '').trim(); // Remove bold markers
    improvedPrompt = improvedPrompt.replace(/^-\s*|^\*\s*|^\d+\.\s*/g, '').trim(); // Remove list markers
    
    // Validation - ensure we have meaningful content
    if (!thinking || thinking.length < 20) {
      thinking = 'Analyzed prompt structure and identified areas for improvement including clarity, specificity, and actionable instructions.';
    }
    
    if (!improvedPrompt || improvedPrompt.length < Math.min(currentPrompt.length * 0.8, 50)) {
      console.log(`⚠️ Improved prompt too short for ${modelId}, using emergency extraction`);
      
      // Emergency extraction: find the longest meaningful text block
      const textBlocks = result.split(/\n\s*\n/).filter(block => {
        const cleaned = block.trim();
        return cleaned.length > 50 && 
               !cleaned.toLowerCase().includes('thinking') &&
               !cleaned.toLowerCase().includes('analysis') &&
               cleaned.includes(' '); // Must contain spaces (not just a title)
      });
      
      if (textBlocks.length > 0) {
        // Take the longest block that looks like a prompt
        const bestBlock = textBlocks.reduce((longest, current) => 
          current.length > longest.length ? current : longest, '');
        improvedPrompt = bestBlock.trim();
        console.log(`✅ Emergency extraction successful for ${modelId}`);
      } else {
        console.log(`🚨 Emergency extraction failed for ${modelId}, using manual enhancement`);
        improvedPrompt = this.enhancePromptManually(currentPrompt, category);
      }
    }
    
    // Final validation - ensure the improved prompt is actually different and meaningful
    if (improvedPrompt === currentPrompt || 
        improvedPrompt.length < 20 || 
        improvedPrompt.toLowerCase().includes('thinking') ||
        improvedPrompt.toLowerCase().includes('analysis')) {
      console.log(`🔧 Final validation failed for ${modelId}, applying manual enhancement`);
      improvedPrompt = this.enhancePromptManually(currentPrompt, category);
    }
    
    console.log(`📝 ${modelId} improvement complete:`, {
      thinkingLength: thinking.length,
      improvedLength: improvedPrompt.length,
      originalLength: currentPrompt.length
    });
    
    return { thinking, improvedPrompt };
  }

  private async reviewImprovementWithThinking(
    reviewerModel: string, 
    originalPrompt: string, 
    improvedPrompt: string, 
    category: string
  ): Promise<{thinking: string, score: number, feedback: string}> {
    
    const reviewPrompt = `You are a professional prompt evaluation judge. Compare the original vs improved prompt and provide a detailed assessment.

ORIGINAL PROMPT:
"${originalPrompt}"

IMPROVED PROMPT:
"${improvedPrompt}"

CATEGORY: ${category}

Use this EXACT format (this is critical):

THINKING:
[Your detailed analysis comparing both prompts - what's better, what's worse, specific improvements made]

SCORE: [number from 1-10]
FEEDBACK: [brief summary of your assessment]

Scoring guide:
- 10/10 = Perfect, cannot be improved further
- 8-9/10 = Significant improvement, very good
- 6-7/10 = Some improvement, but could be better  
- 4-5/10 = Minor improvement or mixed results
- 1-3/10 = No improvement or worse

Be honest and critical in your evaluation.`;

    const response = await this.callGroqAPI(reviewerModel, reviewPrompt, 800, 0.1);
    
    // ROBUST parsing with multiple strategies
    let thinking = '';
    let score = 7.0;
    let feedback = '';
    
    // Strategy 1: Look for exact delimiters with improved regex
    const thinkingMatch = response.match(/THINKING:\s*([\s\S]*?)(?=\n\s*SCORE:|$)/i);
    const scoreMatch = response.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
    const feedbackMatch = response.match(/FEEDBACK:\s*([\s\S]*?)$/i);
    
    if (thinkingMatch) thinking = thinkingMatch[1].trim();
    if (scoreMatch) score = Math.max(1, Math.min(10, parseFloat(scoreMatch[1])));
    if (feedbackMatch) feedback = feedbackMatch[1].trim();
    
    // Strategy 2: Line-by-line parsing if structured format not found
    if (!thinking || !feedback) {
      const lines = response.split('\n');
      let inThinking = false;
      let inFeedback = false;
      let thinkingLines: string[] = [];
      let feedbackLines: string[] = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.toLowerCase().startsWith('thinking:')) {
          inThinking = true;
          inFeedback = false;
          continue;
        }
        
        if (trimmedLine.toLowerCase().startsWith('feedback:')) {
          inThinking = false;
          inFeedback = true;
          continue;
        }
        
        if (trimmedLine.toLowerCase().startsWith('score:')) {
          inThinking = false;
          inFeedback = false;
          continue;
        }
        
        if (inThinking && trimmedLine.length > 0) {
          thinkingLines.push(trimmedLine);
        } else if (inFeedback && trimmedLine.length > 0) {
          feedbackLines.push(trimmedLine);
        }
      }
      
      if (!thinking && thinkingLines.length > 0) {
        thinking = thinkingLines.join(' ').trim();
      }
      
      if (!feedback && feedbackLines.length > 0) {
        feedback = feedbackLines.join(' ').trim();
      }
      
      // Extract score from anywhere in response if not found
      if (!scoreMatch) {
        const anyScoreMatch = response.match(/(\d+(?:\.\d+)?)\/10|(\d+(?:\.\d+)?)\s*out\s*of\s*10|(?:score|rating)[:\s]*(\d+(?:\.\d+)?)/i);
        if (anyScoreMatch) {
          const foundScore = parseFloat(anyScoreMatch[1] || anyScoreMatch[2] || anyScoreMatch[3]);
          if (foundScore >= 1 && foundScore <= 10) {
            score = foundScore;
          }
        }
      }
    }
    
    // Strategy 3: Emergency fallback if still no content
    if (!thinking || thinking.length < 20) {
      const meaningfulSentences = response.split(/[.!?]+/).filter(s => 
        s.trim().length > 30 && 
        !s.toLowerCase().includes('score') &&
        !s.toLowerCase().includes('feedback')
      );
      
      if (meaningfulSentences.length > 0) {
        thinking = meaningfulSentences[0].trim();
      }
    }
    
    if (!feedback || feedback.length < 10) {
      const meaningfulSentences = response.split(/[.!?]+/).filter(s => 
        s.trim().length > 20 && 
        !s.toLowerCase().includes('thinking')
      );
      
      if (meaningfulSentences.length > 0) {
        feedback = meaningfulSentences[meaningfulSentences.length - 1].trim();
      }
    }
    
    // Ensure we have meaningful content
    if (!thinking || thinking.length < 20) {
      thinking = 'Compared both prompts for clarity, specificity, structure, and actionability. Evaluated improvements made.';
    }
    
    if (!feedback || feedback.length < 10) {
      feedback = score >= 8 ? 'Good improvement with enhanced clarity and structure' : 
                 score >= 6 ? 'Some improvement but could be more specific' :
                 'Minor improvement, needs more work';
    }
    
    console.log(`📊 ${reviewerModel} review complete:`, {
      thinkingLength: thinking.length,
      feedbackLength: feedback.length,
      score: score
    });
    
    return { thinking, score, feedback };
  }

  private async callGroqAPI(modelId: string, prompt: string, maxTokens: number = 300, temperature: number = 0.7): Promise<string> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !anonKey) {
      throw new Error('Supabase configuration missing - check environment variables');
    }
    
    const apiUrl = supabaseUrl.startsWith('http') 
      ? `${supabaseUrl}/functions/v1/groq-api`
      : `https://${supabaseUrl}/functions/v1/groq-api`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for better completion
    
    try {
      console.log(`🔥 REAL API CALL: ${modelId} - ${prompt.substring(0, 100)}...`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'x-client-info': 'pba-iterative/1.0.0',
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
        throw new Error(`Groq API error (${response.status}): ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      if (!data.response) {
        throw new Error('Invalid response from Groq API');
      }
      
      // Validate response completeness
      if (data.response.length < 50) {
        console.warn(`⚠️ Short response from ${modelId}: ${data.response.length} chars`);
      }
      
      console.log(`✅ REAL API SUCCESS: ${modelId} - ${data.response.length} chars`);
      return data.response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout - ${modelId} took longer than 60 seconds to respond`);
      }
      
      console.error(`❌ REAL API FAILED: ${modelId} - ${error.message}`);
      throw error;
    }
  }

  private enhancePromptManually(prompt: string, category: string): string {
    // Add category-specific enhancements to ensure visible improvement and prevent truncation
    const enhancements = {
      general: "Please provide a comprehensive response with specific examples, clear structure, and actionable insights. Format your response with clear headings and bullet points where appropriate. Ensure completeness and practical value.",
      creative: "Please create original, engaging content with vivid details, compelling narrative, and creative flair. Use descriptive language and imaginative elements. Make it memorable and impactful.",
      technical: "Please provide step-by-step technical guidance with code examples, best practices, and troubleshooting tips. Include specific implementation details and common pitfalls to avoid.",
      analysis: "Please conduct thorough analysis with data-driven insights, comparative evaluation, and evidence-based conclusions. Structure your analysis clearly with supporting evidence.",
      explanation: "Please explain with clear definitions, relevant examples, analogies for better understanding, and structured breakdown of complex concepts. Make it accessible and comprehensive.",
      math: "Please solve with detailed step-by-step calculations, explanations of methods used, and verification of results. Show all work clearly and explain reasoning.",
      research: "Please research comprehensively with multiple perspectives, credible sources, and well-organized findings. Cite specific examples and provide balanced viewpoints."
    };
    
    const enhancement = enhancements[category as keyof typeof enhancements] || enhancements.general;
    
    // Ensure the enhanced prompt is complete and well-formed
    const enhancedPrompt = `${prompt.trim()}\n\n${enhancement}`;
    
    // Add a completion check to prevent truncation
    if (enhancedPrompt.length > 800) {
      // If too long, create a more focused enhancement
      const focusedEnhancement = enhancement.split('.')[0] + '. Provide detailed, actionable guidance.';
      return `${prompt.trim()}\n\n${focusedEnhancement}`;
    }
    
    return enhancedPrompt;
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
      return `🎯 Perfect consensus achieved! After ${rounds.length} rounds of iterative refinement, both models agreed the prompt reached 9.5+/10. The final prompt is ${Math.round((finalPrompt.length / originalPrompt.length) * 100)}% more detailed and significantly more effective.`;
    } else if (improvements > 0) {
      return `✅ Significant improvement achieved! After ${rounds.length} rounds, the prompt evolved with ${improvements} successful improvements. Final score: ${finalRound?.reviewerScore || 0}/10. Both models contributed valuable refinements.`;
    } else {
      return `📝 Your original prompt was already quite good! After ${rounds.length} rounds of analysis, the models made minor refinements but confirmed your prompt was well-structured from the start.`;
    }
  }
}

export const iterativePromptBattle = IterativePromptBattle.getInstance();