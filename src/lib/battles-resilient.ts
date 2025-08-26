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
    // ALL REAL POLICY - HONEST FAILURE STATE WITH NO SYNTHETIC DATA
    console.error(`[ResilientBattleEngine] Generating failed battle record for ${battleId}. Error: ${errorMessage}`);
    console.error(`[ResilientBattleEngine] Battle type: ${battleData.battle_type}, Models: ${battleData.models.join(', ')}`);
    console.error(`[ResilientBattleEngine] This is an honest API failure - no synthetic data will be generated`);
    
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
      status: 'failed', // HONEST FAILURE STATUS
      winner: null,
      totalCost: 0,
      autoSelectionReason: battleData.auto_selection_reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [], // NO SYNTHETIC RESPONSES
      scores: {}, // NO SYNTHETIC SCORES
      plateauReason: `Groq API Failure: ${errorMessage}. This battle could not be completed due to external API issues. No synthetic data was generated in accordance with ALL REAL policy.`
    };

    console.log(`💾 [ResilientBattleEngine] Created honest failure battle record for ${battleId}`);
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