import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Target, 
  Trophy, 
  ArrowRight, 
  Check, 
  Star,
  Play,
  Users,
  BarChart3,
  Shield,
  Eye
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const sampleBattles = [
    {
      id: 1,
      prompt: "Explain quantum computing to a 5-year-old",
      winner: "Llama3 70B",
      score: 9.2,
      participants: 3,
      date: "2 hours ago"
    },
    {
      id: 2,
      prompt: "Write a haiku about artificial intelligence",
      winner: "Mixtral 8x7B",
      score: 8.8,
      participants: 2,
      date: "5 hours ago"
    },
    {
      id: 3,
      prompt: "Create a marketing strategy for sustainable fashion",
      winner: "Gemma 7B",
      score: 9.0,
      participants: 3,
      date: "1 day ago"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Prompt Battle Arena
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                  Let AI Models Battle for Glory
                </div>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-4xl">
            {/* Logo and Branding */}
            <div className="flex items-center justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl mr-6">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Prompt Battle Arena
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Let AI Models Battle for Glory
                </p>
              </div>
            </div>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Pit the world's best LLM models against each other. Get AI-powered judging, 
              detailed scoring, and discover which model truly excels at your prompts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Start a Battle
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button 
                onClick={() => navigate('/battle/battle_1/results')}
                className="inline-flex items-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Eye className="mr-2 w-5 h-5" />
                View Demo Battle
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Three simple steps to discover the best AI model for your needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                1. Enter Your Prompt
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Type your question, creative request, or problem. Our system automatically 
                selects the best models to compete.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2. Models Battle
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Watch as top AI models generate responses in real-time. Each model 
                gives their best shot at your prompt.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3. Get Judged Results
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our AI judge evaluates accuracy, creativity, and structure. See detailed 
                scores and share your battle results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Battles */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Battles
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              See how different AI models perform across various types of prompts
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {sampleBattles.map((battle) => (
              <div key={battle.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {battle.participants} models
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {battle.date}
                  </div>
                </div>
                
                <p className="text-gray-900 dark:text-white font-medium mb-4 line-clamp-2">
                  "{battle.prompt}"
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {battle.winner}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {battle.score}
                      </span>
                    </div>
                  </div>
                  <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                    View Battle →
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/battle/battle_1/results')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors mr-4"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Demo Battle
            </button>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowRight className="ml-2 w-4 h-4" />
              Start Your Battle
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Simple, Transparent Pricing
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Free</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                ₹0<span className="text-lg text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 text-left mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">3 battles per day</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">Basic models</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-600 dark:text-gray-300">Standard judging</span>
                </li>
              </ul>
              <Link
                to="/login"
                className="w-full inline-flex justify-center items-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 shadow-lg text-white relative">
              <div className="absolute top-4 right-4">
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                  Popular
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">Premium</h3>
              <div className="text-3xl font-bold mb-4">
                ₹999<span className="text-lg opacity-80">/month</span>
              </div>
              <ul className="space-y-3 text-left mb-8">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-white mr-3" />
                  <span>Unlimited battles</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-white mr-3" />
                  <span>All premium models</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-white mr-3" />
                  <span>Advanced AI judging</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-white mr-3" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Link
                to="/login"
                className="w-full inline-flex justify-center items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
              >
                Upgrade to Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  PBA
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                The ultimate platform for comparing AI model performance through structured battles.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li><Link to="/pricing" className="hover:text-gray-900 dark:hover:text-white">Pricing</Link></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Careers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              © 2024 Prompt Battle Arena. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}