// Circuit Breaker Pattern for API Resilience
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringWindow: number;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;
  private successCount = 0;
  private requests: Array<{ timestamp: number; success: boolean }> = [];

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - API temporarily unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.recordRequest(true);

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
      }
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.recordRequest(false);

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  private recordRequest(success: boolean) {
    const now = Date.now();
    this.requests.push({ timestamp: now, success });
    
    // Clean old requests outside monitoring window
    this.requests = this.requests.filter(
      req => now - req.timestamp < this.config.monitoringWindow
    );
  }

  getState(): CircuitState {
    return this.state;
  }

  getHealthMetrics() {
    const recentRequests = this.requests.filter(
      req => Date.now() - req.timestamp < this.config.monitoringWindow
    );
    const successRate = recentRequests.length > 0 
      ? recentRequests.filter(req => req.success).length / recentRequests.length 
      : 1;

    return {
      state: this.state,
      failures: this.failures,
      successRate,
      recentRequests: recentRequests.length,
      timeUntilRecovery: this.state === 'OPEN' 
        ? Math.max(0, this.config.recoveryTimeout - (Date.now() - this.lastFailureTime))
        : 0
    };
  }
}