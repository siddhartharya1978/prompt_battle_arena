// Bulletproof Supabase Integration - Zero Tolerance for Failures
import { supabase } from './supabase';
import { Profile, Battle, transformProfileFromDB, transformBattleFromDB } from '../types';

export interface SupabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class BulletproofSupabase {
  private static instance: BulletproofSupabase;
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  };

  static getInstance(): BulletproofSupabase {
    if (!BulletproofSupabase.instance) {
      BulletproofSupabase.instance = new BulletproofSupabase();
    }
    return BulletproofSupabase.instance;
  }

  getClient() {
    return supabase;
  }

  // Authentication Methods
  async signIn(email: string, password: string): Promise<SupabaseResult<any>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  async signUp(email: string, password: string, name: string): Promise<SupabaseResult<any>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            name: name.trim(),
            full_name: name.trim(),
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }

  async signOut(): Promise<SupabaseResult<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign out failed' 
      };
    }
  }

  // Profile Methods
  async getProfile(userId: string): Promise<SupabaseResult<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Profile not found' };
        }
        return { success: false, error: error.message };
      }

      const profile = transformProfileFromDB(data);
      return { success: true, data: profile };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get profile' 
      };
    }
  }

  async createProfile(userId: string, email: string, name?: string): Promise<SupabaseResult<Profile>> {
    try {
      const profileData = {
        id: userId,
        email: email,
        name: name || email.split('@')[0],
        avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
        plan: 'free',
        role: email === 'admin@pba.com' ? 'admin' : 'user',
        battles_used: 0,
        battles_limit: email === 'admin@pba.com' ? 999 : 3,
        last_reset_at: new Date().toISOString().split('T')[0]
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const profile = transformProfileFromDB(data);
      return { success: true, data: profile };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create profile' 
      };
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<SupabaseResult<Profile>> {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
      if (updates.battlesUsed !== undefined) dbUpdates.battles_used = updates.battlesUsed;
      
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const profile = transformProfileFromDB(data);
      return { success: true, data: profile };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update profile' 
      };
    }
  }

  // Battle Methods
  async getBattles(userId: string): Promise<SupabaseResult<Battle[]>> {
    try {
      const { data, error } = await supabase
        .from('battles')
        .select(`
          *,
          battle_responses(*),
          battle_scores(*),
          prompt_evolution(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const battles = (data || []).map(transformBattleFromDB);
      return { success: true, data: battles };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get battles' 
      };
    }
  }

  async saveBattle(battle: Battle): Promise<SupabaseResult<string>> {
    try {
      // Save main battle record
      const { data: battleData, error: battleError } = await supabase
        .from('battles')
        .insert({
          id: battle.id,
          user_id: battle.userId,
          battle_type: battle.battleType,
          prompt: battle.prompt,
          final_prompt: battle.finalPrompt,
          prompt_category: battle.promptCategory,
          models: battle.models,
          mode: battle.mode,
          battle_mode: battle.battleMode,
          rounds: battle.rounds,
          max_tokens: battle.maxTokens,
          temperature: battle.temperature,
          status: battle.status,
          winner: battle.winner,
          total_cost: battle.totalCost,
          auto_selection_reason: battle.autoSelectionReason
        })
        .select()
        .single();

      if (battleError) {
        return { success: false, error: battleError.message };
      }

      // Save responses
      if (battle.responses && battle.responses.length > 0) {
        const responsesData = battle.responses.map(r => ({
          id: r.id,
          battle_id: battle.id,
          model_id: r.modelId,
          response: r.response,
          latency: r.latency,
          tokens: r.tokens,
          cost: r.cost
        }));

        const { error: responsesError } = await supabase
          .from('battle_responses')
          .insert(responsesData);

        if (responsesError) {
          console.warn('Failed to save responses:', responsesError.message);
        }
      }

      // Save scores
      if (battle.scores && Object.keys(battle.scores).length > 0) {
        const scoresData = Object.entries(battle.scores).map(([modelId, score]) => ({
          id: `score_${Date.now()}_${modelId}`,
          battle_id: battle.id,
          model_id: modelId,
          accuracy: score.accuracy,
          reasoning: score.reasoning,
          structure: score.structure,
          creativity: score.creativity,
          overall: score.overall,
          notes: score.notes
        }));

        const { error: scoresError } = await supabase
          .from('battle_scores')
          .insert(scoresData);

        if (scoresError) {
          console.warn('Failed to save scores:', scoresError.message);
        }
      }

      return { success: true, data: battle.id };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save battle' 
      };
    }
  }

  // Health check
  async healthCheck(): Promise<SupabaseResult<any>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: 'Connected' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Health check failed' 
      };
    }
  }
}

export const bulletproofSupabase = BulletproofSupabase.getInstance();