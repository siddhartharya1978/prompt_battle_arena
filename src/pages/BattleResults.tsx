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
          <div className={`rounded-2xl p-8 mb-8 border ${
            battle.globalConsensus 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700'
              : 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700'
          }`}>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                battle.globalConsensus
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                  : 'bg-gradient-to-br from-yellow-400 to-orange-500'
              }`}>
                <Trophy className="w-8 h-8 text-white" />
              </div>
              
              {battle.globalConsensus && (
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-bold mb-4">
                  <Star className="w-4 h-4 fill-current" />
                  <span>10/10 UN-IMPROVABLE CONSENSUS ACHIEVED</span>
                  <Star className="w-4 h-4 fill-current" />
                </div>
              )}
              
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
              
              {battle.globalConsensus && (
                <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                    🎯 <strong>Perfect Consensus:</strong> All peer models unanimously agreed this {battle.battleType} cannot be meaningfully improved further.
                  </p>
                </div>
              )}
              
              {!battle.globalConsensus && battle.plateauReason && (
                <div className="mt-4 p-4 bg-orange-100 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-700">
                  <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                    📊 <strong>Battle Stopped:</strong> {battle.plateauReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Battle Summary & System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 Battle Summary & System Performance
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Battle Type</div>
              <div className="font-semibold text-blue-900 dark:text-blue-100">
                {battle.battleType === 'prompt' ? 'Prompt Refinement' : 'Response Generation'}
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">Success Rate</div>
              <div className="font-semibold text-green-900 dark:text-green-100">
                {battle.responses ? Math.round((battle.responses.length / battle.models.length) * 100) : 100}%
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Avg Response Time</div>
              <div className="font-semibold text-purple-900 dark:text-purple-100">
                {battle.responses ? Math.round(battle.responses.reduce((sum, r) => sum + r.latency, 0) / battle.responses.length) : 0}ms
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
              <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Total Cost</div>
              <div className="font-semibold text-yellow-900 dark:text-yellow-100">
                ₹{battle.totalCost.toFixed(4)}
              </div>
            </div>
          </div>
          
          {/* System Status & Recommendations */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              🔧 System Performance & Recommendations
            </h4>
            
            <div className="space-y-2">
              {/* Check for fallback usage */}
              {battle.responses && battle.responses.some(r => r.cost < 0.001) && (
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                      Fallback System Used
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Some models used fallback responses due to API issues. Results are still valid but consider retrying for optimal performance.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Performance recommendations */}
              {battle.responses && battle.responses.some(r => r.latency > 5000) && (
                <div className="flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      Slower Response Times Detected
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Some models took longer than usual. Consider using "Turbo" mode for faster results or try during off-peak hours.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Score-based recommendations */}
              {winnerScore && winnerScore.overall < 8.0 && (
                <div className="flex items-start space-x-2">
                  <TrendingUp className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                      Room for Improvement
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      The winning score was {winnerScore.overall}/10. Try refining your prompt or using different models for potentially better results.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Success indicators */}
              {battle.responses && battle.responses.length === battle.models.length && (
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      Perfect Execution
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      All {battle.models.length} models completed successfully with no fallbacks needed. Excellent system performance!
                    </p>
                  </div>
                </div>
              )}
              
              {/* Auto mode specific recommendations */}
              {battle.battleMode === 'auto' && battle.autoSelectionReason && (
                <div className="flex items-start space-x-2">
                  <Brain className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                      Smart Auto-Selection Active
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                      AI automatically selected optimal models for your prompt type. Try Manual mode to compare with different model combinations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
                  🎯 Shareable Prompt Refinement Recap
                </h3>
                {battle.globalConsensus && (
                  <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>10/10 PERFECT</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleCopy(battle.finalPrompt!, 'Final Prompt')}
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm">{copiedText === 'Final Prompt' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
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
                📈 Round-by-Round Prompt Evolution ({battle.promptEvolution.length} rounds)
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
              {(showAllRounds ? battle.promptEvolution : battle.promptEvolution.slice(-5)).map((evolution, index) => {
                const model = getModelInfo(evolution.modelId);
                const isLatest = index === battle.promptEvolution!.length - 1;
                const isInitial = evolution.round === 0;

                return (
                  <div
                    key={evolution.id}
                    className={`border-l-4 pl-6 pb-6 relative ${
                      isLatest && battle.globalConsensus
                        ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10'
                      : isLatest
                        ? 'border-blue-500'
                        : isInitial
                        ? 'border-gray-400'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      {isLatest && battle.globalConsensus && (
                        <div className="absolute -left-2 top-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Star className="w-2 h-2 text-white fill-current" />
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {isInitial ? 'Original Prompt' : `Round ${evolution.round} Champion`}
                        </span>
                        {!isInitial && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            by {model.name}
                          </span>
                        )}
                        {!isInitial && evolution.round > 1 && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                            ← Used as input for Round {evolution.round + 1}
                          </span>
                        )}
                        {evolution.score > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {evolution.score}/10
                            </span>
                          </div>
                        )}
                        {isLatest && battle.globalConsensus && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                            🎯 PERFECT 10/10
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

                    {!isInitial && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 italic">
                        This prompt was the champion of Round {evolution.round} and became the input for the next round's improvements.
                      </p>
                    )}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-3">
                      <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
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
        
        {/* Peer Review Details */}
        {battle.roundResults && battle.roundResults.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🔍 Detailed Peer Reviews & Critiques
              </h3>
              <button
                onClick={() => setShowPeerReviews(!showPeerReviews)}
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <span className="text-sm">{showPeerReviews ? 'Hide' : 'Show'} All Reviews</span>
                {showPeerReviews ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showPeerReviews && (
              <div className="space-y-6">
                {battle.roundResults.map((roundResult: any, roundIndex: number) => (
                  <div key={roundIndex} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Round {roundResult.round} - Peer Reviews
                    </h4>
                    
                    {roundResult.contestants.map((contestant: any) => (
                      <div key={contestant.modelId} className="mb-6 last:mb-0">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {getModelInfo(contestant.modelId).name}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            (Average: {contestant.averageScore}/10)
                          </span>
                          {contestant.modelId === roundResult.champion && (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">
                              Round Champion
                            </span>
                          )}
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          {contestant.peerReviews.map((review: any) => (
                            <div key={review.reviewerId} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  Review by {getModelInfo(review.reviewerId).name}
                                </span>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {review.overallScore}/10
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-2 mb-2 text-xs">
                                <div className="text-center">
                                  <div className="font-medium">{review.scores.clarity}</div>
                                  <div className="text-gray-500 dark:text-gray-400">Clarity</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium">{review.scores.specificity}</div>
                                  <div className="text-gray-500 dark:text-gray-400">Specific</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium">{review.scores.completeness}</div>
                                  <div className="text-gray-500 dark:text-gray-400">Complete</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium">{review.scores.actionability}</div>
                                  <div className="text-gray-500 dark:text-gray-400">Action</div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                                <div className="text-center">
                                  <div className="font-medium">{review.scores.conciseness}</div>
                                  <div className="text-gray-500 dark:text-gray-400">Concise</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium">{review.scores.contextCoverage}</div>
                                  <div className="text-gray-500 dark:text-gray-400">Context</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium">{review.scores.noRedundancy}</div>
                                  <div className="text-gray-500 dark:text-gray-400">No Redund</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium">{review.scores.tailoredToIntent}</div>
                                  <div className="text-gray-500 dark:text-gray-400">Tailored</div>
                                </div>
                              </div>
                              
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                <strong>Critique:</strong> {review.critique}
                              </p>
                              
                              {review.improvements.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Suggested improvements:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {review.improvements.map((improvement, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs">
                                        {improvement}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🎯 Next Steps & Actions
          </h3>
          
          {/* Smart Recommendations */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-700">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
              💡 Smart Recommendations Based on Your Results
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Prompt-specific recommendations */}
              {battle.battleType === 'response' && winnerScore && winnerScore.overall < 9.0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    🔄 Try a Prompt Battle
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                    Your response battle scored {winnerScore.overall}/10. A prompt battle could refine your prompt for even better results.
                  </p>
                  <Link
                    to="/battle/new"
                    state={{ 
                      battleType: 'prompt', 
                      prompt: battle.prompt, 
                      category: battle.promptCategory 
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Refine this prompt →
                  </Link>
                </div>
              )}
              
              {/* Model recommendations */}
              {battle.battleMode === 'manual' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    🧠 Try Auto Mode
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                    You used manual selection. Auto mode might select different models optimized for your specific prompt type.
                  </p>
                  <Link
                    to="/battle/new"
                    state={{ 
                      battleType: battle.battleType, 
                      prompt: battle.finalPrompt || battle.prompt, 
                      category: battle.promptCategory,
                      battleMode: 'auto'
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Try with Auto mode →
                  </Link>
                </div>
              )}
              
              {/* Category recommendations */}
              {battle.promptCategory === 'general' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    🎯 Specify Category
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                    You used "general" category. Specific categories like "creative" or "technical" can improve model selection.
                  </p>
                  <Link
                    to="/battle/new"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                  >
                    Try with specific category →
                  </Link>
                </div>
              )}
              
              {/* Perfect score celebration */}
              {winnerScore && winnerScore.overall >= 9.5 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    🎉 Excellent Results!
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                    Outstanding {winnerScore.overall}/10 score! This {battle.battleType} is production-ready.
                  </p>
                  <button
                    onClick={() => handleCopy(
                      battle.battleType === 'prompt' ? (battle.finalPrompt || battle.prompt) : battle.responses.find(r => r.modelId === battle.winner)?.response || '',
                      'Winning result'
                    )}
                    className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                  >
                    Copy winning result →
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
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

            {/* Smart "New Battle" button with context */}
            {battle.battleType === 'response' ? (
              <Link
                to="/battle/new"
                state={{ 
                  battleType: 'prompt', 
                  prompt: battle.prompt, 
                  category: battle.promptCategory 
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Refine This Prompt</span>
              </Link>
            ) : (
              <Link
                to="/battle/new"
                state={{ 
                  battleType: 'response', 
                  prompt: battle.finalPrompt || battle.prompt, 
                  category: battle.promptCategory 
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Test Refined Prompt</span>
              </Link>
            )}
            
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