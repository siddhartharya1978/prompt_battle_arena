import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBattle } from '../contexts/BattleContext';
import { isGroqApiConfigured } from '../lib/groq';
import Navigation from '../components/Navigation';
import GroqApiKeyModal from '../components/GroqApiKeyModal';
import { 
  Zap, 
  Settings, 
  Play, 
  ChevronDown, 
  ChevronUp,
  Info,
  Sparkles,
  Target,
  Brain,
  Hand,
  Lightbulb,
  Code,
  FileText,
  MessageSquare,
  BookOpen,
  Palette,
  Calculator,
  Globe,
  Edit3,
  ArrowRight,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewBattle() {
  const { user, incrementBattleUsage } = useAuth();
  const { models, createBattle, runBattle, loading } = useBattle();
  const navigate = useNavigate();

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [battleType, setBattleType] = useState<'prompt' | 'response'>('response');
  const [battleMode, setBattleMode] = useState<'auto' | 'manual'>('auto');
  const [prompt, setPrompt] = useState('');
  const [promptCategory, setPromptCategory] = useState('general');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [mode, setMode] = useState<'standard' | 'turbo'>('standard');
  const [rounds, setRounds] = useState(1);
  const [maxTokens, setMaxTokens] = useState(500);
  const [temperature, setTemperature] = useState(0.7);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [autoSelectedModels, setAutoSelectedModels] = useState<string[]>([]);
  const [selectionReason, setSelectionReason] = useState('');

  const canRunBattle = user && user.battles_used < user.battles_limit;
  const promptLength = prompt.length;
  const maxPromptLength = 2000;

  const promptCategories = [
    { id: 'general', label: 'General', icon: MessageSquare, description: 'General questions and discussions' },
    { id: 'creative', label: 'Creative Writing', icon: Palette, description: 'Stories, poems, creative content' },
    { id: 'technical', label: 'Technical/Code', icon: Code, description: 'Programming and technical explanations' },
    { id: 'analysis', label: 'Analysis', icon: Brain, description: 'Data analysis and reasoning tasks' },
    { id: 'summary', label: 'Summary', icon: FileText, description: 'Summarization and condensation' },
    { id: 'explanation', label: 'Explanation', icon: BookOpen, description: 'Educational and explanatory content' },
    { id: 'math', label: 'Math/Logic', icon: Calculator, description: 'Mathematical and logical problems' },
    { id: 'research', label: 'Research', icon: Globe, description: 'Research and fact-finding tasks' }
  ];

  const handleModelToggle = (modelId: string) => {
    if (battleMode === 'auto') return; // Prevent manual selection in auto mode
    
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else if (prev.length < 3) {
        return [...prev, modelId];
      } else {
        toast.error('Maximum 3 models allowed');
        return prev;
      }
    });
  };

  const autoSelectModels = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    const promptLower = prompt.toLowerCase();
    let recommendedModels: string[] = [];
    let reason = '';

    // Enhanced auto-selection logic based on battle type, prompt category and content
    if (battleType === 'prompt') {
      // For prompt battles, select models good at prompt engineering and refinement
      switch (promptCategory) {
        case 'creative':
          recommendedModels = ['llama-3.3-70b-versatile', 'meta-llama/llama-4-maverick-17b-128e-instruct'];
          reason = 'Selected Llama 3.3 70B for its superior creativity and versatility, and Llama 4 Maverick for enhanced creative instruction following - both excel at refining artistic and narrative prompts.';
          break;
        case 'technical':
          recommendedModels = ['qwen/qwen3-32b', 'deepseek-r1-distill-llama-70b'];
          reason = 'Selected Qwen 3 32B for its strong coding and technical abilities, and DeepSeek R1 for advanced reasoning - both excel at creating precise technical prompts.';
          break;
        case 'analysis':
          recommendedModels = ['openai/gpt-oss-120b', 'deepseek-r1-distill-llama-70b'];
          reason = 'Chosen GPT OSS 120B for large-scale analysis capabilities and DeepSeek R1 for advanced reasoning - perfect for analytical prompt refinement.';
          break;
        case 'math':
          recommendedModels = ['qwen/qwen3-32b', 'deepseek-r1-distill-llama-70b'];
          reason = 'Selected models with superior mathematical reasoning - Qwen 3 for mathematical capabilities and DeepSeek R1 for advanced problem-solving logic.';
          break;
        case 'research':
          recommendedModels = ['meta-llama/llama-4-scout-17b-16e-instruct', 'moonshotai/kimi-k2-instruct'];
          reason = 'Chosen Llama 4 Scout for exploration tasks and Kimi K2 for comprehensive analysis - ideal for research-focused prompt refinement.';
          break;
        default:
          recommendedModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
          reason = 'Selected versatile models - Llama 3.3 70B for comprehensive refinement and Llama 3.1 8B for fast, efficient prompt optimization.';
      }
    } else {
      // For response battles, select models based on response generation capabilities
      switch (promptCategory) {
        case 'creative':
          recommendedModels = ['llama-3.3-70b-versatile', 'meta-llama/llama-4-maverick-17b-128e-instruct'];
          reason = 'Selected Llama 3.3 70B for superior creativity and Llama 4 Maverick for enhanced creative instruction following - both excel at diverse creative outputs.';
          break;
        case 'technical':
          recommendedModels = ['qwen/qwen3-32b', 'deepseek-r1-distill-llama-70b', 'llama-3.1-8b-instant'];
          reason = 'Selected Qwen 3 for coding expertise, DeepSeek R1 for advanced reasoning, and Llama 3.1 8B for fast technical responses.';
          break;
        case 'analysis':
          recommendedModels = ['openai/gpt-oss-120b', 'deepseek-r1-distill-llama-70b'];
          reason = 'Chosen GPT OSS 120B for large-scale analysis and DeepSeek R1 for advanced reasoning - perfect for comprehensive analytical responses.';
          break;
        case 'summary':
          recommendedModels = ['llama-3.1-8b-instant', 'openai/gpt-oss-20b'];
          reason = 'Selected fast, efficient models - Llama 3.1 8B for ultra-fast summarization and GPT OSS 20B for balanced, concise outputs.';
          break;
        case 'explanation':
          recommendedModels = ['llama-3.3-70b-versatile', 'moonshotai/kimi-k2-instruct', 'meta-llama/llama-4-scout-17b-16e-instruct'];
          reason = 'Selected models with strong comprehension - Llama 3.3 for versatile explanations, Kimi K2 for detailed responses, and Scout for exploratory insights.';
          break;
        case 'math':
          recommendedModels = ['qwen/qwen3-32b', 'deepseek-r1-distill-llama-70b'];
          reason = 'Chosen models with superior mathematical capabilities - Qwen 3 for mathematical reasoning and DeepSeek R1 for advanced problem-solving.';
          break;
        case 'research':
          recommendedModels = ['meta-llama/llama-4-scout-17b-16e-instruct', 'moonshotai/kimi-k2-instruct'];
          reason = 'Selected research-focused models - Scout for exploration and discovery, Kimi K2 for comprehensive information synthesis.';
          break;
        default:
          // Additional content-based selection
          if (promptLower.includes('story') || promptLower.includes('creative') || promptLower.includes('poem')) {
            recommendedModels = ['llama-3.3-70b-versatile', 'meta-llama/llama-4-maverick-17b-128e-instruct'];
            reason = 'Detected creative content - selected Llama 3.3 for versatile creativity and Maverick for enhanced creative instruction following.';
          } else if (promptLower.includes('code') || promptLower.includes('program') || promptLower.includes('function')) {
            recommendedModels = ['qwen/qwen3-32b', 'deepseek-r1-distill-llama-70b'];
            reason = 'Detected coding request - selected Qwen 3 for coding expertise and DeepSeek R1 for advanced technical reasoning.';
          } else if (promptLower.includes('explain') || promptLower.includes('how') || promptLower.includes('what')) {
            recommendedModels = ['llama-3.3-70b-versatile', 'moonshotai/kimi-k2-instruct', 'llama-3.1-8b-instant'];
            reason = 'Detected explanatory request - selected versatile models for comprehensive explanations from different perspectives.';
          } else {
            recommendedModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
            reason = 'General prompt detected - selected versatile and fast models for comprehensive, efficient responses.';
          }
      }
    }

    setAutoSelectedModels(recommendedModels);
    setSelectionReason(reason);
    toast.success(`Auto-selected ${recommendedModels.length} models based on your prompt!`);
  };

  const handleRunBattle = async () => {
    // Check if Groq API key is configured
    if (!isGroqApiConfigured()) {
      setShowApiKeyModal(true);
      return;
    }

    if (!canRunBattle) {
      toast.error('Daily battle limit reached. Upgrade to Premium for unlimited battles.');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    const modelsToUse = battleMode === 'auto' ? autoSelectedModels : selectedModels;
    
    if (modelsToUse.length < 2) {
      if (battleMode === 'auto') {
        toast.error('Please use auto-select to choose models first');
      } else {
        toast.error('Please select at least 2 models');
      }
      return;
    }

    setIsRunning(true);
    
    try {
      const battle = await createBattle({
        battle_type: battleType,
        prompt: prompt.trim(),
        prompt_category: promptCategory,
        models: modelsToUse,
        mode,
        battle_mode: battleMode,
        rounds,
        max_tokens: maxTokens,
        temperature,
        auto_selection_reason: battleMode === 'auto' ? selectionReason : undefined
      });

      incrementBattleUsage();
      toast.success(`${battleType === 'prompt' ? 'Prompt' : 'Response'} battle created! Running models...`);
      
      await runBattle(battle.id);
      navigate(`/battle/${battle.id}/results`);
    } catch (error) {
      toast.error('Failed to run battle. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  const getSelectedCategory = () => {
    return promptCategories.find(cat => cat.id === promptCategory);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Battle
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Choose your battle type and mode, then let AI models compete
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
          {/* Battle Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Battle Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setBattleType('response');
                  setAutoSelectedModels([]);
                }}
                className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                  battleType === 'response'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Response Battle</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Models compete to generate the best response to your prompt
                </div>
              </button>
              <button
                onClick={() => {
                  setBattleType('prompt');
                  setAutoSelectedModels([]);
                }}
                className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                  battleType === 'prompt'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Edit3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Prompt Battle</span>
                  <span className="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs px-2 py-1 rounded-full">
                    New!
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Models compete to improve and refine your prompt itself
                </div>
              </button>
            </div>
          </div>

          {/* Battle Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Battle Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setBattleMode('auto');
                  setSelectedModels([]);
                  setAutoSelectedModels([]);
                }}
                className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                  battleMode === 'auto'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Auto Mode</span>
                  <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full">
                    New!
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  AI automatically selects best models and runs iterative {battleType === 'prompt' ? 'prompt refinement' : 'response battles'} until 10/10 score
                </div>
              </button>
              <button
                onClick={() => {
                  setBattleMode('manual');
                  setAutoSelectedModels([]);
                }}
                className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                  battleMode === 'manual'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Hand className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Manual Mode</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Manually select models, rounds, and control the entire {battleType === 'prompt' ? 'prompt refinement' : 'response battle'} process
                </div>
              </button>
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {battleType === 'prompt' ? 'Initial Prompt to Refine' : 'Your Prompt'}
              </label>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${
                  promptLength > maxPromptLength ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {promptLength}/{maxPromptLength}
                </span>
              </div>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={battleType === 'prompt' 
                ? "Enter your initial prompt to be refined... (e.g., 'Write about AI' → Models will improve this to be more specific and effective)"
                : "Enter your prompt here... (e.g., 'Explain quantum computing in simple terms' or 'Write a creative story about time travel')"
              }
              className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              maxLength={maxPromptLength}
            />
            {battleType === 'prompt' && (
              <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Edit3 className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    <strong>Prompt Battle Mode:</strong> Models will iteratively refine your prompt to make it clearer, more specific, and more effective at generating high-quality responses.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Prompt Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {promptCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setPromptCategory(category.id)}
                  className={`p-3 border-2 rounded-xl text-center transition-all duration-200 ${
                    promptCategory === category.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <category.icon className="w-5 h-5 mx-auto mb-1 text-gray-600 dark:text-gray-400" />
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    {category.label}
                  </div>
                </button>
              ))}
            </div>
            {getSelectedCategory() && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                {getSelectedCategory()?.description}
              </p>
            )}
          </div>

          {/* Auto Mode: Model Auto-Selection */}
          {battleMode === 'auto' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto-Selected Models
                </label>
                <button
                  onClick={autoSelectModels}
                  disabled={!prompt.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Auto-Select Models</span>
                </button>
              </div>

              {autoSelectedModels.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        AI Model Selection for {battleType === 'prompt' ? 'Prompt Refinement' : 'Response Generation'}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {selectionReason}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {autoSelectedModels.map((modelId) => {
                      const model = models.find(m => m.id === modelId);
                      return model ? (
                        <div
                          key={modelId}
                          className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-600 rounded-lg"
                        >
                          <span className="text-lg">{model.icon}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {model.name}
                          </span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Mode: Model Selection */}
          {battleMode === 'manual' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Models (2-3 required)
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedModels.length}/3 selected
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {models.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => handleModelToggle(model.id)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedModels.includes(model.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{model.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {model.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {model.developer}
                            {model.isPreview && (
                              <span className="ml-1 px-1 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded text-xs">
                                Preview
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedModels.includes(model.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedModels.includes(model.id) && (
                          <div className="w-full h-full rounded-full bg-white scale-50" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {model.description}
                    </p>
                    
                    {/* Model Details Tooltip */}
                    <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-xs">
                      <div className="grid grid-cols-2 gap-1 mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Context:</span>
                        <span className="text-gray-900 dark:text-white">{(model.contextWindow / 1000).toFixed(0)}K tokens</span>
                        <span className="text-gray-500 dark:text-gray-400">Max out:</span>
                        <span className="text-gray-900 dark:text-white">{(model.maxTokens / 1000).toFixed(0)}K tokens</span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-300">
                        <strong>Best for:</strong> {model.strengths.slice(0, 2).join(', ')}
                      </div>
                    </div>
                    
                    {/* Category Tags */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {model.category.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        model.speed === 'fast' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                        model.speed === 'balanced' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                        'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                      }`}>
                        {model.speed}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Battle Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Battle Type
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setMode('standard')}
                  className={`w-full p-3 border-2 rounded-xl text-left transition-all duration-200 ${
                    mode === 'standard'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    Standard Mode
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Balanced performance and quality
                  </div>
                </button>
                <button
                  onClick={() => setMode('turbo')}
                  className={`w-full p-3 border-2 rounded-xl text-left transition-all duration-200 ${
                    mode === 'turbo'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    Turbo Mode
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Faster responses, lower cost
                  </div>
                </button>
              </div>
            </div>

            {/* Rounds Selection (Manual Mode Only) */}
            {battleMode === 'manual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Number of Rounds
                </label>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((roundCount) => (
                    <button
                      key={roundCount}
                      onClick={() => setRounds(roundCount)}
                      className={`w-full p-3 border-2 rounded-xl text-left transition-all duration-200 ${
                        rounds === roundCount
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {roundCount} Round{roundCount > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {roundCount === 1 
                          ? (battleType === 'prompt' ? 'Single prompt refinement' : 'Single response battle')
                          : `${roundCount} rounds of iterative ${battleType === 'prompt' ? 'prompt refinement' : 'response improvement'}`
                        }
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Auto Mode Info */}
            {battleMode === 'auto' && (
              <div className={`bg-gradient-to-br border rounded-xl p-4 ${
                battleType === 'prompt'
                  ? 'from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-200 dark:border-purple-700'
                  : 'from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 border-green-200 dark:border-green-700'
              }`}>
                <div className="flex items-start space-x-3">
                  <Brain className={`w-5 h-5 mt-0.5 ${
                    battleType === 'prompt' 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`} />
                  <div>
                    <h4 className={`font-medium mb-1 ${
                      battleType === 'prompt'
                        ? 'text-purple-900 dark:text-purple-100'
                        : 'text-green-900 dark:text-green-100'
                    }`}>
                      Auto Mode Features
                    </h4>
                    <ul className={`text-sm space-y-1 ${
                      battleType === 'prompt'
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-green-700 dark:text-green-300'
                    }`}>
                      <li>• Intelligent model selection based on {battleType === 'prompt' ? 'prompt engineering expertise' : 'response generation capabilities'}</li>
                      <li>• Automatic iterative {battleType === 'prompt' ? 'prompt refinement' : 'response improvement'} (2-4 rounds)</li>
                      <li>• Continues until 10/10 {battleType === 'prompt' ? 'prompt quality' : 'response score'} or no improvement</li>
                      <li>• Detailed round-by-round {battleType === 'prompt' ? 'refinement' : 'progress'} tracking</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Advanced Settings</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Max Tokens
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {maxTokens}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>100</span>
                    <span>2000</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Temperature
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {temperature}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>0 (Focused)</span>
                    <span>1 (Creative)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Usage Warning */}
          {!canRunBattle && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Daily limit reached
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    You've used all {user?.battles_limit} battles for today. Upgrade to Premium for unlimited battles.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Run Battle Button */}
          <button
            onClick={handleRunBattle}
            disabled={
              !canRunBattle || 
              !prompt.trim() || 
              (battleMode === 'auto' ? autoSelectedModels.length < 2 : selectedModels.length < 2) || 
              isRunning ||
              loading
            }
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
          >
            {isRunning || loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>
                  {battleMode === 'auto' 
                    ? `Running Auto ${battleType === 'prompt' ? 'Prompt' : 'Response'} Battle...` 
                    : `Running ${battleType === 'prompt' ? 'Prompt' : 'Response'} Battle...`
                  }
                </span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>
                  {battleMode === 'auto' 
                    ? `Start Auto ${battleType === 'prompt' ? 'Prompt' : 'Response'} Battle` 
                    : `Run ${battleType === 'prompt' ? 'Prompt' : 'Response'} Battle`
                  }
                </span>
              </>
            )}
          </button>

          {/* Mode Explanation */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              {battleMode === 'auto' ? 'Auto Mode Process' : 'Manual Mode Process'} - {battleType === 'prompt' ? 'Prompt Battle' : 'Response Battle'}
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              {battleMode === 'auto' && battleType === 'prompt' ? (
                <>
                  <p>1. AI analyzes your prompt and selects models skilled in prompt engineering</p>
                  <p>2. Models iteratively refine and improve your prompt across multiple rounds</p>
                  <p>3. Each round produces clearer, more specific, and more effective prompts</p>
                  <p>4. Battle continues until a 10/10 prompt quality is achieved</p>
                </>
              ) : battleMode === 'auto' && battleType === 'response' ? (
                <>
                  <p>1. AI analyzes your prompt and category to select optimal models</p>
                  <p>2. Models compete in iterative rounds, improving responses each time</p>
                  <p>3. Battle continues until a 10/10 score is achieved or no improvement</p>
                  <p>4. Winner declared with detailed round-by-round analysis</p>
                </>
              ) : battleMode === 'manual' && battleType === 'prompt' ? (
                <>
                  <p>1. You manually select 2-3 models and configure prompt refinement settings</p>
                  <p>2. Models generate improved versions of your prompt based on specifications</p>
                  <p>3. AI judge evaluates prompt quality across clarity, specificity, and effectiveness</p>
                  <p>4. Best refined prompt declared winner with detailed improvement analysis</p>
                </>
              ) : (
                <>
                  <p>1. You manually select 2-3 models and configure battle settings</p>
                  <p>2. Models generate responses based on your specifications</p>
                  <p>3. AI judge evaluates all responses across multiple criteria</p>
                  <p>4. Winner declared with detailed scoring breakdown</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <GroqApiKeyModal 
        isOpen={showApiKeyModal} 
        onClose={() => setShowApiKeyModal(false)}
        onSuccess={() => {
          setShowApiKeyModal(false);
          handleRunBattle();
        }}
      />
    </div>
  );
}