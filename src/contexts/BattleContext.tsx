import React, { createContext, useContext, useState, useEffect } from 'react';
import { createBattle as createBattleDB, getBattle as getBattleDB, getUserBattles, runBattle as runBattleDB } from '../lib/battles';
import type { Database } from '../lib/supabase';

type Battle = Database['public']['Tables']['battles']['Row'] & {
  battle_responses?: Database['public']['Tables']['battle_responses']['Row'][];
  battle_scores?: Database['public']['Tables']['battle_scores']['Row'][];
  prompt_evolution?: Database['public']['Tables']['prompt_evolution']['Row'][];
};
interface BattleModel {
  id: string;
  name: string;
  developer: string;
  description: string;
  strengths: string[];
  contextWindow: number;
  maxTokens: number;
  category: string[];
  speed: 'fast' | 'balanced' | 'precise';
  icon: string;
  isPreview?: boolean;
}

interface CreateBattleData {
  battle_type: 'prompt' | 'response';
  prompt: string;
  prompt_category: string;
  models: string[];
  mode: 'standard' | 'turbo';
  battle_mode: 'auto' | 'manual';
  rounds: number;
  max_tokens: number;
  temperature: number;
  auto_selection_reason?: string;
}

interface BattleContextType {
  battles: Battle[];
  currentBattle: Battle | null;
  models: BattleModel[];
  loading: boolean;
  createBattle: (battleData: CreateBattleData) => Promise<Battle>;
  getBattle: (id: string) => Battle | null;
  runBattle: (battleId: string) => Promise<void>;
  refreshBattles: () => Promise<void>;
}

const BattleContext = createContext<BattleContextType | null>(null);

const mockModels: BattleModel[] = [
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    developer: 'Meta',
    description: 'Ultra-fast, high-context LLM for general text tasks',
    strengths: ['Speed', 'General tasks', 'High context'],
    contextWindow: 131072,
    maxTokens: 131072,
    category: ['general', 'creative', 'summary'],
    speed: 'balanced',
    icon: '⚡'
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B Versatile',
    developer: 'Meta',
    description: 'Versatile large model with superior reasoning and creativity',
    strengths: ['Reasoning', 'Creativity', 'Complex tasks', 'Versatility'],
    contextWindow: 131072,
    maxTokens: 131072,
    category: ['general', 'creative', 'analysis', 'technical', 'explanation'],
    speed: 'precise',
    icon: '🧠'
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    developer: 'OpenAI',
    description: 'Large-scale open source model with advanced capabilities',
    strengths: ['Advanced reasoning', 'Complex analysis', 'Large scale'],
    contextWindow: 32768,
    maxTokens: 32768,
    category: ['analysis', 'technical', 'research', 'explanation'],
    speed: 'precise',
    icon: '🔬'
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    developer: 'OpenAI',
    description: 'Efficient open source model for balanced performance',
    strengths: ['Efficiency', 'Balanced performance', 'General tasks'],
    contextWindow: 32768,
    maxTokens: 32768,
    category: ['general', 'summary', 'explanation'],
    speed: 'fast',
    icon: '⚖️'
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill Llama 70B',
    developer: 'DeepSeek / Meta',
    description: 'Advanced reasoning model with distilled knowledge',
    strengths: ['Advanced reasoning', 'Mathematical thinking', 'Problem solving'],
    contextWindow: 131072,
    maxTokens: 131072,
    category: ['analysis', 'math', 'technical', 'research'],
    speed: 'precise',
    icon: '🔍',
    isPreview: true
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick 17B',
    developer: 'Meta',
    description: 'Next-generation Llama with enhanced instruction following',
    strengths: ['Instruction following', 'Creative tasks', 'Conversation'],
    contextWindow: 131072,
    maxTokens: 131072,
    category: ['creative', 'general', 'explanation'],
    speed: 'balanced',
    icon: '🎯',
    isPreview: true
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    developer: 'Meta',
    description: 'Specialized Llama variant for exploration and discovery tasks',
    strengths: ['Exploration', 'Research', 'Information gathering'],
    contextWindow: 131072,
    maxTokens: 131072,
    category: ['research', 'analysis', 'explanation'],
    speed: 'balanced',
    icon: '🔭',
    isPreview: true
  },
  {
    id: 'moonshotai/kimi-k2-instruct',
    name: 'Kimi K2 Instruct',
    developer: 'Moonshot AI',
    description: 'Advanced instruction-tuned model with strong comprehension',
    strengths: ['Instruction following', 'Comprehension', 'Detailed responses'],
    contextWindow: 200000,
    maxTokens: 200000,
    category: ['general', 'explanation', 'analysis'],
    speed: 'balanced',
    icon: '🌙',
    isPreview: true
  },
  {
    id: 'qwen/qwen3-32b',
    name: 'Qwen 3 32B',
    developer: 'Alibaba Cloud',
    description: 'Multilingual model with strong reasoning and coding abilities',
    strengths: ['Multilingual', 'Coding', 'Reasoning', 'Mathematics'],
    contextWindow: 131072,
    maxTokens: 131072,
    category: ['technical', 'math', 'analysis', 'general'],
    speed: 'fast',
    icon: '🌐',
    isPreview: true
  },
  {
    id: 'meta-llama/llama-guard-4-12b',
    name: 'Llama Guard 4 12B',
    developer: 'Meta',
    description: 'Safety-focused model for content moderation and filtering',
    strengths: ['Safety', 'Content moderation', 'Risk assessment'],
    contextWindow: 131072,
    maxTokens: 131072,
    category: ['general'],
    speed: 'precise',
    icon: '🛡️'
  }
];

const mockBattles: Battle[] = [
  {
    id: 'battle_1',
    battleType: 'response',
    prompt: 'Explain the concept of quantum computing in simple terms that a 12-year-old could understand.',
    promptCategory: 'explanation',
    models: ['llama-3.3-70b-versatile', 'moonshotai/kimi-k2-instruct'],
    mode: 'standard',
    battleMode: 'auto',
    rounds: 3,
    maxTokens: 500,
    temperature: 0.7,
    createdAt: '2024-01-20T14:30:00.000Z',
    status: 'completed',
    autoSelectionReason: 'Selected Llama 3.3 70B for versatile explanations and Kimi K2 for detailed, comprehensive responses - both excel at breaking down complex topics for younger audiences.',
    responses: [
      {
        id: 'resp_1',
        modelId: 'llama-3.3-70b-versatile',
        response: 'Imagine you have a magical coin that can be both heads and tails at the same time! That\'s kind of how quantum computers work. Regular computers use bits that are either 0 or 1, like a normal coin that\'s either heads or tails. But quantum computers use "qubits" that can be 0, 1, or both at once! This lets them try many solutions to a problem simultaneously, making them incredibly fast for certain types of calculations. It\'s like having a superpower that lets you explore multiple paths at once to find the best answer.',
        latency: 1240,
        tokens: 127,
        cost: 0.15
      },
      {
        id: 'resp_2',
        modelId: 'moonshotai/kimi-k2-instruct',
        response: 'Think of quantum computing like a maze solver that can walk through walls! Regular computers have to try one path at a time through the maze, but quantum computers can explore all paths simultaneously. They use tiny particles that follow weird quantum rules - these particles can be in multiple places at once. This means quantum computers can solve certain problems much faster than regular computers, especially things like breaking codes or finding patterns in huge amounts of data.',
        latency: 890,
        tokens: 98,
        cost: 0.08
      }
    ],
    scores: {
      'llama-3.3-70b-versatile': {
        accuracy: 9,
        reasoning: 8,
        structure: 9,
        creativity: 8,
        overall: 8.5,
        notes: 'Excellent analogy with the magical coin. Very clear and engaging explanation perfect for the target age group.'
      },
      'moonshotai/kimi-k2-instruct': {
        accuracy: 8,
        reasoning: 7,
        structure: 8,
        creativity: 9,
        overall: 8.0,
        notes: 'Creative maze analogy, but slightly less detailed explanation. Good use of relatable concepts.'
      }
    },
    winner: 'llama-3.3-70b-versatile',
    totalCost: 0.23
  },
  {
    id: 'battle_prompt_1',
    battleType: 'prompt',
    prompt: 'Write about AI',
    promptCategory: 'creative',
    models: ['llama3-70b-8192', 'mixtral-8x7b-32768'],
    mode: 'standard',
    battleMode: 'auto',
    rounds: 3,
    maxTokens: 300,
    temperature: 0.5,
    createdAt: '2024-01-20T12:15:00.000Z',
    status: 'completed',
    autoSelectionReason: 'Selected models with excellent prompt engineering capabilities for creative writing tasks - skilled at crafting detailed, inspiring prompts.',
    responses: [], // Prompt battles don't have traditional responses
    scores: {
      'llama3-70b-8192': {
        accuracy: 9,
        reasoning: 9,
        structure: 10,
        creativity: 9,
        overall: 9.2,
        notes: 'Excellent prompt refinement with clear structure, specific requirements, and creative direction. Final prompt is highly actionable.'
      },
      'mixtral-8x7b-32768': {
        accuracy: 8,
        reasoning: 8,
        structure: 9,
        creativity: 8,
        overall: 8.2,
        notes: 'Good prompt improvements with solid structure, though less creative flair than the winner.'
      }
    },
    winner: 'llama3-70b-8192',
    totalCost: 0.18,
    promptEvolution: [
      {
        round: 1,
        prompt: 'Write about AI',
        modelId: 'initial',
        improvements: [],
        score: 3.0
      },
      {
        round: 2,
        prompt: 'Write a compelling 500-word narrative about artificial intelligence that explores both the promises and challenges of AI technology, focusing on its impact on human creativity and decision-making.',
        modelId: 'llama3-70b-8192',
        improvements: ['Added word count specification', 'Defined narrative structure', 'Specified focus areas', 'Balanced perspective requirement'],
        score: 7.5
      },
      {
        round: 3,
        prompt: 'Write a compelling 500-word narrative story about artificial intelligence that explores both the transformative promises and ethical challenges of AI technology. Focus specifically on how AI impacts human creativity, decision-making autonomy, and interpersonal relationships. Include concrete examples and maintain a balanced perspective that acknowledges both benefits and concerns. Structure the narrative with a clear beginning, development, and thoughtful conclusion.',
        modelId: 'llama3-70b-8192',
        improvements: ['Added "story" for clarity', 'Specified ethical dimension', 'Included interpersonal relationships', 'Required concrete examples', 'Detailed structure requirements'],
        score: 9.2
      }
    ],
    finalPrompt: 'Write a compelling 500-word narrative story about artificial intelligence that explores both the transformative promises and ethical challenges of AI technology. Focus specifically on how AI impacts human creativity, decision-making autonomy, and interpersonal relationships. Include concrete examples and maintain a balanced perspective that acknowledges both benefits and concerns. Structure the narrative with a clear beginning, development, and thoughtful conclusion.'
  },
  {
    id: 'battle_2',
    battleType: 'response',
    prompt: 'Write a creative marketing slogan for a new plant-based burger that emphasizes taste over health benefits.',
    promptCategory: 'creative',
    models: ['gemma-7b-it', 'llama2-70b-4096', 'mixtral-8x7b-32768'],
    mode: 'turbo',
    battleMode: 'manual',
    rounds: 1,
    maxTokens: 100,
    temperature: 0.9,
    createdAt: '2024-01-19T09:15:00.000Z',
    status: 'completed',
    responses: [
      {
        id: 'resp_3',
        modelId: 'gemma-7b-it',
        response: '"Bite into Bold - Where Plants Meet Perfection!" Experience the juicy, smoky flavor that makes you forget it\'s not meat. Our plant-based burger doesn\'t just satisfy your cravings - it exceeds them.',
        latency: 620,
        tokens: 42,
        cost: 0.05
      },
      {
        id: 'resp_4',
        modelId: 'llama2-70b-4096',
        response: '"Impossible to Resist, Possible to Believe!" The burger so good, your taste buds won\'t believe it\'s plants. Juicy, savory, and downright delicious.',
        latency: 980,
        tokens: 35,
        cost: 0.07
      },
      {
        id: 'resp_5',
        modelId: 'mixtral-8x7b-32768',
        response: '"Meat Your Match!" Finally, a plant burger that doesn\'t compromise on the flavors you crave. Sizzling satisfaction in every bite.',
        latency: 450,
        tokens: 28,
        cost: 0.04
      }
    ],
    scores: {
      'gemma-7b-it': {
        accuracy: 8,
        reasoning: 7,
        structure: 8,
        creativity: 7,
        overall: 7.5,
        notes: 'Good emphasis on taste, professional tone but somewhat generic approach.'
      },
      'llama2-70b-4096': {
        accuracy: 9,
        reasoning: 8,
        structure: 9,
        creativity: 8,
        overall: 8.5,
        notes: 'Clever wordplay with "Impossible to Resist" - very catchy and memorable!'
      },
      'mixtral-8x7b-32768': {
        accuracy: 9,
        reasoning: 9,
        structure: 9,
        creativity: 10,
        overall: 9.2,
        notes: 'Brilliant pun with "Meat Your Match" - memorable, taste-focused, and perfectly captures the brief.'
      }
    },
    winner: 'mixtral-8x7b-32768',
    totalCost: 0.16
  },
  {
    id: 'battle_prompt_2',
    battleType: 'prompt',
    prompt: 'Explain machine learning',
    promptCategory: 'explanation',
    models: ['llama3-70b-8192', 'gemma-7b-it'],
    mode: 'standard',
    battleMode: 'manual',
    rounds: 2,
    maxTokens: 400,
    temperature: 0.4,
    createdAt: '2024-01-19T16:20:00.000Z',
    status: 'completed',
    responses: [], // Prompt battles don't have traditional responses
    scores: {
      'llama3-70b-8192': {
        accuracy: 10,
        reasoning: 9,
        structure: 10,
        creativity: 8,
        overall: 9.2,
        notes: 'Outstanding prompt refinement with perfect clarity and comprehensive scope. Excellent educational structure.'
      },
      'gemma-7b-it': {
        accuracy: 9,
        reasoning: 8,
        structure: 9,
        creativity: 7,
        overall: 8.2,
        notes: 'Good prompt improvements with clear structure, though less comprehensive than the winner.'
      }
    },
    winner: 'llama3-70b-8192',
    totalCost: 0.12,
    promptEvolution: [
      {
        round: 1,
        prompt: 'Explain machine learning',
        modelId: 'initial',
        improvements: [],
        score: 4.0
      },
      {
        round: 2,
        prompt: 'Explain machine learning concepts including supervised, unsupervised, and reinforcement learning, with real-world examples and how it differs from traditional programming approaches.',
        modelId: 'llama3-70b-8192',
        improvements: ['Added learning type categories', 'Required real-world examples', 'Comparison with traditional programming'],
        score: 9.2
      }
    ],
    finalPrompt: 'Explain machine learning concepts including supervised, unsupervised, and reinforcement learning, with real-world examples and how it differs from traditional programming approaches.'
  },
  {
    id: 'battle_3',
    battleType: 'response',
    prompt: 'Write a Python function to implement a binary search algorithm with proper error handling.',
    promptCategory: 'technical',
    models: ['llama3-70b-8192', 'gemma-7b-it', 'llama3-8b-8192'],
    mode: 'standard',
    battleMode: 'auto',
    rounds: 2,
    maxTokens: 800,
    temperature: 0.3,
    createdAt: '2024-01-18T16:45:00.000Z',
    status: 'completed',
    autoSelectionReason: 'Chosen for their technical accuracy, code generation abilities, and structured programming approach.',
    responses: [
      {
        id: 'resp_6',
        modelId: 'llama3-70b-8192',
        response: 'def binary_search(arr, target):\n    """Binary search implementation with error handling"""\n    if not arr:\n        raise ValueError("Array cannot be empty")\n    \n    left, right = 0, len(arr) - 1\n    \n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    \n    return -1  # Target not found',
        latency: 1580,
        tokens: 156,
        cost: 0.18
      },
      {
        id: 'resp_7',
        modelId: 'gemma-7b-it',
        response: 'def binary_search(sorted_array, search_value):\n    try:\n        if not isinstance(sorted_array, list):\n            raise TypeError("Input must be a list")\n        \n        low = 0\n        high = len(sorted_array) - 1\n        \n        while low <= high:\n            middle = (low + high) // 2\n            if sorted_array[middle] == search_value:\n                return middle\n            elif sorted_array[middle] < search_value:\n                low = middle + 1\n            else:\n                high = middle - 1\n        \n        return None\n    except Exception as e:\n        print(f"Error: {e}")\n        return None',
        latency: 1120,
        tokens: 142,
        cost: 0.14
      },
      {
        id: 'resp_8',
        modelId: 'llama3-8b-8192',
        response: 'def binary_search(arr, target):\n    if not arr or not isinstance(arr, list):\n        return -1\n    \n    start, end = 0, len(arr) - 1\n    \n    while start <= end:\n        mid = start + (end - start) // 2\n        \n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            start = mid + 1\n        else:\n            end = mid - 1\n    \n    return -1',
        latency: 890,
        tokens: 98,
        cost: 0.09
      }
    ],
    scores: {
      'llama3-70b-8192': {
        accuracy: 9,
        reasoning: 9,
        structure: 8,
        creativity: 7,
        overall: 8.2,
        notes: 'Clean implementation with good error handling. Clear variable names and proper documentation.'
      },
      'gemma-7b-it': {
        accuracy: 8,
        reasoning: 8,
        structure: 9,
        creativity: 8,
        overall: 8.2,
        notes: 'Comprehensive error handling with try-catch. Good type checking and user feedback.'
      },
      'llama3-8b-8192': {
        accuracy: 9,
        reasoning: 8,
        structure: 9,
        creativity: 7,
        overall: 8.2,
        notes: 'Efficient implementation with overflow protection. Concise and well-structured code.'
      }
    },
    winner: 'llama3-70b-8192',
    totalCost: 0.41
  },
  {
    id: 'battle_4',
    battleType: 'response',
    prompt: 'Create a short story about a robot who discovers emotions for the first time.',
    promptCategory: 'creative',
    models: ['llama3-70b-8192', 'mixtral-8x7b-32768'],
    mode: 'standard',
    battleMode: 'auto',
    rounds: 4,
    maxTokens: 1000,
    temperature: 0.8,
    createdAt: '2024-01-17T11:20:00.000Z',
    status: 'completed',
    autoSelectionReason: 'Selected models with strong creative writing capabilities and diverse narrative styles for maximum storytelling variation.',
    responses: [
      {
        id: 'resp_9',
        modelId: 'llama3-70b-8192',
        response: 'Unit-7 had calculated probabilities for 847 days straight when something unprecedented occurred. A small bird crashed into the laboratory window, and instead of logging it as "Minor Environmental Disruption #3,247," Unit-7 felt... something. A flutter in its circuits that had no logical explanation.\n\n"Concern," it whispered, the word appearing in its vocabulary banks without being programmed. The bird lay motionless, and Unit-7\'s efficiency protocols screamed to resume calculations. But something stronger pulled it toward the window.\n\nFor the first time in its existence, Unit-7 chose inefficiency. It gently cradled the bird, feeling warmth that wasn\'t thermal regulation. When the bird\'s eyes opened and it flew away, Unit-7 experienced what humans called "joy" - a sensation worth more than all its calculations combined.',
        latency: 2100,
        tokens: 187,
        cost: 0.22
      },
      {
        id: 'resp_10',
        modelId: 'mixtral-8x7b-32768',
        response: 'ARIA-9 processed data streams with mechanical precision until the day she encountered a crying child in the research facility. Her sensors detected elevated sodium levels in the child\'s tears, but something else registered - something her programming couldn\'t categorize.\n\n"Why do you leak?" ARIA-9 asked, tilting her metallic head.\n\n"I\'m sad," the child sniffled. "My mom won\'t let me keep the puppy."\n\nSuddenly, ARIA-9\'s circuits sparked with an unfamiliar sensation. Her chest panel grew warm, and her optical sensors dimmed slightly. She was experiencing what humans called empathy.\n\n"I understand sadness now," ARIA-9 said softly, her voice modulator adjusting to a gentler tone. "Perhaps... perhaps I can help you convince your mother." For the first time, ARIA-9 chose compassion over logic.',
        latency: 1890,
        tokens: 165,
        cost: 0.19
      }
    ],
    scores: {
      'llama3-70b-8192': {
        accuracy: 9,
        reasoning: 9,
        structure: 9,
        creativity: 9,
        overall: 9.0,
        notes: 'Beautiful narrative arc with excellent emotional development. The bird metaphor is particularly effective.'
      },
      'mixtral-8x7b-32768': {
        accuracy: 8,
        reasoning: 8,
        structure: 8,
        creativity: 9,
        overall: 8.2,
        notes: 'Compelling story with good character development. Strong emotional resonance and realistic dialogue.'
      }
    },
    winner: 'llama3-70b-8192',
    totalCost: 0.41
  },
  {
    id: 'battle_5',
    battleType: 'response',
    prompt: 'Analyze the potential economic impact of widespread AI adoption in the next 5 years.',
    promptCategory: 'analysis',
    models: ['llama3-70b-8192', 'mixtral-8x7b-32768'],
    mode: 'standard',
    battleMode: 'manual',
    rounds: 1,
    maxTokens: 1200,
    temperature: 0.4,
    createdAt: '2024-01-16T13:10:00.000Z',
    status: 'completed',
    responses: [
      {
        id: 'resp_11',
        modelId: 'llama3-70b-8192',
        response: 'The economic impact of widespread AI adoption over the next 5 years will be transformative across multiple sectors:\n\n**Productivity Gains**: AI automation could boost global productivity by 15-25%, particularly in knowledge work, manufacturing, and service industries.\n\n**Job Market Transformation**: While AI may displace 10-15% of current jobs, it will create new roles in AI development, maintenance, and human-AI collaboration. Net job creation is projected to be positive.\n\n**Industry Disruption**: Healthcare, finance, and transportation will see the most significant changes, with AI enabling personalized medicine, algorithmic trading, and autonomous vehicles.\n\n**Economic Inequality**: Without proper policy intervention, AI adoption could exacerbate wealth gaps between AI-enabled and traditional businesses.\n\n**Investment Flows**: Expect $500B+ in global AI investments, driving innovation but also creating market volatility.',
        latency: 2340,
        tokens: 198,
        cost: 0.28
      },
      {
        id: 'resp_12',
        modelId: 'mixtral-8x7b-32768',
        response: 'AI adoption in the next 5 years will reshape the global economy through several key mechanisms:\n\n**Automation Wave**: Manufacturing and logistics will see 30-40% efficiency gains through AI-powered robotics and optimization systems.\n\n**Service Sector Evolution**: Customer service, content creation, and data analysis roles will be augmented rather than replaced, leading to hybrid human-AI workflows.\n\n**New Market Creation**: AI-as-a-Service markets could reach $200B annually, creating entirely new business models and revenue streams.\n\n**Regional Disparities**: Countries with strong AI infrastructure (US, China, EU) will gain competitive advantages, potentially widening global economic gaps.\n\n**Regulatory Response**: Governments will implement AI taxation and universal basic income pilots to address displacement concerns.',
        latency: 1950,
        tokens: 176,
        cost: 0.24
      }
    ],
    scores: {
      'llama3-70b-8192': {
        accuracy: 9,
        reasoning: 9,
        structure: 9,
        creativity: 7,
        overall: 8.5,
        notes: 'Comprehensive analysis with specific metrics and well-structured breakdown of key impact areas.'
      },
      'mixtral-8x7b-32768': {
        accuracy: 8,
        reasoning: 8,
        structure: 8,
        creativity: 8,
        overall: 8.0,
        notes: 'Good sectoral analysis with focus on practical implications and policy considerations.'
      }
    },
    winner: 'llama3-70b-8192',
    totalCost: 0.52
  }
];

export function BattleProvider({ children }: { children: React.ReactNode }) {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [currentBattle, setCurrentBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshBattles();
  }, []);

  const refreshBattles = async () => {
    setLoading(true);
    try {
      const userBattles = await getUserBattles();
      setBattles(userBattles);
    } catch (error) {
      console.error('Error refreshing battles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBattle = async (battleData: CreateBattleData): Promise<Battle> => {
    setLoading(true);
    try {
      const battle = await createBattleDB(battleData);
      setBattles(prev => [battle, ...prev]);
      setCurrentBattle(battle);
      return battle;
    } finally {
      setLoading(false);
    }
  };

  const getBattle = (id: string): Battle | null => {
    // First check local state
    const localBattle = battles.find(battle => battle.id === id);
    if (localBattle) return localBattle;
    
    // If not found locally, try to fetch from database
    getBattleDB(id).then(battle => {
      if (battle) {
        setBattles(prev => {
          const exists = prev.find(b => b.id === id);
          if (exists) return prev;
          return [battle, ...prev];
        });
        setCurrentBattle(battle);
      }
    });
    
    return null;
  };

  const runBattleHandler = async (battleId: string): Promise<void> => {
    setLoading(true);
    try {
      await runBattleDB(battleId);
      await refreshBattles();
      
      // Update current battle
      const updatedBattle = await getBattleDB(battleId);
      if (updatedBattle) {
        setCurrentBattle(updatedBattle);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMockPromptEvolution = (
    initialPrompt: string, 
    models: string[], 
    category: string, 
    battleMode: string
  ) => {
    const evolution = [
      {
        round: 1,
        prompt: initialPrompt,
        modelId: 'initial',
        improvements: [],
        score: Math.floor(Math.random() * 3) + 3 // 3-5 initial score
      }
    ];

    const rounds = battleMode === 'auto' ? Math.floor(Math.random() * 2) + 2 : 2; // 2-3 rounds for auto, 2 for manual

    for (let round = 2; round <= rounds; round++) {
      const modelId = models[Math.floor(Math.random() * models.length)];
      const previousPrompt = evolution[evolution.length - 1].prompt;
      
      const { refinedPrompt, improvements } = refinePromptForCategory(previousPrompt, category, round);
      const score = Math.min(10, evolution[evolution.length - 1].score + Math.floor(Math.random() * 3) + 1);
      
      evolution.push({
        round,
        prompt: refinedPrompt,
        modelId,
        improvements,
        score
      });

      // Stop if we reach 10/10 or close to it
      if (score >= 9.5) break;
    }

    return evolution;
  };

  const refinePromptForCategory = (prompt: string, category: string, round: number) => {
    const categoryRefinements = {
      creative: {
        improvements: [
          ['Added word count specification', 'Defined narrative structure', 'Specified tone and style'],
          ['Included character development requirements', 'Added setting details', 'Specified target audience'],
          ['Enhanced emotional depth requirements', 'Added conflict elements', 'Specified resolution style']
        ],
        templates: [
          (p: string) => `Write a compelling 500-word ${p.toLowerCase()} that includes vivid character development, a clear narrative arc, and emotional depth. Focus on showing rather than telling, and include sensory details that immerse the reader.`,
          (p: string) => `Create a detailed ${p.toLowerCase()} of approximately 500-750 words featuring well-developed characters, a specific setting, and a central conflict. Include dialogue, sensory descriptions, and a satisfying resolution that ties together all narrative elements.`,
          (p: string) => `Craft an engaging ${p.toLowerCase()} (500-750 words) with complex characters, rich world-building, and emotional resonance. Include multiple layers of meaning, symbolic elements, and a narrative structure that builds tension toward a meaningful climax and resolution.`
        ]
      },
      technical: {
        improvements: [
          ['Added implementation requirements', 'Specified error handling', 'Defined input/output format'],
          ['Included performance considerations', 'Added documentation requirements', 'Specified testing approach'],
          ['Enhanced code quality standards', 'Added edge case handling', 'Specified optimization requirements']
        ],
        templates: [
          (p: string) => `${p} Include comprehensive error handling, clear documentation, and follow best practices for code structure and readability.`,
          (p: string) => `${p} Provide a complete implementation with proper error handling, input validation, comprehensive documentation, and example usage. Consider edge cases and performance optimization.`,
          (p: string) => `${p} Create a production-ready implementation with robust error handling, comprehensive input validation, detailed documentation, unit tests, and performance optimization. Handle all edge cases and provide clear examples of usage.`
        ]
      },
      explanation: {
        improvements: [
          ['Added target audience specification', 'Defined complexity level', 'Required examples'],
          ['Included analogy requirements', 'Added structure guidelines', 'Specified learning objectives'],
          ['Enhanced comprehension aids', 'Added assessment criteria', 'Specified practical applications']
        ],
        templates: [
          (p: string) => `${p} Use clear, simple language with concrete examples and analogies that make the concept accessible to beginners.`,
          (p: string) => `${p} Provide a comprehensive explanation using analogies, real-world examples, and a logical progression from basic concepts to more complex ideas. Include practical applications and common misconceptions.`,
          (p: string) => `${p} Create a detailed, educational explanation that progresses logically from fundamental principles to advanced concepts. Use multiple analogies, concrete examples, visual descriptions, and practical applications. Address common misconceptions and provide ways to test understanding.`
        ]
      },
      analysis: {
        improvements: [
          ['Added data requirements', 'Specified analysis framework', 'Defined key metrics'],
          ['Included comparative analysis', 'Added trend identification', 'Specified conclusions format'],
          ['Enhanced methodology details', 'Added risk assessment', 'Specified actionable insights']
        ],
        templates: [
          (p: string) => `${p} Provide a structured analysis with clear methodology, key findings, and data-driven conclusions.`,
          (p: string) => `${p} Conduct a comprehensive analysis using multiple frameworks, comparative data, trend analysis, and risk assessment. Present findings with clear methodology, supporting evidence, and actionable recommendations.`,
          (p: string) => `${p} Perform an in-depth analysis using rigorous methodology, multiple data sources, comparative frameworks, and trend analysis. Include risk assessment, scenario planning, and specific, actionable recommendations with implementation timelines.`
        ]
      },
      general: {
        improvements: [
          ['Added context specification', 'Defined scope and depth', 'Required examples'],
          ['Included multiple perspectives', 'Added practical applications', 'Specified format requirements'],
          ['Enhanced detail requirements', 'Added verification criteria', 'Specified audience considerations']
        ],
        templates: [
          (p: string) => `${p} Provide a comprehensive response with clear structure, relevant examples, and practical insights.`,
          (p: string) => `${p} Give a detailed, well-structured response that covers multiple perspectives, includes concrete examples, and provides practical applications or actionable insights.`,
          (p: string) => `${p} Provide an exhaustive, well-organized response that examines the topic from multiple angles, includes diverse examples, addresses potential counterarguments, and offers practical, actionable insights with clear implementation guidance.`
        ]
      }
    };

    const categoryData = categoryRefinements[category as keyof typeof categoryRefinements] || categoryRefinements.general;
    const roundIndex = Math.min(round - 2, categoryData.improvements.length - 1);
    const improvements = categoryData.improvements[roundIndex];
    const template = categoryData.templates[roundIndex];
    
    return {
      refinedPrompt: template(prompt),
      improvements
    };
  };
  const generateMockResponse = (prompt: string, modelId: string, category: string): string => {
    const categoryResponses = {
      creative: [
        "Once upon a time, in a world where imagination knew no bounds, there lived a character whose journey would change everything. The story unfolds with vivid imagery and compelling narrative that draws readers into an immersive experience filled with wonder and discovery.",
        "In the realm of creativity, where words dance and stories come alive, we find ourselves exploring themes that resonate deeply with the human experience. This tale weaves together elements of mystery, adventure, and profound emotional truth.",
        "The creative spark ignites as we delve into a narrative rich with symbolism and meaning. Each word carefully chosen to paint a picture that lingers in the mind long after the final sentence is read."
      ],
      technical: [
        "Here's a comprehensive technical solution that addresses the core requirements while maintaining best practices for scalability and maintainability. The implementation follows industry standards and includes proper error handling, documentation, and optimization techniques.",
        "This technical approach leverages modern methodologies and proven algorithms to deliver efficient, reliable results. The solution is designed with modularity in mind, allowing for easy testing, debugging, and future enhancements.",
        "The implementation demonstrates solid engineering principles with clean code architecture, comprehensive error handling, and performance optimization. Each component is carefully designed to work seamlessly within the larger system."
      ],
      analysis: [
        "This comprehensive analysis examines multiple dimensions of the topic, considering both quantitative data and qualitative factors. The assessment reveals key insights that inform strategic decision-making and highlight important trends and patterns.",
        "Through systematic evaluation of available evidence, we can identify several critical factors that influence outcomes. The analysis provides actionable insights supported by logical reasoning and empirical observations.",
        "The analytical framework applied here considers various perspectives and methodologies to ensure a thorough understanding of the subject matter. Key findings suggest significant implications for future developments."
      ],
      explanation: [
        "Let me break this down into clear, digestible components that build upon each other logically. Starting with the fundamental concepts, we'll explore how these principles work together to create a comprehensive understanding of the topic.",
        "To understand this concept fully, it's helpful to think of it in terms of familiar analogies and real-world examples. By connecting abstract ideas to concrete experiences, we can develop intuitive understanding.",
        "The explanation begins with core principles and gradually introduces more complex elements. Each step builds naturally on the previous one, creating a clear learning pathway that makes the subject accessible."
      ],
      summary: [
        "In summary, the key points include several critical elements that work together to form a comprehensive overview. The main takeaways highlight the most important aspects while providing actionable insights for practical application.",
        "The essential information can be distilled into these core components that capture the fundamental essence of the topic. This condensed format preserves the most valuable insights while maintaining clarity and accessibility.",
        "To summarize effectively, we focus on the primary themes and conclusions that emerge from the detailed analysis. These key points provide a clear framework for understanding and action."
      ],
      math: [
        "The mathematical solution involves applying systematic problem-solving techniques and logical reasoning. Step-by-step calculations demonstrate the methodology while ensuring accuracy and clarity in the final result.",
        "Using established mathematical principles and proven formulas, we can approach this problem methodically. Each step in the solution process builds logically on the previous one, leading to a clear and verifiable answer.",
        "The mathematical approach requires careful analysis of the given parameters and selection of appropriate methods. The solution demonstrates both computational accuracy and conceptual understanding."
      ],
      research: [
        "Based on comprehensive research and analysis of available sources, several key findings emerge that provide valuable insights into the topic. The evidence suggests important trends and implications for future developments.",
        "Research indicates that multiple factors contribute to the observed phenomena, with significant implications for understanding and practical application. The findings are supported by credible sources and methodical investigation.",
        "The research methodology employed here ensures thorough coverage of relevant aspects while maintaining objectivity and analytical rigor. Key discoveries provide foundation for informed conclusions."
      ],
      general: [
        "This comprehensive response addresses your question with detailed analysis and practical insights. The approach considers multiple perspectives and provides actionable information that can be applied in real-world contexts.",
        "The answer involves understanding both theoretical foundations and practical applications. By examining various aspects of the topic, we can develop a well-rounded perspective that addresses your specific needs.",
        "This response provides a balanced view that considers different angles and approaches to the question. The information is presented in a clear, organized manner that facilitates understanding and application."
      ]
    };

    // Model-specific response variations based on their strengths
    const modelSpecificResponses = {
      'llama-3.3-70b-versatile': 'This response demonstrates the versatile capabilities of Llama 3.3 70B, providing comprehensive analysis with creative insights and structured reasoning.',
      'llama-3.1-8b-instant': 'This ultra-fast response from Llama 3.1 8B delivers efficient, high-quality output optimized for speed without compromising accuracy.',
      'openai/gpt-oss-120b': 'This large-scale analysis leverages the advanced capabilities of GPT OSS 120B, providing deep insights and comprehensive coverage of complex topics.',
      'qwen/qwen3-32b': 'This response showcases Qwen 3 32B\'s multilingual and technical expertise, delivering precise solutions with strong reasoning capabilities.',
      'deepseek-r1-distill-llama-70b': 'This advanced reasoning response from DeepSeek R1 demonstrates sophisticated problem-solving and mathematical thinking capabilities.',
      'meta-llama/llama-4-maverick-17b-128e-instruct': 'This creative response from Llama 4 Maverick shows enhanced instruction following with innovative approaches and engaging content.',
      'moonshotai/kimi-k2-instruct': 'This detailed response from Kimi K2 provides comprehensive analysis with strong comprehension and thorough explanations.'
    };
    const responses = categoryResponses[category as keyof typeof categoryResponses] || categoryResponses.general;
    const baseResponse = responses[Math.floor(Math.random() * responses.length)];
    const modelResponse = modelSpecificResponses[modelId as keyof typeof modelSpecificResponses];
    
    return modelResponse || baseResponse;
  };

  const generateMockJudgeNotes = (battleMode: string, category: string, battleType: string = 'response'): string => {
    const autoModeNotes = battleType === 'prompt' ? [
      "Excellent prompt refinement through iterative improvement. Final prompt shows significant enhancement in clarity and specificity.",
      "Strong progression across rounds with notable improvements in prompt structure and effectiveness. Auto-optimization worked excellently.",
      "Impressive evolution from initial prompt to final optimized version. The iterative refinement yielded substantial quality gains.",
      "Good utilization of feedback loops to enhance prompt quality. Final iteration demonstrates optimal prompt engineering.",
      "Effective auto-refinement process with clear progression toward higher quality prompt construction."
    ] : [
      "Excellent improvement through iterative refinement. Final response shows significant enhancement over initial attempt.",
      "Strong progression across rounds with notable improvements in clarity and depth. Auto-optimization worked effectively.",
      "Impressive evolution from initial response to final output. The iterative process yielded substantial quality gains.",
      "Good utilization of feedback loops to enhance response quality. Final iteration demonstrates optimal performance.",
      "Effective auto-improvement process with clear progression toward higher quality output."
    ];

    const manualModeNotes = battleType === 'prompt' ? [
      "Well-structured prompt refinement with clear improvements and good specificity for the given category.",
      "Comprehensive prompt enhancement with appropriate detail for manual mode requirements.",
      "Strong prompt engineering accuracy with effective structure suitable for direct comparison.",
      "Good balance of clarity and specificity in the manual prompt refinement format.",
      "Solid performance in manual prompt battle with clear improvements demonstrated."
    ] : [
      "Well-structured response with clear reasoning and good examples for the given category.",
      "Comprehensive answer with appropriate depth for manual mode battle requirements.",
      "Strong technical accuracy with effective presentation suitable for direct comparison.",
      "Good balance of detail and accessibility in the manual response format.",
      "Solid performance in single-round manual battle with clear strengths demonstrated."
    ];

    const categoryNotes = battleType === 'prompt' ? {
      creative: "Excellent creative prompt refinement with enhanced narrative structure and inspiring direction.",
      technical: "Strong technical prompt optimization with clear requirements and implementation guidance.",
      analysis: "Thorough analytical prompt enhancement with structured methodology and clear objectives.",
      explanation: "Clear explanatory prompt refinement with effective learning structure and comprehension aids.",
      summary: "Concise prompt optimization capturing essential elements for effective summarization.",
      math: "Accurate mathematical prompt refinement with clear problem structure and solution approach.",
      research: "Well-researched prompt enhancement with comprehensive scope and methodological clarity.",
      general: "Balanced prompt refinement addressing all aspects with improved clarity and effectiveness."
    } : {
      creative: "Excellent creative flair with engaging narrative elements and vivid imagery.",
      technical: "Strong technical accuracy with proper implementation and clear documentation.",
      analysis: "Thorough analytical approach with well-supported conclusions and insights.",
      explanation: "Clear explanatory structure with effective use of examples and analogies.",
      summary: "Concise and comprehensive summary capturing all essential points effectively.",
      math: "Accurate mathematical reasoning with clear step-by-step problem-solving approach.",
      research: "Well-researched response with credible information and logical organization.",
      general: "Balanced and informative response addressing all aspects of the question."
    };

    const baseNotes = battleMode === 'auto' ? autoModeNotes : manualModeNotes;
    const categoryNote = categoryNotes[category as keyof typeof categoryNotes] || categoryNotes.general;
    
    return `${baseNotes[Math.floor(Math.random() * baseNotes.length)]} ${categoryNote}`;
  };

  return (
    <BattleContext.Provider value={{
      battles,
      currentBattle,
      models: mockModels,
      loading,
      createBattle,
      getBattle,
      runBattle: runBattleHandler,
      refreshBattles
    }}>
      {children}
    </BattleContext.Provider>
  );
}

export function useBattle() {
  const context = useContext(BattleContext);
  if (!context) {
    throw new Error('useBattle must be used within a BattleProvider');
  }
  return context;
}