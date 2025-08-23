import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { 
  Check, 
  X, 
  Zap, 
  Crown, 
  Star,
  Users,
  Shield,
  Headphones,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Pricing() {
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for trying out AI battles',
      icon: Zap,
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-800',
      borderColor: 'border-gray-200 dark:border-gray-700',
      features: [
        { name: '3 battles per day', included: true },
        { name: 'Basic models (Llama2, Gemma)', included: true },
        { name: 'Standard judging', included: true },
        { name: 'Battle history (30 days)', included: true },
        { name: 'Basic sharing', included: true },
        { name: 'Premium models', included: false },
        { name: 'Advanced AI judging', included: false },
        { name: 'Priority support', included: false },
        { name: 'Custom battle modes', included: false },
        { name: 'API access', included: false }
      ],
      cta: user?.plan === 'free' ? 'Current Plan' : 'Downgrade',
      disabled: user?.plan === 'free'
    },
    {
      name: 'Premium',
      price: 999,
      period: 'month',
      description: 'Unlimited battles with premium features',
      icon: Crown,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      popular: true,
      features: [
        { name: 'Unlimited battles', included: true },
        { name: 'All premium models (GPT-4, Claude, etc.)', included: true },
        { name: 'Advanced AI judging', included: true },
        { name: 'Unlimited battle history', included: true },
        { name: 'Advanced sharing & exports', included: true },
        { name: 'Custom battle modes', included: true },
        { name: 'Priority support', included: true },
        { name: 'Early access to new features', included: true },
        { name: 'API access (coming soon)', included: true },
        { name: 'Team collaboration (coming soon)', included: true }
      ],
      cta: user?.plan === 'premium' ? 'Current Plan' : 'Upgrade to Premium',
      disabled: user?.plan === 'premium'
    }
  ];

  const handleUpgrade = (planName: string) => {
    if (planName === 'Premium') {
      setShowUpgradeModal(true);
    } else {
      toast.success('Plan change simulated!');
    }
  };

  const handleUpgradeConfirm = () => {
    setShowUpgradeModal(false);
    toast.success('Upgrade simulated! In a real app, this would process payment.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Start free and upgrade when you need more battles. All plans include our core AI battle features.
          </p>
        </div>

        {/* Current Plan Status */}
        {user && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  user.plan === 'premium' 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {user.plan === 'premium' ? (
                    <Crown className="w-6 h-6 text-white" />
                  ) : (
                    <Zap className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Current Plan: {user.plan === 'premium' ? 'Premium' : 'Free'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {user.plan === 'premium' 
                      ? 'Unlimited battles and premium features'
                      : `${user.battles_used}/${user.battles_limit} battles used today`
                    }
                  </p>
                </div>
              </div>
              {user.plan === 'free' && (
                <button
                  onClick={() => handleUpgrade('Premium')}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Upgrade Now
                </button>
              )}
            </div>
          </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl shadow-lg overflow-hidden ${plan.bgColor} ${plan.borderColor} border-2`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                    plan.name === 'Premium' 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <plan.icon className={`w-8 h-8 ${
                      plan.name === 'Premium' ? 'text-white' : plan.color
                    }`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      ₹{plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600 dark:text-gray-300 ml-2">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${
                        feature.included 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={plan.disabled}
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    plan.disabled
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : plan.name === 'Premium'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02]'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                What happens when I reach my daily limit?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Free users can run 3 battles per day. The limit resets at midnight IST. Premium users have unlimited battles.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Yes, you can cancel your Premium subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                What models are included in Premium?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Premium includes access to all available models including GPT-4, Claude, and other cutting-edge LLMs as they become available.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Is there a team plan available?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Team collaboration features are coming soon! Contact us if you're interested in early access for your organization.
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Upgrade to Premium
                </h3>
                    : `${user?.battlesUsed || 0}/${user?.battlesLimit || 3} battles used today`
                  Unlock unlimited battles and premium features for just ₹999/month
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-900 dark:text-white">Unlimited battles</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-900 dark:text-white">All premium models</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-900 dark:text-white">Advanced AI judging</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-900 dark:text-white">Priority support</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgradeConfirm}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}