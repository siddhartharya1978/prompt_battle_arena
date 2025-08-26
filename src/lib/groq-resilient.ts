// Ultra-resilient Groq API client with multiple fallback strategies
import { calculateGroqCost } from './groq';

interface GroqCallResult {
  response: string;
  tokens: number;
  cost: number;
  latency: number;
  attempts: number;
  fallbackUsed?: string;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterMax: number;
}

export class ResilientGroqClient {
  private static instance: ResilientGroqClient;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private rateLimitResetTime = 0;
  private consecutiveFailures = 0;
  private lastSuccessTime = Date.now();

  static getInstance(): ResilientGroqClient {
    if (!ResilientGroqClient.instance) {
      ResilientGroqClient.instance = new ResilientGroqClient();
    }
    return ResilientGroqClient.instance;
  }

  async callGroqAPI(
    model: string,
    prompt: string,
    maxTokens: number = 500,
    temperature: number = 0.7,
    progressCallback?: (status: string) => void
  ): Promise<GroqCallResult> {
    const config: RetryConfig = {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitterMax: 1000
    };

    let lastError: Error;
    let totalAttempts = 0;

    // Strategy 1: Direct API call with intelligent retry
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      totalAttempts++;
      
      try {
        progressCallback?.(`Attempt ${attempt + 1}/${config.maxRetries + 1} - Calling ${model}...`);
        
        // Check if we should wait due to rate limits
        if (this.rateLimitResetTime > Date.now()) {
          const waitTime = this.rateLimitResetTime - Date.now();
          progressCallback?.(`Rate limit active, waiting ${Math.round(waitTime/1000)}s...`);
          await this.sleep(waitTime);
        }

        const result = await this.makeDirectAPICall(model, prompt, maxTokens, temperature);
        
        // Success - reset failure tracking
        this.consecutiveFailures = 0;
        this.lastSuccessTime = Date.now();
        
        progressCallback?.(`✅ Success with ${model}`);
        return { ...result, attempts: totalAttempts };

      } catch (error) {
        lastError = error as Error;
        this.consecutiveFailures++;
        
        // Handle rate limits
        if (this.isRateLimitError(error)) {
          const delay = this.calculateRateLimitDelay(attempt);
          this.rateLimitResetTime = Date.now() + delay;
          progressCallback?.(`Rate limited, backing off for ${Math.round(delay/1000)}s...`);
          
          if (attempt < config.maxRetries) {
            await this.sleep(delay);
            continue;
          }
        }
        
        // Handle other retryable errors
        if (this.isRetryableError(error) && attempt < config.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt, config);
          progressCallback?.(`Retrying in ${Math.round(delay/1000)}s due to: ${error.message}`);
          await this.sleep(delay);
          continue;
        }
        
        // Non-retryable error or max retries reached
        break;
      }
    }

    // Strategy 2: Fallback to alternative models
    progressCallback?.(`Primary model failed, trying fallbacks...`);
    const fallbackResult = await this.tryFallbackModels(model, prompt, maxTokens, temperature, progressCallback);
    if (fallbackResult) {
      return { ...fallbackResult, attempts: totalAttempts, fallbackUsed: fallbackResult.fallbackUsed };
    }

    // Strategy 3: Simplified prompt fallback (if all else fails)
    const simplifiedResult = await this.trySimplifiedPrompt(model, prompt, maxTokens, temperature, progressCallback);
    if (simplifiedResult) {
      return { ...simplifiedResult, attempts: totalAttempts, fallbackUsed: 'simplified-prompt' };
    }

    // Strategy 4: Generate synthetic response
    progressCallback?.(`Generating synthetic response...`);
    
    // HONEST FAILURE - NO SYNTHETIC RESPONSES
    console.error(`💥 [ResilientGroqClient] ALL GROQ API ATTEMPTS FAILED for model ${model}`);
    console.error(`💥 [ResilientGroqClient] Error: ${lastError?.message}`);
    console.error(`💥 [ResilientGroqClient] Attempts: ${totalAttempts}`);
    
    throw new Error(`Groq API completely unavailable: ${lastError?.message || 'Unknown error'}. All fallback strategies exhausted.`);
  } // End of callGroqAPI

  private async makeDirectAPICall(
    model: string,
    prompt: string,
    maxTokens: number,
    temperature: number
  ): Promise<GroqCallResult> {
    let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Robust validation of environment variables
    if (!supabaseUrl || supabaseUrl.trim() === '') {
      throw new Error('VITE_SUPABASE_URL environment variable is missing or empty. Please check your .env file and ensure it contains your Supabase project URL (e.g., https://yourproject.supabase.co)');
    }
    
    if (!anonKey || anonKey.trim() === '') {
      throw new Error('VITE_SUPABASE_ANON_KEY environment variable is missing or empty. Please check your .env file and ensure it contains your Supabase anon key');
    }

    // Fix common URL issues
    supabaseUrl = supabaseUrl.trim();
    
    // Convert localhost URLs to proper format if needed
    if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
      throw new Error('VITE_SUPABASE_URL cannot be localhost. Please use your actual Supabase project URL from https://supabase.com/dashboard (e.g., https://yourproject.supabase.co)');
    }
    
    // Ensure URL has proper protocol
    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
      supabaseUrl = `https://${supabaseUrl}`;
    }

    // Validate and construct API URL
    let apiUrl: string;
    try {
      // Remove any trailing slashes and ensure proper format
      const cleanUrl = supabaseUrl.replace(/\/+$/, '');
      
      // Validate URL format
      if (!cleanUrl.includes('.supabase.co')) {
        throw new Error(`Invalid Supabase URL format: ${cleanUrl}. Expected format: https://yourproject.supabase.co`);
      }
      
      // Construct the edge function URL
      apiUrl = `${cleanUrl}/functions/v1/groq-api`;
      
      // Validate final URL
      new URL(apiUrl); // This will throw if URL is invalid
    } catch (urlError) {
      throw new Error(`Failed to construct valid API URL from VITE_SUPABASE_URL: ${urlError.message}. Please ensure VITE_SUPABASE_URL is set to your Supabase project URL (e.g., https://yourproject.supabase.co)`);
    }

    // Validate anon key format (should be a JWT-like string)
    if (!anonKey.includes('.') || anonKey.length < 100) {
      throw new Error('VITE_SUPABASE_ANON_KEY appears to be invalid (should be a JWT token)');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

    try {
      const startTime = Date.now();
      
      // Additional fetch validation
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'x-client-info': 'pba-resilient/1.0.0',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          prompt,
          max_tokens: maxTokens,
          temperature: temperature === 0 ? 1e-8 : temperature
        })
      }).catch((fetchError) => {
        // Provide more specific error messages for common fetch failures
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out after 45 seconds');
        }
        if (fetchError.message.includes('Failed to fetch')) {
          throw new Error(`Network error: Unable to reach Supabase Edge Function at ${apiUrl}. This usually means:\n1. VITE_SUPABASE_URL is incorrect (should be https://yourproject.supabase.co)\n2. The groq-api Edge Function is not deployed\n3. Network connectivity issues\n\nPlease check your Supabase project URL in .env file.`);
        }
        throw new Error(`Fetch failed: ${fetchError.message}`);
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Edge Function Error (${response.status}): ${errorData.error || response.statusText || 'Unknown error'}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      return {
        response: data.response || '',
        tokens: data.tokens || 0,
        cost: data.cost || 0,
        latency,
        attempts: 1
      };
    } catch (error) {
      clearTimeout(timeoutId);
      // Re-throw with enhanced error context
      if (error instanceof Error) {
        throw new Error(`Groq API call failed: ${error.message}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async tryFallbackModels(
    originalModel: string,
    prompt: string,
    maxTokens: number,
    temperature: number,
    progressCallback?: (status: string) => void
  ): Promise<GroqCallResult | null> {
    // Comprehensive fallback model list - ALL REAL GROQ MODELS
    const fallbackModels = [
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile', 
      'deepseek-r1-distill-llama-70b',
      'qwen/qwen3-32b'
    ].filter(m => m !== originalModel);

    console.log(`🔄 [ResilientGroqClient] Trying ${fallbackModels.length} fallback models for failed ${originalModel}`);
    for (const fallbackModel of fallbackModels) {
      try {
        progressCallback?.(`Trying fallback model: ${fallbackModel}...`);
        console.log(`🔄 [ResilientGroqClient] Attempting fallback model: ${fallbackModel}`);
        
        // Use more conservative settings for fallback calls
        const result = await this.makeDirectAPICall(
          fallbackModel, 
          prompt, 
          Math.min(maxTokens, 300), // Reduce tokens for stability
          Math.min(temperature, 0.5) // Lower temperature for stability
        );
        
        console.log(`✅ [ResilientGroqClient] Fallback model ${fallbackModel} succeeded!`);
        return { ...result, fallbackUsed: fallbackModel };
      } catch (error) {
        console.error(`❌ [ResilientGroqClient] Fallback model ${fallbackModel} failed: ${error.message}`);
        progressCallback?.(`Fallback ${fallbackModel} failed: ${error.message}`);
        continue;
      }
    }

    console.error(`💥 [ResilientGroqClient] ALL ${fallbackModels.length} fallback models failed`);
    return null;
  }

  private async trySimplifiedPrompt(
    model: string,
    originalPrompt: string,
    maxTokens: number,
    temperature: number,
    progressCallback?: (status: string) => void
  ): Promise<GroqCallResult | null> {
    console.log(`🔄 [ResilientGroqClient] Trying simplified prompts for model ${model}`);
    
    // Create multiple simplified versions - ALL REAL CONTENT
    const simplifications = [
      // Strategy 1: Truncate long prompts
      originalPrompt.length > 300 ? originalPrompt.substring(0, 300) + "..." : originalPrompt,
      // Strategy 2: Extract core request
      this.extractCoreRequest(originalPrompt),
      // Strategy 3: Ultra-simple version
      `Please provide a helpful response about: ${this.extractKeywords(originalPrompt)}`
    ];

    for (let i = 0; i < simplifications.length; i++) {
      try {
        progressCallback?.(`Trying simplified prompt strategy ${i + 1}...`);
        console.log(`🔄 [ResilientGroqClient] Simplified strategy ${i + 1}: "${simplifications[i].substring(0, 100)}..."`);
        
        const result = await this.makeDirectAPICall(
          model, 
          simplifications[i], 
          Math.min(maxTokens, 150), // Very conservative token limit
          0.3 // Low temperature for stability
        );
        
        console.log(`✅ [ResilientGroqClient] Simplified strategy ${i + 1} succeeded!`);
        return result;
      } catch (error) {
        console.error(`❌ [ResilientGroqClient] Simplified strategy ${i + 1} failed: ${error.message}`);
        progressCallback?.(`Simplified strategy ${i + 1} failed: ${error.message}`);
        if (i === simplifications.length - 1) {
          console.error(`💥 [ResilientGroqClient] ALL simplified prompt strategies failed`);
          return null;
        }
      }
    }
    
    return null;
  }

  private extractCoreRequest(prompt: string): string {
    // Extract the main request from a complex prompt
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      return sentences[0].trim() + ".";
    }
    return prompt.substring(0, 100) + "...";
  }

  private extractKeywords(prompt: string): string {
    // Extract key terms from prompt for ultra-simple fallback
    const words = prompt.toLowerCase().split(/\s+/);
    const keywords = words.filter(word => 
      word.length > 4 && 
      !['please', 'provide', 'explain', 'describe', 'create', 'write'].includes(word)
    ).slice(0, 3);
    
    return keywords.length > 0 ? keywords.join(', ') : 'the requested topic';
  }
  private isRateLimitError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return message.includes('rate limit') || 
           message.includes('429') || 
           message.includes('too many requests');
  }

  private isRetryableError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return message.includes('timeout') ||
           message.includes('network') ||
           message.includes('connection') ||
           message.includes('fetch') ||
           message.includes('500') ||
           message.includes('502') ||
           message.includes('503') ||
           message.includes('504');
  }

  private calculateRateLimitDelay(attempt: number): number {
    // Progressive delays for rate limits: 5s, 15s, 30s, 60s
    const delays = [5000, 15000, 30000, 60000];
    return delays[Math.min(attempt, delays.length - 1)] + Math.random() * 2000;
  }

  private calculateBackoffDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    const jitter = Math.random() * config.jitterMax;
    return cappedDelay + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance for easy importing
export const resilientGroqClient = ResilientGroqClient.getInstance();