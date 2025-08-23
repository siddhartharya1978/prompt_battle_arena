import React, { createContext, useContext, useState, useEffect } from 'react';
import { createBattle as createBattleAPI, getUserBattles, getBattle as getBattleAPI, BattleData, Battle } from '../lib/battles';

interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: string;
  available: boolean;
  premium: boolean;
}

interface BattleContextType {
  battles: Battle[];
  models: Model[];
  loading: boolean;
  createBattle: (battleData: BattleData) => Promise<Battle>;
  getBattle: (battleId: string) => Promise<Battle | null>;
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
      setBattles(userBattles);
    } catch (error) {
      console.error('Error refreshing battles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBattle = async (battleData: BattleData): Promise<Battle> => {
    const battle = await createBattleAPI(battleData);
    // Refresh battles to include the new one
    await refreshBattles();
    return battle;
  };

  const getBattle = async (battleId: string): Promise<Battle | null> => {
    return await getBattleAPI(battleId);
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