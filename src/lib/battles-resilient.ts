// Ultra-resilient battle system with comprehensive error handling
import { BattleData, Battle, BattleResponse, BattleScore } from '../types';
import { flawlessBattleEngine, FlawlessBattleConfig } from './flawless-battle-engine';
import { BattleProgressTracker, ProgressCallback } from './battle-progress';
import { AVAILABLE_MODELS } from './models';

export class ResilientBattleEngine {
  private progressTracker: BattleProgressTracker;

  constructor(progressCallback: ProgressCallback) {
    this.progressTracker = new BattleProgressTracker(progressCallback);
  }

  async createBattle(battleData: BattleData): Promise<Battle> {
    try {
      // Use the new flawless battle engine
      const config: FlawlessBattleConfig = {
        prompt: battleData.prompt,
        category: battleData.prompt_category,
        battleType: battleData.battle_type,
        models: battleData.models.slice(0, 2), // Limit to 2 models
        userId: 'current-user-id',
        maxRounds: battleData.battle_type === 'prompt' ? 6 : 1,
        qualityThreshold: 9.5
      };

      const result = await flawlessBattleEngine.runFlawlessBattle(
        config,
        (phase, progress, details) => {
          this.progressTracker.updatePhase(phase, details, progress, details);
        }
      );

      if (!result.success) {
        throw new Error('Battle execution failed');
      }

      // Store battle in cache
      this.storeBattleInCache(result.battle);
      return result.battle;

    } catch (error) {
      this.progressTracker.addError(`Battle failed: ${error.message}`);
      
      // Generate fallback battle result
      return this.generateFallbackBattle(battleData, `battle_${Date.now()}`, error.message);
    }
  }

  private generateFallbackBattle(battleData: BattleData, battleId: string, errorMessage: string): Battle {
    // ALL REAL FAILURE - No synthetic data, honest failure state
    console.error(`[ResilientBattleEngine] Generating failed battle record for ${battleId}. Error: ${errorMessage}`);
    
    const battle: Battle = {
      id: battleId,
      userId: 'current-user-id',
      battleType: battleData.battle_type,
      prompt: battleData.prompt,
      finalPrompt: null,
      promptCategory: battleData.prompt_category,
      models: battleData.models,
      mode: battleData.mode,
      battleMode: battleData.battle_mode,
      rounds: 1,
      maxTokens: battleData.max_tokens,
      temperature: battleData.temperature,
      status: 'failed', // Mark as failed
      winner: null,
      totalCost: 0,
      autoSelectionReason: battleData.auto_selection_reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [],
      scores: {},
      plateauReason: `API Failure: ${errorMessage}`
    };

    this.storeBattleInCache(battle);
    return battle;
  }

  private storeBattleInCache(battle: Battle) {
    try {
      const demoCache = JSON.parse(localStorage.getItem('demo_battles') || '[]');
      demoCache.unshift(battle);
      if (demoCache.length > 50) {
        demoCache.splice(50);
      }
      localStorage.setItem('demo_battles', JSON.stringify(demoCache));
    } catch (error) {
      console.error('Error storing battle in cache:', error);
    }
  }
}