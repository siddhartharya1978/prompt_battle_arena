import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ModelCard from '../components/ModelCard';
import { simpleBattleEngine, SimpleBattleResult } from '../lib/simple-battle';
import { AVAILABLE_MODELS } from '../lib/models';
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

export default function NewBattle() {
  const { user, incrementBattleUsage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Battle configuration state
  const [battleType, setBattleType] = useState<'prompt' | 'response'>('response');
  const [battleMode, setBattleMode] = useState<'auto' | 'manual'>('auto');
  const [prompt, setPrompt] = useState('');
  const [promptCategory, setPromptCategory] = useState('general');
  const [selectedPair, setSelectedPair] = useState<[string, string]>(['llama-3.1-8b-instant', 'llama-3.3-70b-versatile']);
  const [isCreating, setIsCreating] = useState(false);
  const [battleProgress, setBattleProgress] = useState<{step: string, progress: number} | null>(null);
  const [battleResult, setBattleResult] = useState<SimpleBattleResult | null>(null);

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

  // Auto-select models based on category and battle type
  const autoSelectModels = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first for intelligent model selection');
      return;
    }
    
    const pair = simpleBattleEngine.selectBestPair(prompt, promptCategory);
    setSelectedPair(pair);
    
    const modelA = getModelInfo(pair[0]);
    const modelB = getModelInfo(pair[1]);
    toast.success(`🎯 Selected: ${modelA.name} vs ${modelB.name}`);
  };

  const getModelInfo = (modelId: string) => {
    return AVAILABLE_MODELS.find(m => m.id === modelId) || { name: modelId, icon: '🤖' };
  };

  const canCreateBattle = () => {
    return prompt.trim().length >= 10;
  };

  const getDisabledButtonTooltip = () => {
    if (prompt.trim().length === 0) return "Please enter a prompt";
    if (prompt.trim().length < 10) return "Prompt must be at least 10 characters long";
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

    setIsCreating(true);
    setBattleResult(null);

    try {
      const result = await simpleBattleEngine.runBattle(
        prompt.trim(),
        promptCategory,
        (step, progress) => {
          setBattleProgress({ step, progress });
        }
      );
      
      setBattleResult(result);
      setBattleProgress(null);
      await incrementBattleUsage();
      
      toast.success(`🏆 ${result.winner === 'A' ? result.modelA.name : result.modelB.name} wins!`);
      
    } catch (error) {
      console.error('Battle execution error:', error);
      toast.error('Battle failed - please try again');
    } finally {
      setIsCreating(false);
      setBattleProgress(null);
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
              1. Battle Type (Response Battle Only)
            </h2>
            <div className="p-6 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center space-x-3 mb-3">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Response Battle
                </h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Two AI models compete to generate the best response to your prompt. Fast, simple, and reliable.
              </p>
            </div>
          </div>

          {/* Battle Mode Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Auto-Selected Models
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {selectedPair.map((modelId, index) => {
                const model = getModelInfo(modelId);
                return (
                  <div key={modelId} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{model.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{model.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {index === 0 ? 'Challenger A' : 'Challenger B'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 flex justify-center">
              <button
                onClick={autoSelectModels}
                disabled={!prompt.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Brain className="w-4 h-4" />
                <span>Auto-Select Best Pair</span>
              </button>
            </div>
          </div>

          {/* Prompt Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Enter Your Prompt
            </h2>
            
            {/* Prompt Input */}
            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt for AI models to respond to..."
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
          </div>

          {/* Battle Progress */}
          {battleProgress && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Battle in Progress
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-700 dark:text-gray-300">{battleProgress.step}</span>
                    <span className="text-gray-600 dark:text-gray-400">{battleProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${battleProgress.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Battle Results */}
          {battleResult && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                🏆 Battle Results
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Model A */}
                <div className={`p-4 rounded-xl border-2 ${
                  battleResult.winner === 'A' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-600'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-2xl">{getModelInfo(battleResult.modelA.id).icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {battleResult.modelA.name}
                        {battleResult.winner === 'A' && <span className="ml-2">🏆</span>}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Score: {battleResult.modelA.score.toFixed(1)}/10
                      </p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {battleResult.modelA.response}
                    </p>
                  </div>
                </div>

                {/* Model B */}
                <div className={`p-4 rounded-xl border-2 ${
                  battleResult.winner === 'B' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-600'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-2xl">{getModelInfo(battleResult.modelB.id).icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {battleResult.modelB.name}
                        {battleResult.winner === 'B' && <span className="ml-2">🏆</span>}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Score: {battleResult.modelB.score.toFixed(1)}/10
                      </p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {battleResult.modelB.response}
                    </p>
                  </div>
                </div>
              </div>

              {/* Winner Reasoning */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  🎯 Why {battleResult.winner === 'A' ? battleResult.modelA.name : battleResult.modelB.name} Won:
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {battleResult.reasoning}
                </p>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={() => {
                    setBattleResult(null);
                    setPrompt('');
                  }}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start New Battle
                </button>
              </div>
            </div>
          )}

          {/* Create Battle Button */}
          {!battleResult && (
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
                    <span>Start Battle: {getModelInfo(selectedPair[0]).name} vs {getModelInfo(selectedPair[1]).name}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
              
              {!canCreateBattle() && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {getDisabledButtonTooltip()}
                </p>
              )}
            </div>
            </div>
          )}
        </div>
      </div>

      <FeedbackWidget />
    </div>
  );
}