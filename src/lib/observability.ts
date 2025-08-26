// OBSERVABILITY - OMNI-AGENT NEXUS
// Production monitoring and logging (PII-free)

export interface ObservabilityEvent {
  timestamp: string; // ISO timestamp in IST
  event_type: 'user_action' | 'system_event' | 'error' | 'performance';
  category: string;
  action: string;
  user_id?: string; // Hashed for privacy
  session_id: string;
  metadata: Record<string, any>; // No PII
  duration_ms?: number;
  error_code?: string;
  success: boolean;
}

export interface PerformanceMetrics {
  battle_creation_time: number;
  api_response_time: number;
  database_query_time: number;
  page_load_time: number;
  error_rate: number;
  success_rate: number;
}

export interface UsageMetrics {
  daily_battles: number;
  daily_users: number;
  popular_categories: Record<string, number>;
  model_usage: Record<string, number>;
  peak_hours: number[];
}

class ObservabilityManager {
  private static instance: ObservabilityManager;
  private events: ObservabilityEvent[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): ObservabilityManager {
    if (!ObservabilityManager.instance) {
      ObservabilityManager.instance = new ObservabilityManager();
    }
    return ObservabilityManager.instance;
  }

  // LOG USER ACTIONS (PII-free)
  logUserAction(action: string, category: string, metadata: Record<string, any> = {}, userId?: string) {
    const event: ObservabilityEvent = {
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      event_type: 'user_action',
      category,
      action,
      user_id: userId ? this.hashUserId(userId) : undefined,
      session_id: this.sessionId,
      metadata: this.sanitizeMetadata(metadata),
      success: true
    };

    this.events.push(event);
    this.persistEvent(event);
  }

  // LOG SYSTEM EVENTS
  logSystemEvent(action: string, category: string, metadata: Record<string, any> = {}, success: boolean = true) {
    const event: ObservabilityEvent = {
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      event_type: 'system_event',
      category,
      action,
      session_id: this.sessionId,
      metadata: this.sanitizeMetadata(metadata),
      success
    };

    this.events.push(event);
    this.persistEvent(event);
  }

  // LOG ERRORS WITH TAXONOMY
  logError(error: any, category: string, action: string, userId?: string) {
    const event: ObservabilityEvent = {
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      event_type: 'error',
      category,
      action,
      user_id: userId ? this.hashUserId(userId) : undefined,
      session_id: this.sessionId,
      metadata: {
        error_message: error?.message || 'Unknown error',
        error_type: error?.constructor?.name || 'Error',
        stack_trace: error?.stack?.split('\n')[0] || 'No stack trace' // Only first line
      },
      error_code: this.extractErrorCode(error),
      success: false
    };

    this.events.push(event);
    this.persistEvent(event);
  }

  // LOG PERFORMANCE METRICS
  logPerformance(action: string, duration: number, metadata: Record<string, any> = {}) {
    const event: ObservabilityEvent = {
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      event_type: 'performance',
      category: 'performance',
      action,
      session_id: this.sessionId,
      metadata: this.sanitizeMetadata(metadata),
      duration_ms: duration,
      success: true
    };

    this.events.push(event);
    this.persistEvent(event);
  }

  // GET PERFORMANCE METRICS
  getPerformanceMetrics(): PerformanceMetrics {
    const performanceEvents = this.events.filter(e => e.event_type === 'performance');
    
    const battleCreationTimes = performanceEvents
      .filter(e => e.action === 'battle_creation')
      .map(e => e.duration_ms || 0);
    
    const apiResponseTimes = performanceEvents
      .filter(e => e.action === 'api_call')
      .map(e => e.duration_ms || 0);

    const errorEvents = this.events.filter(e => e.event_type === 'error');
    const totalEvents = this.events.length;

    return {
      battle_creation_time: this.calculateAverage(battleCreationTimes),
      api_response_time: this.calculateAverage(apiResponseTimes),
      database_query_time: 0, // Would be calculated from DB events
      page_load_time: 0, // Would be calculated from navigation events
      error_rate: totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0,
      success_rate: totalEvents > 0 ? ((totalEvents - errorEvents.length) / totalEvents) * 100 : 100
    };
  }

  // GET USAGE METRICS
  getUsageMetrics(): UsageMetrics {
    const today = new Date().toDateString();
    const todayEvents = this.events.filter(e => new Date(e.timestamp).toDateString() === today);
    
    const battleEvents = todayEvents.filter(e => e.action === 'battle_created');
    const uniqueUsers = new Set(todayEvents.map(e => e.user_id).filter(Boolean));

    const categories: Record<string, number> = {};
    const models: Record<string, number> = {};

    battleEvents.forEach(event => {
      const category = event.metadata.category;
      const modelList = event.metadata.models;
      
      if (category) categories[category] = (categories[category] || 0) + 1;
      if (Array.isArray(modelList)) {
        modelList.forEach((model: string) => {
          models[model] = (models[model] || 0) + 1;
        });
      }
    });

    return {
      daily_battles: battleEvents.length,
      daily_users: uniqueUsers.size,
      popular_categories: categories,
      model_usage: models,
      peak_hours: this.calculatePeakHours(todayEvents)
    };
  }

  // PRIVACY-SAFE HELPERS
  private hashUserId(userId: string): string {
    // Simple hash for privacy (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash)}`;
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    Object.entries(metadata).forEach(([key, value]) => {
      // Remove PII fields
      if (key.toLowerCase().includes('email') || 
          key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token')) {
        return;
      }
      
      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = value.length > 100 ? `${value.substring(0, 100)}...` : value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.slice(0, 10); // Limit array size
      }
    });

    return sanitized;
  }

  private extractErrorCode(error: any): string {
    if (error?.code) return error.code;
    if (error?.status) return `HTTP_${error.status}`;
    if (error?.name) return error.name;
    return 'UNKNOWN_ERROR';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private persistEvent(event: ObservabilityEvent) {
    try {
      // Store in localStorage for demo, would be sent to analytics service in production
      const stored = JSON.parse(localStorage.getItem('pba_observability') || '[]');
      stored.push(event);
      
      // Keep only last 1000 events
      if (stored.length > 1000) {
        stored.splice(0, stored.length - 1000);
      }
      
      localStorage.setItem('pba_observability', JSON.stringify(stored));
    } catch (error) {
      console.warn('Failed to persist observability event:', error);
    }
  }

  private calculateAverage(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((sum, num) => sum + num, 0) / numbers.length : 0;
  }

  private calculatePeakHours(events: ObservabilityEvent[]): number[] {
    const hourCounts: Record<number, number> = {};
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  // EXPORT FOR ADMIN DASHBOARD
  exportMetrics(): {
    performance: PerformanceMetrics;
    usage: UsageMetrics;
    recentErrors: ObservabilityEvent[];
    systemHealth: string;
  } {
    const recentErrors = this.events
      .filter(e => e.event_type === 'error')
      .slice(-10);

    const errorRate = this.getPerformanceMetrics().error_rate;
    const systemHealth = errorRate < 1 ? 'excellent' : errorRate < 5 ? 'good' : 'degraded';

    return {
      performance: this.getPerformanceMetrics(),
      usage: this.getUsageMetrics(),
      recentErrors,
      systemHealth
    };
  }
}

export const observability = ObservabilityManager.getInstance();

// CONVENIENCE FUNCTIONS
export const logBattleCreated = (battleId: string, battleType: string, models: string[], userId?: string) => {
  observability.logUserAction('battle_created', 'battles', {
    battle_id: battleId,
    battle_type: battleType,
    models,
    model_count: models.length
  }, userId);
};

export const logBattleCompleted = (battleId: string, winner: string, score: number, duration: number, userId?: string) => {
  observability.logUserAction('battle_completed', 'battles', {
    battle_id: battleId,
    winner,
    score,
    success: true
  }, userId);
  
  observability.logPerformance('battle_creation', duration, {
    battle_id: battleId,
    winner,
    score
  });
};

export const logError = (error: any, context: string, userId?: string) => {
  observability.logError(error, 'application', context, userId);
};