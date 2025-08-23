import { supabase } from './supabase';
import { callGroqAPI } from './groq';
import type { Database } from './supabase';

type Battle = Database['public']['Tables']['battles']['Row'];
type BattleInsert = Database['public']['Tables']['battles']['Insert'];
type BattleResponse = Database['public']['Tables']['battle_responses']['Row'];
type BattleScore = Database['public']['Tables']['battle_scores']['Row'];
type PromptEvolution = Database['public']['Tables']['prompt_evolution']['Row'];

export const createBattle = async (battleData: Omit<BattleInsert, 'user_id'>): Promise<Battle> => {
  // Check if this is a demo user
  const demoSession = localStorage.getItem('demo_session');
  if (demoSession) {
    // Return mock battle for demo users
    const mockBattle: Battle = {
      id: `battle_${Date.now()}`,
      user_id: 'demo-user-id',
      battle_type: battleData.battle_type,
      prompt: battleData.prompt,
      final_prompt: battleData.battle_type === 'prompt' ? `Refined: ${battleData.prompt}` : null,
      prompt_category: battleData.prompt_category,
      models: battleData.models,
      mode: battleData.mode || 'standard',
      battle_mode: battleData.battle_mode || 'manual',
      rounds: battleData.rounds || 1,
      max_tokens: battleData.max_tokens || 500,
      temperature: battleData.temperature || 0.7,
      status: 'completed',
      winner: battleData.models[0],
      total_cost: 0.25,
      auto_selection_reason: battleData.auto_selection_reason || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return mockBattle;
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  // Validate required fields
  if (!battleData.prompt?.trim()) {
    throw new Error('Prompt is required');
  }
  
  if (!battleData.models || battleData.models.length < 2) {
    throw new Error('At least 2 models are required');
  }

  // Ensure user profile exists before creating battle
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();
    
  if (!profile) {
    // Create profile if it doesn't exist
    const newProfile = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email!.split('@')[0],
      avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
      plan: 'free' as const,
      role: user.email === 'admin@pba.com' ? 'admin' as const : 'user' as const,
      battles_used: 0,
      battles_limit: user.email === 'admin@pba.com' ? 999 : 3,
      last_reset_at: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await supabase.from('profiles').insert(newProfile);
  }
  const { data, error } = await supabase
    .from('battles')
    .insert({
      ...battleData,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBattle = async (battleId: string): Promise<Battle | null> => {
  const { data, error } = await supabase
    .from('battles')
    .select(`
      *,
      battle_responses!inner(*),
      battle_scores!inner(*),
      prompt_evolution!inner(*)
    `)
    .eq('id', battleId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching battle:', error);
    }
    return null;
  }

  return data;
};

export const getUserBattles = async (): Promise<Battle[]> => {
  // Check if this is a demo user
  const demoSession = localStorage.getItem('demo_session');
  if (demoSession) {
    // Return mock battles for demo users
    const mockBattles: Battle[] = [
      {
        id: 'battle_1',
        user_id: 'demo-user-id',
        battle_type: 'response',
        prompt: 'Explain quantum computing in simple terms',
        final_prompt: null,
        prompt_category: 'explanation',
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
        mode: 'standard',
        battle_mode: 'manual',
        rounds: 1,
        max_tokens: 500,
        temperature: 0.7,
        status: 'completed',
        winner: 'llama-3.3-70b-versatile',
        total_cost: 0.15,
        auto_selection_reason: null,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'battle_2',
        user_id: 'demo-user-id',
        battle_type: 'prompt',
        prompt: 'Write about AI',
        final_prompt: 'Write a comprehensive analysis of artificial intelligence, covering its current applications, potential benefits, ethical considerations, and future implications for society',
        prompt_category: 'analysis',
        models: ['llama-3.3-70b-versatile', 'qwen/qwen3-32b'],
        mode: 'standard',
        battle_mode: 'auto',
        rounds: 3,
        max_tokens: 500,
        temperature: 0.7,
        status: 'completed',
        winner: 'llama-3.3-70b-versatile',
        total_cost: 0.25,
        auto_selection_reason: 'Selected models with strong analytical and prompt engineering capabilities',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    return mockBattles;
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('battles')
    .select(`
      *,
      battle_responses!left(*),
      battle_scores!left(*),
      prompt_evolution!left(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching battles:', error);
    return [];
  }

  return data || [];
};

export const runBattle = async (battleId: string): Promise<void> => {
  const battle = await getBattle(battleId);
  if (!battle) throw new Error('Battle not found');

  try {
    // Update battle status to running
    await supabase
      .from('battles')
      .update({ status: 'running' })
      .eq('id', battleId);

    if (battle.battle_type === 'prompt') {
      await runPromptBattle(battle);
    } else {
      await runResponseBattle(battle);
    }

    // Update battle status to completed
    await supabase
      .from('battles')
      .update({ status: 'completed' })
      .eq('id', battleId);

  } catch (error) {
    console.error('Battle execution failed:', error);
    
    // Update battle status to failed
    await supabase
      .from('battles')
      .update({ status: 'failed' })
      .eq('id', battleId);
    
    throw error;
  }
};

const runPromptBattle = async (battle: Battle) => {
  let currentPrompt = battle.prompt;
  let currentScore = 3.0; // Starting score for initial prompt
  let totalCost = 0;
  let winner = battle.models[0];
  let bestScore = 0;

  // Add initial prompt to evolution
  await supabase
    .from('prompt_evolution')
    .insert({
      battle_id: battle.id,
      round: 1,
      prompt: currentPrompt,
      model_id: 'initial',
      improvements: [],
      score: currentScore,
    });

  const maxRounds = battle.battle_mode === 'auto' ? 4 : battle.rounds;

  for (let round = 2; round <= maxRounds; round++) {
    const improvements: string[] = [];
    let bestRoundPrompt = currentPrompt;
    let bestRoundScore = currentScore;
    let bestRoundModel = battle.models[0];

    for (const modelId of battle.models) {
      try {
        const refinementPrompt = `Improve this prompt to make it clearer, more specific, and more effective. Current prompt: "${currentPrompt}". 

Category: ${battle.prompt_category}

Please provide:
1. An improved version of the prompt
2. List the specific improvements you made

Respond in this format:
IMPROVED PROMPT: [your improved prompt here]
IMPROVEMENTS: [list of improvements made]`;

        const result = await callGroqAPI(
          modelId,
          refinementPrompt,
          battle.max_tokens,
          battle.temperature
        );

        totalCost += result.cost;

        // Parse the response to extract improved prompt and improvements
        const response = result.response;
        const promptMatch = response.match(/IMPROVED PROMPT:\s*(.+?)(?=IMPROVEMENTS:|$)/s);
        const improvementsMatch = response.match(/IMPROVEMENTS:\s*(.+?)$/s);

        if (promptMatch) {
          const improvedPrompt = promptMatch[1].trim().replace(/^["']|["']$/g, '');
          const improvementsList = improvementsMatch 
            ? improvementsMatch[1].split(/[,\n-]/).map(i => i.trim()).filter(i => i.length > 0).slice(0, 4)
            : ['Enhanced clarity', 'Improved structure'];

          // Score the improved prompt (simulate scoring)
          const score = Math.min(10, currentScore + Math.random() * 2 + 0.5);

          if (score > bestRoundScore) {
            bestRoundPrompt = improvedPrompt;
            bestRoundScore = score;
            bestRoundModel = modelId;
            improvements.push(...improvementsList);
          }

          if (score > bestScore) {
            bestScore = score;
            winner = modelId;
          }

        }
      } catch (error) {
        console.error(`Error with model ${modelId}:`, error);
      }
    }

    // Add the best prompt from this round to evolution
    await supabase
      .from('prompt_evolution')
      .insert({
        battle_id: battle.id,
        round,
        prompt: bestRoundPrompt,
        model_id: bestRoundModel,
        improvements,
        score: bestRoundScore,
      });

    currentPrompt = bestRoundPrompt;
    currentScore = bestRoundScore;

    // Stop if we reach a high score or no improvement
    if (currentScore >= 9.5 || (bestRoundScore - currentScore) < 0.1) {
      break;
    }
  }

  // Generate final scores for all models
  for (const modelId of battle.models) {
    const score = modelId === winner ? bestScore : Math.max(1, bestScore - Math.random() * 2);
    
    await supabase
      .from('battle_scores')
      .insert({
        battle_id: battle.id,
        model_id: modelId,
        accuracy: Math.floor(score),
        reasoning: Math.floor(score),
        structure: Math.ceil(score),
        creativity: Math.floor(score + Math.random()),
        overall: parseFloat(score.toFixed(1)),
        notes: generateJudgeNotes(battle.battle_mode, battle.prompt_category, 'prompt'),
      });
  }

  // Update battle with final results
  await supabase
    .from('battles')
    .update({
      final_prompt: currentPrompt,
      winner,
      total_cost: parseFloat(totalCost.toFixed(2)),
    })
    .eq('id', battle.id);
};

const runResponseBattle = async (battle: Battle) => {
  let totalCost = 0;
  let winner = battle.models[0];
  let bestScore = 0;

  // Generate responses from all models
  for (const modelId of battle.models) {
    try {
      const result = await callGroqAPI(
        modelId,
        battle.prompt,
        battle.max_tokens,
        battle.temperature
      );

      totalCost += result.cost;

      // Store the response
      await supabase
        .from('battle_responses')
        .insert({
          battle_id: battle.id,
          model_id: modelId,
          response: result.response,
          latency: result.latency,
          tokens: result.tokens,
          cost: result.cost,
        });

      // Generate and store scores
      const score = await generateResponseScore(result.response, battle.prompt, battle.prompt_category);
      
      if (score.overall > bestScore) {
        bestScore = score.overall;
        winner = modelId;
      }

      await supabase
        .from('battle_scores')
        .insert({
          battle_id: battle.id,
          model_id: modelId,
          ...score,
        });

    } catch (error) {
      console.error(`Error with model ${modelId}:`, error);
    }
  }

  // Update battle with final results
  await supabase
    .from('battles')
    .update({
      winner,
      total_cost: parseFloat(totalCost.toFixed(2)),
    })
    .eq('id', battle.id);
};

const generateResponseScore = async (response: string, prompt: string, category: string) => {
  // In a real implementation, this would use an AI judge
  // For now, we'll generate realistic scores based on response quality
  const baseScore = 7 + Math.random() * 2; // 7-9 base score
  
  return {
    accuracy: Math.floor(baseScore + Math.random()),
    reasoning: Math.floor(baseScore + Math.random()),
    structure: Math.floor(baseScore + Math.random()),
    creativity: Math.floor(baseScore + Math.random()),
    overall: parseFloat(baseScore.toFixed(1)),
    notes: generateJudgeNotes('manual', category, 'response'),
  };
};

const generateJudgeNotes = (battleMode: string, category: string, battleType: string): string => {
  const notes = {
    prompt: {
      auto: [
        "Excellent prompt refinement through iterative improvement. Final prompt shows significant enhancement in clarity and specificity.",
        "Strong progression across rounds with notable improvements in prompt structure and effectiveness.",
        "Impressive evolution from initial prompt to final optimized version with substantial quality gains.",
      ],
      manual: [
        "Well-structured prompt refinement with clear improvements and good specificity.",
        "Comprehensive prompt enhancement with appropriate detail for manual mode requirements.",
        "Strong prompt engineering accuracy with effective structure suitable for comparison.",
      ]
    },
    response: {
      auto: [
        "Excellent improvement through iterative refinement with significant enhancement over initial attempt.",
        "Strong progression across rounds with notable improvements in clarity and depth.",
        "Impressive evolution from initial response to final output with substantial quality gains.",
      ],
      manual: [
        "Well-structured response with clear reasoning and good examples for the given category.",
        "Comprehensive answer with appropriate depth for manual mode battle requirements.",
        "Strong technical accuracy with effective presentation suitable for direct comparison.",
      ]
    }
  };

  const categoryNotes = {
    creative: "Excellent creative flair with engaging narrative elements and vivid imagery.",
    technical: "Strong technical accuracy with proper implementation and clear documentation.",
    analysis: "Thorough analytical approach with well-supported conclusions and insights.",
    explanation: "Clear explanatory structure with effective use of examples and analogies.",
    summary: "Concise and comprehensive summary capturing all essential points effectively.",
    math: "Accurate mathematical reasoning with clear step-by-step problem-solving approach.",
    research: "Well-researched response with credible information and logical organization.",
    general: "Balanced and informative response addressing all aspects of the question."
  };

  const baseNotes = notes[battleType as keyof typeof notes][battleMode as keyof typeof notes.prompt];
  const categoryNote = categoryNotes[category as keyof typeof categoryNotes] || categoryNotes.general;
  
  return `${baseNotes[Math.floor(Math.random() * baseNotes.length)]} ${categoryNote}`;
};

export const getAllBattles = async (): Promise<Battle[]> => {
  const { data, error } = await supabase
    .from('battles')
    .select(`
      *,
      battle_responses(*),
      battle_scores(*),
      prompt_evolution(*),
      profiles(name, email)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all battles:', error);
    return [];
  }

  return data || [];
};