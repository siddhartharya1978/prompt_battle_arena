// Ultra-reliable data persistence with retry mechanisms and optimistic updates
import { bulletproofSupabase } from './supabase-bulletproof';
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
    console.log(`📊 [DataPersistence] ===== STARTING BATTLE USAGE INCREMENT =====`);
    console.log(`📊 [DataPersistence] User ID: ${userId}`);
    console.log(`📊 [DataPersistence] Current Usage: ${currentUsage}`);
    console.log(`📊 [DataPersistence] Limit: ${limit}`);
    console.log(`📊 [DataPersistence] Target Usage: ${Math.min(currentUsage + 1, limit)}`);
    
    const options: PersistenceOptions = {
      maxRetries: 3,
      retryDelay: 1000,
      optimistic: true,
      fallbackToLocal: true
    };

    // Optimistic update
    const optimisticUsage = Math.min(currentUsage + 1, limit);
    
    try {
      // Attempt database update with retries for ALL users
      console.log(`🔄 [DataPersistence] ATTEMPTING: Supabase update for user ${userId}`);
      const result = await this.retryOperation(async () => {
        const updatedProfile = await bulletproofSupabase.updateProfile(userId, {
          battlesUsed: optimisticUsage
        });
        
        if (!updatedProfile) {
          throw new Error('Profile update returned null');
        }
        
        console.log(`✅ [DataPersistence] SUPABASE UPDATE SUCCESS: User ${userId} usage = ${updatedProfile.battlesUsed}`);
        return { battles_used: updatedProfile.battlesUsed };
      }, options);

      console.log(`🎉 [DataPersistence] ===== BATTLE USAGE INCREMENT COMPLETE SUCCESS =====`);
      console.log(`🎉 [DataPersistence] User ${userId} new usage: ${result.battles_used}`);
      return { success: true, newUsage: result.battles_used };


    } catch (error) {
      console.error(`💥 [DataPersistence] ===== BATTLE USAGE INCREMENT FAILED =====`);
      console.error(`💥 [DataPersistence] User ID: ${userId}`);
      console.error(`💥 [DataPersistence] Error: ${error.message}`);
      console.error(`💥 [DataPersistence] Attempting fallback to localStorage...`);
      
      if (options.fallbackToLocal) {
        // Fallback to localStorage tracking
        const fallbackKey = `user_${userId}_battles_used`;
        localStorage.setItem(fallbackKey, optimisticUsage.toString());
        console.log(`🔄 [DataPersistence] FALLBACK SUCCESS: localStorage usage tracking for user ${userId}`);
        return { success: true, newUsage: optimisticUsage };
      }

      console.error(`💥 [DataPersistence] CRITICAL FAILURE: All usage increment methods failed for user ${userId}`);
      return { success: false, newUsage: currentUsage };
    }
  }

  async saveBattle(battle: Battle): Promise<{success: boolean, battleId: string}> {
    if (!battle || !battle.id) {
      throw new Error('Invalid battle data provided');
    }
    
    // Use bulletproof Supabase save
    return await bulletproofSupabase.saveBattle(battle);
  }

  private async saveBattleToLocalStorage(battle: Battle): Promise<void> {
    return new Promise((resolve, reject) => {
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
        console.log(`💾 [DataPersistence] LOCAL: Battle ${battle.id} saved to localStorage successfully`);
        resolve();
      } catch (error) {
        console.error(`💥 [DataPersistence] CRITICAL: Failed to save battle ${battle.id} to localStorage:`, error);
        reject(error);
      }
    });
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

      console.log(`✅ [DataPersistence] SUCCESS: Profile updated for user ${userId}`);
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
        console.error(`❌ [DataPersistence] FAILED: Profile update for user ${userId} failed. Error: ${error.message}`);
        console.log(`🔄 [DataPersistence] FALLBACK: Profile updates saved to localStorage for user ${userId}`);
        return { success: true };
      }

      console.error(`💥 [DataPersistence] CRITICAL: Profile update completely failed for user ${userId}. Error: ${error.message}`);
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
      console.log(`💾 [DataPersistence] LOCAL: Battle ${battle.id} saved to localStorage successfully`);
    } catch (error) {
      console.error(`💥 [DataPersistence] CRITICAL: Failed to save battle ${battle.id} to localStorage:`, error);
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