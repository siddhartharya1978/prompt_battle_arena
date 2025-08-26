// Ultra-resilient battle system with comprehensive error handling
import { BattleData, Battle, BattleResponse, BattleScore } from '../types';
import { BattleProgressTracker, ProgressCallback } from './battle-progress';
import { AVAILABLE_MODELS } from './models';

export class ResilientBattleEngine {
  private progressTracker: BattleProgressTracker;

  constructor(progressCallback: ProgressCallback) {
    this.progressTracker = new BattleProgressTracker(progressCallback);
  }

  async createBattle(battleData: BattleData): Promise<Battle> {
    // This class is now deprecated - battle creation moved to BattleContext
    throw new Error('ResilientBattleEngine is deprecated - use BattleContext.createBattle instead');
  }
}