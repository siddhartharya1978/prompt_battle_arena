import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBattle } from '../contexts/BattleContext';
import { Battle, Model, BattleScore } from '../types';
import Navigation from '../components/Navigation';
import FeedbackWidget from '../components/FeedbackWidget';
import { 
  Trophy, 
  Clock, 
  Zap, 
  Share2, 
  Download, 
  Copy,
  Star,
  Medal,
  Target,
  Users,
  Calendar,
  DollarSign,
  Brain,
  Hand,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Edit3,
  MessageSquare,
  Layers,
  FileText,
  Lightbulb
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BattleResults() {
  const { id } = useParams<{ id: string }>();
  const { getBattle, models, battles } = useBattle();
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeRound, setActiveRound] = useState(0);
  const [activeTab, setActiveTab] = useState<'results' | 'evolution'>('results');
  
  console.log('BattleResults: Looking for battle with ID:', id);
  console.log('BattleResults: Available battles in context:', battles?.length || 0);
  
  const battle = id ? getBattle(id) : null;
  console.log('BattleResults: Found battle:', battle ? 'Yes' : 'No');
  
  if (battle) {
    console.log('BattleResults: Battle details:', {
      id: battle.id,
      type: battle.battleType,
      status: battle.status,
      winner: battle.winner,
      responsesCount: battle.responses?.length || 0,
      scoresCount: Object.keys(battle.scores || {}).length
    });
  }

  useEffect(() => {
    if (battle?.status === 'completed' && battle.winner) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      // For prompt battles, default to evolution tab
      if (battle.battleType === 'prompt') {
        setActiveTab('evolution');
      }
    }
  }, [battle]);

  if (!battle) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {id ? `Battle "${id}" Not Found` : 'Loading Battle...'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {id ? `Battle with ID "${id}" could not be found. It may not exist or you may not have permission to view it.` : 'Please wait while we load your battle results.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Return to Dashboard
              </Link>
              <Link
                to="/battle/new"
                className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Create New Battle
              </Link>
              <Link
                to="/battle/battle_1/results"
                className="inline-flex items-center px-6 py-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium rounded-xl hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
              >
                View Demo Battle
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getModelInfo = (modelId: string) => {
    return models.find(m => m.id === modelId) || { name: modelId, icon: '🤖' };
  };

  const winnerModel = battle.winner ? getModelInfo(battle.winner) : null;
  const winnerResponse = battle.responses.find(r => r.modelId === battle.winner);
  const winnerScore = battle.winner ? battle.scores[battle.winner] : null;

  const handleShare = async () => {
    const shareText = battle.battleType === 'prompt' 
      ? `Check out this AI prompt refinement battle! ${winnerModel?.name} created the perfect prompt with a score of ${winnerScore?.overall}/10`
      : `Check out this AI response battle result! ${winnerModel?.name} won with a score of ${winnerScore?.overall}/10`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AI ${battle.battleType === 'prompt' ? 'Prompt' : 'Response'} Battle Results`,
          text: shareText,
          url: window.location.href
        });
      } catch (error) {
        // Fall back to clipboard if share fails
        navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
        toast.success('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleCopyResults = () => {
    const resultsText = `
${battle.battleType === 'prompt' ? 'Prompt' : 'Response'} Battle Results - ${new Date(battle.createdAt).toLocaleDateString('en-IN')}

Battle Type: ${battle.battleType === 'prompt' ? 'Prompt Refinement' : 'Response Generation'}
Mode: ${battle.battleMode === 'auto' ? 'Auto Mode' : 'Manual Mode'}
${battle.battleType === 'prompt' ? 'Initial Prompt' : 'Prompt'}: "${battle.prompt}"
${battle.battleType === 'prompt' && battle.finalPrompt ? `Final Refined Prompt: "${battle.finalPrompt}"` : ''}
Category: ${battle.promptCategory}

Winner: ${winnerModel?.name} (Score: ${winnerScore?.overall}/10)

Models Competed:
${battle.battleType === 'prompt' ? 
  battle.models.map(modelId => {
    const model = getModelInfo(modelId);
    const score = battle.scores[modelId];
    return `- ${model.name}: ${score?.overall}/10`;
  }).join('\n') :
  battle.responses.map(r => {
  const model = getModelInfo(r.modelId);
  const score = battle.scores[r.modelId];
  return `- ${model.name}: ${score?.overall}/10`;
}).join('\n')
}

${battle.battleMode === 'auto' && battle.autoSelectionReason ? `\nAuto-Selection Reason: ${battle.autoSelectionReason}` : ''}

Total Cost: ₹${battle.totalCost}
    `.trim();

    navigator.clipboard.writeText(resultsText);
    toast.success('Results copied to clipboard!');
  };

  // Mock round data for auto mode battles
  const mockRounds = battle.battleMode === 'auto' ? 
    (battle.battleType === 'prompt' ? [
      {
        round: 1,
        title: 'Initial Analysis',
        description: 'Models analyze the initial prompt for improvement opportunities'
      },
      {
        round: 2,
        title: 'Prompt Refinement',
        description: 'Models create enhanced versions with better clarity and specificity'
      },
      {
        round: 3,
        title: 'Final Optimization',
        description: 'Models perfect the prompt for maximum effectiveness'
      }
    ] : [
      {
        round: 1,
        title: 'Initial Responses',
        description: 'Models generate their first responses to the prompt'
      },
      {
        round: 2,
        title: 'Iterative Improvement',
        description: 'Models refine responses based on initial feedback'
      },
      {
        round: 3,
        title: 'Final Optimization',
        description: 'Models make final improvements to achieve optimal scores'
      }
    ]) : [{ 
      round: 1, 
      title: battle.battleType === 'prompt' ? 'Single Round Refinement' : 'Single Round Battle', 
      description: battle.battleType === 'prompt' ? 'Direct prompt improvement comparison' : 'Direct model comparison' 
    }];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-transparent to-yellow-400/20 animate-pulse" />
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-16 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                battle.battleType === 'prompt'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                  : battle.battleMode === 'auto' 
                    ? 'bg-gradient-to-br from-green-500 to-blue-500' 
                    : 'bg-gradient-to-br from-blue-500 to-indigo-500'
              }`}>
                {battle.battleType === 'prompt' ? (
                  <Edit3 className="w-5 h-5 text-white" />
                ) : battle.battleMode === 'auto' ? (
                  <Brain className="w-5 h-5 text-white" />
                ) : (
                  <Hand className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {battle.battleType === 'prompt' ? 'Prompt' : 'Response'} Battle #{battle.id.split('_')[battle.id.split('_').length - 1]} • {battle.battleMode === 'auto' ? 'Auto Mode' : 'Manual Mode'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(battle.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Kolkata'
                  })} IST
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyResults}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Battle Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {battle.battleType === 'prompt' ? 'Initial Prompt to Refine' : 'Battle Prompt'}
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Type:</span>
                <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
                  battle.battleType === 'prompt'
                    ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                    : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                }`}>
                  {battle.battleType === 'prompt' ? 'Prompt Battle' : 'Response Battle'}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-300">Category:</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium capitalize">
                  {battle.promptCategory}
                </span>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
              "{battle.prompt}"
            </p>
            {battle.battleType === 'prompt' && battle.finalPrompt && battle.finalPrompt !== battle.prompt && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Final Refined Prompt:
                </h3>
                <p className="text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-700">
                  "{battle.finalPrompt}"
                </p>
              </div>
            )}
          </div>

          {/* Auto-Selection Reason (Auto Mode Only) */}
          {battle.battleMode === 'auto' && battle.autoSelectionReason && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Brain className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900 dark:text-green-100 mb-1">
                    INTELLIGENT MODEL SELECTION ANALYSIS
                  </h3>
                  <pre className="text-xs text-green-700 dark:text-green-300 whitespace-pre-wrap font-mono bg-white dark:bg-green-800/20 p-3 rounded border overflow-x-auto">
                    {battle.autoSelectionReason}
                  </pre>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Peer Review Consensus (if achieved) */}
          {battle.roundResults && battle.roundResults.some((r: any) => r.consensus) && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                    🏆 PEER CONSENSUS ACHIEVED
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    All peer reviewers agree this output cannot be meaningfully improved further.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Models</p>
                <p className="font-medium text-gray-900 dark:text-white">{battle.models.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Mode</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">{battle.mode}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Rounds</p>
                <p className="font-medium text-gray-900 dark:text-white">{battle.rounds || 1}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Max Tokens</p>
                <p className="font-medium text-gray-900 dark:text-white">{battle.maxTokens}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Cost</p>
                <p className="font-medium text-gray-900 dark:text-white">₹{battle.totalCost}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Round Navigation (Multi-round battles) */}
        {mockRounds.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {battle.battleType === 'prompt' ? 'Refinement' : 'Battle'} Rounds
            </h3>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {mockRounds.map((round, index) => (
                <button
                  key={round.round}
                  onClick={() => setActiveRound(index)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeRound === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>Round {round.round}</span>
                    {index < mockRounds.length - 1 && (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-xs opacity-80 mt-1">
                    {round.title}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
              {mockRounds[activeRound]?.description}
            </p>
          </div>
        )}

        {/* Winner Announcement */}
        {battle.winner && winnerModel && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 mb-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 animate-pulse" />
            <div className="relative flex items-center justify-center mb-4">
              <Trophy className="w-12 h-12 mr-4" />
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">
                  🎉 {battle.battleType === 'prompt' ? 'Prompt Refinement' : 'Battle'} Winner!
                </h2>
                <p className="text-xl flex items-center justify-center space-x-2">
                  <span>{winnerModel.icon}</span>
                  <span>{winnerModel.name}</span>
                </p>
                <p className="opacity-90">
                  Final Score: {winnerScore?.overall}/10
                  {battle.battleMode === 'auto' && (
                    <span className="ml-2 text-sm">(Achieved in Round {activeRound + 1})</span>
                  )}
                </p>
              </div>
            </div>
            {battle.battleMode === 'auto' && (
              <div className="text-center text-sm opacity-90">
                Auto Mode: Achieved optimal {battle.battleType === 'prompt' ? 'prompt quality' : 'response score'} through iterative {battle.battleType === 'prompt' ? 'refinement' : 'improvement'}
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation for Prompt Battles */}
        {battle.battleType === 'prompt' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('evolution')}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'evolution'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                  <span>Prompt Evolution</span>
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'results'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Trophy className="w-5 h-5" />
                  <span>Model Scores</span>
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'evolution' && battle.promptEvolution && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Prompt Refinement Journey
                  </h3>
                  
                  {battle.promptEvolution.map((evolution, index) => (
                    <div key={evolution.round} className="relative">
                      {index > 0 && (
                        <div className="absolute left-6 -top-3 w-0.5 h-6 bg-gray-300 dark:bg-gray-600"></div>
                      )}
                      
                      <div className={`border-2 rounded-xl p-6 ${
                        evolution.round === 1 
                          ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30'
                          : evolution.modelId === battle.winner
                            ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'border-blue-200 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              evolution.round === 1
                                ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                : evolution.modelId === battle.winner
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-blue-500 text-white'
                            }`}>
                              {evolution.round}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {evolution.round === 1 ? 'Initial Prompt' : `Round ${evolution.round} Refinement`}
                              </h4>
                              {evolution.modelId !== 'initial' && (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  Refined by {getModelInfo(evolution.modelId).name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                              {evolution.score}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">/10</div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            "{evolution.prompt}"
                          </p>
                        </div>

                        {evolution.improvements.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                              Improvements Made:
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {evolution.improvements.map((improvement, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium"
                                >
                                  {improvement}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'results' && (
                <div className="grid lg:grid-cols-2 gap-6">
                  {battle.models.map((modelId) => {
                    const model = getModelInfo(modelId);
                    const score = battle.scores[modelId];
                    const isWinner = modelId === battle.winner;

                    return (
                      <div
                        key={modelId}
                        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden ${
                          isWinner ? 'ring-2 ring-yellow-400' : ''
                        }`}
                      >
                        {/* Model Header */}
                        <div className={`p-4 ${
                          isWinner 
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                            : 'bg-gray-50 dark:bg-gray-700/50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{model.icon}</span>
                              <div>
                                <h3 className={`font-bold ${
                                  isWinner ? 'text-white' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {model.name}
                                </h3>
                                {isWinner && (
                                  <div className="flex items-center space-x-1">
                                    <Medal className="w-4 h-4" />
                                    <span className="text-sm">Winner</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {score && (
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${
                                  isWinner ? 'text-white' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {score.overall}
                                </div>
                                <div className={`text-sm ${
                                  isWinner ? 'text-white/80' : 'text-gray-600 dark:text-gray-300'
                                }`}>
                                  /10
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Detailed Scores */}
                        <div className="p-4">
                          {score && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                {battle.battleType === 'prompt' ? 'Prompt Quality Scores' : 'Response Quality Scores'}
                              </h4>
                              {[
                                { label: battle.battleType === 'prompt' ? 'Clarity' : 'Accuracy', value: score.accuracy },
                                { label: battle.battleType === 'prompt' ? 'Specificity' : 'Reasoning', value: score.reasoning },
                                { label: 'Structure', value: score.structure },
                                { label: battle.battleType === 'prompt' ? 'Effectiveness' : 'Creativity', value: score.creativity }
                              ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600 dark:text-gray-300">{item.label}</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                      <div 
                                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${(item.value / 10) * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-medium text-gray-900 dark:text-white w-6">
                                      {item.value}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              
                              {score.notes && (
                                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                  <p className="text-xs text-gray-600 dark:text-gray-300">
                                    <strong>Judge Notes:</strong> {score.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Response Battle Results */}
        {battle.battleType === 'response' && (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {battle.responses.map((response) => {
              const model = getModelInfo(response.modelId);
              const score = battle.scores[response.modelId];
              const isWinner = response.modelId === battle.winner;

              // Mock round progression for auto mode
              const roundScores = battle.battleMode === 'auto' ? [
                { round: 1, score: Math.max(1, (score?.overall || 7) - 2) },
                { round: 2, score: Math.max(1, (score?.overall || 7) - 1) },
                { round: 3, score: score?.overall || 7 }
              ] : [{ round: 1, score: score?.overall || 7 }];

              return (
                <div
                  key={response.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden ${
                    isWinner ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  {/* Model Header */}
                  <div className={`p-4 ${
                    isWinner 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                      : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{model.icon}</span>
                        <div>
                          <h3 className={`font-bold ${
                            isWinner ? 'text-white' : 'text-gray-900 dark:text-white'
                          }`}>
                            {model.name}
                          </h3>
                          {isWinner && (
                            <div className="flex items-center space-x-1">
                              <Medal className="w-4 h-4" />
                              <span className="text-sm">Winner</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {score && (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            isWinner ? 'text-white' : 'text-gray-900 dark:text-white'
                          }`}>
                            {score.overall}
                          </div>
                          <div className={`text-sm ${
                            isWinner ? 'text-white/80' : 'text-gray-600 dark:text-gray-300'
                          }`}>
                            /10
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Round Progress (Auto Mode) */}
                  {battle.battleMode === 'auto' && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-600">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Round Progression
                      </h4>
                      <div className="flex items-center space-x-2">
                        {roundScores.map((roundData, index) => (
                          <React.Fragment key={roundData.round}>
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                index <= activeRound
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                              }`}>
                                {roundData.score}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                R{roundData.round}
                              </span>
                            </div>
                            {index < roundScores.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response Content */}
                  <div className="p-4">
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {battle.battleMode === 'auto' ? `Round ${activeRound + 1} Response` : 'Response'}
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {response.response}
                      </p>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Latency</p>
                        <p className="font-medium text-gray-900 dark:text-white">{response.latency}ms</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <Zap className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Tokens</p>
                        <p className="font-medium text-gray-900 dark:text-white">{response.tokens}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center mb-1">
                          <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Cost</p>
                        <p className="font-medium text-gray-900 dark:text-white">₹{response.cost}</p>
                      </div>
                    </div>

                    {/* Detailed Scores */}
                    {score && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">Detailed Scores</h4>
                        {[
                          { label: 'Accuracy', value: score.accuracy },
                          { label: 'Reasoning', value: score.reasoning },
                          { label: 'Structure', value: score.structure },
                          { label: 'Creativity', value: score.creativity }
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-300">{item.label}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${(item.value / 10) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-900 dark:text-white w-6">
                                {item.value}
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        {score.notes && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              <strong>Judge Notes:</strong> {score.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Battle Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {battle.battleType === 'prompt' ? 'Prompt Refinement' : 'Battle'} Summary
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Performance Ranking</h4>
              <div className="space-y-2">
                {battle.models
                  .sort((a, b) => (battle.scores[b]?.overall || 0) - (battle.scores[a]?.overall || 0))
                  .map((modelId, index) => {
                    const model = getModelInfo(modelId);
                    const score = battle.scores[modelId];
                    const isWinner = modelId === battle.winner;
                    const responseData = battle.responses.find(r => r.modelId === modelId);
                    
                    return (
                      <div
                        key={modelId}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isWinner 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700'
                            : 'bg-gray-50 dark:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            'bg-orange-400 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-lg">{model.icon}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {model.name}
                          </span>
                          {isWinner && <Trophy className="w-4 h-4 text-yellow-500" />}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {score?.overall}/10
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {battle.battleType === 'prompt' ? 'Prompt Quality' : `₹${responseData?.cost || '0.00'}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                {battle.battleType === 'prompt' ? 'Refinement' : 'Battle'} Insights
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Battle Type</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {battle.battleType === 'prompt' ? 'Prompt Refinement' : 'Response Generation'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Battle Mode</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {battle.battleMode} Mode
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Duration</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {battle.battleType === 'prompt' 
                      ? `${Math.floor(Math.random() * 2000) + 1000}ms`
                      : `${Math.max(...battle.responses.map(r => r.latency))}ms`
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Avg Score</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(Object.values(battle.scores).reduce((sum, score) => sum + score.overall, 0) / Object.values(battle.scores).length).toFixed(1)}/10
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Score Range</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.min(...Object.values(battle.scores).map(s => s.overall))} - {Math.max(...Object.values(battle.scores).map(s => s.overall))}
                  </span>
                </div>
                {battle.battleType === 'prompt' && battle.promptEvolution && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Refinement Rounds</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {battle.promptEvolution.length - 1}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Shareable Recap Card */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8 border border-blue-200 dark:border-blue-700">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Shareable {battle.battleType === 'prompt' ? 'Prompt Refinement' : 'Battle'} Recap
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Share your {battle.battleType === 'prompt' ? 'prompt refinement' : 'battle'} results with the community
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white">PBA</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(battle.createdAt).toLocaleDateString('en-IN')}
              </span>
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
              {battle.battleType === 'prompt' 
                ? `"${battle.prompt}" → "${battle.finalPrompt || battle.prompt}"`
                : `"${battle.prompt}"`
              }
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{winnerModel?.icon}</span>
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {winnerModel?.name} {battle.battleType === 'prompt' ? 'refined best!' : 'wins!'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-bold text-gray-900 dark:text-white">
                  {winnerScore?.overall}/10
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Results
            </button>
            <button
              onClick={() => toast.success('Recap card saved! (Demo mode)')}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Save Card
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/battle/new"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Target className="w-5 h-5 mr-2" />
            Start New Battle
          </Link>
          <Link
            to="/history"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            View All Battles
          </Link>
        </div>
      </div>

      <FeedbackWidget />
    </div>
  );
}