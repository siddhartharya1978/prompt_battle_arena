import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { updateProfile } from '../lib/auth';
import Navigation from '../components/Navigation';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Trash2, 
  Save,
  Moon,
  Sun,
  Monitor,
  Crown,
  Zap,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { user, logout, updateUserProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face'
  });

  // Update profile data when user changes
  React.useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        avatar_url: user.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face'
      });
    }
  }, [user]);
  // Notification settings
  const [notifications, setNotifications] = useState({
    battleComplete: true,
    dailyReset: true,
    newFeatures: false,
    marketing: false
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Account', icon: Shield }
  ];

  const handleSaveProfile = async () => {
    if (user) {
      if (!profileData.name.trim()) {
        toast.error('Name is required');
        return;
      }
      
      setUploading(true);
      try {
        let avatarUrl = profileData.avatar_url;
        
        // Upload avatar if a new file was selected
        if (avatarFile) {
          try {
            // For demo users, just use a placeholder URL
            const demoSession = localStorage.getItem('demo_session');
            if (demoSession) {
              avatarUrl = URL.createObjectURL(avatarFile);
              toast.success('Avatar updated (demo mode)');
            } else {
              const { uploadAvatar } = await import('../lib/storage');
              avatarUrl = await uploadAvatar(avatarFile, user.id);
            }
          } catch (error) {
            console.error('Avatar upload failed:', error);
            toast.error('Avatar upload failed, but profile will still be updated');
          }
        }
        
        // Check if demo user
        const demoSession = localStorage.getItem('demo_session');
        if (demoSession) {
          // Update demo session
          const updatedUser = {
            ...user,
            name: profileData.name.trim(),
            avatarUrl: avatarUrl
          };
          localStorage.setItem('demo_session', JSON.stringify(updatedUser));
          await updateUserProfile({
            name: profileData.name.trim(),
            avatarUrl: avatarUrl
          });
        } else {
          // Update profile in database
          const { data, error } = await supabase
            .from('profiles')
            .update({
              name: profileData.name.trim(),
              avatar_url: avatarUrl
            })
            .eq('id', user.id)
            .select()
            .single();
          
          if (error) throw error;
          
          // Update the auth context with new profile data
          await updateUserProfile({
            name: profileData.name.trim(),
            avatarUrl: avatarUrl
          });
        }
        
        toast.success('Profile updated successfully!');
        setAvatarFile(null);
      } catch (error) {
        console.error('Profile update error:', error);
        toast.error('Failed to update profile');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar file must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      // Preview the image
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({ ...prev, avatar_url: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    toast.success('Account deletion simulated. In a real app, this would delete the account.');
    setTimeout(() => {
      logout();
    }, 2000);
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Profile Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              <img
                src={profileData.avatar_url}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
              <div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Change Photo
                </label>
                {avatarFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    New avatar selected: {avatarFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={uploading}
            className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5 mr-2" />
            {uploading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Subscription
        </h3>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {user?.plan === 'premium' ? (
                <Crown className="w-6 h-6 text-yellow-500" />
              ) : (
                <Zap className="w-6 h-6 text-gray-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.plan === 'premium' ? 'Premium Plan' : 'Free Plan'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.plan === 'premium' 
                    ? 'Unlimited battles and premium features'
                    : `${user?.battlesUsed || 0}/${user?.battlesLimit || 3} battles used today`
                  }
                </p>
              </div>
            </div>
            {user?.plan === 'free' && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Upgrade
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Theme Preferences
        </h3>
        
        <div className="space-y-3">
          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
              theme === 'light'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Sun className="w-6 h-6 text-yellow-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Light Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Clean and bright interface</p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 ${
              theme === 'light' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'
            }`}>
              {theme === 'light' && <div className="w-full h-full rounded-full bg-white scale-50" />}
            </div>
          </button>

          <button
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Moon className="w-6 h-6 text-blue-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Easy on the eyes</p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 ${
              theme === 'dark' ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'
            }`}>
              {theme === 'dark' && <div className="w-full h-full rounded-full bg-white scale-50" />}
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notification Preferences
        </h3>
        
        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => {
            const labels = {
              battleComplete: 'Battle completion notifications',
              dailyReset: 'Daily usage reset reminders',
              newFeatures: 'New feature announcements',
              marketing: 'Marketing and promotional emails'
            };

            return (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {labels[key as keyof typeof labels]}
                  </p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [key]: !value })}
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
    </div>
  );

  const renderAccountTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Account Information
        </h3>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Member since</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Total battles</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {Math.floor(Math.random() * 50) + 10}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Account ID</span>
            <span className="font-medium text-gray-900 dark:text-white font-mono text-sm">
              {user?.id}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          Danger Zone
        </h3>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                Delete Account
              </h4>
              <p className="text-sm text-red-600 dark:text-red-400">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="ml-4 flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your account preferences and settings
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
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'appearance' && renderAppearanceTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'account' && renderAccountTab()}
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Delete Account
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}