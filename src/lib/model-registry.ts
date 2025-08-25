// Groq-Aware Model Registry with ELO tracking and capabilities
import { AVAILABLE_MODELS } from './models';
import { ModelCapabilities } from './battle-engine';

export class ModelRegistry {
  private models: Map<string, ModelCapabilities> = new Map();
  private rateLimits: Map<string, { requests: number, resetTime: number }> = new Map();

  constructor() {
    this.initializeModels();
  }

  private initializeModels() {
    AVAILABLE_MODELS.forEach(model => {
      const capabilities: ModelCapabilities = {
        id: model.id,
        ctx_tokens: model.contextWindow,
        avg_latency_ms: this.estimateLatency(model.speed),
        cost_per_1k_tokens: model.pricing,
        tool_use_support: model.knownFor.includes('technical') || model.id.includes('tool'),
        json_mode_support: true, // Most Groq models support JSON mode
        determinism_ok: true,
        diversity_key: `${model.provider}-${this.getArchitecture(model.id)}`,
        elo_by_task: this.initializeELO(model),
        freshness_score: this.calculateFreshness(model)
      };
      
      this.models.set(model.id, capabilities);
    });
  }

  private estimateLatency(speed: string): number {
    switch (speed) {
      case 'fast': return 800;
      case 'medium': return 1500;
      case 'slow': return 3000;
      default: return 1500;
    }
  }

  private getArchitecture(modelId: string): string {
    if (modelId.includes('8b')) return '8b';
    if (modelId.includes('70b')) return '70b';
    if (modelId.includes('120b')) return '120b';
    if (modelId.includes('32b')) return '32b';
    if (modelId.includes('17b')) return '17b';
    if (modelId.includes('22m')) return '22m';
    if (modelId.includes('86m')) return '86m';
    return 'unknown';
  }

  private initializeELO(model: any): Record<string, number> {
    const baseELO = 1500;
    const bonuses = {
      reasoning: model.knownFor.includes('reasoning') ? 100 : 0,
      creative: model.knownFor.includes('creative') ? 100 : 0,
      technical: model.knownFor.includes('technical') ? 100 : 0,
      analysis: model.knownFor.includes('analysis') ? 100 : 0,
      writing: model.knownFor.includes('general') ? 50 : 0,
      planning: model.knownFor.includes('reasoning') ? 75 : 0
    };

    return {
      reasoning: baseELO + bonuses.reasoning,
      creative: baseELO + bonuses.creative,
      technical: baseELO + bonuses.technical,
      analysis: baseELO + bonuses.analysis,
      writing: baseELO + bonuses.writing,
      planning: baseELO + bonuses.planning
    };
  }

  private calculateFreshness(model: any): number {
    // Newer models get higher freshness scores
    if (model.id.includes('llama-4')) return 1.0;
    if (model.id.includes('llama-3.3')) return 0.9;
    if (model.id.includes('llama-3.1')) return 0.8;
    if (model.id.includes('qwen3')) return 0.7;
    return 0.5;
  }

  public getCapabilities(modelId: string): ModelCapabilities | null {
    return this.models.get(modelId) || null;
  }

  public getAllCapabilities(): ModelCapabilities[] {
    return Array.from(this.models.values());
  }

  public updateELO(modelId: string, taskType: string, newELO: number) {
    const model = this.models.get(modelId);
    if (model) {
      model.elo_by_task[taskType] = newELO;
    }
  }

  public checkRateLimit(modelId: string): boolean {
    const limit = this.rateLimits.get(modelId);
    if (!limit) return true;

    const now = Date.now();
    if (now > limit.resetTime) {
      this.rateLimits.delete(modelId);
      return true;
    }

    return limit.requests < 30; // Conservative limit
  }

  public recordRequest(modelId: string) {
    const now = Date.now();
    const resetTime = now + 60000; // 1 minute window
    
    const current = this.rateLimits.get(modelId) || { requests: 0, resetTime };
    current.requests++;
    
    this.rateLimits.set(modelId, current);
  }

  public getOptimalModels(requirements: BattleRequirements): string[] {
    const capabilities = this.getAllCapabilities();
    
    // Filter by requirements
    const suitable = capabilities.filter(model => {
      return model.ctx_tokens >= requirements.constraints.min_ctx_tokens &&
             model.avg_latency_ms <= requirements.constraints.max_latency_ms &&
             model.cost_per_1k_tokens <= requirements.constraints.max_cost_usd &&
             this.checkRateLimit(model.id);
    });

    if (suitable.length < 2) {
      console.warn('⚠️ Insufficient suitable models, using fallback selection');
      return ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
    }

    // Diversity and seeding
    const diversityGroups: Record<string, ModelCapabilities[]> = {};
    suitable.forEach(model => {
      if (!diversityGroups[model.diversity_key]) {
        diversityGroups[model.diversity_key] = [];
      }
      diversityGroups[model.diversity_key].push(model);
    });

    const selected: ModelCapabilities[] = [];
    Object.values(diversityGroups).forEach(group => {
      const best = group.sort((a, b) => {
        const aScore = a.elo_by_task[requirements.task_type] || 1500;
        const bScore = b.elo_by_task[requirements.task_type] || 1500;
        return bScore - aScore;
      })[0];
      selected.push(best);
    });

    return selected.slice(0, 3).map(m => m.id);
  }
}

// Singleton instance
export const modelRegistry = new ModelRegistry();