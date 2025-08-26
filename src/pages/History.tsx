import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBattle } from '../contexts/BattleContext';
import { Battle, Model } from '../types';
import { AVAILABLE_MODELS } from '../lib/models';
import Navigation from '../components/Navigation';
import FeedbackWidget from '../components/FeedbackWidget';
import { 
  Search, 
  Filter, 
  Trophy, 
  Clock, 
  Users, 
  Star,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Brain,
  Hand,
  Target,
  TrendingUp,
  Edit3,
  MessageSquare
} from 'lucide-react';

export default function History() {
  const { battles, models } = useBattle();
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'running'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'auto' | 'manual'>('all');
  const [filterType, setFilterType] = useState<'all' | 'prompt' | 'response'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const battlesPerPage = 10;

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        setLoadError(null);
        // History loads automatically through BattleContext
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Failed to load history');
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, []);

  const getModelInfo = (modelId: string) => {
    return AVAILABLE_MODELS.find(m => m.id === modelId) || { name: modelId, icon: '🤖' };
  };

  const categories = [
    'all', 'general', 'creative', 'technical', 'analysis', 
    'summary', 'explanation', 'math', 'research'
  ];

  // Filter battles based on search and filters
  const filteredBattles = battles.filter(battle => {
    const matchesSearch = battle.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         battle.models.some(modelId => 
                           getModelInfo(modelId).name.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesStatus = filterStatus === 'all' || battle.status === filterStatus;
    const matchesMode = filterMode === 'all' || battle.battleMode === filterMode;
    const matchesType = filterType === 'all' || battle.battleType === filterType;
    const matchesCategory = filterCategory === 'all' || battle.promptCategory === filterCategory;
    
    return matchesSearch && matchesStatus && matchesMode && matchesType && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBattles.length / battlesPerPage);
  const startIndex = (currentPage - 1) * battlesPerPage;
  const paginatedBattles = filteredBattles.slice(startIndex, startIndex + battlesPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Battle History
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            View and analyze your past AI battles - both Prompt Refinement and Response Generation across Auto and Manual modes
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search battles..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as 'all' | 'completed' | 'running');
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="running">Running</option>
              </select>
            </div>

            {/* Battle Type Filter */}
            <div className="relative">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as 'all' | 'prompt' | 'response');
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="prompt">Prompt Battle</option>
                <option value="response">Response Battle</option>
              </select>
            </div>

            {/* Battle Mode Filter */}
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterMode}
                onChange={(e) => {
                  setFilterMode(e.target.value as 'all' | 'auto' | 'manual');
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="all">All Modes</option>
                <option value="auto">Auto Mode</option>
                <option value="manual">Manual Mode</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>
              Showing {paginatedBattles.length} of {filteredBattles.length} battles
            </span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Prompt: {filteredBattles.filter(b => b.battleType === 'prompt').length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Response: {filteredBattles.filter(b => b.battleType === 'response').length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>Auto: {filteredBattles.filter(b => b.battleMode === 'auto').length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Hand className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Manual: {filteredBattles.filter(b => b.battleMode === 'manual').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Battle List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {paginatedBattles.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedBattles.map((battle) => {
                const winnerModel = battle.winner ? getModelInfo(battle.winner) : null;
                const winnerScore = battle.winner && battle.scores ? battle.scores[battle.winner] : null;

                return (
                  <div key={battle.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Battle Type and Mode Badges */}
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
                            <span>{battle.battleMode} mode</span>
                          </div>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium capitalize">
                            {battle.promptCategory}
                          </span>
                          {battle.rounds && battle.rounds > 1 && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                              {battle.rounds} rounds
                            </span>
                          )}
                        </div>

                        {/* Battle Prompt */}
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {battle.battleType === 'prompt' ? 'Refining: ' : ''} "{battle.prompt}"
                        </h3>

                        {/* Final Prompt for Prompt Battles */}
                        {battle.battleType === 'prompt' && battle.finalPrompt && battle.finalPrompt !== battle.prompt && (
                          <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                            <p className="text-sm text-green-700 dark:text-green-300">
                              <strong>Final:</strong> "{battle.finalPrompt}"
                            </p>
                          </div>
                        )}

                        {/* Battle Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {battle.createdAt ? new Date(battle.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Asia/Kolkata'
                            }) + ' IST' : 'Unknown date'}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {battle.models?.length || 0} models
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {battle.mode}
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            battle.status === 'completed' 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : battle.status === 'running'
                              ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                              : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          }`}>
                            {battle.status}
                          </div>
                        </div>

                        {/* Models */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {battle.models.map((modelId) => {
                            const model = getModelInfo(modelId);
                            const isWinner = modelId === battle.winner;
                            return (
                              <div
                                key={modelId}
                                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                                  isWinner
                                    ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-300 dark:ring-yellow-600'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <span>{model.icon}</span>
                                <span>{model.name}</span>
                                {isWinner && <Trophy className="w-3 h-3" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Winner Info */}
                        {battle.status === 'completed' && winnerModel && winnerScore && (
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Trophy className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {battle.battleType === 'prompt' ? 'Best Refinement' : 'Winner'}: {winnerModel.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {winnerScore.overall}/10
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Cost: ₹{battle.totalCost}
                            </div>
                            {battle.battleMode === 'auto' && battle.rounds && battle.rounds > 1 && (
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {battle.rounds} rounds
                              </div>
                            )}
                            {battle.battleType === 'prompt' && battle.promptEvolution && (
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                {battle.promptEvolution.length - 1} refinements
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="ml-4 flex-shrink-0">
                        <Link
                          to={`/battle/${battle.id}/results`}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Results
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm || filterStatus !== 'all' || filterMode !== 'all' || filterType !== 'all' || filterCategory !== 'all'
                  ? 'No battles found'
                  : 'No battles yet!'
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchTerm || filterStatus !== 'all' || filterMode !== 'all' || filterType !== 'all' || filterCategory !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start your first battle to see magic happen! Create a battle and watch AI models compete.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && filterMode === 'all' && filterType === 'all' && filterCategory === 'all' && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/battle/new"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Battle
                  </Link>
                  <Link
                    to="/battle/battle_1/results"
                    className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    View Demo Battle
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              const isCurrentPage = page === currentPage;
              
              // Show first page, last page, current page, and pages around current
              const showPage = page === 1 || 
                              page === totalPages || 
                              Math.abs(page - currentPage) <= 1;

              if (!showPage) {
                // Show ellipsis
                if (page === 2 && currentPage > 4) {
                  return <span key={page} className="px-2 text-gray-500">...</span>;
                }
                if (page === totalPages - 1 && currentPage < totalPages - 3) {
                  return <span key={page} className="px-2 text-gray-500">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isCurrentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Battle Statistics */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center space-x-3 mb-4">
              <Edit3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Prompt Battles</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Prompt refinement and optimization</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {battles.filter(b => b.battleType === 'prompt').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(battles.filter(b => b.battleType === 'prompt' && b.winner).reduce((sum, b) => sum + (b.scores[b.winner]?.overall || 0), 0) / battles.filter(b => b.battleType === 'prompt' && b.winner).length || 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Avg Score</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Response Battles</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Response generation and comparison</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {battles.filter(b => b.battleType === 'response').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(battles.filter(b => b.battleType === 'response' && b.winner).reduce((sum, b) => sum + (b.scores[b.winner]?.overall || 0), 0) / battles.filter(b => b.battleType === 'response' && b.winner).length || 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Avg Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FeedbackWidget />
    </div>
  );
}