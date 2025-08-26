import React, { useState } from 'react';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBattle } from '../contexts/BattleContext';
import { Profile } from '../types';
import { bulletproofSupabase } from '../lib/supabase-bulletproof';
import { runComprehensiveE2ETests } from '../lib/comprehensive-tests';
import Navigation from '../components/Navigation';
import {
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  TrendingUp,
  Zap,
  Crown,
  Calendar,
  DollarSign,
  Eye,
  ToggleLeft,
  ToggleRight,
  Database,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const { user } = useAuth();
  const { battles, refreshBattles } = useBattle();
  const [activeTab, setActiveTab] = useState('overview');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [runningTests, setRunningTests] = useState(false);
  const [comprehensiveResults, setComprehensiveResults] = useState<any[]>([]);
  const [runningComprehensive, setRunningComprehensive] = useState(false);

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Load real users from Supabase
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const client = bulletproofSupabase.getClient();
        if (!client) {
          throw new Error('Supabase not initialized');
        }
        
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (user?.role === 'admin') {
      loadUsers();
    } else {
      setLoadingUsers(false);
    }
  }, [user]);
  const [featureFlags, setFeatureFlags] = useState({
    newBattleMode: true,
    advancedJudging: false,
    apiAccess: false,
    teamFeatures: false
  });

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              You don't have permission to access the admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderDatabaseTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Database Health Check
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Test all database operations and API integrations
              </p>
            </div>
            <button
              onClick={handleRunDatabaseTests}
              disabled={runningTests}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>{runningTests ? 'Running Tests...' : 'Run Tests'}</span>
            </button>
          </div>
        </div>
        
        {testResults.length > 0 && (
          <div className="p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              Test Results ({testResults.filter(r => r.success).length}/{testResults.length} passed)
            </h4>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success
                      ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      result.success
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {result.success ? '✅' : '❌'} {result.test}
                    </span>
                  </div>
                  {result.error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Error: {result.error}
                    </p>
                  )}
                  {result.data && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Data: {JSON.stringify(result.data, null, 2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Database Configuration
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-300">Supabase URL:</span>
            <p className="font-mono text-gray-900 dark:text-white break-all">
              {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}
            </p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-300">Anon Key:</span>
            <p className="font-mono text-gray-900 dark:text-white">
              {import.meta.env.VITE_SUPABASE_ANON_KEY ? '***configured***' : 'Not configured'}
            </p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-300">Service Role:</span>
            <p className="font-mono text-gray-900 dark:text-white">
              {import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '***configured***' : 'Not configured'}
            </p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-300">Storage Buckets:</span>
            <p className="font-mono text-gray-900 dark:text-white">
              Create manually in Dashboard
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Storage Setup Instructions</h4>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>1. Go to Storage in your Supabase Dashboard</li>
            <li>2. Create bucket: <code>avatars</code> (public, 5MB limit)</li>
            <li>3. Create bucket: <code>battle-exports</code> (private, 10MB limit)</li>
            <li>4. Policies will be created automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'features', label: 'Features', icon: Settings },
    { id: 'database', label: 'Database', icon: Database }
  ];

  const stats = [
    {
      label: 'Total Users',
      value: users.length,
      change: '+12%',
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Total Battles',
      value: battles.length,
      change: '+8%',
      icon: Zap,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'Premium Users',
      value: users.filter((u: any) => u.plan === 'premium').length,
      change: '+25%',
      icon: Crown,
      color: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      label: 'Revenue',
      value: '₹12,450',
      change: '+18%',
      icon: DollarSign,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  const toggleFeatureFlag = (flag: string) => {
    setFeatureFlags(prev => ({
      ...prev,
      [flag]: !prev[flag as keyof typeof prev]
    }));
  };

  const handleRunDatabaseTests = async () => {
    setRunningTests(true);
    toast.loading('Running database tests...');
    
    try {
      const results = await runDatabaseTests();
      setTestResults(results);
      const summary = displayTestResults(results);
      
      toast.dismiss();
      if (summary.allPassed) {
        toast.success(`All ${summary.totalCount} database tests passed!`);
      } else {
        toast.error(`${summary.passCount}/${summary.totalCount} tests passed. Check console for details.`);
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to run database tests');
      console.error('Database test error:', error);
    } finally {
      setRunningTests(false);
    }
  };

  const handleRunComprehensiveTests = async () => {
    setRunningComprehensive(true);
    toast.loading('Running COMPREHENSIVE E2E tests - this will take 2-3 minutes...');
    
    try {
      const results = await runComprehensiveE2ETests();
      setComprehensiveResults(results);
      
      const passedCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      const criticalFailures = results.filter(r => !r.success && r.critical).length;
      
      toast.dismiss();
      if (criticalFailures === 0 && passedCount === totalCount) {
        toast.success(`🎉 ALL ${totalCount} E2E TESTS PASSED! Your app is production-ready!`);
      } else if (criticalFailures === 0) {
        toast.success(`✅ Core functionality working! ${passedCount}/${totalCount} tests passed.`);
      } else {
        toast.error(`🚨 ${criticalFailures} critical failures found! ${passedCount}/${totalCount} tests passed.`);
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to run E2E tests');
      console.error('E2E test error:', error);
    } finally {
      setRunningComprehensive(false);
    }
  };
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Comprehensive Tests */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Comprehensive End-to-End Tests
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Complete validation of frontend, backend, security, performance, and data integrity
              </p>
            </div>
            <button
              onClick={handleRunComprehensiveTests}
              disabled={runningComprehensive}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>{runningComprehensive ? 'Running E2E Tests (2-3 min)...' : 'Run Complete E2E Suite'}</span>
            </button>
          </div>
        </div>
        
        {comprehensiveResults.length > 0 && (
          <div className="p-6">
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                E2E Test Results ({comprehensiveResults.filter(r => r.success).length}/{comprehensiveResults.length} passed)
              </h4>
              
              {/* Critical Failures Alert */}
              {comprehensiveResults.filter(r => !r.success && r.critical).length > 0 && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 dark:text-red-400 font-bold">🚨 CRITICAL FAILURES DETECTED</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {comprehensiveResults.filter(r => !r.success && r.critical).length} critical issues found that must be addressed before production.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[...new Set(comprehensiveResults.map(r => r.category))].map(category => {
                  const categoryTests = comprehensiveResults.filter(r => r.category === category);
                  const passed = categoryTests.filter(r => r.success).length;
                  const total = categoryTests.length;
                  const criticalFailed = categoryTests.filter(r => !r.success && r.critical).length;
                  const percentage = (passed / total) * 100;
                  
                  const getProgressBarColor = (percentage: number) => {
                    if (criticalFailed > 0) return 'bg-red-500';
                    if (percentage === 100) return 'bg-green-500';
                    if (percentage >= 80) return 'bg-yellow-500';
                    return 'bg-orange-500';
                  };
                  
                  return (
                    <div key={category} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {category}
                        {criticalFailed > 0 && <span className="text-red-500 ml-1">🚨</span>}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">{passed}/{total} passed</div>
                      {criticalFailed > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400">{criticalFailed} critical</div>
                      )}
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${getProgressBarColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {comprehensiveResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${result.critical && !result.success ? 'border-red-500 bg-red-50 dark:bg-red-900/30' :
                    result.success
                      ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      result.critical && !result.success ? 'text-red-800 dark:text-red-200' :
                      result.success
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {result.success ? '✅' : (result.critical ? '🚨' : '❌')} {result.category}: {result.test}
                      {result.critical && !result.success && <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded">CRITICAL</span>}
                    </span>
                    {result.duration && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {result.duration}ms
                      </span>
                    )}
                  </div>
                  {result.error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {result.critical ? '🚨 CRITICAL ERROR: ' : 'Error: '}{result.error}
                    </p>
                  )}
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                        View Details
                      </summary>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Basic Database Tests */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Basic Database Health Check
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Quick test of basic database operations
              </p>
            </div>
            <button
              onClick={handleRunDatabaseTests}
              disabled={runningTests}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>{runningTests ? 'Running Basic Tests...' : 'Run Basic Tests'}</span>
            </button>
          </div>
        </div>
        
        {testResults.length > 0 && (
          <div className="p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              Test Results ({testResults.filter(r => r.success).length}/{testResults.length} passed)
            </h4>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success
                      ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      result.success
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {result.success ? '✅' : '❌'} {result.test}
                    </span>
                  </div>
                  {result.error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      Error: {result.error}
                    </p>
                  )}
                  {result.data && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Data: {JSON.stringify(result.data, null, 2)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                  {stat.change} from last month
                </p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Battles
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {battles.slice(0, 5).map((battle) => (
            <div key={battle.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-white font-medium mb-1 line-clamp-1">
                    "{battle.prompt}"
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{battle.models.length} models</span>
                    <span>{new Date(battle.createdAt).toLocaleDateString('en-IN')}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      battle.status === 'completed' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {battle.status}
                    </span>
                  </div>
                </div>
                <button className="ml-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          User Management
        </h3>
      </div>
      {loadingUsers ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading users...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Active
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((userData: any) => (
              <tr key={userData.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {userData.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {userData.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    userData.plan === 'premium'
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}>
                    {userData.plan === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                    {userData.plan}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {userData.plan === 'premium' ? 'Unlimited' : `${userData.battles_used}/${userData.battles_limit}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(userData.created_at).toLocaleDateString('en-IN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(userData.updated_at).toLocaleDateString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );

  const renderFeaturesTab = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Feature Flags
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Control which features are available to users
        </p>
      </div>
      <div className="p-6 space-y-4">
        {Object.entries(featureFlags).map(([key, value]) => {
          const labels = {
            newBattleMode: 'New Battle Mode',
            advancedJudging: 'Advanced AI Judging',
            apiAccess: 'API Access',
            teamFeatures: 'Team Collaboration Features'
          };

          const descriptions = {
            newBattleMode: 'Enable experimental battle modes for all users',
            advancedJudging: 'Use advanced AI models for judging battles',
            apiAccess: 'Allow users to access the PBA API',
            teamFeatures: 'Enable team collaboration and sharing features'
          };

          return (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {labels[key as keyof typeof labels]}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {descriptions[key as keyof typeof descriptions]}
                </p>
              </div>
              <button
                onClick={() => toggleFeatureFlag(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Panel
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Manage users, monitor system performance, and control features
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'features' && renderFeaturesTab()}
            {activeTab === 'database' && renderDatabaseTab()}
          </div>
        </div>
      </div>
    </div>
  );
}