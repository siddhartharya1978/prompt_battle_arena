import React, { useState } from 'react';
import { MessageCircle, X, Send, Star, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { systemMonitor, SystemHealth } from '../lib/system-monitor';

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [email, setEmail] = useState('');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [showSystemStatus, setShowSystemStatus] = useState(false);

  // Load system health when widget opens
  React.useEffect(() => {
    if (isOpen) {
      systemMonitor.getSystemHealth().then(setSystemHealth);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced feedback submission with system context
    const feedbackData = {
      rating,
      feedback,
      email,
      systemHealth,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // In a real app, this would send to your feedback API
    console.log('Feedback submitted:', feedbackData);
    
    // Show contextual success message
    if (rating >= 4) {
      toast.success('🎉 Thank you for the positive feedback! We\'re glad you\'re enjoying PBA.');
    } else if (rating >= 2) {
      toast.success('📝 Thank you for your feedback! We\'ll work on improving your experience.');
    } else {
      toast.success('🔧 Thank you for reporting issues! Our team will investigate and improve the system.');
    }
    
    // Reset form
    setFeedback('');
    setRating(0);
    setEmail('');
    setIsOpen(false);
  };

  const handleSystemStatusToggle = () => {
    setShowSystemStatus(!showSystemStatus);
    if (!systemHealth) {
      systemMonitor.getSystemHealth().then(setSystemHealth);
    }
  };

  const handleExternalFeedback = () => {
    // Replace with your actual feedback form URL
    window.open('https://forms.google.com/your-feedback-form', '_blank');
    setIsOpen(false);
  };

  return (
    <>
      {/* Feedback Button */}
      <div className="fixed bottom-6 right-6 z-40 space-y-3">
        {/* System Status Indicator */}
        {systemHealth && (
          <button
            onClick={handleSystemStatusToggle}
            className={`p-2 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${
              systemHealth.overall === 'excellent' ? 'bg-green-600 hover:bg-green-700' :
              systemHealth.overall === 'good' ? 'bg-blue-600 hover:bg-blue-700' :
              systemHealth.overall === 'degraded' ? 'bg-yellow-600 hover:bg-yellow-700' :
              'bg-red-600 hover:bg-red-700'
            } text-white`}
            title={`System Status: ${systemHealth.overall}`}
          >
            {systemHealth.overall === 'excellent' ? <CheckCircle className="w-5 h-5" /> :
             systemHealth.overall === 'good' ? <TrendingUp className="w-5 h-5" /> :
             <AlertTriangle className="w-5 h-5" />}
          </button>
        )}
        
        {/* Feedback Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
          title="Leave Feedback"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      {/* System Status Panel */}
      {showSystemStatus && systemHealth && (
        <div className="fixed bottom-24 right-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80 z-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">System Status</h4>
            <button
              onClick={() => setShowSystemStatus(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className={`p-3 rounded-lg mb-3 ${
            systemHealth.overall === 'excellent' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' :
            systemHealth.overall === 'good' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' :
            systemHealth.overall === 'degraded' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700' :
            'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {systemHealth.overall === 'excellent' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
               systemHealth.overall === 'good' ? <TrendingUp className="w-4 h-4 text-blue-600" /> :
               <AlertTriangle className="w-4 h-4 text-yellow-600" />}
              <span className={`font-medium text-sm ${
                systemHealth.overall === 'excellent' ? 'text-green-800 dark:text-green-200' :
                systemHealth.overall === 'good' ? 'text-blue-800 dark:text-blue-200' :
                systemHealth.overall === 'degraded' ? 'text-yellow-800 dark:text-yellow-200' :
                'text-red-800 dark:text-red-200'
              }`}>
                Overall: {systemHealth.overall}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(systemHealth.components).map(([component, status]) => (
                <div key={component} className="flex items-center space-x-1">
                  <span className={
                    status === 'healthy' ? 'text-green-600' :
                    status === 'degraded' ? 'text-yellow-600' :
                    'text-red-600'
                  }>
                    {status === 'healthy' ? '✅' : status === 'degraded' ? '⚠️' : '❌'}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 capitalize">{component}</span>
                </div>
              ))}
            </div>
          </div>
          
          {systemHealth.recommendations.length > 0 && (
            <div className="space-y-1">
              {systemHealth.recommendations.slice(0, 3).map((rec, idx) => (
                <p key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                  • {rec}
                </p>
              ))}
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setShowSystemStatus(false);
                setIsOpen(true);
              }}
              className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Report an issue →
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Share Your Feedback & Experience
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* System Context */}
              {systemHealth && systemHealth.overall !== 'excellent' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                    <strong>System Status:</strong> {systemHealth.overall}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    We've detected some system issues. Your feedback helps us improve reliability.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How would you rate your experience?
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1 transition-colors ${
                        star <= rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tell us about your experience
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={
                    rating >= 4 ? "What did you like most? Any suggestions for improvement?" :
                    rating >= 2 ? "What could we improve? Any specific issues you encountered?" :
                    "Please describe any issues, errors, or problems you experienced. This helps us fix them quickly."
                  }
                  className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {rating < 3 ? 'Detailed issue reports help us fix problems faster' : 'Your feedback helps us improve PBA for everyone'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  We'll only use this to follow up on your feedback
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Feedback</span>
                </button>
                <button
                  type="button"
                  onClick={handleExternalFeedback}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Bug Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}