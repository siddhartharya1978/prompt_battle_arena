// Intelligent Rate Limiter for Groq API
export class GroqRateLimiter {
  private static instance: GroqRateLimiter;
  private requestQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
    request: () => Promise<any>;
    priority: number;
  }> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private consecutiveErrors = 0;
  private backoffUntil = 0;
  private readonly MIN_INTERVAL = 1000; // 1 second between requests
  private readonly MAX_BACKOFF = 60000; // 1 minute max backoff

  static getInstance(): GroqRateLimiter {
    if (!GroqRateLimiter.instance) {
      GroqRateLimiter.instance = new GroqRateLimiter();
    }
    return GroqRateLimiter.instance;
  }

  async enqueue<T>(request: () => Promise<T>, priority: number = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject, request, priority });
      this.requestQueue.sort((a, b) => b.priority - a.priority); // Higher priority first
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();

      // Check if we're in backoff period
      if (now < this.backoffUntil) {
        const waitTime = this.backoffUntil - now;
        console.log(`⏳ Rate limiter: Waiting ${waitTime}ms before next request`);
        await this.sleep(waitTime);
      }

      // Ensure minimum interval between requests
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.MIN_INTERVAL) {
        await this.sleep(this.MIN_INTERVAL - timeSinceLastRequest);
      }

      const item = this.requestQueue.shift();
      if (!item) break;

      try {
        this.lastRequestTime = Date.now();
        const result = await item.request();
        this.consecutiveErrors = 0; // Reset on success
        item.resolve(result);
      } catch (error) {
        this.consecutiveErrors++;
        
        if (this.isRateLimitError(error)) {
          // Exponential backoff for rate limits
          const backoffTime = Math.min(
            this.MIN_INTERVAL * Math.pow(2, this.consecutiveErrors),
            this.MAX_BACKOFF
          );
          this.backoffUntil = Date.now() + backoffTime;
          console.log(`🚫 Rate limit detected, backing off for ${backoffTime}ms`);
          
          // Re-queue the failed request
          this.requestQueue.unshift(item);
          continue;
        }
        
        item.reject(error);
      }
    }

    this.isProcessing = false;
  }

  private isRateLimitError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return message.includes('rate limit') || 
           message.includes('429') || 
           message.includes('too many requests');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getQueueStatus() {
    return {
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      backoffUntil: this.backoffUntil,
      consecutiveErrors: this.consecutiveErrors
    };
  }
}

export const groqRateLimiter = GroqRateLimiter.getInstance();