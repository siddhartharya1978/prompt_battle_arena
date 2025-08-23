import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Zap, 
  Target, 
  Brain, 
  Hand, 
  Edit3, 
  MessageSquare,
  ArrowRight,
  Play,
  ChevronRight
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to Prompt Battle Arena!",
      content: (
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            PBA is the ultimate platform for comparing AI model performance through structured battles. 
            Pit the world's best LLM models against each other and discover which one truly excels at your prompts.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Perfect for:</strong> Content creators, developers, researchers, and anyone who wants to find the best AI model for their specific needs.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Two Types of Battles",
      content: (
        <div className="space-y-4">
          <div className="border border-purple-200 dark:border-purple-700 rounded-xl p-4 bg-purple-50 dark:bg-purple-900/20">
            <div className="flex items-center space-x-2 mb-2">
              <Edit3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-semibold text-purple-900 dark:text-purple-100">Prompt Battle</h4>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Models compete to improve and refine your prompt itself. Watch as your initial prompt evolves into a perfectly crafted instruction through multiple rounds of AI refinement.
            </p>
          </div>
          
          <div className="border border-blue-200 dark:border-blue-700 rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Response Battle</h4>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Models compete to generate the best response to your prompt. Compare creativity, accuracy, and reasoning across different AI models to find the perfect answer.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Auto vs Manual Mode",
      content: (
        <div className="space-y-4">
          <div className="border border-green-200 dark:border-green-700 rounded-xl p-4 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-green-900 dark:text-green-100">Auto Mode</h4>
              <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full">
                Recommended
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mb-2">
              AI automatically selects the best models for your prompt and runs iterative battles until achieving a 10/10 score.
            </p>
            <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
              <li>• Smart model selection based on your prompt</li>
              <li>• Automatic iterative improvement</li>
              <li>• Continues until optimal results</li>
            </ul>
          </div>
          
          <div className="border border-purple-200 dark:border-purple-700 rounded-xl p-4 bg-purple-50 dark:bg-purple-900/20">
            <div className="flex items-center space-x-2 mb-2">
              <Hand className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-semibold text-purple-900 dark:text-purple-100">Manual Mode</h4>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
              You choose the models, rounds, and settings. Perfect for specific comparisons or when you want full control.
            </p>
            <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
              <li>• Choose 2-3 specific models</li>
              <li>• Control battle parameters</li>
              <li>• Direct model comparison</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Ready to Start?",
      content: (
        <div className="text-center space-y-4">
          <Target className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-gray-600 dark:text-gray-300">
            You're all set! Try a demo battle first to see how it works, or jump straight into creating your own battle.
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => {
                onClose();
                navigate('/battle/battle_1/results');
              }}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>View Demo Battle</span>
            </button>
            
            <button
              onClick={() => {
                onClose();
                navigate('/battle/new');
              }}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Target className="w-4 h-4" />
              <span>Create Your First Battle</span>
            </button>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {currentStepData.title}
          </h2>
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Get Started!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}