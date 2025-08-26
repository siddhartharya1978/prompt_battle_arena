// Ultra-resilient battle system with comprehensive error handling
import { BattleData, Battle, BattleResponse, BattleScore } from '../types';
import { FlawlessBattleEngine } from './flawless-battle-engine';
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
      const config = {
        prompt: battleData.prompt,
        category: battleData.prompt_category,
        battleType: battleData.battle_type,
        models: battleData.models.slice(0, 2), // Limit to 2 models
        userId: 'current-user-id',
        maxRounds: battleData.battle_type === 'prompt' ? 6 : 1,
        qualityThreshold: 9.5
      };

      const battleEngine = FlawlessBattleEngine.getInstance();
      const result = await battleEngine.runFlawlessBattle(
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
    console.error(`💥 [ResilientBattleEngine] GENERATING HONEST FAILED BATTLE RECORD`);
    console.error(`💥 [ResilientBattleEngine] Battle ID: ${battleId}`);
    console.error(`💥 [ResilientBattleEngine] Battle Type: ${battleData.battle_type}`);
    console.error(`💥 [ResilientBattleEngine] Models: ${battleData.models.join(', ')}`);
    console.error(`💥 [ResilientBattleEngine] Error: ${errorMessage}`);
    console.error(`💥 [ResilientBattleEngine] NO SYNTHETIC DATA GENERATED - HONEST API FAILURE`);
    
    const battle: Battle = {
      id: battleId,
      userId: battleData.user_id || 'unknown-user',
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
      plateauReason: `HONEST API FAILURE: ${errorMessage}. This battle could not be completed due to external Groq API issues. No synthetic data was generated in accordance with ALL REAL policy. You can retry immediately as the issue is likely temporary.`
    };

    console.log(`💾 [ResilientBattleEngine] HONEST FAILED BATTLE CREATED: ${battleId}`);
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