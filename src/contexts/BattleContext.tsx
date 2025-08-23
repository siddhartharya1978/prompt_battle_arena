import React, { createContext, useContext, useState, useEffect } from 'react';
import { createBattle as createBattleAPI, getUserBattles, getBattle as getBattleAPI, runBattle } from '../lib/battles';
import { Battle, BattleData, Model } from '../types';

interface BattleContextType {
  battles: Battle[];
  models: Model[];
  loading: boolean;
  createBattle: (battleData: BattleData) => Promise<Battle>;
  getBattle: (battleId: string) => Battle | null;
  refreshBattles: () => Promise<void>;
}

const BattleContext = createContext<BattleContextType | null>(null);

// Available AI models
const AVAILABLE_MODELS: Model[] = [
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    description: 'Fast and efficient model for general tasks',
    icon: '🦙',
    available: true,
    premium: false
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    description: 'Large model with excellent reasoning capabilities',
    icon: '🦙',
    available: true,
    premium: false
  },
  {
    id: 'meta-llama/llama-guard-4-12b',
    name: 'Llama Guard 4 12B',
    provider: 'Meta',
    description: 'Safety-focused model for content moderation',
    icon: '🛡️',
    available: true,
    premium: false
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    provider: 'OpenAI',
    description: 'Large open-source GPT model',
    icon: '🤖',
    available: true,
    premium: true
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    provider: 'OpenAI',
    description: 'Smaller open-source GPT model',
    icon: '🤖',
    available: true,
    premium: false
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 70B',
    provider: 'DeepSeek',
    description: 'Advanced reasoning model for complex tasks',
    icon: '🧠',
    available: true,
    premium: true
  },
  {
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'Llama 4 Maverick 17B',
    provider: 'Meta',
    description: 'Next-generation instruction-following model',
    icon: '🚀',
    available: true,
    premium: true
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    provider: 'Meta',
    description: 'Efficient instruction model for various tasks',
    icon: '🔍',
    available: true,
    premium: true
  },
  {
    id: 'moonshotai/kimi-k2-instruct',
    name: 'Kimi K2',
    provider: 'Moonshot AI',
    description: 'Multilingual instruction-following model',
    icon: '🌙',
    available: true,
    premium: true
  },
  {
    id: 'qwen/qwen3-32b',
    name: 'Qwen 3 32B',
    provider: 'Alibaba',
    description: 'Powerful multilingual model',
    icon: '🐉',
    available: true,
    premium: false
  }
];

export function BattleProvider({ children }: { children: React.ReactNode }) {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBattles = async () => {
    try {
      setLoading(true);
      const userBattles = await getUserBattles();
      setBattles(userBattles || []);
    } catch (error) {
      console.error('Error refreshing battles:', error);
      setBattles([]);
    } finally {
      setLoading(false);
    }
  };

  const createBattle = async (battleData: BattleData): Promise<Battle> => {
    try {
      const battle = await createBattleAPI(battleData);
      // Refresh battles to include the new one
      if (refreshBattles) {
        await refreshBattles();
      }
      return battle;
    } catch (error) {
      console.error('Error creating battle:', error);
      throw error;
    }
  };

  const getBattle = (battleId: string): Battle | null => {
    if (!battleId) return null;
    
    // First check in current battles array
    const existingBattle = battles.find(b => b.id === battleId);
    if (existingBattle) {
      return existingBattle;
    }

    // Check if this is a demo user
    const demoSession = localStorage.getItem('demo_session');
    if (demoSession) {
      // Return comprehensive mock battle for demo users
      if (battleId === 'battle_1') {
        return {
          id: 'battle_1',
          userId: 'demo-user-id',
          battleType: 'response',
          prompt: 'Explain the concept of artificial intelligence in simple terms',
          finalPrompt: null,
          promptCategory: 'explanation',
          models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'],
          mode: 'standard',
          battleMode: 'manual',
          rounds: 1,
          maxTokens: 500,
          temperature: 0.7,
          status: 'completed',
          winner: 'llama-3.3-70b-versatile',
          totalCost: 1.25,
          autoSelectionReason: null,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          responses: [
            {
              id: 'response_1',
              battleId: 'battle_1',
              modelId: 'llama-3.1-8b-instant',
              response: 'Artificial Intelligence (AI) is like giving computers the ability to think and learn like humans. Instead of just following pre-programmed instructions, AI systems can analyze information, recognize patterns, and make decisions on their own. Think of it as teaching a computer to be smart - like how your phone can recognize your voice, or how Netflix knows what movies you might like. AI helps computers understand and respond to the world around them, making them more helpful and capable of solving complex problems.',
              latency: 1200,
              tokens: 85,
              cost: 0.62,
              createdAt: new Date().toISOString()
            },
            {
              id: 'response_2',
              battleId: 'battle_1',
              modelId: 'llama-3.3-70b-versatile',
              response: 'Artificial Intelligence (AI) refers to computer systems that can perform tasks typically requiring human intelligence. These systems can learn from data, recognize patterns, solve problems, and make decisions. Think of AI as teaching machines to be smart - like how your phone can recognize your voice, how streaming services recommend movies you might like, or how GPS finds the best route to your destination. AI is everywhere around us, helping make technology more intuitive and useful in our daily lives.',
              latency: 1450,
              tokens: 78,
              cost: 0.63,
              createdAt: new Date().toISOString()
            }
          ],
          scores: {
            'llama-3.1-8b-instant': {
              accuracy: 8.2,
              reasoning: 7.5,
              structure: 7.8,
              creativity: 6.9,
              overall: 7.6,
              notes: 'Good accuracy and clear explanation, decent structure, reasoning could be improved.'
            },
            'llama-3.3-70b-versatile': {
              accuracy: 9.1,
              reasoning: 8.7,
              structure: 8.9,
              creativity: 8.2,
              overall: 8.7,
              notes: 'Excellent accuracy and reasoning, well-structured content, good creative examples.'
            }
          }
        };
      }
    }

    return null;
  };

  useEffect(() => {
    refreshBattles();
  }, []);

  const value = {
    battles,
    models: AVAILABLE_MODELS,
    loading,
    createBattle,
    getBattle,
    refreshBattles
  };

  return (
    <BattleContext.Provider value={value}>
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