import React, { useState } from 'react';
import { 
  Brain, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Eye, 
  EyeOff,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { IterativeRound } from '../lib/iterative-battle';

interface IterativeThinkingProps {
  rounds: IterativeRound[];
  currentStep: string;
  progress: number;
  isVisible: boolean;
  onToggleVisibility: () => void;
  modelA: string;
  modelB: string;
}

export default function IterativeThinking({ 
  rounds, 
  currentStep, 
  progress, 
  isVisible, 
  onToggleVisibility,
  modelA,
  modelB 
}: IterativeThinkingProps) {
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([rounds.length]));

  const toggleRound = (roundNumber: number) => {
    setExpandedRounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roundNumber)) {
        newSet.delete(roundNumber);
      } else {
        newSet.add(roundNumber);
      }
      return newSet;
    });
  };

  const getModelName = (modelId: string): string => {
    const models: Record<string, string> = {
      'llama-3.1-8b-instant': 'Llama 3.1 8B',
      'llama-3.3-70b-versatile': 'Llama 3.3 70B',
      'deepseek-r1-distill-llama-70b': 'DeepSeek R1',
      'qwen/qwen3-32b': 'Qwen 3 32B'
    };
    return models[modelId] || modelId;
  };

  const getScoreColor = (score: number) => {
    if (score >= 10) return 'text-green-600 dark:text-green-400';
    if (score >= 8) return 'text-blue-600 dark:text-blue-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 10) return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
    if (score >= 8) return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
    if (score >= 6) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
    return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Iterative Prompt Refinement
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {getModelName(modelA)} ↔ {getModelName(modelB)} taking turns to improve
              </p>
            </div>
          </div>
          <button
            onClick={onToggleVisibility}
            className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{isVisible ? 'Hide' : 'Show'} Process</span>
          </button>
        </div>
      </div>

      {isVisible && (
        <div className="p-6 space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {currentStep}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {progress}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-600 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Rounds History */}
          {rounds.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                Refinement Rounds ({rounds.length})
              </h4>
              
              <div className="space-y-3">
                {rounds.map((round) => (
                  <div key={round.round} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleRound(round.round)}
                      className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Round {round.round}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {getModelName(round.improverModel)} → {getModelName(round.reviewerModel)}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBadge(round.reviewerScore)}`}>
                            {round.reviewerScore}/10
                          </span>
                          {round.consensusAchieved && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                              🎯 Perfect!
                            </span>
                          )}
                          {round.isImprovement && !round.consensusAchieved && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                              ✅ Improved
                            </span>
                          )}
                        </div>
                        {expandedRounds.has(round.round) ? 
                          <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        }
                      </div>
                    </button>
                    
                    {expandedRounds.has(round.round) && (
                      <div className="p-4 border-t border-gray-200 dark:border-gray-600 space-y-4">
                        {/* AI Thinking Process */}
                        {round.improverModel && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {getModelName(round.improverModel)}'s Thinking:
                            </h5>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                              <p className="text-sm text-blue-900 dark:text-blue-100 italic">
                                {round.improverThinking || 'Thinking process not captured'}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Improved Prompt */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getModelName(round.improverModel)}'s Improvement:
                          </h5>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                            <p className="text-sm text-green-900 dark:text-green-100">
                              "{round.improvedPrompt}"
                            </p>
                          </div>
                        </div>
                        
                        {/* Reviewer Thinking */}
                        {round.reviewerThinking && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {getModelName(round.reviewerModel)}'s Analysis:
                            </h5>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                              <p className="text-sm text-purple-900 dark:text-purple-100 italic">
                                {round.reviewerThinking}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Review Score & Feedback */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {getModelName(round.reviewerModel)}'s Review:
                          </h5>
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`font-medium ${getScoreColor(round.reviewerScore)}`}>
                                Score: {round.reviewerScore}/10
                              </span>
                              {round.consensusAchieved && <Target className="w-4 h-4 text-green-500" />}
                              {round.isImprovement && !round.consensusAchieved && <TrendingUp className="w-4 h-4 text-blue-500" />}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {round.reviewerFeedback}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Battle Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {rounds.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Rounds</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {rounds.filter(r => r.isImprovement).length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Improvements</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {rounds.length > 0 ? rounds[rounds.length - 1].reviewerScore.toFixed(1) : '0'}/10
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Final Score</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}