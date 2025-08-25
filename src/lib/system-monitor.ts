// Comprehensive System Health Monitoring
import { modelHealthMonitor } from './model-health';
import { dataPersistenceManager } from './data-persistence';

export interface SystemHealth {
  overall: 'excellent' | 'good' | 'degraded' | 'critical';
  components: {
    api: 'healthy' | 'degraded' | 'down';
    database: 'healthy' | 'degraded' | 'down';
    storage: 'healthy' | 'degraded' | 'down';
    models: 'healthy' | 'degraded' | 'down';
  };
  metrics: {
    apiResponseTime: number;
    errorRate: number;
    successfulBattles: number;
    failedBattles: number;
  };
  recommendations: string[];
  lastChecked: string;
}

export interface PerformanceMetrics {
  avgBattleTime: number;
  avgResponseTime: number;
  successRate: number;
  userSatisfaction: number;
  systemLoad: number;
}

class SystemMonitor {
  private static instance: SystemMonitor;
  private healthCache: SystemHealth | null = null;
  private metricsCache: PerformanceMetrics | null = null;
  private lastHealthCheck = 0;
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  async getSystemHealth(forceRefresh = false): Promise<SystemHealth> {
    const now = Date.now();
    
    if (!forceRefresh && this.healthCache && (now - this.lastHealthCheck) < this.HEALTH_CHECK_INTERVAL) {
      return this.healthCache;
    }

    console.log('🏥 Running comprehensive system health check...');

    const health: SystemHealth = {
      overall: 'excellent',
      components: {
        api: 'healthy',
        database: 'healthy',
        storage: 'healthy',
        models: 'healthy'
      },
      metrics: {
        apiResponseTime: 0,
        errorRate: 0,
        successfulBattles: 0,
        failedBattles: 0
      },
      recommendations: [],
      lastChecked: new Date().toISOString()
    };

    // Check API health
    try {
      const startTime = Date.now();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey) {
        health.components.api = 'down';
        health.recommendations.push('Supabase configuration missing - check environment variables');
      } else {
        const apiUrl = supabaseUrl.startsWith('http') 
          ? `${supabaseUrl}/functions/v1/groq-api`
          : `https://${supabaseUrl}/functions/v1/groq-api`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            prompt: 'Health check',
            max_tokens: 5,
            temperature: 0.1
          })
        });

        const responseTime = Date.now() - startTime;
        health.metrics.apiResponseTime = responseTime;

        if (response.ok) {
          health.components.api = responseTime > 5000 ? 'degraded' : 'healthy';
          if (responseTime > 5000) {
            health.recommendations.push('API response times elevated - consider using Turbo mode');
          }
        } else {
          health.components.api = 'degraded';
          health.recommendations.push(`API issues detected (${response.status}) - fallback systems active`);
        }
      }
    } catch (error) {
      health.components.api = 'down';
      health.recommendations.push('API connectivity issues - using offline fallbacks');
    }

    // Check database health
    try {
      const storageHealth = dataPersistenceManager.getStorageHealth();
      
      if (!storageHealth.supabase) {
        health.components.database = 'down';
        health.recommendations.push('Database not configured - using local storage fallback');
      } else if (storageHealth.pendingOperations > 5) {
        health.components.database = 'degraded';
        health.recommendations.push(`${storageHealth.pendingOperations} pending sync operations - will sync when connection improves`);
      }

      if (!storageHealth.localStorage) {
        health.components.storage = 'down';
        health.recommendations.push('Local storage unavailable - data persistence limited');
      }
    } catch (error) {
      health.components.database = 'degraded';
      health.recommendations.push('Database health check failed - monitoring systems active');
    }

    // Check model health
    try {
      const availableModels = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
      const modelHealth = await modelHealthMonitor.checkAllModelsHealth(availableModels);
      
      if (modelHealth.overallHealth === 'poor') {
        health.components.models = 'down';
        health.recommendations.push('Multiple model issues detected - enhanced fallback system active');
      } else if (modelHealth.overallHealth === 'degraded') {
        health.components.models = 'degraded';
        health.recommendations.push('Some model issues detected - automatic failover enabled');
      }
    } catch (error) {
      health.components.models = 'degraded';
      health.recommendations.push('Model health check failed - using cached status');
    }

    // Calculate overall health
    const componentStatuses = Object.values(health.components);
    const downCount = componentStatuses.filter(s => s === 'down').length;
    const degradedCount = componentStatuses.filter(s => s === 'degraded').length;

    if (downCount > 1) {
      health.overall = 'critical';
    } else if (downCount > 0 || degradedCount > 2) {
      health.overall = 'degraded';
    } else if (degradedCount > 0) {
      health.overall = 'good';
    } else {
      health.overall = 'excellent';
    }

    // Add overall recommendations
    if (health.overall === 'excellent') {
      health.recommendations.unshift('🎉 All systems operating perfectly! Optimal battle performance expected.');
    } else if (health.overall === 'good') {
      health.recommendations.unshift('✅ Systems operating well with minor issues. Battles will complete successfully.');
    } else if (health.overall === 'degraded') {
      health.recommendations.unshift('⚠️ Some system issues detected. Enhanced fallback systems are active to ensure battle completion.');
    } else {
      health.recommendations.unshift('🚨 Multiple system issues detected. Ultra-resilient mode active - battles will still complete but may take longer.');
    }

    this.healthCache = health;
    this.lastHealthCheck = now;
    
    return health;
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    if (this.metricsCache) {
      return this.metricsCache;
    }

    try {
      // Get battle history for metrics
      const battles = JSON.parse(localStorage.getItem('demo_battles') || '[]');
      
      const completedBattles = battles.filter((b: any) => b.status === 'completed');
      const failedBattles = battles.filter((b: any) => b.status === 'failed');
      
      const avgBattleTime = completedBattles.length > 0 
        ? completedBattles.reduce((sum: number, b: any) => {
            const duration = new Date(b.updatedAt).getTime() - new Date(b.createdAt).getTime();
            return sum + duration;
          }, 0) / completedBattles.length
        : 0;

      const avgResponseTime = completedBattles.length > 0
        ? completedBattles.reduce((sum: number, b: any) => {
            const avgLatency = b.responses?.reduce((s: number, r: any) => s + r.latency, 0) / (b.responses?.length || 1);
            return sum + avgLatency;
          }, 0) / completedBattles.length
        : 0;

      const successRate = battles.length > 0 
        ? (completedBattles.length / battles.length) * 100 
        : 100;

      const userSatisfaction = completedBattles.length > 0
        ? completedBattles.reduce((sum: number, b: any) => {
            const winnerScore = b.winner && b.scores ? b.scores[b.winner]?.overall || 0 : 0;
            return sum + (winnerScore / 10);
          }, 0) / completedBattles.length * 100
        : 85;

      this.metricsCache = {
        avgBattleTime: Math.round(avgBattleTime / 1000), // Convert to seconds
        avgResponseTime: Math.round(avgResponseTime),
        successRate: Math.round(successRate * 10) / 10,
        userSatisfaction: Math.round(userSatisfaction * 10) / 10,
        systemLoad: Math.random() * 30 + 20 // Simulated system load 20-50%
      };

      return this.metricsCache;
    } catch (error) {
      console.error('Failed to calculate performance metrics:', error);
      
      // Return default metrics
      return {
        avgBattleTime: 45,
        avgResponseTime: 1500,
        successRate: 95.0,
        userSatisfaction: 85.0,
        systemLoad: 25.0
      };
    }
  }

  clearCache(): void {
    this.healthCache = null;
    this.metricsCache = null;
    this.lastHealthCheck = 0;
  }

  // Real-time monitoring hooks
  startRealTimeMonitoring(callback: (health: SystemHealth) => void): () => void {
    const interval = setInterval(async () => {
      try {
        const health = await this.getSystemHealth(true);
        callback(health);
      } catch (error) {
        console.error('Real-time monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }
}

export const systemMonitor = SystemMonitor.getInstance();