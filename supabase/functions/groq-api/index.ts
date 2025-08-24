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

    // Get Groq API key from environment - try multiple possible names
    const groqApiKey = Deno.env.get('GROQ_API_KEY') || 
                      Deno.env.get('GROQ_API_TOKEN') || 
                      Deno.env.get('VITE_GROQ_API_KEY');
    
    if (!groqApiKey) {
      console.error('❌ GROQ API KEY NOT FOUND');
      console.error('Available env vars:', Object.keys(Deno.env.toObject()));
      
      return new Response(
        JSON.stringify({
          error: 'GROQ_API_KEY not configured in Supabase Edge Function. Please add it in your Supabase project settings under Edge Functions environment variables.',
          available_env_vars: Object.keys(Deno.env.toObject()),
          instructions: 'Go to Supabase Dashboard → Edge Functions → groq-api → Environment Variables → Add GROQ_API_KEY'
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

    console.log(`🤖 Calling Groq API with model: ${model}`);
    const startTime = Date.now();

    // Make real API call to Groq
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
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
        max_tokens: max_tokens || 500,
        temperature: temperature || 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API Error:', response.status, errorData);
      
      if (response.status === 401) {
        throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY configuration.');
      } else if (response.status === 429) {
        throw new Error('Groq API rate limit exceeded. Please try again later.');
      } else if (response.status === 400) {
        throw new Error(`Invalid request to Groq API: ${errorData.error?.message || 'Bad request'}`);
      } else {
        throw new Error(`Groq API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }
    }

    const data: GroqResponse = await response.json();
    const latency = Date.now() - startTime;
    const cost = calculateGroqCost(model, data.usage.total_tokens);

    console.log(`✅ Groq API success: ${data.usage.total_tokens} tokens, $${cost}, ${latency}ms`);

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