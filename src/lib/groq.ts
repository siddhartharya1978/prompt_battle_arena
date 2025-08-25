// Real Groq API integration - Production ready
import { groqRateLimiter } from './groq-rate-limiter';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const callGroqAPI = async (
  model: string,
  prompt: string,
  maxTokens: number = 500,
  temperature: number = 0.7
): Promise<{
  response: string;
  tokens: number;
  cost: number;
  latency: number;
}> => {
  // Use rate limiter for all API calls
  return await groqRateLimiter.enqueue(
    () => attemptGroqAPICall(model, prompt, maxTokens, temperature),
    1 // Normal priority
  );
};

const attemptGroqAPICall = async (
  model: string,
  prompt: string,
  maxTokens: number = 500,
  temperature: number = 0.7
): Promise<{
  response: string;
  tokens: number;
  cost: number;
  latency: number;
}> => {
  // Validate inputs
  if (!model?.trim()) {
    throw new Error('Model is required');
  }
  
  if (!prompt?.trim()) {
    throw new Error('Prompt is required');
  }
  
  // Call Supabase Edge Function for real API integration
  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  // Ensure URL has protocol
  if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    supabaseUrl = `https://${supabaseUrl}`;
  }
  
  const apiUrl = `${supabaseUrl}/functions/v1/groq-api`;
  
  if (!apiUrl || !import.meta.env.VITE_SUPABASE_URL) {
    throw new Error('Supabase URL not configured. Please set VITE_SUPABASE_URL in your environment variables.');
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Supabase Anon Key not configured. Please set VITE_SUPABASE_ANON_KEY in your environment variables.');
  }
  
  // Validate Supabase URL format
  try {
    new URL(apiUrl);
  } catch (error) {
    throw new Error(`Invalid Supabase URL format: ${import.meta.env.VITE_SUPABASE_URL}. Please check your VITE_SUPABASE_URL environment variable.`);
  }
  
  const startTime = Date.now();

  try {
    // Add timeout to prevent hanging requests (reduced from 90s to 30s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'x-client-info': 'pba-app/1.0.0',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt,
        max_tokens: maxTokens,
        temperature
      })
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 404) {
        throw new Error(`Groq API endpoint not found at ${apiUrl}. Please ensure the groq-api edge function is deployed to your Supabase project. Check your Supabase Dashboard under Edge Functions.`);
      }
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please check your Supabase configuration and ensure GROQ_API_KEY is set in your edge function environment.');
      }
      
      // Handle configuration errors
      if (errorData.error && errorData.error.includes('GROQ_API_KEY')) {
        throw new Error(`Configuration Error: ${errorData.error}\n\nTo fix this:\n1. Go to your Supabase Dashboard\n2. Navigate to Edge Functions → groq-api\n3. Add GROQ_API_KEY as an environment variable\n4. Redeploy the edge function`);
      }
      
      throw new Error(`Groq API error (${response.status}): ${errorData.error || 'Unknown error'}. Please check your API configuration.`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    if (!data.response) {
      throw new Error('Invalid response from Groq API. Please check your API configuration.');
    }

    return {
      response: data.response,
      tokens: data.tokens || 0,
      cost: data.cost || 0,
      latency
    };
  } catch (error) {
    console.error('Groq API call failed:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Groq API took longer than 30 seconds to respond. Please try again.');
    }
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Network error: Unable to connect to Supabase Edge Function. Please check:\n1. Edge Function 'groq-api' is deployed\n2. GROQ_API_KEY is set in Edge Function environment\n3. Supabase project is active\n4. Network connectivity`);
    }
    
    throw error;
  }
};

// Calculate cost based on token usage (in USD)
export const calculateGroqCost = (model: string, tokens: number): number => {
  const rates: Record<string, number> = {
    'llama-3.1-8b-instant': 0.00005,
    'llama-3.3-70b-versatile': 0.00027,
    'meta-llama/llama-guard-4-12b': 0.0001,
    'deepseek-r1-distill-llama-70b': 0.00027,
    'meta-llama/llama-4-maverick-17b-128e-instruct': 0.0002,
    'meta-llama/llama-4-scout-17b-16e-instruct': 0.0002,
    'moonshotai/kimi-k2-instruct': 0.0003,
    'qwen/qwen3-32b': 0.00027
  };

  const rate = rates[model] || 0.00027;
  return parseFloat((tokens * rate).toFixed(6));
};