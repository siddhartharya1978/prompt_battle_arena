import { corsHeaders } from '../_shared/cors.ts';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on non-rate-limit errors
      if (error instanceof Response && error.status !== 429) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate exponential backoff delay with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`🔄 Rate limit hit, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

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

  // Debug logging for environment variables
  console.log('🔍 DEBUG: Checking environment variables...');
  const allEnvVars = Deno.env.toObject();
  console.log('Available env vars:', Object.keys(allEnvVars));
  console.log('GROQ_API_KEY exists:', !!Deno.env.get('GROQ_API_KEY'));
  console.log('GROQ_API_KEY length:', Deno.env.get('GROQ_API_KEY')?.length || 0);

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
      console.error('❌ GROQ API KEY NOT FOUND AFTER CHECKING ALL VARIANTS');
      console.error('Checked: GROQ_API_KEY, GROQ_API_TOKEN, VITE_GROQ_API_KEY');
      console.error('Available env vars:', Object.keys(allEnvVars));
      
      return new Response(
        JSON.stringify({
          error: 'GROQ_API_KEY not found in Edge Function environment. This usually means the function needs to be redeployed after adding the environment variable.',
          available_env_vars: Object.keys(allEnvVars),
          instructions: 'After adding GROQ_API_KEY in Supabase Dashboard, you may need to redeploy the Edge Function or wait a few minutes for it to take effect.',
          debug_info: {
            checked_vars: ['GROQ_API_KEY', 'GROQ_API_TOKEN', 'VITE_GROQ_API_KEY'],
            total_env_vars: Object.keys(allEnvVars).length
          }
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

    console.log(`✅ GROQ API KEY FOUND (length: ${groqApiKey.length})`);
    console.log(`🤖 Calling Groq API with model: ${model}`);

    // Make API call with retry mechanism
    const startTime = Date.now();
    const data: GroqResponse = await retryWithBackoff(async () => {
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
          // Create a Response object to signal rate limit for retry logic
          const rateLimitError = new Error('Rate limit exceeded') as any;
          rateLimitError.status = 429;
          throw rateLimitError;
        } else if (response.status === 400) {
          throw new Error(`Invalid request to Groq API: ${errorData.error?.message || 'Bad request'}`);
        } else {
          throw new Error(`Groq API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
        }
      }

      return await response.json();
    }, 5, 2000); // 5 retries with 2 second base delay
    
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
    
    // Handle rate limit errors specifically
    if (error instanceof Error && error.message.includes('Rate limit')) {
      return new Response(
        JSON.stringify({
          error: 'Groq API rate limit exceeded after multiple retries. Please try again in a few minutes.'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
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