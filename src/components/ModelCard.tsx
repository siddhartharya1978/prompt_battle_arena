import React, { useState } from 'react';
import { Model } from '../types';
import { 
  ExternalLink, 
  Info, 
  Clock, 
  Zap, 
  Shield, 
  Star,
  CheckCircle,
  AlertTriangle,
  FileText,
  Crown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ModelCardProps {
  model: Model;
  isSelected?: boolean;
  onToggle?: () => void;
  showSelection?: boolean;
  compact?: boolean;
}

export default function ModelCard({ 
  model, 
  isSelected = false, 
  onToggle, 
  showSelection = false,
  compact = false 
}: ModelCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string, reliability: string) => {
    if (status === 'production' && reliability === 'high') return 'text-green-600 dark:text-green-400';
    if (status === 'production') return 'text-blue-600 dark:text-blue-400';
    if (status === 'preview' && reliability === 'experimental') return 'text-orange-600 dark:text-orange-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  const getStatusIcon = (status: string, reliability: string) => {
    if (status === 'production' && reliability === 'high') return <CheckCircle className="w-4 h-4" />;
    if (status === 'production') return <Shield className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  if (compact) {
    return (
      <div
        className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
        }`}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{model.icon}</span>
            <div>
              <h3 className={`font-medium text-sm ${
                isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
              }`}>
                {model.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{model.provider}</p>
            </div>
          </div>
          {isSelected && <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          {model.premium && <Crown className="w-4 h-4 text-yellow-500" />}
        </div>
        
        <div className="flex items-center space-x-2 text-xs">
          <div className={`flex items-center space-x-1 ${getStatusColor(model.status, model.reliability)}`}>
            {getStatusIcon(model.status, model.reliability)}
            <span className="capitalize">{model.status}</span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600 dark:text-gray-300">{model.contextWindow.toLocaleString()} ctx</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-gray-200 dark:border-gray-700'
    } overflow-hidden`}>
      {/* Header */}
      <div className={`p-6 ${
        isSelected 
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20' 
          : 'bg-gray-50 dark:bg-gray-700/50'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{model.icon}</span>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {model.name}
                </h3>
                {model.premium && <Crown className="w-5 h-5 text-yellow-500" />}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{model.provider}</p>
              <div className={`flex items-center space-x-1 mt-1 ${getStatusColor(model.status, model.reliability)}`}>
                {getStatusIcon(model.status, model.reliability)}
                <span className="text-sm font-medium capitalize">{model.status}</span>
                <span className="text-xs">({model.reliability} reliability)</span>
              </div>
            </div>
          </div>
          
          {showSelection && (
            <button
              onClick={onToggle}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
              }`}
            >
              {isSelected ? 'Selected' : 'Select'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
          {model.description}
        </p>

        {/* Key Specs */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Context Window</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {model.contextWindow.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Max Tokens</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {model.maxCompletionTokens.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Speed</p>
              <p className="font-medium text-gray-900 dark:text-white capitalize">
                {model.speed}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Quality</p>
              <p className="font-medium text-gray-900 dark:text-white capitalize">
                {model.quality}
              </p>
            </div>
          </div>
        </div>

        {/* Known For Tags */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Known For:</p>
          <div className="flex flex-wrap gap-2">
            {model.knownFor.map((trait, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Benchmark Strengths */}
        {model.benchmarkStrengths.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Benchmark Strengths:</p>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              {model.benchmarkStrengths.map((strength, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Expandable Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
        >
          <Info className="w-4 h-4" />
          <span>{showDetails ? 'Hide' : 'Show'} Technical Details</span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDetails && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Model ID</p>
                <p className="font-mono text-gray-900 dark:text-white text-xs break-all">
                  {model.id}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Max File Size</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {model.maxFileSize}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Pricing</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  ${model.pricing}/1K tokens
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">API Status</p>
                <p className={`font-medium ${model.available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {model.available ? 'Available' : 'Unavailable'}
                </p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
              <a
                href={`https://console.groq.com/docs/models#${model.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Full Documentation</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}