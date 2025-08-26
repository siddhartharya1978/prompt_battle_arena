// BULLETPROOF SUPABASE CLIENT - OMNI-AGENT NEXUS vULTIMA
// Enhanced with error taxonomy, observability, and secret rotation

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Profile } from '../types';
import { errorTaxonomy } from './error-taxonomy';
import { observability } from './observability';
import { securityManager } from './security-manager';

export interface AuthResult {
  success: boolean;
  profile: Profile | null;
  error?: string;
  errorCode?: string;
}

class BulletproofSupabase {
  private static instance: BulletproofSupabase;
  private client: SupabaseClient | null = null;
  private initialized = false;

  static getInstance(): BulletproofSupabase {
    if (!BulletproofSupabase.instance) {
      BulletproofSupabase.instance = new BulletproofSupabase();
    }
    return BulletproofSupabase.instance;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      observability.logError(
        new Error('Missing Supabase configuration'),
        'configuration',
        'supabase_init'
      );
      throw new Error('Supabase configuration missing. Please check environment variables.');
    }

    try {
      this.client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });

      this.initialized = true;
      observability.logSystemEvent('supabase_initialized', 'database', { url: supabaseUrl });
    } catch (error) {
      const classified = errorTaxonomy.handleError(error, 'supabase_initialization');
      throw new Error(classified.userMessage);
    }
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }

  async getSession() {
    await this.initialize();
    if (!this.client) return null;

    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      const classified = errorTaxonomy.handleError(error, 'get_session');
      observability.logError(error, 'auth', 'get_session');
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    await this.initialize();
    if (!this.client) {
      return { success: false, profile: null, error: 'Supabase not initialized' };
    }

    try {
      observability.logUserAction('sign_in_attempt', 'auth', { email_domain: email.split('@')[1] });

      const { data, error } = await this.client.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) throw error;

      if (data.user) {
        const profile = await this.getProfile(data.user.id);
        observability.logUserAction('sign_in_success', 'auth', { user_id: data.user.id });
        securityManager.auditLog('user_login', 'auth', true, { email_domain: email.split('@')[1] }, data.user.id);
        
        return { success: true, profile };
      }

      return { success: false, profile: null, error: 'No user data returned' };
    } catch (error) {
      const classified = errorTaxonomy.handleError(error, 'sign_in');
      observability.logError(error, 'auth', 'sign_in');
      
      return { 
        success: false, 
        profile: null, 
        error: classified.userMessage,
        errorCode: classified.code
      };
    }
  }

  async signUp(email: string, password: string, name: string): Promise<AuthResult> {
    await this.initialize();
    if (!this.client) {
      return { success: false, profile: null, error: 'Supabase not initialized' };
    }

    try {
      observability.logUserAction('sign_up_attempt', 'auth', { email_domain: email.split('@')[1] });

      const { data, error } = await this.client.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            name: name.trim(),
            full_name: name.trim(),
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        observability.logUserAction('sign_up_success', 'auth', { user_id: data.user.id });
        securityManager.auditLog('user_registration', 'auth', true, { email_domain: email.split('@')[1] }, data.user.id);
        
        // Profile will be created by trigger
        return { success: true, profile: null };
      }

      return { success: false, profile: null, error: 'No user data returned' };
    } catch (error) {
      const classified = errorTaxonomy.handleError(error, 'sign_up');
      observability.logError(error, 'auth', 'sign_up');
      
      return { 
        success: false, 
        profile: null, 
        error: classified.userMessage,
        errorCode: classified.code
      };
    }
  }

  async signOut(): Promise<void> {
    if (!this.client) return;

    try {
      const { error } = await this.client.auth.signOut();
      if (error) throw error;
      
      observability.logUserAction('sign_out', 'auth');
      securityManager.auditLog('user_logout', 'auth', true);
    } catch (error) {
      const classified = errorTaxonomy.handleError(error, 'sign_out');
      observability.logError(error, 'auth', 'sign_out');
      throw new Error(classified.userMessage);
    }
  }

  async getProfile(userId: string): Promise<Profile | null> {
    await this.initialize();
    if (!this.client) return null;

    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatar_url,
        plan: data.plan,
        role: data.role,
        battlesUsed: data.battles_used || 0,
        battlesLimit: data.battles_limit || 3,
        lastResetAt: data.last_reset_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      const classified = errorTaxonomy.handleError(error, 'get_profile');
      observability.logError(error, 'database', 'get_profile', userId);
      return null;
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    await this.initialize();
    if (!this.client) return null;

    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
      if (updates.battlesUsed !== undefined) dbUpdates.battles_used = updates.battlesUsed;
      if (updates.lastResetAt !== undefined) dbUpdates.last_reset_at = updates.lastResetAt;
      
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await this.client
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      observability.logUserAction('profile_updated', 'profiles', { fields: Object.keys(updates) }, userId);
      securityManager.auditLog('profile_update', 'profiles', true, { fields: Object.keys(updates) }, userId);

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatar_url,
        plan: data.plan,
        role: data.role,
        battlesUsed: data.battles_used || 0,
        battlesLimit: data.battles_limit || 3,
        lastResetAt: data.last_reset_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      const classified = errorTaxonomy.handleError(error, 'update_profile');
      observability.logError(error, 'database', 'update_profile', userId);
      securityManager.auditLog('profile_update', 'profiles', false, { error: error.message }, userId);
      return null;
    }
  }
}

export const bulletproofSupabase = BulletproofSupabase.getInstance();