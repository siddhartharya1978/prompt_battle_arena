import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBattle } from '../contexts/BattleContext';
import { Battle, BattleScore } from '../types';
import Navigation from '../components/Navigation';
import FeedbackWidget from '../components/FeedbackWidget';
import { 
  Trophy, 
  Star, 
  Users, 
  Clock, 
  DollarSign,
  Copy,
  Share2,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Target,
  Brain,
  Hand,
  Edit3,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Zap,
  Crown,
  ArrowLeft,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BattleResults() {
  const { id } = useParams<{ id: string }>();
  const { getBattle, models } = useBattle();
  const navigate = useNavigate();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllRounds, setShowAllRounds] = useState(false);
  const [showPeerReviews, setShowPeerReviews] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    const loadBattle = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        // Try to get battle from context first
        let battleData = getBattle(id);
        
        // If not found, try demo data
        if (!battleData) {
          const demoCache = JSON.parse(localStorage.getItem('demo_battles') || '[]');
          battleData = demoCache.find((b: Battle) => b.id === id);
        }
        
        // If still not found, create demo battle for battle_1
        if (!battleData && id === 'battle_1') {
          battleData = createDemoBattle();
        }

        setBattle(battleData || null);
      } catch (error) {
        console.error('Error loading battle:', error);
        toast.error('Failed to load battle results');
      } finally {
        setLoading(false);
      }
    };

    loadBattle();
  }, [id, getBattle]);

  const createDemoBattle = (): Battle => {
    return {
      id: 'battle_1',
      userId: 'demo-user',
      battleType: 'response',
      prompt: 'Explain artificial intelligence in simple terms that a 10-year-old could understand',
      finalPrompt: null,
      promptCategory: 'explanation',
      models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b'],
      mode: 'standard',
      battleMode: 'auto',
      rounds: 1,
      maxTokens: 500,
      temperature: 0.7,
      status: 'completed',
      winner: 'llama-3.3-70b-versatile',
      totalCost: 0.0234,
      autoSelectionReason: 'Selected models based on explanation task: Llama 3.1 8B for speed, Llama 3.3 70B for reasoning depth, and DeepSeek R1 for technical accuracy.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [
        {
          id: 'resp_1',
          battleId: 'battle_1',
          modelId: 'llama-3.1-8b-instant',
          response: 'Think of AI like a really smart robot brain! It\'s a computer program that can learn things, just like how you learn to ride a bike or do math. The computer looks at lots of examples and figures out patterns, then uses those patterns to help people with tasks like answering questions, recognizing pictures, or even playing games. It\'s like having a super-fast student that never gets tired of learning!',
          latency: 1200,
          tokens: 89,
          cost: 0.0045,
          createdAt: new Date().toISOString()
        },
        {
          id: 'resp_2',
          battleId: 'battle_1',
          modelId: 'llama-3.3-70b-versatile',
          response: 'Imagine AI as a super-smart computer friend that loves to learn! Just like how you learn by watching, listening, and practicing, AI learns by looking at millions of examples. For instance, to recognize cats in photos, it studies thousands of cat pictures until it becomes an expert. AI can help doctors find diseases, help cars drive safely, and even help you find the perfect movie to watch. It\'s like having a brilliant assistant that gets smarter every day and wants to help make life easier for everyone!',
          latency: 1800,
          tokens: 112,
          cost: 0.0302,
          createdAt: new Date().toISOString()
        },
        {
          id: 'resp_3',
          battleId: 'battle_1',
          modelId: 'deepseek-r1-distill-llama-70b',
          response: 'AI is like teaching a computer to think and solve problems, similar to how your brain works! The computer studies lots of information and examples to learn patterns - like how you learned that clouds often mean rain is coming. Once it learns these patterns, it can help with many tasks: translating languages, suggesting what to watch on TV, or helping scientists discover new medicines. It\'s basically a very powerful tool that helps humans do things faster and better!',
          latency: 2100,
          tokens: 95,
          cost: 0.0257,
          createdAt: new Date().toISOString()
        }
      ],
      scores: {
        'llama-3.1-8b-instant': {
          accuracy: 8.2,
          reasoning: 7.8,
          structure: 8.5,
          creativity: 8.0,
          overall: 8.1,
          notes: 'Clear and engaging explanation with good analogies. Could be more comprehensive.'
        },
        'llama-3.3-70b-versatile': {
          accuracy: 9.1,
          reasoning: 9.3,
          structure: 9.0,
          creativity: 9.2,
          overall: 9.2,
          notes: 'Excellent explanation with perfect balance of simplicity and comprehensiveness. Great real-world examples.'
        },
        'deepseek-r1-distill-llama-70b': {
          accuracy: 8.8,
          reasoning: 8.6,
          structure: 8.4,
          creativity: 8.1,
          overall: 8.5,
          notes: 'Solid technical accuracy with good analogies. Well-structured response.'
        }
      }
    };
  };

  const getModelInfo = (modelId: string) => {
    return models.find(m => m.id === modelId) || { name: modelId, icon: '🤖', provider: 'Unknown' };
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `AI Battle Results - ${battle?.battleType === 'prompt' ? 'Prompt' : 'Response'} Battle`,
      text: `Check out this AI battle result: "${battle?.prompt}"`,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await handleCopy(window.location.href, 'Battle link');
      }
    } catch (error) {
      // Fallback to copying link
      await handleCopy(window.location.href, 'Battle link');
    }
  };

  const handleExport = () => {
    if (!battle) return;

    const exportData = {
      battle: {
        id: battle.id,
        type: battle.battleType,
        prompt: battle.prompt,
        finalPrompt: battle.finalPrompt,
        category: battle.promptCategory,
        models: battle.models,
        winner: battle.winner,
        createdAt: battle.createdAt
      },
      responses: battle.responses,
      scores: battle.scores,
      promptEvolution: battle.promptEvolution || []
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battle-${battle.id}-results.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Battle results exported!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Loading battle results...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Battle Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The battle you're looking for doesn't exist or has been removed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/battle/new"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Target className="w-4 h-4 mr-2" />
                Create New Battle
              </Link>
              <Link
                to="/history"
                className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Clock className="w-4 h-4 mr-2" />
                View History
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const winner = battle.winner ? getModelInfo(battle.winner) : null;
  const winnerScore = battle.winner && battle.scores ? battle.scores[battle.winner] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                battle.battleType === 'prompt'
                  ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                  : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
              }`}>
                {battle.battleType === 'prompt' ? (
                  <Edit3 className="w-4 h-4" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                <span>{battle.battleType === 'prompt' ? 'Prompt' : 'Response'} Battle</span>
              </div>
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${
                battle.battleMode === 'auto'
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
              }`}>
                {battle.battleMode === 'auto' ? (
                  <Brain className="w-4 h-4" />
                ) : (
                  <Hand className="w-4 h-4" />
                )}
                <span>{battle.battleMode} mode</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                battle.status === 'completed' 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : battle.status === 'running'
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                  : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}>
                {battle.status}
              </span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Battle Results
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {battle.createdAt ? new Date(battle.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Kolkata'
            }) + ' IST' : 'Unknown date'}
          </p>
        </div>

        {/* Winner Announcement */}
        {battle.status === 'completed' && winner && winnerScore && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-8 mb-8 border border-yellow-200 dark:border-yellow-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🏆 {battle.battleType === 'prompt' ? 'Best Refinement' : 'Winner'}: {winner.name}
              </h2>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {winnerScore.overall}/10
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
                  <DollarSign className="w-4 h-4" />
                  <span>₹{battle.totalCost.toFixed(4)}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
                  <Users className="w-4 h-4" />
                  <span>{battle.models.length} models</span>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                {winnerScore.notes}
              </p>
            </div>
          </div>
        )}

        {/* Prompt Display */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {battle.battleType === 'prompt' ? 'Original Prompt' : 'Battle Prompt'}
            </h3>
            <button
              onClick={() => handleCopy(battle.prompt, 'Prompt')}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm">{copiedText === 'Prompt' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <p className="text-gray-900 dark:text-white leading-relaxed">
              "{battle.prompt}"
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="capitalize">Category: {battle.promptCategory}</span>
            <span>•</span>
            <span>{battle.rounds} {battle.rounds === 1 ? 'round' : 'rounds'}</span>
            <span>•</span>
            <span>Max tokens: {battle.maxTokens}</span>
            <span>•</span>
            <span>Temperature: {battle.temperature}</span>
          </div>
        </div>

        {/* Final Prompt (for prompt battles) */}
        {battle.battleType === 'prompt' && battle.finalPrompt && battle.finalPrompt !== battle.prompt && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Final Optimized Prompt
                </h3>
                <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  <span>Optimized</span>
                </div>
              </div>
              <button
                onClick={() => handleCopy(battle.finalPrompt!, 'Final Prompt')}
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm">{copiedText === 'Final Prompt' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
              <p className="text-gray-900 dark:text-white leading-relaxed">
                "{battle.finalPrompt}"
              </p>
            </div>
          </div>
        )}

        {/* Auto Selection Reasoning */}
        {battle.battleMode === 'auto' && battle.autoSelectionReason && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Intelligent Model Selection
              </h3>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
              <pre className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap font-mono">
                {battle.autoSelectionReason}
              </pre>
            </div>
          </div>
        )}

        {/* Model Responses */}
        {battle.responses && battle.responses.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Model Responses & Scores
            </h3>
            <div className="space-y-6">
              {battle.responses
                .sort((a, b) => {
                  const scoreA = battle.scores[a.modelId]?.overall || 0;
                  const scoreB = battle.scores[b.modelId]?.overall || 0;
                  return scoreB - scoreA;
                })
                .map((response, index) => {
                  const model = getModelInfo(response.modelId);
                  const score = battle.scores[response.modelId];
                  const isWinner = response.modelId === battle.winner;

                  return (
                    <div
                      key={response.id}
                      className={`border-2 rounded-xl p-6 transition-all ${
                        isWinner
                          ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{model.icon}</span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {model.name}
                              </h4>
                              {isWinner && (
                                <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">
                                  <Trophy className="w-3 h-3" />
                                  <span>Winner</span>
                                </div>
                              )}
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                #{index + 1}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {model.provider}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(response.response, `${model.name} response`)}
                          className="flex items-center space-x-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          <span className="text-sm">{copiedText === `${model.name} response` ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
                        <p className="text-gray-900 dark:text-white leading-relaxed">
                          {response.response}
                        </p>
                      </div>

                      {score && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {score.accuracy}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Accuracy</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {score.reasoning}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Reasoning</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {score.structure}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Structure</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {score.creativity}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Creativity</div>
                          </div>
                          <div className="text-center">
                            <div className={`text-xl font-bold ${
                              isWinner ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              {score.overall}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Overall</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{response.latency}ms</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="w-4 h-4" />
                            <span>{response.tokens} tokens</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>₹{response.cost.toFixed(4)}</span>
                          </div>
                        </div>
                      </div>

                      {score?.notes && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Judge's Notes:</strong> {score.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Prompt Evolution (for prompt battles) */}
        {battle.battleType === 'prompt' && battle.promptEvolution && battle.promptEvolution.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Prompt Evolution ({battle.promptEvolution.length} rounds)
              </h3>
              <button
                onClick={() => setShowAllRounds(!showAllRounds)}
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <span className="text-sm">{showAllRounds ? 'Hide' : 'Show'} All Rounds</span>
                {showAllRounds ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-4">
              {(showAllRounds ? battle.promptEvolution : battle.promptEvolution.slice(-3)).map((evolution, index) => {
                const model = getModelInfo(evolution.modelId);
                const isLatest = index === battle.promptEvolution!.length - 1;

                return (
                  <div
                    key={evolution.id}
                    className={`border-l-4 pl-6 pb-6 ${
                      isLatest
                        ? 'border-green-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Round {evolution.round}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          by {model.name}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {evolution.score}/10
                          </span>
                        </div>
                        {isLatest && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                            Final
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopy(evolution.prompt, `Round ${evolution.round} prompt`)}
                        className="flex items-center space-x-1 px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-xs transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedText === `Round ${evolution.round} prompt` ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-900 dark:text-white">
                        "{evolution.prompt}"
                      </p>
                    </div>

                    {evolution.improvements && evolution.improvements.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {evolution.improvements.map((improvement, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs"
                          >
                            {improvement}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Battle</span>
            </button>
            
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Results</span>
            </button>

            <Link
              to="/battle/new"
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Target className="w-4 h-4" />
              <span>New Battle</span>
            </Link>

            <Link
              to="/history"
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>View History</span>
            </Link>
          </div>
        </div>
      </div>

      <FeedbackWidget />
    </div>
  );
}