// MODE INDICATOR - OMNI-AGENT NEXUS
// Demo/Production mode visibility component

import React from 'react';
import { AlertTriangle, Shield, Eye } from 'lucide-react';

interface ModeIndicatorProps {
  mode: 'demo' | 'production';
  className?: string;
}

export default function ModeIndicator({ mode, className = '' }: ModeIndicatorProps) {
  if (mode === 'production') {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium ${className}`}>
        <Shield className="w-3 h-3" />
        <span>Production</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium ${className}`}>
      <Eye className="w-3 h-3" />
      <span>Demo Mode</span>
      <AlertTriangle className="w-3 h-3" />
    </div>
  );
}

// MODE DETECTION HOOK
export const useAppMode = (): 'demo' | 'production' => {
  // Check if using demo data or real Supabase
  const hasSupabaseConfig = !!(
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('demo')
  );

  return hasSupabaseConfig ? 'production' : 'demo';
};