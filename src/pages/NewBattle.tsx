import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBattle } from '../contexts/BattleContext';
import { AVAILABLE_MODELS, selectOptimalModels } from '../lib/models';
import ModelCard from '../components/ModelCard';
import BattleThinking from '../components/BattleThinking';
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
  Activity,
  Info,
  Shuffle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewBattle() {
  const { user, incrementBattleUsage } = useAuth();
  const { createBattle, battleProgress } = useBattle();
  const navigate = useNavigate();
  const location = useLocation();

  // Battle configuration state
  const [battleType, setBattleType] = useState<'prompt' | 'response'>('response');
  const [battleMode, setBattleMode] = useState<'auto' | 'manual'>('auto');
  const [prompt, setPrompt] = useState('');
  const [promptCategory, setPromptCategory] = useState('general');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [autoSelectionReason, setAutoSelectionReason] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showThinking, setShowThinking] = useState(true);

  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxTokens, setMaxTokens] = useState(500);
  const [temperature, setTemperature] = useState(0.7);
  const [rounds, setRounds] = useState(1);

  // Pre-populate from navigation state
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.battleType) setBattleType(state.battleType);
      if (state.prompt) setPrompt(state.prompt);
      if (state.category) setPromptCategory(state.category);
      if (state.battleMode) setBattleMode(state.battleMode);
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const categories = [
    'general', 'creative', 'technical', 'analysis', 
    'summary', 'explanation', 'math', 'research'
  ];

  const availableModels = AVAILABLE_MODELS.filter(m => m.available);

  // Auto-select models based on prompt and category
  const autoSelectModels = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first for intelligent model selection');
      return;
    }
    
    try {
      const result = selectOptimalModels(prompt, promptCategory, battleType, 2);
      setSelectedModels(result.selected);
      setAutoSelectionReason(result.rationale);
      
      const modelNames = result.selected.map(id => {
        const model = AVAILABLE_MODELS.find(m => m.id === id);
        return model?.name || id;
      });
      
      toast.success(`🎯 Auto-selected: ${modelNames.join(' vs ')}`);
    } catch (error) {
      toast.error('Auto-selection failed. Please select models manually.');
      console.error('Auto-selection error:', error);
    }
  };

  const toggleModelSelection = (modelId: string) => {
    setSelectedModels(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else if (prev.length < 2) {
        return [...prev, modelId];
      } else {
        // Replace the first model if already at limit
        return [prev[1], modelId];
      }
    });
  };

  const canCreateBattle = () => {
    if (!prompt.trim() || prompt.trim().length < 10) return false;
    if (battleMode === 'manual' && selectedModels.length < 2) return false;
    if (user?.plan === 'free' && user.battlesUsed >= user.battlesLimit) return false;
    return true;
  };

  const getDisabledButtonTooltip = () => {
    if (!prompt.trim()) return "Please enter a prompt";
    if (prompt.trim().length < 10) return "Prompt must be at least 10 characters long";
    if (battleMode === 'manual' && selectedModels.length < 2) return "Please select exactly 2 models";
    if (user?.plan === 'free' && user.battlesUsed >= user.battlesLimit) return "Daily battle limit reached. Upgrade for unlimited battles!";
    if (isCreating) return "Battle is already being created...";
    return "";
  };

  const handleCreateBattle = async () => {
    if (!user) {
      toast.error('Please log in to create battles');
      return;
    }

    if (!canCreateBattle()) {
      toast.error(getDisabledButtonTooltip());
      return;
    }

    setIsCreating(true);

    try {
      let finalModels = selectedModels;
      let finalReason = autoSelectionReason;

      // Auto-select models if in auto mode
      if (battleMode === 'auto') {
        const result = selectOptimalModels(prompt, promptCategory, battleType, 2);
        finalModels = result.selected;
        finalReason = result.rationale;
      }

      const battleData = {
        battle_type: battleType,
        prompt: prompt.trim(),
        prompt_category: promptCategory,
        models: finalModels,
        mode: 'standard' as const,
        battle_mode: battleMode,
        rounds: battleType === 'prompt' ? 10 : rounds,
        max_tokens: maxTokens,
        temperature,
        auto_selection_reason: battleMode === 'auto' ? finalReason : undefined
      };

      const battle = await createBattle(battleData);
      
      // Increment usage after successful battle
      await incrementBattleUsage();
      
      // Navigate to results
      navigate(`/battle/${battle.id}/results`);
      
    } catch (error) {
      console.error('Battle creation error:', error);
      toast.error(`Battle failed: ${error.message}`);
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
            Pit AI models against each other and discover which one excels at your prompt
          </p>
        </div>

        {/* Usage Status */}
        {user && user.plan === 'free' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-blue-900 dark:text-blue-100 font-medium">
                  Daily Usage: {user.battlesUsed}/{user.battlesLimit} battles
                </span>
              </div>
              {user.battlesUsed >= user.battlesLimit ? (
                <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Limit reached</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">{user.battlesLimit - user.battlesUsed} remaining</span>
                </div>
              )}
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(user.battlesUsed / user.battlesLimit) * 100}%` }}
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
                  <Edit3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Prompt Battle
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Models compete to improve and refine your prompt itself. Watch your prompt evolve through iterative AI refinement.
                </p>
                <div className="flex items-center space-x-2 text-xs text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Perfect for prompt engineering</span>
                </div>
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
                  <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Response Battle
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Models compete to generate the best response to your prompt. Compare creativity, accuracy, and reasoning.
                </p>
                <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                  <Target className="w-3 h-3" />
                  <span>Perfect for content generation</span>
                </div>
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
                  <Brain className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Auto Mode
                  </h3>
                  <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  AI automatically selects the best 2 models for your prompt and runs optimal battles.
                </p>
                <div className="flex items-center space-x-2 text-xs text-green-600 dark:text-green-400">
                  <Lightbulb className="w-3 h-3" />
                  <span>Smart model selection + iterative improvement</span>
                </div>
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
                  <Hand className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Manual Mode
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  You choose exactly 2 models and control all battle parameters for precise comparisons.
                </p>
                <div className="flex items-center space-x-2 text-xs text-purple-600 dark:text-purple-400">
                  <Settings className="w-3 h-3" />
                  <span>Full control over model selection</span>
                </div>
              </button>
            </div>
          </div>

          {/* Prompt Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Configure Your {battleType === 'prompt' ? 'Prompt to Refine' : 'Prompt'}
            </h2>
            
            {/* Category Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={promptCategory}
                onChange={(e) => setPromptCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {battleType === 'prompt' ? 'Prompt to Improve' : 'Your Prompt'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  battleType === 'prompt' 
                    ? "Enter your prompt that needs improvement. AI models will take turns refining it until it's perfect..."
                    : "Enter your prompt. AI models will compete to generate the best response..."
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
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                4. Select Models ({selectedModels.length}/2)
              </h2>
              {battleMode === 'auto' && (
                <button
                  onClick={autoSelectModels}
                  disabled={!prompt.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Brain className="w-4 h-4" />
                  <span>Auto-Select Optimal Models</span>
                </button>
              )}
              {battleMode === 'manual' && (
                <button
                  onClick={() => setSelectedModels([])}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Clear Selection</span>
                </button>
              )}
            </div>

            {/* Auto Selection Reasoning */}
            {battleMode === 'auto' && autoSelectionReason && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                      AI Selection Reasoning:
                    </h4>
                    <div className="text-sm text-green-700 dark:text-green-300 whitespace-pre-line">
                      {autoSelectionReason}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Model Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={selectedModels.includes(model.id)}
                  onToggle={() => toggleModelSelection(model.id)}
                  showSelection={battleMode === 'manual'}
                  compact={true}
                />
              ))}
            </div>

            {/* Selection Status */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Selected Models: {selectedModels.length}/2
                </span>
                {selectedModels.length === 2 && (
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Ready for battle!</span>
                  </div>
                )}
              </div>
              
              {selectedModels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedModels.map(modelId => {
                    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
                    return (
                      <div key={modelId} className="flex items-center space-x-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                        <span>{model?.icon}</span>
                        <span>{model?.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full mb-4"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                5. Advanced Settings (Optional)
              </h2>
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-gray-400" />
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAdvanced && (
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 500)}
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
                    onChange={(e) => setTemperature(parseFloat(e.target.value) || 0.7)}
                    min="0"
                    max="2"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {battleType === 'response' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rounds
                    </label>
                    <input
                      type="number"
                      value={rounds}
                      onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
                      min="1"
                      max="3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Battle Thinking Interface */}
          {battleProgress && (
            <BattleThinking
              progress={battleProgress}
              isVisible={showThinking}
              onToggleVisibility={() => setShowThinking(!showThinking)}
            />
          )}

          {/* Create Battle Button */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="text-center">
              <button
                onClick={handleCreateBattle}
                disabled={!canCreateBattle() || isCreating}
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
              >
                {isCreating ? (
                  <>
                    <Activity className="w-5 h-5 animate-pulse" />
                    <span>
                      {battleProgress?.step || 'Starting Battle...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>
                      Start {battleType === 'prompt' ? 'Prompt Refinement' : 'Response'} Battle
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              {!canCreateBattle() && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {getDisabledButtonTooltip()}
                </p>
              )}

              {battleMode === 'auto' && prompt.trim() && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  AI will select the optimal 2 models for your prompt
                </p>
              )}

              {battleMode === 'manual' && selectedModels.length === 2 && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Ready to battle: {selectedModels.map(id => AVAILABLE_MODELS.find(m => m.id === id)?.name).join(' vs ')}
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