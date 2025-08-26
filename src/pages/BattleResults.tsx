import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBattle } from '../contexts/BattleContext';
import { Battle, BattleScore } from '../types';
import { AVAILABLE_MODELS } from '../lib/models';
import Navigation from '../components/Navigation';
import FeedbackWidget from '../components/FeedbackWidget';
import { 
  Trophy, 
  Star, 
  Users, 
  Clock, 
  Target,
  ArrowLeft,
  Share2,
  Download,
  Eye,
  BarChart3,
  Zap,
  Crown,
  Calendar,
  DollarSign,
  Edit3,
  MessageSquare,
  Brain,
  Hand,
  TrendingUp,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BattleResults() {
  const { id } = useParams<{ id: string }>();
  const { getBattle } = useBattle();
  const navigate = useNavigate();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    const loadBattle = async () => {
      if (!id) {
        navigate('/history');
        return;
      }

      try {
        // Check for demo battle
        if (id === 'battle_1') {
          setBattle(getDemoBattle());
        } else {
          const foundBattle = getBattle(id);
          if (foundBattle) {
            setBattle(foundBattle);
          } else {
            toast.error('Battle not found');
            navigate('/history');
            return;
          }
        }
      } catch (error) {
        console.error('Error loading battle:', error);
        toast.error('Failed to load battle results');
        navigate('/history');
      } finally {
        setLoading(false);
      }
    };

    loadBattle();
  }, [id, getBattle, navigate]);

  const getDemoBattle = (): Battle => {
    return {
      id: 'battle_1',
      userId: 'demo-user',
      battleType: 'response',
      prompt: 'Explain artificial intelligence in simple terms for beginners',
      finalPrompt: null,
      promptCategory: 'explanation',
      models: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile'],
      mode: 'standard',
      battleMode: 'auto',
      rounds: 1,
      maxTokens: 500,
      temperature: 0.7,
      status: 'completed',
      winner: 'llama-3.3-70b-versatile',
      totalCost: 0.0045,
      autoSelectionReason: '🎯 **OPTIMAL 2-MODEL SELECTION**\n\n**Prompt:** "Explain artificial intelligence in simple terms for beginners"\n**Category:** explanation | **Type:** response\n\n**Detected:** Educational, Explanatory\n\n**SELECTED CHAMPIONS (2/2):**\n1. **Llama 3.1 8B Instant** (8.2/10)\n   Fast response time, Clear explanations\n\n2. **Llama 3.3 70B Versatile** (9.1/10)\n   Large parameter count for complex reasoning, Specialized in educational content\n\n**STRATEGY:** Top 2 models selected for optimal competitive dynamics and faster battles.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      responses: [
        {
          id: 'response_1',
          battleId: 'battle_1',
          modelId: 'llama-3.1-8b-instant',
          response: 'Artificial Intelligence (AI) is like giving computers the ability to think and learn, similar to how humans do. Imagine teaching a computer to recognize patterns, make decisions, and solve problems by showing it lots of examples. AI systems can understand language, recognize images, and even create content. They work by processing massive amounts of data to find patterns and make predictions. Common examples include voice assistants like Siri, recommendation systems on Netflix, and chatbots that help with customer service.',
          latency: 1200,
          tokens: 95,
          cost: 0.00475,
          createdAt: new Date().toISOString()
        },
        {
          id: 'response_2',
          battleId: 'battle_1',
          modelId: 'llama-3.3-70b-versatile',
          response: 'Think of Artificial Intelligence (AI) as teaching computers to be smart helpers. Just like how you learn to ride a bike by practicing, AI learns by looking at millions of examples. For instance, to recognize cats in photos, an AI studies thousands of cat pictures until it understands what makes a cat look like a cat. AI is everywhere around us: when Netflix suggests movies you might like, when your phone\'s camera focuses automatically, or when GPS finds the fastest route home. The goal is to create computer programs that can think, learn, and make helpful decisions, making our daily lives easier and more efficient.',
          latency: 2100,
          tokens: 128,
          cost: 0.0346,
          createdAt: new Date().toISOString()
        }
      ],
      scores: {
        'llama-3.1-8b-instant': {
          accuracy: 8.2,
          reasoning: 7.8,
          structure: 8.0,
          creativity: 7.5,
          overall: 7.9,
          notes: 'Clear and concise explanation with good examples. Well-structured for beginners.'
        },
        'llama-3.3-70b-versatile': {
          accuracy: 9.1,
          reasoning: 9.3,
          structure: 9.0,
          creativity: 8.8,
          overall: 9.1,
          notes: 'Excellent use of analogies and real-world examples. Perfect for beginners with engaging explanations.'
        }
      }
    };
  };

  const getModelInfo = (modelId: string) => {
    return AVAILABLE_MODELS.find(m => m.id === modelId) || { 
      name: modelId, 
      icon: '🤖',
      provider: 'Unknown'
    };
  };

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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/battle/${battle?.id}/results`;
    copyToClipboard(shareUrl, 'Battle URL');
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
        scores: battle.scores,
        createdAt: battle.createdAt
      },
      responses: battle.responses,
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: 'PBA User'
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battle_${battle.id}_results.json`;
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
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading Battle Results...
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Retrieving battle data and analysis
            </p>
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
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Battle Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The battle you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/history"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (battle.status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <Link
                  to="/history"
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Battle Failed - Honest API Error
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    External API failure - No synthetic data generated
                  </p>
                </div>
              </div>
            </div>

            {/* Failed Battle Details */}
            <div className="p-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                      Honest API Failure - No Fake Data Generated
                    </h3>
                    <p className="text-red-700 dark:text-red-300 mb-4">
                      This battle could not be completed due to external Groq API issues. In accordance with our 
                      strict "ALL REAL" policy, no synthetic, mock, or fake data was generated. The battle has been 
                      honestly recorded as failed. You can retry immediately as the issue is likely temporary.
                    {battle.plateauReason && (
                      <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3">
                        <p className="text-sm text-red-800 dark:text-red-200 font-mono">
                          <strong>Error Details:</strong> {battle.plateauReason}
                        </p>
                      </div>
                    )}
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What This Means:</h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• The external Groq API experienced temporary technical difficulties</li>
                        <li>• No fake or synthetic data was generated</li>
                        <li>• Your battle attempt was recorded honestly as failed</li>
                        <li>• You can retry immediately - API issues are usually temporary</li>
                        <li>• Your usage quota was not consumed for this failed battle</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Battle Configuration */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Battle Configuration</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Type:</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {battle.battleType} Battle
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Mode:</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {battle.battleMode} Mode
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Models:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {battle.models.join(', ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Category:</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {battle.promptCategory}
                    </p>
                  </div>
                </div>
              </div>

              {/* Original Prompt */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Original Prompt</h4>
                <p className="text-gray-900 dark:text-white">
                  "{battle.prompt}"
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/battle/new"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try New Battle
                </Link>
                <Link
                  to="/history"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View History
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const winner = battle.winner ? getModelInfo(battle.winner) : null;
  const winnerScore = battle.winner && battle.scores ? battle.scores[battle.winner] : null;
  const loser = battle.models.find(m => m !== battle.winner);
  const loserInfo = loser ? getModelInfo(loser) : null;
  const loserScore = loser && battle.scores ? battle.scores[loser] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/history"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Battle Results
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {battle.battleType === 'prompt' ? 'Prompt Refinement' : 'Response Generation'} • {battle.promptCategory}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Battle Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Battle Overview
            </h2>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                battle.battleType === 'prompt'
                  ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                  : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
              }`}>
                {battle.battleType === 'prompt' ? (
                  <Edit3 className="w-3 h-3" />
                ) : (
                  <MessageSquare className="w-3 h-3" />
                )}
                <span>{battle.battleType === 'prompt' ? 'Prompt' : 'Response'}</span>
              </div>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                battle.battleMode === 'auto'
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
              }`}>
                {battle.battleMode === 'auto' ? (
                  <Brain className="w-3 h-3" />
                ) : (
                  <Hand className="w-3 h-3" />
                )}
                <span>{battle.battleMode} mode</span>
              </div>
            </div>
          </div>

          {/* Prompt Display */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {battle.battleType === 'prompt' ? 'Original Prompt:' : 'Battle Prompt:'}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <p className="text-gray-900 dark:text-white">
                "{battle.prompt}"
              </p>
              <button
                onClick={() => copyToClipboard(battle.prompt, 'Original prompt')}
                className="mt-2 flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {copiedText === 'Original prompt' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
          </div>

          {/* Final Prompt for Prompt Battles */}
          {battle.battleType === 'prompt' && battle.finalPrompt && battle.finalPrompt !== battle.prompt && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Final Refined Prompt:
              </h3>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <p className="text-gray-900 dark:text-white">
                  "{battle.finalPrompt}"
                </p>
                <button
                  onClick={() => copyToClipboard(battle.finalPrompt!, 'Final prompt')}
                  className="mt-2 flex items-center space-x-1 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                >
                  {copiedText === 'Final prompt' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Refined Prompt</span>
                </button>
              </div>
            </div>
          )}

          {/* Battle Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {battle.models.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Models</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {battle.rounds}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {battle.battleType === 'prompt' ? 'Refinements' : 'Rounds'}
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                ₹{battle.totalCost.toFixed(4)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Cost</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {new Date(battle.createdAt).toLocaleDateString('en-IN')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Date</div>
            </div>
          </div>
        </div>

        {/* Winner Announcement */}
        {winner && winnerScore && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-lg p-8 mb-8 text-white">
            <div className="text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">
                🏆 {winner.name} Wins!
              </h2>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Star className="w-6 h-6 fill-current" />
                <span className="text-2xl font-bold">
                  {winnerScore.overall}/10
                </span>
              </div>
              <p className="text-yellow-100 max-w-2xl mx-auto">
                {winnerScore.notes}
              </p>
            </div>
          </div>
        )}

        {/* Auto Selection Reasoning */}
        {battle.battleMode === 'auto' && battle.autoSelectionReason && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <button
              onClick={() => toggleSection('reasoning')}
              className="flex items-center justify-between w-full mb-4"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                🧠 AI Model Selection Reasoning
              </h2>
              {expandedSections.has('reasoning') ? 
                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </button>
            
            {expandedSections.has('reasoning') && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <div className="whitespace-pre-line text-sm text-green-700 dark:text-green-300">
                  {battle.autoSelectionReason}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Model Comparison */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {battle.models.map((modelId, index) => {
            const model = getModelInfo(modelId);
            const score = battle.scores[modelId];
            const response = battle.responses.find(r => r.modelId === modelId);
            const isWinner = modelId === battle.winner;

            return (
              <div
                key={modelId}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden ${
                  isWinner ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                {/* Model Header */}
                <div className={`p-6 ${
                  isWinner 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                    : 'bg-gray-50 dark:bg-gray-700/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{model.icon}</span>
                      <div>
                        <h3 className={`text-lg font-bold ${
                          isWinner ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}>
                          {model.name}
                        </h3>
                        <p className={`text-sm ${
                          isWinner ? 'text-yellow-100' : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {model.provider}
                        </p>
                      </div>
                    </div>
                    
                    {isWinner && (
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-6 h-6" />
                        <span className="font-bold">Winner!</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Score Breakdown */}
                {score && (
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Performance Scores
                      </h4>
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {score.overall}/10
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { label: 'Accuracy', value: score.accuracy, icon: Target },
                        { label: 'Reasoning', value: score.reasoning, icon: Brain },
                        { label: 'Structure', value: score.structure, icon: BarChart3 },
                        { label: 'Creativity', value: score.creativity, icon: Sparkles }
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(value / 10) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                              {value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>Judge's Notes:</strong> {score.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Response */}
                {response && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Response
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{response.tokens} tokens</span>
                        <span>{response.latency}ms</span>
                        <span>₹{response.cost.toFixed(4)}</span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-3">
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        {response.response}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => copyToClipboard(response.response, `${model.name} response`)}
                      className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      {copiedText === `${model.name} response` ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Response</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detailed Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <button
            onClick={() => toggleSection('analysis')}
            className="flex items-center justify-between w-full mb-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              📊 Detailed Analysis
            </h2>
            {expandedSections.has('analysis') ? 
              <ChevronUp className="w-5 h-5 text-gray-400" /> : 
              <ChevronDown className="w-5 h-5 text-gray-400" />
            }
          </button>
          
          {expandedSections.has('analysis') && (
            <div className="space-y-6">
              {/* Head-to-Head Comparison */}
              {winnerScore && loserScore && loserInfo && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                    Head-to-Head Comparison
                  </h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    {[
                      { label: 'Accuracy', winner: winnerScore.accuracy, loser: loserScore.accuracy },
                      { label: 'Reasoning', winner: winnerScore.reasoning, loser: loserScore.reasoning },
                      { label: 'Structure', winner: winnerScore.structure, loser: loserScore.structure },
                      { label: 'Creativity', winner: winnerScore.creativity, loser: loserScore.creativity }
                    ].map(({ label, winner: winnerVal, loser: loserVal }) => (
                      <div key={label} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{label}</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {winnerVal}
                            </span>
                            <span className="text-xs text-gray-500">vs</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {loserVal}
                            </span>
                          </div>
                          <div className={`text-xs font-medium ${
                            winnerVal > loserVal ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                          }`}>
                            {winnerVal > loserVal ? `+${(winnerVal - loserVal).toFixed(1)}` : 'Tied'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  Performance Metrics
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {battle.responses.map(response => {
                    const model = getModelInfo(response.modelId);
                    return (
                      <div key={response.modelId} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-lg">{model.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{model.name}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Tokens:</span>
                            <div className="font-medium text-gray-900 dark:text-white">{response.tokens}</div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Latency:</span>
                            <div className="font-medium text-gray-900 dark:text-white">{response.latency}ms</div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Cost:</span>
                            <div className="font-medium text-gray-900 dark:text-white">₹{response.cost.toFixed(4)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prompt Evolution (for Prompt Battles) */}
        {battle.battleType === 'prompt' && battle.promptEvolution && battle.promptEvolution.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <button
              onClick={() => toggleSection('evolution')}
              className="flex items-center justify-between w-full mb-4"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                🔄 Prompt Evolution ({battle.promptEvolution.length} rounds)
              </h2>
              {expandedSections.has('evolution') ? 
                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </button>
            
            {expandedSections.has('evolution') && (
              <div className="space-y-4">
                {/* Show Original Prompt First */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Original Prompt
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                      Starting Point
                    </span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-sm text-gray-900 dark:text-white">
                      "{battle.prompt}"
                    </p>
                  </div>
                </div>

                {battle.promptEvolution.map((evolution, index) => (
                  <div key={evolution.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Round {evolution.round}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          by {getModelInfo(evolution.modelId).name}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                          {evolution.score}/10
                        </span>
                        {evolution.score >= 9.5 && (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                            🎯 Excellent!
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* AI Thinking Process */}
                    {evolution.improvements.length > 0 && evolution.improvements[0] !== 'Original user prompt' && (
                      <div className="mb-3">
                        <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                          AI Thinking Process:
                        </h5>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                          <p className="text-sm text-blue-900 dark:text-blue-100 italic">
                            {evolution.improvements[0]}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Refined Prompt */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-3 border border-green-200 dark:border-green-700">
                      <h5 className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
                        Refined Prompt:
                      </h5>
                      <p className="text-sm text-gray-900 dark:text-white">
                        "{evolution.prompt}"
                      </p>
                      <button
                        onClick={() => copyToClipboard(evolution.prompt, `Round ${evolution.round} prompt`)}
                        className="mt-2 flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                      >
                        {copiedText === `Round ${evolution.round} prompt` ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>Copy This Version</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/battle/new"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Create New Battle
          </Link>
          
          <Link
            to="/history"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            View All Battles
          </Link>
        </div>
      </div>

      <FeedbackWidget />
    </div>
  );
}