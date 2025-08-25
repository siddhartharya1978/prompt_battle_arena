// Real-time battle progress tracking and notifications
export interface BattleProgress {
  phase: string;
  step: string;
  progress: number; // 0-100
  details: string;
  subPhase?: string; // More granular step within a phase
  modelStatus: Record<string, 'pending' | 'running' | 'completed' | 'failed'>;
  modelProgress: Record<string, number>; // Individual model progress 0-100
  currentRound?: number;
  totalRounds?: number;
  estimatedTimeRemaining?: number; // seconds
  errors: string[];
  warnings: string[];
  successMessages: string[];
  phaseStartTime: number;
  totalStartTime: number;
}

export type ProgressCallback = (progress: BattleProgress) => void;

export class BattleProgressTracker {
  private callback: ProgressCallback;
  private progress: BattleProgress;

  constructor(callback: ProgressCallback) {
    this.callback = callback;
    const now = Date.now();
    this.progress = {
      phase: 'Initializing',
      step: 'Setting up battle configuration',
      progress: 0,
      details: 'Preparing battle configuration...',
      modelStatus: {},
      modelProgress: {},
      errors: [],
      warnings: [],
      successMessages: [],
      phaseStartTime: now,
      totalStartTime: now
    };
  }

  updatePhase(phase: string, step: string, progress: number, details: string, subPhase?: string) {
    const now = Date.now();
    const phaseChanged = this.progress.phase !== phase;
    
    this.progress = {
      ...this.progress,
      phase,
      step,
      progress,
      details,
      subPhase,
      phaseStartTime: phaseChanged ? now : this.progress.phaseStartTime,
      estimatedTimeRemaining: this.calculateTimeRemaining(progress, now)
    };
    this.callback(this.progress);
  }

  updateModelStatus(modelId: string, status: 'pending' | 'running' | 'completed' | 'failed', progress: number = 0) {
    this.progress.modelStatus[modelId] = status;
    this.progress.modelProgress[modelId] = progress;
    this.callback(this.progress);
  }

  updateModelProgress(modelId: string, progress: number, details?: string) {
    this.progress.modelProgress[modelId] = progress;
    if (details) {
      this.progress.details = details;
    }
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

  addSuccess(message: string) {
    this.progress.successMessages.push(message);
    this.callback(this.progress);
  }

  setRoundInfo(current: number, total: number) {
    this.progress.currentRound = current;
    this.progress.totalRounds = total;
    this.callback(this.progress);
  }

  private calculateTimeRemaining(currentProgress: number, currentTime: number): number {
    if (currentProgress <= 0) return 0;
    
    const elapsed = currentTime - this.progress.totalStartTime;
    const estimatedTotal = (elapsed / currentProgress) * 100;
    const remaining = Math.max(0, estimatedTotal - elapsed);
    
    return Math.round(remaining / 1000); // Convert to seconds
  }

  complete() {
    this.progress = {
      ...this.progress,
      phase: 'Completed',
      step: 'Battle finished',
      progress: 100,
      details: 'Battle completed successfully!',
      estimatedTimeRemaining: 0
    };
    this.callback(this.progress);
  }
}