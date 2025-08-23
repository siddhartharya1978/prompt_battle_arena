// Groq API integration - Server-side only
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
  // Validate inputs
  if (!model?.trim()) {
    throw new Error('Model is required');
  }
  
  if (!prompt?.trim()) {
    throw new Error('Prompt is required');
  }
  
  // This will be called via Supabase Edge Function
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/groq-api`;
  
  const startTime = Date.now();

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        max_tokens: maxTokens,
        temperature
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    const latency = Date.now() - startTime;

    return {
      response: data.response,
      tokens: data.tokens,
      cost: data.cost,
      latency
    };
  } catch (error) {
    console.error('Groq API call failed:', error);
    
    // If it's a network error, provide more context
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Groq API. Check your internet connection.');
    }
    
    throw error;
  }
};

// Calculate cost based on token usage (in INR)
export const calculateGroqCost = (model: string, tokens: number): number => {
  const rates: Record<string, number> = {
    'llama-3.1-8b-instant': 0.0001,
    'llama-3.3-70b-versatile': 0.0005,
    'meta-llama/llama-guard-4-12b': 0.0002,
    'openai/gpt-oss-120b': 0.0008,
    'openai/gpt-oss-20b': 0.0003,
    'deepseek-r1-distill-llama-70b': 0.0006,
    'meta-llama/llama-4-maverick-17b-128e-instruct': 0.0004,
    'meta-llama/llama-4-scout-17b-16e-instruct': 0.0004,
    'moonshotai/kimi-k2-instruct': 0.0007,
    'qwen/qwen3-32b': 0.0005
  };

  const rate = rates[model] || 0.0005;
  return parseFloat((tokens * rate).toFixed(4));
};