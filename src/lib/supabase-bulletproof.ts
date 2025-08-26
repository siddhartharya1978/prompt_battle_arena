// BULLETPROOF SUPABASE INTEGRATION - ZERO TOLERANCE FOR FAILURES
// Comprehensive error handling, fallbacks, and recovery mechanisms

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile, Battle, transformProfileFromDB, transformBattleFromDB } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
}

export interface SupabaseHealth {
  connected: boolean;
  authenticated: boolean;
  profileAccess: boolean;
  battleAccess: boolean;
  storageAccess: boolean;
  errors: string[];
  warnings: string[];
}

class BulletproofSupabase {
  private static instance: BulletproofSupabase;
  private client: SupabaseClient | null = null;
  private adminClient: SupabaseClient | null = null;
  private config: SupabaseConfig | null = null;
  private healthCache: SupabaseHealth | null = null;
  private lastHealthCheck = 0;
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute

  static getInstance(): BulletproofSupabase {
    if (!BulletproofSupabase.instance) {
      BulletproofSupabase.instance = new BulletproofSupabase();
    }
    return BulletproofSupabase.instance;
  }

  // BULLETPROOF INITIALIZATION
  async initialize(): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      console.log('🔧 [Supabase] BULLETPROOF INITIALIZATION STARTING...');
      
      // Step 1: Validate environment variables
      const url = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      if (!url || url.trim() === '') {
        errors.push('VITE_SUPABASE_URL is missing or empty');
      } else if (!url.includes('.supabase.co') && !url.includes('localhost')) {
        errors.push(`Invalid Supabase URL format: ${url}`);
      }
      
      if (!anonKey || anonKey.trim() === '') {
        errors.push('VITE_SUPABASE_ANON_KEY is missing or empty');
      } else if (!anonKey.includes('.') || anonKey.length < 100) {
        errors.push('VITE_SUPABASE_ANON_KEY appears to be invalid (should be a JWT token)');
      }
      
      if (errors.length > 0) {
        console.error('❌ [Supabase] Environment validation failed:', errors);
        return { success: false, errors };
      }
      
      // Step 2: Create clients with enhanced configuration
      this.config = { url: url.trim(), anonKey: anonKey.trim(), serviceKey };
      
      this.client = createClient(this.config.url, this.config.anonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        },
        global: {
          headers: {
            'x-client-info': 'pba-app/1.0.0'
          }
        },
        db: {
          schema: 'public'
        }
      });
      
      if (serviceKey) {
        this.adminClient = createClient(this.config.url, serviceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
      }
      
      // Step 3: Test connection
      const healthCheck = await this.checkHealth();
      if (!healthCheck.connected) {
        errors.push('Failed to connect to Supabase');
        return { success: false, errors };
      }
      
      console.log('✅ [Supabase] BULLETPROOF INITIALIZATION COMPLETE');
      return { success: true, errors: [] };
      
    } catch (error) {
      const errorMsg = `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error('❌ [Supabase] Initialization error:', error);
      return { success: false, errors };
    }
  }

  // BULLETPROOF HEALTH CHECK
  async checkHealth(forceRefresh = false): Promise<SupabaseHealth> {
    const now = Date.now();
    
    if (!forceRefresh && this.healthCache && (now - this.lastHealthCheck) < this.HEALTH_CHECK_INTERVAL) {
      return this.healthCache;
    }
    
    const health: SupabaseHealth = {
      connected: false,
      authenticated: false,
      profileAccess: false,
      battleAccess: false,
      storageAccess: false,
      errors: [],
      warnings: []
    };
    
    if (!this.client) {
      health.errors.push('Supabase client not initialized');
      return health;
    }
    
    try {
      // Test 1: Basic connection
      const { data, error } = await this.client.from('profiles').select('count').limit(1);
      if (error) {
        health.errors.push(`Connection test failed: ${error.message}`);
      } else {
        health.connected = true;
        health.profileAccess = true;
      }
      
      // Test 2: Authentication status
      const { data: session } = await this.client.auth.getSession();
      health.authenticated = !!session.session;
      
      // Test 3: Battle table access
      try {
        const { error: battleError } = await this.client.from('battles').select('count').limit(1);
        if (battleError) {
          health.warnings.push(`Battle table access issue: ${battleError.message}`);
        } else {
          health.battleAccess = true;
        }
      } catch (error) {
        health.warnings.push('Battle table access test failed');
      }
      
      // Test 4: Storage access (non-critical)
      try {
        const { data: buckets } = await this.client.storage.listBuckets();
        health.storageAccess = !!buckets;
      } catch (error) {
        health.warnings.push('Storage access limited');
      }
      
    } catch (error) {
      health.errors.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    this.healthCache = health;
    this.lastHealthCheck = now;
    return health;
  }

  // BULLETPROOF AUTHENTICATION
  async signIn(email: string, password: string): Promise<{ user: any; profile: Profile | null }> {
    if (!this.client) {
      throw new Error('Supabase not initialized');
    }
    
    console.log('🔐 [Supabase] BULLETPROOF SIGN IN for:', email);
    
    try {
      // Step 1: Authenticate with Supabase
      const { data, error } = await this.client.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });
      
      if (error) {
        console.error('❌ [Supabase] Auth failed:', error);
        throw new Error(`Authentication failed: ${error.message}`);
      }
      
      if (!data.user) {
        throw new Error('No user returned from authentication');
      }
      
      console.log('✅ [Supabase] Authentication successful for:', data.user.email);
      
      // Step 2: Get or create profile with bulletproof logic
      let profile: Profile | null = null;
      
      try {
        console.log('👤 [Supabase] Fetching profile for user:', data.user.id);
        const { data: profileData, error: profileError } = await this.client
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('❌ [Supabase] Profile fetch error:', profileError);
          throw profileError;
        }
        
        if (profileData) {
          console.log('✅ [Supabase] Profile found:', profileData.email);
          profile = transformProfileFromDB(profileData);
        } else {
          console.log('📝 [Supabase] No profile found, creating one...');
          
          // Create missing profile
          const newProfileData = {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
            avatar_url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
            plan: 'free' as const,
            role: data.user.email === 'admin@pba.com' ? 'admin' as const : 'user' as const,
            battles_used: 0,
            battles_limit: data.user.email === 'admin@pba.com' ? 999 : 3,
            last_reset_at: new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { data: insertedProfile, error: insertError } = await this.client
            .from('profiles')
            .insert(newProfileData)
            .select()
            .single();
          
          if (insertError) {
            console.error('❌ [Supabase] Profile creation failed:', insertError);
            // Create fallback profile object instead of failing
            profile = {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
              avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
              plan: 'free',
              role: 'user',
              battlesUsed: 0,
              battlesLimit: 3,
              lastResetAt: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            console.log('🔄 [Supabase] Using fallback profile due to insert failure');
          } else {
            console.log('✅ [Supabase] Profile created successfully');
            profile = transformProfileFromDB(insertedProfile);
          }
        }
        
      } catch (profileError) {
        console.error('❌ [Supabase] Profile handling failed:', profileError);
        
        // CRITICAL: Create emergency profile to prevent infinite loading
        profile = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
          avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
          plan: 'free',
          role: 'user',
          battlesUsed: 0,
          battlesLimit: 3,
          lastResetAt: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.log('🚨 [Supabase] EMERGENCY: Using fallback profile to prevent infinite loading');
      }
      
      console.log('🎉 [Supabase] SIGN IN COMPLETE SUCCESS');
      return { user: data.user, profile };
      
    } catch (error) {
      console.error('💥 [Supabase] SIGN IN FAILED:', error);
      throw error;
    }
  }

  // BULLETPROOF PROFILE OPERATIONS
  async getProfile(userId: string): Promise<Profile | null> {
    if (!this.client || !userId) return null;
    
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch error:', error);
        return null;
      }
      
      return data ? transformProfileFromDB(data) : null;
    } catch (error) {
      console.error('Profile fetch failed:', error);
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    if (!this.client || !userId) return null;
    
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
      if (updates.battlesUsed !== undefined) dbUpdates.battles_used = updates.battlesUsed;
      
      dbUpdates.updated_at = new Date().toISOString();
      
      const { data, error } = await this.client
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return transformProfileFromDB(data);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  // BULLETPROOF BATTLE OPERATIONS
  async saveBattle(battle: Battle): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Supabase not initialized' };
    }
    
    try {
      console.log('💾 [Supabase] BULLETPROOF BATTLE SAVE:', battle.id);
      
      // Step 1: Save main battle record
      const { error: battleError } = await this.client
        .from('battles')
        .upsert({
          id: battle.id,
          user_id: battle.userId,
          battle_type: battle.battleType,
          prompt: battle.prompt,
          final_prompt: battle.finalPrompt,
          prompt_category: battle.promptCategory,
          models: battle.models,
          mode: battle.mode,
          battle_mode: battle.battleMode,
          rounds: battle.rounds,
          max_tokens: battle.maxTokens,
          temperature: battle.temperature,
          status: battle.status,
          winner: battle.winner,
          total_cost: battle.totalCost,
          auto_selection_reason: battle.autoSelectionReason,
          created_at: battle.createdAt,
          updated_at: battle.updatedAt
        });
      
      if (battleError) {
        console.error('❌ [Supabase] Battle save failed:', battleError);
        return { success: false, error: battleError.message };
      }
      
      // Step 2: Save responses (if any)
      if (battle.responses && battle.responses.length > 0) {
        const { error: responsesError } = await this.client
          .from('battle_responses')
          .upsert(battle.responses.map(r => ({
            id: r.id,
            battle_id: r.battleId,
            model_id: r.modelId,
            response: r.response,
            latency: r.latency,
            tokens: r.tokens,
            cost: r.cost,
            created_at: r.createdAt
          })));
        
        if (responsesError) {
          console.warn('⚠️ [Supabase] Responses save failed:', responsesError);
          // Don't fail entire operation for responses
        }
      }
      
      // Step 3: Save scores (if any)
      if (battle.scores && Object.keys(battle.scores).length > 0) {
        const scoreEntries = Object.entries(battle.scores).map(([modelId, score]) => ({
          id: `score_${battle.id}_${modelId}`,
          battle_id: battle.id,
          model_id: modelId,
          accuracy: score.accuracy,
          reasoning: score.reasoning,
          structure: score.structure,
          creativity: score.creativity,
          overall: score.overall,
          notes: score.notes,
          created_at: new Date().toISOString()
        }));
        
        const { error: scoresError } = await this.client
          .from('battle_scores')
          .upsert(scoreEntries);
        
        if (scoresError) {
          console.warn('⚠️ [Supabase] Scores save failed:', scoresError);
          // Don't fail entire operation for scores
        }
      }
      
      console.log('✅ [Supabase] Battle saved successfully:', battle.id);
      return { success: true };
      
    } catch (error) {
      const errorMsg = `Battle save failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ [Supabase] Battle save error:', error);
      return { success: false, error: errorMsg };
    }
  }

  async getBattles(userId: string): Promise<{ battles: Battle[]; error?: string }> {
    if (!this.client || !userId) {
      return { battles: [], error: 'Invalid parameters' };
    }
    
    try {
      const { data, error } = await this.client
        .from('battles')
        .select(`
          *,
          battle_responses(*),
          battle_scores(*),
          prompt_evolution(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ [Supabase] Battles fetch failed:', error);
        return { battles: [], error: error.message };
      }
      
      const battles = (data || []).map(transformBattleFromDB).filter(Boolean);
      console.log('✅ [Supabase] Fetched battles:', battles.length);
      return { battles };
      
    } catch (error) {
      const errorMsg = `Battles fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ [Supabase] Battles fetch error:', error);
      return { battles: [], error: errorMsg };
    }
  }

  // BULLETPROOF SESSION MANAGEMENT
  async getSession() {
    if (!this.client) return null;
    
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) {
        console.error('Session fetch error:', error);
        return null;
      }
      return data.session;
    } catch (error) {
      console.error('Session fetch failed:', error);
      return null;
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Supabase not initialized' };
    }
    
    try {
      const { error } = await this.client.auth.signOut();
      if (error) {
        console.error('❌ [Supabase] Sign out error:', error);
        // Force local sign out even if API fails
        await this.client.auth.signOut({ scope: 'local' });
        return { success: true }; // Consider it successful if local logout works
      }
      
      console.log('✅ [Supabase] Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('❌ [Supabase] Sign out failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // GETTERS
  getClient(): SupabaseClient | null {
    return this.client;
  }

  getAdminClient(): SupabaseClient | null {
    return this.adminClient;
  }

  isInitialized(): boolean {
    return !!this.client;
  }

  getConfig(): SupabaseConfig | null {
    return this.config;
  }
}

// Export singleton instance
export const bulletproofSupabase = BulletproofSupabase.getInstance();

// Initialize immediately
bulletproofSupabase.initialize().then(result => {
  if (result.success) {
    console.log('🎉 [Supabase] BULLETPROOF INITIALIZATION SUCCESS');
  } else {
    console.error('💥 [Supabase] INITIALIZATION FAILED:', result.errors);
  }
});

// Export legacy interface for compatibility
export const supabase = bulletproofSupabase.getClient();
export const supabaseAdmin = bulletproofSupabase.getAdminClient();