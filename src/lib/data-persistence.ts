// Ultra-reliable data persistence with retry mechanisms and optimistic updates
import { supabase } from './supabase';
import { Profile, Battle } from '../types';

export interface PersistenceOptions {
  maxRetries?: number;
  retryDelay?: number;
  optimistic?: boolean;
  fallbackToLocal?: boolean;
}

export class DataPersistenceManager {
  private static instance: DataPersistenceManager;
  private operationQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  static getInstance(): DataPersistenceManager {
    if (!DataPersistenceManager.instance) {
      DataPersistenceManager.instance = new DataPersistenceManager();
    }
    return DataPersistenceManager.instance;
  }

  async incrementBattleUsage(userId: string, currentUsage: number, limit: number): Promise<{success: boolean, newUsage: number}> {
    const options: PersistenceOptions = {
      maxRetries: 3,
      retryDelay: 1000,
      optimistic: true,
      fallbackToLocal: true
    };

    // Optimistic update
    const optimisticUsage = Math.min(currentUsage + 1, limit);
    
    try {
      // Check if demo user
      const demoSession = localStorage.getItem('demo_session');
      if (demoSession) {
        const demoUser = JSON.parse(demoSession);
        demoUser.battlesUsed = optimisticUsage;
        demoUser.updatedAt = new Date().toISOString();
        localStorage.setItem('demo_session', JSON.stringify(demoUser));
        console.log(`[DataPersistence] Demo user battle usage incremented to ${optimisticUsage} (localStorage)`);
        return { success: true, newUsage: optimisticUsage };
      }

      // Real user - attempt database update with retries
      const result = await this.retryOperation(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            battles_used: optimisticUsage,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select('battles_used')
          .single();

        if (error) throw error;
        console.log(`[DataPersistence] Supabase: Battle usage for user ${userId} incremented to ${data.battles_used}`);
        return data;
      }, options);

      return { success: true, newUsage: result.battles_used };


    } catch (error) {
      console.error('Failed to increment battle usage:', error);
      
      if (options.fallbackToLocal) {
        // Fallback to localStorage tracking
        const fallbackKey = `user_${userId}_battles_used`;
        localStorage.setItem(fallbackKey, optimisticUsage.toString());
        console.warn(`[DataPersistence] Supabase: Failed to increment battle usage for user ${userId}. Falling back to localStorage. Error: ${error.message}`);
        return { success: true, newUsage: optimisticUsage };
      }

      return { success: false, newUsage: currentUsage };
    }
  }

  async saveBattle(battle: Battle): Promise<{success: boolean, battleId: string}> {
    const options: PersistenceOptions = {
      maxRetries: 3,
      retryDelay: 2000,
      optimistic: true,
      fallbackToLocal: true
    };

    try {
      // Always save to localStorage first (immediate backup)
      this.saveBattleToLocalStorage(battle);

      // If it's a demo user, we're done after localStorage save
      // Check if demo user
      const demoSession = localStorage.getItem('demo_session');
      if (demoSession) {
        return { success: true, battleId: battle.id };
      }

      // Real user - attempt database save with retries
      await this.retryOperation(async () => {
        // Save main battle record
        const { error: battleError } = await supabase
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
          });

        if (battleError) throw battleError;

        // Save responses
        if (battle.responses.length > 0) {
          const { error: responsesError } = await supabase
            .from('battle_responses')
            .insert(battle.responses.map(r => ({
              id: r.id,
              battle_id: r.battleId,
              model_id: r.modelId,
              response: r.response,
              latency: r.latency,
              tokens: r.tokens,
              cost: r.cost
            })));

          if (responsesError) throw responsesError;
        }

        // Save scores
        const scoreEntries = Object.entries(battle.scores).map(([modelId, score]) => ({
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

        if (scoreEntries.length > 0) {
          const { error: scoresError } = await supabase
            .from('battle_scores')
            .insert(scoreEntries);

          if (scoresError) throw scoresError;
        }

        // Save prompt evolution if exists
        if (battle.promptEvolution && battle.promptEvolution.length > 0) {
          const { error: evolutionError } = await supabase
            .from('prompt_evolution')
            .insert(battle.promptEvolution.map(p => ({
              id: p.id,
              battle_id: p.battleId,
              round: p.round,
              prompt: p.prompt,
              model_id: p.modelId,
              improvements: p.improvements,
              score: p.score
            })));

          if (evolutionError) throw evolutionError;
          console.log(`[DataPersistence] Supabase: Battle ${battle.id} and related records saved successfully.`);
        }
      }, options);

      return { success: true, battleId: battle.id };


    } catch (error) {
      console.error('Failed to save battle to database:', error);
      
      if (options.fallbackToLocal) {
        // Already saved to localStorage, so we're good
        console.log('Battle saved to localStorage as fallback');
        console.warn(`[DataPersistence] Supabase: Failed to save battle ${battle.id}. Falling back to localStorage. Error: ${error.message}`);
      }

      return { success: false, battleId: battle.id };
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{success: boolean, profile?: Profile}> {
    const options: PersistenceOptions = {
      maxRetries: 3,
      retryDelay: 1000,
      optimistic: true,
      fallbackToLocal: true
    };

    try {
      // Check if demo user
      const demoSession = localStorage.getItem('demo_session');
      if (demoSession) {
        const demoUser = JSON.parse(demoSession);
        const updatedUser = { ...demoUser, ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem('demo_session', JSON.stringify(updatedUser));
        return { success: true, profile: updatedUser };
        console.log(`[DataPersistence] Demo user profile updated (localStorage) for user ${userId}`);
      }

      // Real user - attempt database update with retries
      const result = await this.retryOperation(async () => {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
        if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
        if (updates.battlesUsed !== undefined) dbUpdates.battles_used = updates.battlesUsed;
        
        const { data, error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;
        console.log(`[DataPersistence] Supabase: Profile for user ${userId} updated successfully.`);
        return data;
      }, options);

      return { success: true, profile: result };


    } catch (error) {
      console.error('Failed to update profile:', error);
      
      if (options.fallbackToLocal) {
        // Save to localStorage as fallback
        const fallbackKey = `user_${userId}_profile_updates`;
        localStorage.setItem(fallbackKey, JSON.stringify({
          updates,
          timestamp: new Date().toISOString()
        })); // This is a pending update, not the actual profile
        console.log('Profile updates saved to localStorage as fallback');
        return { success: true };
      }

      return { success: false };
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    options: PersistenceOptions
  ): Promise<T> {
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Wait before retry with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        console.warn(`[DataPersistence] Retrying operation (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms. Error: ${lastError.message}`);
        console.log(`Retrying operation in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  private saveBattleToLocalStorage(battle: Battle): void {
    try {
      const demoCache = JSON.parse(localStorage.getItem('demo_battles') || '[]');
      
      // Remove any existing battle with same ID
      const filteredCache = demoCache.filter((b: Battle) => b.id !== battle.id);
      
      // Add new battle at the beginning
      filteredCache.unshift(battle);
      
      // Keep only last 100 battles
      if (filteredCache.length > 100) {
        filteredCache.splice(100);
      }
      
      localStorage.setItem('demo_battles', JSON.stringify(filteredCache));
      console.log(`[DataPersistence] Battle ${battle.id} saved to localStorage.`);
    } catch (error) {
      console.error('Failed to save battle to localStorage:', error);
      // Even localStorage can fail (quota exceeded), but we continue
    }
  }

  // Sync pending operations when connection is restored
  async syncPendingOperations(): Promise<void> {
    try {
      // Check for pending profile updates
      const profileKeys = Object.keys(localStorage).filter(key => key.includes('_profile_updates'));
      
      for (const key of profileKeys) {
        try {
          const pendingUpdate = JSON.parse(localStorage.getItem(key) || '{}');
          const userId = key.split('_')[1];
          
          if (pendingUpdate.updates && userId) {
            await this.updateProfile(userId, pendingUpdate.updates);
            localStorage.removeItem(key);
            console.log(`[DataPersistence] Synced pending profile update for user ${userId}.`);
          }
        } catch (error) {
          console.error('Failed to sync profile update:', error);
        }
      }

      // Check for pending battle usage updates
      const usageKeys = Object.keys(localStorage).filter(key => key.includes('_battles_used'));
      
      for (const key of usageKeys) {
        try {
          const usage = parseInt(localStorage.getItem(key) || '0');
          const userId = key.split('_')[1];
          
          if (usage > 0 && userId) {
            await this.incrementBattleUsage(userId, usage - 1, 999); // Sync the increment
            localStorage.removeItem(key);
            console.log(`[DataPersistence] Synced pending usage update for user ${userId}.`);
          }
        } catch (error) {
          console.error('Failed to sync usage update:', error);
        }
      }

    } catch (error) {
      console.error('Failed to sync pending operations:', error);
    }
  }

  // Get storage health status
  getStorageHealth(): {
    localStorage: boolean;
    supabase: boolean;
    pendingOperations: number;
  } {
    const localStorageWorks = (() => {
      try {
        const testKey = 'pba_storage_test';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    })();

    const pendingOperations = Object.keys(localStorage).filter(key => 
      key.includes('_profile_updates') || key.includes('_battles_used')
    ).length;

    return {
      localStorage: localStorageWorks,
      supabase: !!import.meta.env.VITE_SUPABASE_URL,
      pendingOperations
    };
  }
}

export const dataPersistenceManager = DataPersistenceManager.getInstance();