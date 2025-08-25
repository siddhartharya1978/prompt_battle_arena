// Real-time battle progress tracking and notifications
export interface BattleProgress {
  phase: string;
  step: string;
  progress: number; // 0-100
  details: string;
  modelStatus: Record<string, 'pending' | 'running' | 'completed' | 'failed'>;
  currentRound?: number;
  totalRounds?: number;
  errors: string[];
  warnings: string[];
}

export type ProgressCallback = (progress: BattleProgress) => void;

export class BattleProgressTracker {
  private callback: ProgressCallback;
  private progress: BattleProgress;

  constructor(callback: ProgressCallback) {
    this.callback = callback;
    this.progress = {
      phase: 'Initializing',
      step: 'Setting up battle',
      progress: 0,
      details: 'Preparing battle configuration...',
      modelStatus: {},
      errors: [],
      warnings: []
    };
  }

  updatePhase(phase: string, step: string, progress: number, details: string) {
    this.progress = {
      ...this.progress,
      phase,
      step,
      progress,
      details
    };
    this.callback(this.progress);
  }

  updateModelStatus(modelId: string, status: 'pending' | 'running' | 'completed' | 'failed') {
    this.progress.modelStatus[modelId] = status;
    this.callback(this.progress);
  }

  addError(error: string) {
    this.progress.errors.push(error);
    this.callback(this.progress);
  }

  addWarning(warning: string) {
    this.progress.warnings.push(warning);
    this.callback(this.progress);
  }

  setRoundInfo(current: number, total: number) {
    this.progress.currentRound = current;
    this.progress.totalRounds = total;
    this.callback(this.progress);
  }

  complete() {
    this.progress = {
      ...this.progress,
      phase: 'Completed',
      step: 'Battle finished',
      progress: 100,
      details: 'Battle completed successfully!'
    };
    this.callback(this.progress);
  }
}