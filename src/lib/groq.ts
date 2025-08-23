// Groq API integration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

let groqApiKey: string | null = null;

export const setGroqApiKey = (key: string) => {
  groqApiKey = key;
  localStorage.setItem('groq_api_key', key);
};

export const getGroqApiKey = (): string | null => {
  if (groqApiKey) return groqApiKey;
  
  const stored = localStorage.getItem('groq_api_key');
  if (stored) {
    groqApiKey = stored;
    return stored;
  }
  
  return null;
};

export const clearGroqApiKey = () => {
  groqApiKey = null;
  localStorage.removeItem('groq_api_key');
};

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
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  const startTime = Date.now();

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data: GroqResponse = await response.json();
    const latency = Date.now() - startTime;

    // Calculate cost (approximate based on token usage)
    const cost = calculateGroqCost(model, data.usage.total_tokens);

    return {
      response: data.choices[0]?.message?.content || '',
      tokens: data.usage.total_tokens,
      cost,
      latency
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('Groq API call failed:', error);
    throw error;
  }
};

// Approximate cost calculation for Groq models (in INR)
const calculateGroqCost = (model: string, tokens: number): number => {
  // Groq pricing is very competitive, these are approximate rates in INR
  const rates: Record<string, number> = {
    'llama-3.1-8b-instant': 0.0001, // Very fast, very cheap
    'llama-3.3-70b-versatile': 0.0005, // Balanced
    'meta-llama/llama-guard-4-12b': 0.0002,
    'openai/gpt-oss-120b': 0.0008, // Larger model, higher cost
    'openai/gpt-oss-20b': 0.0003,
    'deepseek-r1-distill-llama-70b': 0.0006,
    'meta-llama/llama-4-maverick-17b-128e-instruct': 0.0004,
    'meta-llama/llama-4-scout-17b-16e-instruct': 0.0004,
    'moonshotai/kimi-k2-instruct': 0.0007,
    'qwen/qwen3-32b': 0.0005
  };

  const rate = rates[model] || 0.0005; // Default rate
  return parseFloat((tokens * rate).toFixed(4));
};

export const isGroqApiConfigured = (): boolean => {
  return !!getGroqApiKey();
};