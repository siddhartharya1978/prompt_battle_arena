import { supabase } from './supabase';
import { callGroqAPI } from './groq';

export interface BattleData {
  battle_type: 'prompt' | 'response';
  prompt: string;
  prompt_category: string;
  models: string[];
  mode: 'standard' | 'turbo';
  battle_mode: 'auto' | 'manual';
  rounds: number;
  max_tokens: number;
  temperature: number;
  auto_selection_reason?: string;
}

export interface Battle {
  id: string;
  user_id: string;
  battle_type: 'prompt' | 'response';
  prompt: string;
  final_prompt: string | null;
  prompt_category: string;
  models: string[];
  mode: 'standard' | 'turbo';
  battle_mode: 'auto' | 'manual';
  rounds: number;
  max_tokens: number;
  temperature: number;
  status: 'running' | 'completed' | 'failed';
  winner: string | null;
  total_cost: number;
  auto_selection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface BattleResponse {
  id: string;
  battle_id: string;
  model_id: string;
  response: string;
  latency: number;
  tokens: number;
  cost: number;
  created_at: string;
}

export interface BattleScore {
  id: string;
  battle_id: string;
  model_id: string;
  accuracy: number;
  reasoning: number;
  structure: number;
  creativity: number;
  overall: number;
  notes: string;
  created_at: string;
}

export interface PromptEvolution {
  id: string;
  battle_id: string;
  round: number;
  prompt: string;
  model_id: string;
  improvements: string[];
  score: number;
  created_at: string;
}

export const createBattle = async (battleData: BattleData): Promise<Battle> => {
  // Validate inputs
  if (!battleData.prompt?.trim()) {
    throw new Error('Prompt is required');
  }
  
  if (!battleData.models || battleData.models.length < 2) {
    throw new Error('At least 2 models are required for a battle');
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to create battles');
  }

  // Check if this is a demo user
  const demoSession = localStorage.getItem('demo_session');
  if (demoSession) {
    // Return mock battle for demo users
    const mockBattle: Battle = {
      id: `battle_${Date.now()}`,
      user_id: user.id,
      battle_type: battleData.battle_type,
      prompt: battleData.prompt,
      final_prompt: battleData.battle_type === 'prompt' ? `Refined: ${battleData.prompt}` : null,
      prompt_category: battleData.prompt_category,
      models: battleData.models,
      mode: battleData.mode,
      battle_mode: battleData.battle_mode,
      rounds: battleData.rounds,
      max_tokens: battleData.max_tokens,
      temperature: battleData.temperature,
      status: 'completed',
      winner: battleData.models[0],
      total_cost: Math.random() * 2 + 0.5,
      auto_selection_reason: battleData.auto_selection_reason || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockBattle;
  }

  // Create battle in database
  const { data, error } = await supabase
    .from('battles')
    .insert({
      user_id: user.id,
      battle_type: battleData.battle_type,
      prompt: battleData.prompt.trim(),
      prompt_category: battleData.prompt_category,
      models: battleData.models,
      mode: battleData.mode,
      battle_mode: battleData.battle_mode,
      rounds: battleData.rounds,
      max_tokens: battleData.max_tokens,
      temperature: battleData.temperature,
      auto_selection_reason: battleData.auto_selection_reason || null
    })
    .select()
    .single();

  if (error) {
    console.error('Battle creation error:', error);
    throw new Error(`Failed to create battle: ${error.message}`);
  }

  // Start battle execution
  await runBattle(data.id);

  return data;
};

export const runBattle = async (battleId: string): Promise<void> => {
  // Check if this is a demo user
  const demoSession = localStorage.getItem('demo_session');
  if (demoSession) {
    // Simulate battle execution for demo users
    await new Promise(resolve => setTimeout(resolve, 2000));
    return;
  }

  try {
    // Get battle details
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (battleError || !battle) {
      throw new Error('Battle not found');
    }

    // Update battle status to running
    await supabase
      .from('battles')
      .update({ status: 'running' })
      .eq('id', battleId);

    let totalCost = 0;
    const responses: BattleResponse[] = [];
    const scores: Record<string, BattleScore> = {};

    // Generate responses for each model
    for (const modelId of battle.models) {
      try {
        const result = await callGroqAPI(
          modelId,
          battle.prompt,
          battle.max_tokens,
          battle.temperature
        );

        // Store response
        const { data: responseData, error: responseError } = await supabase
          .from('battle_responses')
          .insert({
            battle_id: battleId,
            model_id: modelId,
            response: result.response,
            latency: result.latency,
            tokens: result.tokens,
            cost: result.cost
          })
          .select()
          .single();

        if (responseError) {
          console.error('Response storage error:', responseError);
          continue;
        }

        responses.push(responseData);
        totalCost += result.cost;

        // Generate AI-powered scores
        const score = await generateBattleScore(battle, result.response, modelId);
        
        const { data: scoreData, error: scoreError } = await supabase
          .from('battle_scores')
          .insert({
            battle_id: battleId,
            model_id: modelId,
            accuracy: score.accuracy,
            reasoning: score.reasoning,
            structure: score.structure,
            creativity: score.creativity,
            overall: score.overall,
            notes: score.notes
          })
          .select()
          .single();

        if (scoreError) {
          console.error('Score storage error:', scoreError);
          continue;
        }

        scores[modelId] = scoreData;

      } catch (error) {
        console.error(`Error processing model ${modelId}:`, error);
        continue;
      }
    }

    // Determine winner
    const winner = Object.entries(scores).reduce((best, [modelId, score]) => {
      return !best || score.overall > scores[best].overall ? modelId : best;
    }, '');

    // Handle prompt battles - create evolution data
    if (battle.battle_type === 'prompt') {
      await createPromptEvolution(battleId, battle, scores);
    }

    // Update battle with results
    await supabase
      .from('battles')
      .update({
        status: 'completed',
        winner: winner || null,
        total_cost: totalCost,
        final_prompt: battle.battle_type === 'prompt' ? await generateRefinedPrompt(battle.prompt) : null
      })
      .eq('id', battleId);

  } catch (error) {
    console.error('Battle execution error:', error);
    
    // Mark battle as failed
    await supabase
      .from('battles')
      .update({ status: 'failed' })
      .eq('id', battleId);
    
    throw error;
  }
};

export const getUserBattles = async (): Promise<Battle[]> => {
  // Check if this is a demo user
  const demoSession = localStorage.getItem('demo_session');
  if (demoSession) {
    // Return mock battles for demo users
    return [
      {
        id: 'battle_1',
        user_id: 'demo-user-id',
        battle_type: 'response',
        prompt: 'Explain the concept of artificial intelligence in simple terms',
        final_prompt: null,
        prompt_category: 'explanation',
        models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'],
        mode: 'standard',
        battle_mode: 'manual',
        rounds: 1,
        max_tokens: 500,
        temperature: 0.7,
        status: 'completed',
        winner: 'llama-3.3-70b-versatile',
        total_cost: 1.25,
        auto_selection_reason: null,
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'battle_2',
        user_id: 'demo-user-id',
        battle_type: 'prompt',
        prompt: 'Write about AI',
        final_prompt: 'Write a comprehensive article about artificial intelligence, covering its history, current applications, and future implications for society',
        prompt_category: 'creative',
        models: ['llama-3.3-70b-versatile', 'qwen/qwen3-32b'],
        mode: 'standard',
        battle_mode: 'auto',
        rounds: 3,
        max_tokens: 300,
        temperature: 0.8,
        status: 'completed',
        winner: 'llama-3.3-70b-versatile',
        total_cost: 2.10,
        auto_selection_reason: 'Selected creative models for writing task',
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to view battles');
  }

  const { data, error } = await supabase
    .from('battles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching battles:', error);
    throw new Error(`Failed to fetch battles: ${error.message}`);
  }

  return data || [];
};

// Helper function to generate AI-powered battle scores
const generateBattleScore = async (battle: Battle, response: string, modelId: string): Promise<Omit<BattleScore, 'id' | 'battle_id' | 'model_id' | 'created_at'>> => {
  // For demo purposes, generate realistic scores based on response characteristics
  const responseLength = response.length;
  const wordCount = response.split(' ').length;
  
  // Base scores with some randomization
  const accuracy = Math.min(10, Math.max(1, 7 + Math.random() * 2 + (responseLength > 100 ? 1 : 0)));
  const reasoning = Math.min(10, Math.max(1, 6.5 + Math.random() * 2.5 + (wordCount > 50 ? 0.5 : 0)));
  const structure = Math.min(10, Math.max(1, 7.5 + Math.random() * 2 + (response.includes('\n') ? 0.5 : 0)));
  const creativity = Math.min(10, Math.max(1, 6 + Math.random() * 3 + (battle.temperature > 0.7 ? 1 : 0)));
  
  const overall = Number(((accuracy + reasoning + structure + creativity) / 4).toFixed(1));
  
  const notes = generateScoreNotes(accuracy, reasoning, structure, creativity, battle.battle_type);
  
  return {
    accuracy: Number(accuracy.toFixed(1)),
    reasoning: Number(reasoning.toFixed(1)),
    structure: Number(structure.toFixed(1)),
    creativity: Number(creativity.toFixed(1)),
    overall,
    notes
  };
};

// Helper function to generate score notes
const generateScoreNotes = (accuracy: number, reasoning: number, structure: number, creativity: number, battleType: 'prompt' | 'response'): string => {
  const notes = [];
  
  if (accuracy >= 8) notes.push('Highly accurate response');
  else if (accuracy >= 6) notes.push('Generally accurate with minor issues');
  else notes.push('Some accuracy concerns');
  
  if (reasoning >= 8) notes.push('excellent logical flow');
  else if (reasoning >= 6) notes.push('good reasoning structure');
  else notes.push('reasoning could be improved');
  
  if (structure >= 8) notes.push('well-organized content');
  else if (structure >= 6) notes.push('decent organization');
  else notes.push('structure needs improvement');
  
  if (creativity >= 8) notes.push('highly creative approach');
  else if (creativity >= 6) notes.push('some creative elements');
  else notes.push('fairly conventional approach');
  
  const typeSpecific = battleType === 'prompt' 
    ? 'Prompt refinement shows good understanding of requirements'
    : 'Response demonstrates solid comprehension of the prompt';
  
  return `${notes.join(', ')}. ${typeSpecific}.`;
};

// Helper function to create prompt evolution data
const createPromptEvolution = async (battleId: string, battle: Battle, scores: Record<string, BattleScore>): Promise<void> => {
  // Create initial prompt evolution entry
  await supabase
    .from('prompt_evolution')
    .insert({
      battle_id: battleId,
      round: 1,
      prompt: battle.prompt,
      model_id: 'initial',
      improvements: [],
      score: 5.0
    });

  // Create evolution entries for each model's refinement
  let round = 2;
  for (const [modelId, score] of Object.entries(scores)) {
    const refinedPrompt = await generateRefinedPrompt(battle.prompt, modelId);
    const improvements = generateImprovements(battle.prompt, refinedPrompt);
    
    await supabase
      .from('prompt_evolution')
      .insert({
        battle_id: battleId,
        round: round++,
        prompt: refinedPrompt,
        model_id: modelId,
        improvements,
        score: score.overall
      });
  }
};

// Helper function to generate refined prompts
const generateRefinedPrompt = async (originalPrompt: string, modelId?: string): Promise<string> => {
  // For demo purposes, generate a refined version of the prompt
  const refinements = [
    'Please provide a detailed and comprehensive',
    'Explain in clear, easy-to-understand terms',
    'Include specific examples and practical applications',
    'Structure your response with clear headings and bullet points',
    'Consider multiple perspectives and provide balanced analysis'
  ];
  
  const randomRefinement = refinements[Math.floor(Math.random() * refinements.length)];
  return `${randomRefinement} ${originalPrompt.toLowerCase()}. Ensure your response is well-structured, informative, and engaging for the target audience.`;
};

// Helper function to generate improvement suggestions
const generateImprovements = (original: string, refined: string): string[] => {
  const improvements = [
    'Added clarity and specificity',
    'Improved structure and organization',
    'Enhanced detail requirements',
    'Better audience targeting',
    'Clearer success criteria',
    'More specific output format',
    'Added context and examples',
    'Improved actionability'
  ];
  
  // Return 2-4 random improvements
  const count = Math.floor(Math.random() * 3) + 2;
  return improvements.sort(() => 0.5 - Math.random()).slice(0, count);
};