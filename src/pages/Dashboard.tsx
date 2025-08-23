import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBattle } from '../contexts/BattleContext';
import Navigation from '../components/Navigation';
import FeedbackWidget from '../components/FeedbackWidget';
import { 
  Zap, 
  Plus, 
  Trophy, 
  Clock, 
  Users, 
  TrendingUp,
  Star,
  ArrowRight,
  Calendar,
  Target,
  Play,
  Eye
} from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { battles, loading: battlesLoading } = useBattle();
  const navigate = useNavigate();

  const recentBattles = battles.slice(0, 3);
  const usagePercentage = user ? Math.min(100, (user.battles_used / user.battles_limit) * 100) : 0;

  const stats = [
    {
      label: 'Total Battles',
      value: battles.length,
      icon: Zap,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Wins',
      value: battles.filter(b => b.winner).length,
      icon: Trophy,
      color: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      label: 'Avg Score',
      value: battles.length > 0 ? 
        (battles.reduce((sum, b) => {
          const scores = Object.values(b.scores || {});
          return sum + (scores.length > 0 ? scores.reduce((s, score) => s + score.overall, 0) / scores.length : 0);
        }, 0) / battles.length).toFixed(1) : '0.0',
      icon: Star,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'This Month',
      value: battles.filter(b => new Date(b.createdAt).getMonth() === new Date().getMonth()).length,
      icon: TrendingUp,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Ready to pit some AI models against each other?
          </p>
        </div>

        {/* Quick Actions & Usage */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* New Battle Card */}
          <div>
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">Start a New Battle</h2>
                  <p className="opacity-90 mb-4">
                    Choose your prompt and let AI models compete for the best response
                  </p>
                  <Link
                    to="/battle/new"
                    className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Battle
                  </Link>
                </div>
                <div className="hidden sm:block">
                  <Target className="w-24 h-24 opacity-20" />
                </div>
              </div>
            </div>
          </div>

          {/* Demo Battle Card */}
          <div>
            <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">Try a Demo Battle</h2>
                  <p className="opacity-90 mb-4">
                    See how battles work with a completed example
                  </p>
                  <button
                    onClick={() => navigate('/battle/battle_1/results')}
                    className="inline-flex items-center px-6 py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    View Demo
                  </button>
                </div>
                <div className="hidden sm:block">
                  <Eye className="w-24 h-24 opacity-20" />
                </div>
              </div>
            </div>
          </div>

          {/* Usage Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Daily Usage</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {user?.plan} Plan
              </span>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-300">
                  {user?.battles_used} / {user?.battles_limit} battles
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  {Math.round(usagePercentage)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    usagePercentage >= 100 ? 'bg-red-500' : 
                    usagePercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>

            {user?.battles_used === user?.battles_limit && (
              <div className="text-center">
                <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                  Daily limit reached
                </p>
                <Link
                  to="/pricing"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Upgrade to Premium →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Battles */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Battles
              </h2>
              <Link
                to="/history"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm flex items-center"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentBattles.length > 0 ? (
              recentBattles.map((battle) => (
                <div key={battle.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white font-medium mb-2 line-clamp-2">
                        "{battle.prompt}"
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {battle.models?.length || 0} models
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(battle.created_at).toLocaleDateString('en-IN')}
                        </div>
                        {battle.winner && (
                          <div className="flex items-center">
                            <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
                            Winner: {battle.winner}
                          </div>
                        )}
                      </div>
                    </div>
                    <Link
                      to={`/battle/${battle.id}/results`}
                      className="ml-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm whitespace-nowrap"
                    >
                      View Results →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                {authLoading || battlesLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="ml-3 text-gray-600 dark:text-gray-300">Loading battles...</span>
                  </div>
                ) : (
                  <>
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No battles yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Start your first battle to see results here
                </p>
                <Link
                  to="/battle/new"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Battle
                </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <FeedbackWidget />
      </div>
    </div>
  );
}