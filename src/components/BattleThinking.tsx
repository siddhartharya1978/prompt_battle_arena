import React, { useState } from 'react';
import { 
  Brain, 
  Zap, 
  Target, 
  CheckCircle, 
  Clock, 
  Eye, 
  EyeOff,
  ChevronDown,
  ChevronUp,
  Activity,
  Sparkles
} from 'lucide-react';
import { BattleProgress } from '../lib/battle-progress';

interface BattleThinkingProps {
  progress: BattleProgress;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export default function BattleThinking({ progress, isVisible, onToggleVisibility }: BattleThinkingProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['current']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const getPhaseIcon = (phase: string) => {
    if (phase.includes('Initialization')) return <Sparkles className="w-4 h-4" />;
    if (phase.includes('Model Selection')) return <Brain className="w-4 h-4" />;
    if (phase.includes('Generation') || phase.includes('Competition')) return <Zap className="w-4 h-4" />;
    if (phase.includes('Judging') || phase.includes('Evaluation')) return <Target className="w-4 h-4" />;
    if (phase.includes('Completed')) return <CheckCircle className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'running': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'failed': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Battle Thinking Process
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Watch AI models compete in real-time
              </p>
            </div>
          </div>
          <button
            onClick={onToggleVisibility}
            className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{isVisible ? 'Hide' : 'Show'} Thinking</span>
          </button>
        </div>
      </div>

      {isVisible && (
        <div className="p-6 space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getPhaseIcon(progress.phase)}
                <span className="font-medium text-gray-900 dark:text-white">
                  {progress.phase}
                </span>
                {progress.subPhase && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    → {progress.subPhase}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {progress.progress}%
                </span>
                {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>~{progress.estimatedTimeRemaining}s</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{ width: `${progress.progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {progress.details}
            </p>
          </div>

          {/* Round Information */}
          {progress.currentRound && progress.totalRounds && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Round {progress.currentRound} of {progress.totalRounds}
                </span>
                <div className="flex space-x-1">
                  {Array.from({ length: progress.totalRounds }, (_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < progress.currentRound 
                          ? 'bg-blue-600' 
                          : i === progress.currentRound - 1
                          ? 'bg-blue-400 animate-pulse'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Model Status */}
          {Object.keys(progress.modelStatus).length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('models')}
                className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  Model Status ({Object.keys(progress.modelStatus).length} models)
                </span>
                {expandedSections.has('models') ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </button>
              
              {expandedSections.has('models') && (
                <div className="mt-3 space-y-2">
                  {Object.entries(progress.modelStatus).map(([modelId, status]) => {
                    const modelProgress = progress.modelProgress[modelId] || 0;
                    return (
                      <div key={modelId} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {modelId.split('/').pop() || modelId}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getModelStatusColor(status)}`}>
                            {status}
                          </span>
                        </div>
                        {status === 'running' && (
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${modelProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Success Messages */}
          {progress.successMessages.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('success')}
                className="flex items-center justify-between w-full p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <span className="font-medium text-green-900 dark:text-green-100">
                  Success Log ({progress.successMessages.length})
                </span>
                {expandedSections.has('success') ? 
                  <ChevronUp className="w-4 h-4 text-green-600" /> : 
                  <ChevronDown className="w-4 h-4 text-green-600" />
                }
              </button>
              
              {expandedSections.has('success') && (
                <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                  {progress.successMessages.slice(-5).map((message, index) => (
                    <div key={index} className="flex items-start space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-green-700 dark:text-green-300">{message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Warnings */}
          {progress.warnings.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('warnings')}
                className="flex items-center justify-between w-full p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
              >
                <span className="font-medium text-yellow-900 dark:text-yellow-100">
                  Warnings ({progress.warnings.length})
                </span>
                {expandedSections.has('warnings') ? 
                  <ChevronUp className="w-4 h-4 text-yellow-600" /> : 
                  <ChevronDown className="w-4 h-4 text-yellow-600" />
                }
              </button>
              
              {expandedSections.has('warnings') && (
                <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                  {progress.warnings.slice(-3).map((warning, index) => (
                    <div key={index} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm text-yellow-700 dark:text-yellow-300">
                      ⚠️ {warning}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Errors */}
          {progress.errors.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection('errors')}
                className="flex items-center justify-between w-full p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <span className="font-medium text-red-900 dark:text-red-100">
                  Issues ({progress.errors.length})
                </span>
                {expandedSections.has('errors') ? 
                  <ChevronUp className="w-4 h-4 text-red-600" /> : 
                  <ChevronDown className="w-4 h-4 text-red-600" />
                }
              </button>
              
              {expandedSections.has('errors') && (
                <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                  {progress.errors.slice(-3).map((error, index) => (
                    <div key={index} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                      🚨 {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {Math.round((Date.now() - progress.totalStartTime) / 1000)}s
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Elapsed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {progress.estimatedTimeRemaining || 0}s
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Remaining</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}