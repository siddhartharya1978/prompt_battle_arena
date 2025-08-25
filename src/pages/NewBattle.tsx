import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBattle } from '../contexts/BattleContext';
import ModelCard from '../components/ModelCard';
import { BattleData } from '../types';
import Navigation from '../components/Navigation';
import FeedbackWidget from '../components/FeedbackWidget';
import { 
  Zap, 
  Target, 
  Users, 
  Settings, 
  Play,
  Brain,
  Hand,
  Edit3,
  MessageSquare,
  Lightbulb,
  Sparkles,
  Crown,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { selectOptimalModels } from '../lib/models';
import { modelHealthMonitor, HealthCheckResult, getHealthStatusColor, getHealthStatusIcon, getHealthStatusBadge } from '../lib/model-health';
import BattleThinking from '../components/BattleThinking';

export default function NewBattle() {
  const { user, incrementBattleUsage } = useAuth();
  const { models, createBattle, selectOptimalModels, getAutoSelectionReason, battleProgress } = useBattle();
  const navigate = useNavigate();
  const location = useLocation();

  // Battle configuration state
  const [battleType, setBattleType] = useState<'prompt' | 'response'>('response');
  const [battleMode, setBattleMode] = useState<'auto' | 'manual'>('auto');
  const [prompt, setPrompt] = useState('');
  const [promptCategory, setPromptCategory] = useState('general');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [rounds, setRounds] = useState(1);
  const [maxTokens, setMaxTokens] = useState(500);
  const [temperature, setTemperature] = useState(0.7);
  const [mode, setMode] = useState<'standard' | 'turbo'>('standard');
  const [isCreating, setIsCreating] = useState(false);
  const [autoSelectionResult, setAutoSelectionResult] = useState<{
    selected: string[];
    rationale: string;
    deselected: Array<{modelId: string, reason: string}>;
  } | null>(null);
  const [modelHealthStatus, setModelHealthStatus] = useState<HealthCheckResult | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [showThinking, setShowThinking] = useState(true);

  // Pre-populate from navigation state (smart recommendations)
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.battleType) setBattleType(state.battleType);
      if (state.prompt) setPrompt(state.prompt);
      if (state.category) setPromptCategory(state.category);
      if (state.battleMode) setBattleMode(state.battleMode);
      
      // Clear the state to prevent re-population on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const categories = [
    { id: 'general', name: 'General', description: 'General questions and conversations' },
    { id: 'creative', name: 'Creative', description: 'Creative writing, stories, poems' },
    { id: 'technical', name: 'Technical', description: 'Programming, engineering, tech topics' },
    { id: 'analysis', name: 'Analysis', description: 'Data analysis, research, insights' },
    { id: 'summary', name: 'Summary', description: 'Text summarization and condensing' },
    { id: 'explanation', name: 'Explanation', description: 'Explaining complex topics simply' },
    { id: 'math', name: 'Math', description: 'Mathematical problems and calculations' },
    { id: 'research', name: 'Research', description: 'Research assistance and fact-finding' }
  ];

  const samplePrompts = {
    general: [
      "Explain the concept of artificial intelligence in simple terms",
      "What are the benefits and drawbacks of remote work?",
      "How can someone develop better communication skills?"
    ],
    creative: [
      "Write a short story about a time traveler who gets stuck in the past",
      "Create a haiku about the changing seasons",
      "Describe a futuristic city from the perspective of a visitor"
    ],
    technical: [
      "Explain the difference between React and Vue.js for web development",
      "How does blockchain technology work?",
      "What are the best practices for database optimization?"
    ],
    analysis: [
      "Analyze the pros and cons of renewable energy adoption",
      "What factors contribute to successful startup companies?",
      "Compare different project management methodologies"
    ],
    summary: [
      "Summarize the key points of climate change and its global impact",
      "Provide a brief overview of machine learning applications",
      "Condense the main themes of Shakespeare's Hamlet"
    ],
    explanation: [
      "Explain quantum computing to a 10-year-old",
      "How does the stock market work for beginners?",
      "What is cryptocurrency and how is it different from regular money?"
    ],
    math: [
      "Solve this algebra problem: 2x + 5 = 15, find x",
      "Calculate the compound interest on $1000 at 5% for 3 years",
      "Explain the Pythagorean theorem with examples"
    ],
    research: [
      "What are the latest developments in renewable energy technology?",
      "Research the historical significance of the Silk Road",
      "Find information about the health benefits of Mediterranean diet"
    ]
  };

  // Auto-select models based on category and battle type
  const autoSelectModels = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first for intelligent model selection');
      return;
    }
    
    const result = selectOptimalModels(prompt, promptCategory, battleType, 2); // Max 2 models
    setAutoSelectionResult(result);
    setSelectedModels(result.selected);

    toast.success(`🎯 Selected optimal 2-model battle: ${result.selected.map(id => getModelInfo(id).name).join(' vs ')}`);
  };

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else {
        const maxModels = 2; // Always limit to 2 models
        if (prev.length >= maxModels) {
          toast.error(`Maximum ${maxModels} models allowed for ${battleMode} mode`);
          return prev;
        }
        return [...prev, modelId];
      }
    });
  };

  const useSamplePrompt = (samplePrompt: string) => {
    setPrompt(samplePrompt);
    toast.success('Sample prompt loaded!');
  };

  const getModelInfo = (modelId: string) => {
    return models.find(m => m.id === modelId) || { name: modelId, icon: '🤖' };
  };

  const canCreateBattle = () => {
    const minPromptLength = 10; // Minimum characters for a valid prompt
    return prompt.trim().length >= minPromptLength && selectedModels.length >= 2;
  };

  const getDisabledButtonTooltip = () => {
    if (prompt.trim().length === 0) return "Please enter a prompt";
    if (prompt.trim().length < 10) return "Prompt must be at least 10 characters long";
    if (selectedModels.length < 2) return "Please select at least 2 models";
    if (user?.plan === 'free' && user.battlesUsed >= user.battlesLimit) return "Daily battle limit reached. Upgrade for unlimited battles!";
    if (isCreating) return "Battle is already being created...";
    return ""; // Should not be disabled
  };

  const handleCreateBattle = async () => {
    if (!user) {
      toast.error('Please log in to create battles');
      return;
    }

    // Check usage limits
    if (user.plan === 'free' && 
        typeof user.battlesUsed === 'number' && 
        typeof user.battlesLimit === 'number' && 
        user.battlesUsed >= user.battlesLimit) {
      toast.error(`You've reached your daily limit of ${user.battlesLimit} battles. Upgrade to Premium for unlimited battles!`);
      return;
    }

    if (!canCreateBattle()) {
      toast.error('Please enter a prompt and select at least 2 models');
      return;
    }

    setIsCreating(true);

    try {
      // Validate models are available
      const availableModels = selectedModels.filter(modelId => {
        const model = models.find(m => m.id === modelId);
        return model && model.available;
      });
      
      if (availableModels.length < 2) {
        throw new Error('At least 2 available models are required. Some selected models may be unavailable.');
      }
      
      const battleData: BattleData = {
        battle_type: battleType,
        prompt: prompt.trim(),
        prompt_category: promptCategory,
        models: availableModels.slice(0, 2), // Ensure max 2 models
        mode,
        battle_mode: battleMode,
        rounds: battleMode === 'auto' ? 3 : 1, // Reduced rounds for faster battles
        max_tokens: maxTokens,
        temperature,
        auto_selection_reason: battleMode === 'auto' ? getAutoSelectionReason(prompt, promptCategory, selectedModels) : undefined
      };

      const battle = await createBattle(battleData);
      
      // Increment usage for real users
      await incrementBattleUsage();
      
      // Ensure we have a valid battle ID before navigating
      if (battle && battle.id) {
        navigate(`/battle/${battle.id}/results`);
      } else {
        throw new Error('Battle created but no ID returned');
      }
    } catch (error) {
      console.error('Battle execution error:', error);
      
      // Show detailed error for API issues
      let errorMessage = 'Failed to execute battle';
      if (error instanceof Error) {
        if (error.message.includes('Supabase')) {
          errorMessage = 'API Configuration Error: Please ensure Supabase and Groq API are properly configured.';
        } else if (error.message.includes('Groq')) {
          errorMessage = 'Groq API Error: Please check your API key configuration.';
        } else {
          errorMessage = `Battle Error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Battle
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Set up your AI battle and watch models compete for the best {battleType === 'prompt' ? 'prompt refinement' : 'response'}
          </p>
        </div>

        {/* Usage Status */}
        {user && user.plan === 'free' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-900 dark:text-blue-100 font-medium">
                  Daily Usage: {user.battles_used}/{user.battles_limit} battles
                </span>
              </div>
              {user.battles_used >= user.battles_limit ? (
                <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Limit reached</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">{user.battles_limit - user.battles_used} remaining</span>
                </div>
              )}
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(user.battles_used / user.battles_limit) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Battle Type Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Choose Battle Type
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setBattleType('prompt')}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  battleType === 'prompt'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Edit3 className={`w-6 h-6 ${
                    battleType === 'prompt' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <h3 className={`font-semibold ${
                    battleType === 'prompt' ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'
                  }`}>
                    Prompt Battle
                  </h3>
                </div>
                <p className={`text-sm ${
                  battleType === 'prompt' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300'
                }`}>
                  Models compete to improve and refine your prompt itself. Watch your initial prompt evolve into a perfectly crafted instruction.
                </p>
              </button>

              <button
                onClick={() => setBattleType('response')}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  battleType === 'response'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <MessageSquare className={`w-6 h-6 ${
                    battleType === 'response' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <h3 className={`font-semibold ${
                    battleType === 'response' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                  }`}>
                    Response Battle
                  </h3>
                </div>
                <p className={`text-sm ${
                  battleType === 'response' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'
                }`}>
                  Models compete to generate the best response to your prompt. Compare creativity, accuracy, and reasoning across different AI models.
                </p>
              </button>
            </div>
          </div>

          {/* Battle Mode Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Choose Battle Mode
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setBattleMode('auto')}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  battleMode === 'auto'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Brain className={`w-6 h-6 ${
                    battleMode === 'auto' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <h3 className={`font-semibold ${
                    battleMode === 'auto' ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-white'
                  }`}>
                    Auto Mode
                  </h3>
                  <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full">
                    Recommended
                  </span>
                </div>
                <p className={`text-sm mb-3 ${
                  battleMode === 'auto' ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-300'
                }`}>
                  AI automatically selects the best models for your prompt and runs iterative battles until achieving optimal results.
                </p>
                <ul className={`text-xs space-y-1 ${
                  battleMode === 'auto' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  <li>• Smart model selection based on your prompt</li>
                  <li>• Automatic iterative improvement</li>
                  <li>• Continues until optimal results</li>
                </ul>
              </button>

              <button
                onClick={() => setBattleMode('manual')}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                  battleMode === 'manual'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Hand className={`w-6 h-6 ${
                    battleMode === 'manual' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <h3 className={`font-semibold ${
                    battleMode === 'manual' ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'
                  }`}>
                    Manual Mode
                  </h3>
                </div>
                <p className={`text-sm mb-3 ${
                  battleMode === 'manual' ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300'
                }`}>
                  You choose the models, rounds, and settings. Perfect for specific comparisons or when you want full control.
                </p>
                <ul className={`text-xs space-y-1 ${
                  battleMode === 'manual' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  <li>• Choose 2-3 specific models</li>
                  <li>• Control battle parameters</li>
                  <li>• Direct model comparison</li>
                </ul>
              </button>
            </div>
          </div>

          {/* Prompt Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Configure Your {battleType === 'prompt' ? 'Initial Prompt' : 'Prompt'}
            </h2>
            
            {/* Category Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Category
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setPromptCategory(category.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      promptCategory === category.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{category.name}</div>
                    <div className="text-xs opacity-75 mt-1">{category.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {battleType === 'prompt' ? 'Initial Prompt to Refine' : 'Your Prompt'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={battleType === 'prompt' 
                  ? "Enter a prompt that you'd like AI models to improve and refine..."
                  : "Enter your prompt for AI models to respond to..."
                }
                className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {prompt.length} characters
                </span>
                {prompt.trim().length > 0 && prompt.trim().length < 10 && (
                  <span className="text-sm text-orange-600 dark:text-orange-400">
                    Prompt must be at least 10 characters long
                  </span>
                )}
                {prompt.length > 500 && (
                  <span className="text-sm text-orange-600 dark:text-orange-400">
                    Consider shortening for better results
                  </span>
                )}
              </div>
            </div>

            {/* Sample Prompts */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sample {promptCategory} prompts:
                </span>
              </div>
              <div className="grid gap-2">
                {samplePrompts[promptCategory as keyof typeof samplePrompts]?.map((sample, index) => (
                  <button
                    key={index}
                    onClick={() => useSamplePrompt(sample)}
                    className="text-left p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                4. {battleMode === 'auto' ? 'Auto-Selected Models' : 'Manual Model Selection'} ({selectedModels.length}/2)
              </h2>
              {battleMode === 'auto' ? (
                <button
                  onClick={autoSelectModels}
                  disabled={!prompt.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Brain className="w-4 h-4" />
                  <span>Select Best 2 Models</span>
                </button>
              ) : (
                <button
                  onClick={autoSelectModels}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Smart Suggestions</span>
                </button>
              )}
            </div>

            {/* Auto-Selection Results */}
            {battleMode === 'auto' && autoSelectionResult && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                  🎯 Optimal 2-Model Selection:
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {autoSelectionResult.selected.map((modelId, index) => {
                    const model = getModelInfo(modelId);
                    return (
                      <div key={modelId} className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                        <span className="text-lg">{model.icon}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{model.name}</span>
                      </div>
                    );
                  })}
                </div>
                
                <details className="text-sm">
                  <summary className="cursor-pointer text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">
                    View Selection Details
                  </summary>
                  <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {autoSelectionResult.rationale}
                    </pre>
                  </div>
                </details>
              </div>
            )}

            {/* Model Cards */}
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {models.filter(model => model.available).map((model) => (
                <div key={model.id} className="relative">
                  <ModelCard
                    model={model}
                    isSelected={selectedModels.includes(model.id)}
                    onToggle={() => battleMode === 'manual' ? handleModelToggle(model.id) : undefined}
                    showSelection={battleMode === 'manual'}
                    compact={false}
                  />
                  
                  {/* Health Status Overlay */}
                  {selectedModels.includes(model.id) && modelHealthStatus && (
                    <div className="absolute top-2 right-2">
                      {(() => {
                        const isHealthy = modelHealthStatus.healthyModels.includes(model.id);
                        const isDegraded = modelHealthStatus.degradedModels.includes(model.id);
                        const isUnavailable = modelHealthStatus.unavailableModels.includes(model.id);
                        
                        if (isHealthy) {
                          return (
                            <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                              ✅ Healthy
                            </div>
                          );
                        } else if (isDegraded) {
                          return (
                            <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
                              ⚠️ Degraded
                            </div>
                          );
                        } else if (isUnavailable) {
                          return (
                            <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium">
                              ❌ Issues
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedModels.length < 2 && battleMode === 'manual' && (
              <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm text-orange-700 dark:text-orange-300">
                    Select at least 2 models to start a manual battle
                  </span>
                </div>
              </div>
            )}
            
            {battleMode === 'auto' && selectedModels.length === 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Enter a prompt above, then click "Select Best 2 Models" to let AI choose the optimal pair
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Settings (Manual Mode) */}
          {battleMode === 'manual' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Advanced Settings
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    min="50"
                    max="2000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Temperature
                  </label>
                  <input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    min="0"
                    max="2"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as 'standard' | 'turbo')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="standard">Standard</option>
                    <option value="turbo">Turbo</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Auto Mode Settings */}
          {battleMode === 'auto' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                5. **AUTO MODE - SUPREME OPTIMIZATION**
              </h2>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border-2 border-green-300 dark:border-green-600">
                <div className="flex items-center space-x-3 mb-4">
                  <Brain className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                      **SMART AUTO MODE - PEER-REVIEWED 10/10 OPTIMIZATION**
                    </h3>
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      Automatic, justified, iterative, peer-reviewed LLM selection/loop until true 10/10 consensus or plateau
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-600">
                    <h4 className="font-bold text-green-900 dark:text-green-100 mb-2">
                      🎯 **OPTIMIZED AUTO MODE:**
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      **Streamlined 2-model battles with intelligent selection, real-time thinking visualization, and faster completion times for optimal user experience.**
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300">**Optimal 2-Model Selection**</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300">**Real-time Thinking Process**</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300">**Faster Battle Completion**</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300">**Enhanced User Experience**</span>
                  </div>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                    ⚡ **OPTIMIZED FOR SPEED** - Maximum 2 models, reduced rounds, real-time thinking visualization. 
                    Perfect balance of quality and user experience.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Create Battle Button */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            {/* Real-time Progress Display */}
            {battleProgress && (
              <div className="mb-6">
                <BattleThinking 
                  progress={battleProgress}
                  isVisible={showThinking}
                  onToggleVisibility={() => setShowThinking(!showThinking)}
                />
              </div>
            )}
            
            <div className="text-center">
              <button
                onClick={handleCreateBattle}
                disabled={!canCreateBattle() || isCreating || (
                  user?.plan === 'free' && 
                  typeof user?.battlesUsed === 'number' && 
                  typeof user?.battlesLimit === 'number' && 
                  user.battlesUsed >= user.battlesLimit
                )}
                title={getDisabledButtonTooltip()} // Tooltip for disabled button
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
              >
                {isCreating ? (
                  <>
                    <Activity className="w-5 h-5 animate-pulse" />
                    <span>
                      {battleProgress?.phase || 'Starting Battle...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>Start 2-Model {battleType === 'prompt' ? 'Prompt' : 'Response'} Battle</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              {(!canCreateBattle() || (user?.plan === 'free' && user.battlesUsed >= user.battlesLimit)) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {getDisabledButtonTooltip()}
                </p> // Display the same tooltip message below the button
              )}
              
              {user?.plan === 'free' && 
               typeof user?.battlesUsed === 'number' && 
               typeof user?.battlesLimit === 'number' && 
               user.battlesUsed >= user.battlesLimit && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                  Daily limit reached. Upgrade to Premium for unlimited battles!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <FeedbackWidget />
    </div>
  );
}