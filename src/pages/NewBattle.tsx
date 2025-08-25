import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { iterativePromptBattle, IterativeBattleResult } from '../lib/iterative-battle';
import IterativeThinking from '../components/IterativeThinking';
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
  const [battleProgress, setBattleProgress] = useState<{step: string, progress: number, details?: string} | null>(null);
  const [battleResult, setBattleResult] = useState<IterativeBattleResult | null>(null);
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

  // Auto-select models based on category and battle type
  const autoSelectModels = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first for intelligent model selection');
      return;
    }
    
    // Use the iterative battle engine's selection logic
    const pair = iterativePromptBattle.selectOptimalPair(prompt, promptCategory);
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
      const result = await iterativePromptBattle.runIterativeBattle(
        prompt.trim(),
        promptCategory,
        (step, progress, details) => {
          setBattleProgress({ step, progress, details });
        }
      );
      
      setBattleResult(result);
      setBattleProgress(null);
      await incrementBattleUsage();
      
      if (result.consensusAchieved) {
        toast.success(`🎯 Perfect 10/10 prompt achieved in ${result.totalRounds} rounds!`);
      } else {
        toast.success(`✅ Prompt improved to ${result.finalScore}/10 in ${result.totalRounds} rounds!`);
      }
      
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
            Iterative Prompt Refinement
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Watch two AI models take turns improving your prompt until they both agree it's perfect (10/10)
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
              1. Refinement Type (Prompt Improvement Only)
            </h2>
            <div className="p-6 rounded-xl border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center space-x-3 mb-3">
                <Edit3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Iterative Prompt Refinement
                </h3>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Two AI models take turns improving your prompt until both agree it's perfect (10/10). Just like your manual process!
              </p>
            </div>
          </div>

          {/* Battle Mode Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Refinement Partners
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
                          {index === 0 ? 'Improver A' : 'Improver B'}
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
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Brain className="w-4 h-4" />
                <span>Select Optimal Refinement Pair</span>
              </button>
            </div>
          </div>

          {/* Prompt Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Enter Your Prompt to Refine
            </h2>
            
            {/* Prompt Input */}
            <div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt that needs improvement. The AI models will take turns refining it until it's perfect..."
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

          {/* Iterative Thinking Interface */}
          {(battleProgress || battleResult) && (
            <IterativeThinking
              rounds={battleResult?.rounds || []}
              currentStep={battleProgress?.step || 'Completed'}
              progress={battleProgress?.progress || 100}
              isVisible={showThinking}
              onToggleVisibility={() => setShowThinking(!showThinking)}
              modelA={selectedPair[0]}
              modelB={selectedPair[1]}
            />
          )}

          {/* Final Results */}
          {battleResult && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                🎯 Refinement Complete
              </h3>
              
              {/* Original vs Final Prompt Comparison */}
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Original Prompt */}
                  <div className="p-4 rounded-xl border-2 border-gray-300 dark:border-gray-600">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                      <span>📝 Original Prompt</span>
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        "{battleResult.originalPrompt}"
                      </p>
                    </div>
                  </div>

                  {/* Final Refined Prompt */}
                  <div className={`p-4 rounded-xl border-2 ${
                    battleResult.consensusAchieved 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  }`}>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                      <span>✨ Refined Prompt</span>
                      {battleResult.consensusAchieved && <span>🎯</span>}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        battleResult.consensusAchieved 
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      }`}>
                        {battleResult.finalScore}/10
                      </span>
                    </h4>
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        "{battleResult.finalPrompt}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Battle Summary */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {battleResult.totalRounds}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Rounds</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {battleResult.rounds.filter(r => r.isImprovement).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Improvements</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${
                        battleResult.consensusAchieved ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {battleResult.finalScore}/10
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Final Score</div>
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                <div className={`rounded-lg p-4 border ${
                  battleResult.consensusAchieved 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                }`}>
                <h4 className={`font-medium mb-2 ${
                  battleResult.consensusAchieved 
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-blue-900 dark:text-blue-100'
                }`}>
                  📊 Refinement Analysis:
                </h4>
                <p className={`text-sm ${
                  battleResult.consensusAchieved 
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  {battleResult.reasoning}
                </p>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={() => {
                    setBattleResult(null);
                    setPrompt('');
                    setShowThinking(true);
                  }}
                  className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Refine Another Prompt
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
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
              >
                {isCreating ? (
                  <>
                    <Activity className="w-5 h-5 animate-pulse" />
                    <span>
                      {battleProgress?.step || 'Starting Refinement...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Start Refinement: {getModelInfo(selectedPair[0]).name} ↔ {getModelInfo(selectedPair[1]).name}</span>
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