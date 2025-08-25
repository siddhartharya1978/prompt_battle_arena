// Proactive Model Health Monitoring System
import { AVAILABLE_MODELS } from './models';
import { supabase } from './supabase';

export interface ModelHealthStatus {
  modelId: string;
  status: 'healthy' | 'degraded' | 'unavailable' | 'unknown';
  lastChecked: string;
  responseTime: number;
  errorRate: number;
  lastError?: string;
  recommendation?: string;
}

export interface HealthCheckResult {
  overallHealth: 'excellent' | 'good' | 'degraded' | 'poor';
  healthyModels: string[];
  degradedModels: string[];
  unavailableModels: string[];
  recommendations: string[];
}

class ModelHealthMonitor {
  private static instance: ModelHealthMonitor;
  private healthCache: Map<string, ModelHealthStatus> = new Map();
  private lastGlobalCheck = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly HEALTH_CHECK_TIMEOUT = 45000; // 45 seconds

  static getInstance(): ModelHealthMonitor {
    if (!ModelHealthMonitor.instance) {
      ModelHealthMonitor.instance = new ModelHealthMonitor();
    }
    return ModelHealthMonitor.instance;
  }

  async checkModelHealth(modelId: string): Promise<ModelHealthStatus> {
    const cached = this.healthCache.get(modelId);
    const now = Date.now();

    // Return cached result if recent
    if (cached && (now - new Date(cached.lastChecked).getTime()) < this.CACHE_DURATION) {
      return cached;
    }

    console.log(`🏥 Health check for ${modelId}`);

    try {
      const startTime = Date.now();
      
      // Quick health check with minimal prompt
      const healthCheckPrompt = "Hi";
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase configuration missing');
      }

      const apiUrl = supabaseUrl.startsWith('http') 
        ? `${supabaseUrl}/functions/v1/groq-api`
        : `https://${supabaseUrl}/functions/v1/groq-api`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.HEALTH_CHECK_TIMEOUT);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'x-client-info': 'pba-health-check/1.0.0',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: modelId,
          prompt: healthCheckPrompt,
          max_tokens: 10,
          temperature: 0.1
        })
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      let status: ModelHealthStatus['status'] = 'healthy';
      let lastError: string | undefined;
      let recommendation: string | undefined;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        lastError = errorData.error || `HTTP ${response.status}`;
        
        if (response.status === 429) {
          status = 'degraded';
          recommendation = 'Rate limited - will retry automatically';
        } else if (response.status >= 500) {
          status = 'degraded';
          recommendation = 'Server issues - using fallback strategies';
        } else {
          status = 'unavailable';
          recommendation = 'Model temporarily unavailable - consider alternatives';
        }
      } else {
        // Check response time for degradation
        if (responseTime > 5000) {
          status = 'degraded';
          recommendation = 'Slower than usual - may use fallbacks';
        }
      }

      const healthStatus: ModelHealthStatus = {
        modelId,
        status,
        lastChecked: new Date().toISOString(),
        responseTime,
        errorRate: status === 'healthy' ? 0 : 1,
        lastError,
        recommendation
      };

      this.healthCache.set(modelId, healthStatus);
      return healthStatus;

    } catch (error) {
      console.error(`❌ Health check failed for ${modelId}:`, error);
      
      const healthStatus: ModelHealthStatus = {
        modelId,
        status: 'unknown',
        lastChecked: new Date().toISOString(),
        responseTime: this.HEALTH_CHECK_TIMEOUT,
        errorRate: 1,
        lastError: error instanceof Error ? error.message : 'Health check failed',
        recommendation: 'Unable to verify status - will attempt with fallbacks'
      };

      this.healthCache.set(modelId, healthStatus);
      return healthStatus;
    }
  }

  async checkAllModelsHealth(modelIds: string[]): Promise<HealthCheckResult> {
    console.log(`🏥 Running health checks for ${modelIds.length} models`);
    
    const healthPromises = modelIds.map(id => this.checkModelHealth(id));
    const healthStatuses = await Promise.all(healthPromises);

    const healthyModels = healthStatuses.filter(h => h.status === 'healthy').map(h => h.modelId);
    const degradedModels = healthStatuses.filter(h => h.status === 'degraded').map(h => h.modelId);
    const unavailableModels = healthStatuses.filter(h => h.status === 'unavailable').map(h => h.modelId);

    const recommendations: string[] = [];
    
    if (unavailableModels.length > 0) {
      recommendations.push(`${unavailableModels.length} models unavailable - automatic alternatives will be used`);
    }
    
    if (degradedModels.length > 0) {
      recommendations.push(`${degradedModels.length} models experiencing issues - fallback strategies active`);
    }
    
    if (healthyModels.length < 2) {
      recommendations.push('Limited healthy models - battle will use enhanced fallback system');
    }

    let overallHealth: HealthCheckResult['overallHealth'] = 'excellent';
    if (unavailableModels.length > modelIds.length / 2) {
      overallHealth = 'poor';
    } else if (degradedModels.length > 0 || unavailableModels.length > 0) {
      overallHealth = 'degraded';
    } else if (healthyModels.length === modelIds.length) {
      overallHealth = 'excellent';
    } else {
      overallHealth = 'good';
    }

    return {
      overallHealth,
      healthyModels,
      degradedModels,
      unavailableModels,
      recommendations
    };
  }

  getModelHealthStatus(modelId: string): ModelHealthStatus | null {
    return this.healthCache.get(modelId) || null;
  }

  clearHealthCache(): void {
    this.healthCache.clear();
  }
}

export const modelHealthMonitor = ModelHealthMonitor.getInstance();

// Utility functions for UI components
export const getHealthStatusColor = (status: ModelHealthStatus['status']): string => {
  switch (status) {
    case 'healthy': return 'text-green-600 dark:text-green-400';
    case 'degraded': return 'text-yellow-600 dark:text-yellow-400';
    case 'unavailable': return 'text-red-600 dark:text-red-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
};

export const getHealthStatusIcon = (status: ModelHealthStatus['status']): string => {
  switch (status) {
    case 'healthy': return '✅';
    case 'degraded': return '⚠️';
    case 'unavailable': return '❌';
    default: return '❓';
  }
};

export const getHealthStatusBadge = (status: ModelHealthStatus['status']): string => {
  switch (status) {
    case 'healthy': return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
    case 'degraded': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
    case 'unavailable': return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
};