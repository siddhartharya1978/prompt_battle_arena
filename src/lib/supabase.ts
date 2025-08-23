import { createClient } from '@supabase/supabase-js';

// Use actual Supabase instance
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using demo mode.');
  // Provide fallback values for development
  const fallbackUrl = 'https://demo.supabase.co';
  const fallbackKey = 'demo-key';
  // Create client with fallback values for demo mode
  var supabase = createClient(fallbackUrl, fallbackKey);
} else {
  // Create client with actual environment variables
  var supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          plan: 'free' | 'premium';
          role: 'user' | 'admin';
          battles_used: number;
          battles_limit: number;
          last_reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          plan?: 'free' | 'premium';
          role?: 'user' | 'admin';
          battles_used?: number;
          battles_limit?: number;
          last_reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          plan?: 'free' | 'premium';
          role?: 'user' | 'admin';
          battles_used?: number;
          battles_limit?: number;
          last_reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      battles: {
        Row: {
          id: string;
          user_id: string;
          battle_type: 'prompt' | 'response';
          prompt: string;
          final_prompt: string | null;
          prompt_category: string;
          models: string[];
          mode: 'standard' | 'turbo';
          battle_mode: 'auto' | 'manual';
          rounds: number;
          max_tokens: number;
          temperature: number;
          status: 'running' | 'completed' | 'failed';
          winner: string | null;
          total_cost: number;
          auto_selection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          battle_type: 'prompt' | 'response';
          prompt: string;
          final_prompt?: string | null;
          prompt_category: string;
          models: string[];
          mode: 'standard' | 'turbo';
          battle_mode: 'auto' | 'manual';
          rounds: number;
          max_tokens: number;
          temperature: number;
          status?: 'running' | 'completed' | 'failed';
          winner?: string | null;
          total_cost?: number;
          auto_selection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          battle_type?: 'prompt' | 'response';
          prompt?: string;
          final_prompt?: string | null;
          prompt_category?: string;
          models?: string[];
          mode?: 'standard' | 'turbo';
          battle_mode?: 'auto' | 'manual';
          rounds?: number;
          max_tokens?: number;
          temperature?: number;
          status?: 'running' | 'completed' | 'failed';
          winner?: string | null;
          total_cost?: number;
          auto_selection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      battle_responses: {
        Row: {
          id: string;
          battle_id: string;
          model_id: string;
          response: string;
          latency: number;
          tokens: number;
          cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          battle_id: string;
          model_id: string;
          response: string;
          latency: number;
          tokens: number;
          cost: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          battle_id?: string;
          model_id?: string;
          response?: string;
          latency?: number;
          tokens?: number;
          cost?: number;
          created_at?: string;
        };
      };
      battle_scores: {
        Row: {
          id: string;
          battle_id: string;
          model_id: string;
          accuracy: number;
          reasoning: number;
          structure: number;
          creativity: number;
          overall: number;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          battle_id: string;
          model_id: string;
          accuracy: number;
          reasoning: number;
          structure: number;
          creativity: number;
          overall: number;
          notes: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          battle_id?: string;
          model_id?: string;
          accuracy?: number;
          reasoning?: number;
          structure?: number;
          creativity?: number;
          overall?: number;
          notes?: string;
          created_at?: string;
        };
      };
      prompt_evolution: {
        Row: {
          id: string;
          battle_id: string;
          round: number;
          prompt: string;
          model_id: string;
          improvements: string[];
          score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          battle_id: string;
          round: number;
          prompt: string;
          model_id: string;
          improvements: string[];
          score: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          battle_id?: string;
          round?: number;
          prompt?: string;
          model_id?: string;
          improvements?: string[];
          score?: number;
          created_at?: string;
        };
      };
    };
  };
}