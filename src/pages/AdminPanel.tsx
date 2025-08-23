import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBattle } from '../contexts/BattleContext';
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
  ToggleRight
} from 'lucide-react';

export default function AdminPanel() {
  const { user } = useAuth();
  const { battles } = useBattle();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock admin data
  const mockUsers = [
    {
      id: 'user_1',
      name: 'Arjun Sharma',
      email: 'arjun@example.com',
      plan: 'free',
      battlesUsed: 2,
      battlesLimit: 3,
      joinedAt: '2024-01-15T10:30:00.000Z',
      lastActive: '2024-01-20T14:30:00.000Z'
    },
    {
      id: 'user_2',
      name: 'Priya Patel',
      email: 'priya@example.com',
      plan: 'premium',
      battlesUsed: 15,
      battlesLimit: -1,
      joinedAt: '2024-01-10T08:15:00.000Z',
      lastActive: '2024-01-20T16:45:00.000Z'
    },
    {
      id: 'user_3',
      name: 'Rahul Kumar',
      email: 'rahul@example.com',
      plan: 'free',
      battlesUsed: 3,
      battlesLimit: 3,
      joinedAt: '2024-01-18T12:00:00.000Z',
      lastActive: '2024-01-19T10:20:00.000Z'
    }
  ];

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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'features', label: 'Features', icon: Settings }
  ];

  const stats = [
    {
      label: 'Total Users',
      value: mockUsers.length,
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
      value: mockUsers.filter(u => u.plan === 'premium').length,
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

  const renderOverviewTab = () => (
    <div className="space-y-6">
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
            {mockUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.plan === 'premium'
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}>
                    {user.plan === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                    {user.plan}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {user.plan === 'premium' ? 'Unlimited' : `${user.battlesUsed}/${user.battlesLimit}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(user.joinedAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(user.lastActive).toLocaleDateString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}