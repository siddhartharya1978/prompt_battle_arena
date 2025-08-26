# API CONTRACTS - PROMPT BATTLE ARENA
## OMNI-AGENT NEXUS vULTIMA Data Contracts

### Battle Creation API

**Endpoint:** `POST /api/battles`

**Request Contract:**
```typescript
interface BattleCreateRequest {
  battle_type: 'prompt' | 'response';
  prompt: string; // min: 10 chars, max: 2000 chars
  prompt_category: 'general' | 'creative' | 'technical' | 'analysis' | 'summary' | 'explanation' | 'math' | 'research';
  models: string[]; // exactly 2 models from available list
  mode: 'standard' | 'turbo';
  battle_mode: 'auto' | 'manual';
  rounds: number; // 1-10 for response, 1-20 for prompt
  max_tokens: number; // 50-2000
  temperature: number; // 0.0-2.0
  auto_selection_reason?: string;
}
```

**Response Contract:**
```typescript
interface BattleCreateResponse {
  success: boolean;
  battle_id: string; // UUID format
  estimated_cost: number; // in ₹
  estimated_duration_seconds: number;
  error?: {
    code: string;
    message: string;
    details?: string;
    retry_after?: number;
  };
}
```

**Example Request:**
```json
{
  "battle_type": "response",
  "prompt": "Explain artificial intelligence in simple terms for beginners",
  "prompt_category": "explanation",
  "models": ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"],
  "mode": "standard",
  "battle_mode": "auto",
  "rounds": 1,
  "max_tokens": 500,
  "temperature": 0.7,
  "auto_selection_reason": "AI selected models based on prompt analysis"
}
```

**Example Response:**
```json
{
  "success": true,
  "battle_id": "550e8400-e29b-41d4-a716-446655440000",
  "estimated_cost": 0.025,
  "estimated_duration_seconds": 45
}
```

### Battle Results API

**Endpoint:** `GET /api/battles/{battle_id}`

**Response Contract:**
```typescript
interface BattleResultsResponse {
  battle: {
    id: string;
    user_id: string;
    battle_type: 'prompt' | 'response';
    prompt: string;
    final_prompt?: string; // Only for prompt battles
    prompt_category: string;
    models: string[];
    status: 'running' | 'completed' | 'failed';
    winner?: string;
    total_cost: number;
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
  };
  responses: Array<{
    id: string;
    model_id: string;
    response: string;
    latency: number; // milliseconds
    tokens: number;
    cost: number; // in ₹
  }>;
  scores: Record<string, {
    accuracy: number; // 0-10
    reasoning: number; // 0-10
    structure: number; // 0-10
    creativity: number; // 0-10
    overall: number; // 0-10
    notes: string;
  }>;
  prompt_evolution?: Array<{
    round: number;
    prompt: string;
    model_id: string;
    improvements: string[];
    score: number;
  }>;
  ai_judge_reasoning: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}
```

### User Profile API

**Endpoint:** `GET /api/profile`

**Response Contract:**
```typescript
interface UserProfile {
  id: string; // UUID
  email: string; // Valid email format
  name: string; // 1-100 chars
  avatar_url?: string; // Valid URL or null
  plan: 'free' | 'premium';
  role: 'user' | 'admin';
  battles_used: number; // 0-999999
  battles_limit: number; // 3 for free, 999999 for premium
  last_reset_at: string; // ISO date
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
```

### Error Response Format

**Standard Error Contract:**
```typescript
interface ErrorResponse {
  code: string; // AUTH_001, CONFIG_002, NETWORK_003, etc.
  message: string; // User-friendly message
  details?: string; // Technical details for debugging
  retry_after?: number; // Seconds to wait before retry
  fallback_available: boolean;
}
```

### Database Schema Contracts

**Profiles Table:**
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  avatar_url text,
  plan user_plan DEFAULT 'free'::user_plan NOT NULL,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  battles_used integer DEFAULT 0 CHECK (battles_used >= 0),
  battles_limit integer DEFAULT 3 CHECK (battles_limit > 0),
  last_reset_at date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Battles Table:**
```sql
CREATE TABLE battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  battle_type battle_type NOT NULL,
  prompt text NOT NULL CHECK (length(prompt) >= 10 AND length(prompt) <= 2000),
  final_prompt text,
  prompt_category text NOT NULL,
  models text[] NOT NULL CHECK (array_length(models, 1) = 2),
  mode battle_mode_type DEFAULT 'standard'::battle_mode_type,
  battle_mode battle_mode_selection DEFAULT 'manual'::battle_mode_selection,
  rounds integer DEFAULT 1 CHECK (rounds >= 1 AND rounds <= 20),
  max_tokens integer DEFAULT 500 CHECK (max_tokens >= 50 AND max_tokens <= 2000),
  temperature numeric DEFAULT 0.7 CHECK (temperature >= 0.0 AND temperature <= 2.0),
  status battle_status DEFAULT 'running'::battle_status,
  winner text,
  total_cost numeric DEFAULT 0 CHECK (total_cost >= 0),
  auto_selection_reason text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```