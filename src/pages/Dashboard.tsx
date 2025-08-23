import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBattle } from '../contexts/BattleContext';
import Navigation from '../components/Navigation';
import FeedbackWidget from '../components/FeedbackWidget';
import { 
  Zap, 
  Target, 
  Trophy, 
  TrendingUp, 
  Users, 
  Clock,
  Star,
  Crown,
  Calendar,
  ArrowRight,
  Plus,
  Eye,
  BarChart3,
  Sparkles,
  Brain,
  Hand,
  Edit3,
  MessageSquare
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { battles, models, refreshBattles } = useBattle();
  const [stats, setStats] = useState({
    totalBattles: 0,
    winRate: 0,
    avgScore: 0,
    favoriteModel: 'N/A'
  });

  const getModelInfo = (modelId: string) => {
    return models.find(m => m.id === modelId) || { name: modelId, icon: '🤖' };
  };

  useEffect(() => {
    refreshBattles();
  }, [refreshBattles]);

  useEffect(() => {
    if (battles.length > 0) {
      const completedBattles = battles.filter(b => b.status === 'completed');
      const totalScore = completedBattles.reduce((sum, battle) => {
        const winnerScore = battle.winner ? battle.scores[battle.winner] : null;
        return sum + (winnerScore?.overall || 0);
      }, 0);

      // Calculate favorite model
      const modelCounts: Record<string, number> = {};
      battles.forEach(battle => {
        if (battle.winner) {
          modelCounts[battle.winner] = (modelCounts[battle.winner] || 0) + 1;
        }
      });
      
      const favoriteModelId = Object.entries(modelCounts).sort(([,a], [,b]) => b - a)[0]?.[0];
      const favoriteModel = favoriteModelId ? models.find(m => m.id === favoriteModelId)?.name || favoriteModelId : 'N/A';

      setStats({
        totalBattles: battles.length,
        winRate: completedBattles.length > 0 ? Math.round((completedBattles.length / battles.length) * 100) : 0,
        avgScore: completedBattles.length > 0 ? Number((totalScore / completedBattles.length).toFixed(1)) : 0,
        favoriteModel
      });
    }
  }, [battles, models]);

  const recentBattles = battles.slice(0, 5);

  const getModelInfo = (modelId: string) => {
    return models.find(m => m.id === modelId) || { name: modelId, icon: '🤖' };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Ready to pit AI models against each other? Let's create some epic battles!
              </p>
            </div>
            <div className="hidden sm:flex items-center space-x-2">
              {user?.plan === 'premium' ? (
                <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl">
                  <Crown className="w-5 h-5" />
                  <span className="font-medium">Premium</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl">
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Free Plan</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage Status (Free Users) */}
        {user && user.plan === 'free' && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Daily Battle Usage
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {user.battles_used}/{user.battles_limit} battles used today
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.battles_limit - user.battles_used}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">remaining</div>
              </div>
            </div>
            
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(user.battles_used / user.battles_limit) * 100}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Resets daily at midnight IST
              </p>
              <Link
                to="/pricing"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Upgrade for unlimited battles →
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            to="/battle/new"
            className="group bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8" />
              <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold mb-2">New Battle</h3>
            <p className="text-blue-100 text-sm">
              Create a new AI model battle
            </p>
          </Link>

          <Link
            to="/history"
            className="group bg-white dark:bg-gray-800 rounded-2xl p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <ArrowRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Battle History</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              View past battles and results
            </p>
          </Link>

          <Link
            to="/battle/battle_1/results"
            className="group bg-white dark:bg-gray-800 rounded-2xl p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <ArrowRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Demo Battle</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              See how battles work
            </p>
          </Link>

          <Link
            to="/pricing"
            className="group bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Crown className="w-8 h-8" />
              <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upgrade</h3>
            <p className="text-yellow-100 text-sm">
              Get unlimited battles
            </p>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Battles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBattles}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.winRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Avg Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgScore}/10</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Top Model</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{stats.favoriteModel}</p>
              </div>
              <Trophy className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Battles */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Recent Battles
                  </h2>
                  <Link
                    to="/history"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    View all →
                  </Link>
                </div>
              </div>

              {recentBattles.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentBattles.map((battle) => {
                    const winnerModel = battle.winner ? getModelInfo(battle.winner) : null;
                    const winnerScore = battle.winner ? battle.scores[battle.winner] : null;

                    return (
                      <div key={battle.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
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
                                <span>{battle.battleMode}</span>
                              </div>
                            </div>
                            
                            <h3 className="text-gray-900 dark:text-white font-medium mb-1 line-clamp-1">
                              "{battle.prompt}"
                            </h3>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {battle.models.length} models
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(battle.createdAt).toLocaleDateString('en-IN')}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                battle.status === 'completed' 
                                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                              }`}>
                                {battle.status}
                              </span>
                            </div>

                            {battle.status === 'completed' && winnerModel && winnerScore && (
                              <div className="flex items-center space-x-2 mt-2">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {winnerModel.name}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="text-sm text-gray-600 dark:text-gray-300">
                                    {winnerScore.overall}/10
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          <Link
                            to={`/battle/${battle.id}/results`}
                            className="ml-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No battles yet!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Create your first battle to see magic happen
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      to="/battle/new"
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Battle
                    </Link>
                    <Link
                      to="/battle/battle_1/results"
                      className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Demo Battle
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Available Models */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Available Models
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {models.filter(model => model.available).slice(0, 6).map((model) => (
                  <div key={model.id} className="flex items-center space-x-3">
                    <span className="text-2xl">{model.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {model.name}
                        </p>
                        {model.premium && (
                          <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {model.provider}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      model.available ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  to="/battle/new"
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Battle
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FeedbackWidget />
    </div>
  );
}