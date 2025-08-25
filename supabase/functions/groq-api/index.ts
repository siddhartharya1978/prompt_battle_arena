import { corsHeaders } from '../_shared/cors.ts';

interface GroqRequest {
  model: string;
  prompt: string;
  max_tokens: number;
  temperature: number;
}

interface GroqResponse {
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

const calculateGroqCost = (model: string, tokens: number): number => {
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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { model, prompt, max_tokens, temperature }: GroqRequest = await req.json();

    // Validate inputs
    if (!model || !prompt) {
      throw new Error('Model and prompt are required');
    }

    // Get Groq API key from environment
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    
    if (!groqApiKey) {
      console.error('❌ GROQ_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({
          error: 'Groq API not configured - GROQ_API_KEY environment variable missing'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    console.log('✅ GROQ_API_KEY found, making API call...');
    console.log(`🤖 Simple API call: ${model}`);

    // Simple, direct API call with short timeout
    const startTime = Date.now();
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Math.min(max_tokens || 300, 300), // Limit tokens for speed
        temperature: temperature === 0 ? 1e-8 : (temperature || 0.7),
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      console.error('❌ Groq API Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      if (response.status === 429) {
        throw new Error('Rate limit - please wait a moment');
      } else if (response.status === 401) {
        throw new Error('Invalid GROQ_API_KEY - check your API key configuration');
      } else {
        throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }
    }

    const data: GroqResponse = await response.json();
    
    const latency = Date.now() - startTime;
    const cost = calculateGroqCost(model, data.usage.total_tokens);

    console.log(`✅ Simple API success: ${latency}ms`);

    // Return successful response
    return new Response(
      JSON.stringify({
        response: data.choices[0]?.message?.content || '',
        tokens: data.usage.total_tokens,
        cost,
        latency
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Edge Function Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});