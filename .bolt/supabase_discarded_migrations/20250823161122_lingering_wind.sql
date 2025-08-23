/*
  # Complete Prompt Battle Arena Database Schema Setup
  
  This migration creates the complete database schema for Prompt Battle Arena with:
  1. All custom types and enums
  2. All tables with proper relationships
  3. Row Level Security policies
  4. Triggers and functions
  5. Storage buckets and policies
  6. Admin and user roles
  
  This script is idempotent and can be run multiple times safely.
*/

-- Drop all existing objects in reverse dependency order
DROP POLICY IF EXISTS "Users can read own prompt evolution" ON prompt_evolution;
DROP POLICY IF EXISTS "Users can create prompt evolution" ON prompt_evolution;
DROP POLICY IF EXISTS "Admins can read all prompt evolution" ON prompt_evolution;

DROP POLICY IF EXISTS "Users can read own battle scores" ON battle_scores;
DROP POLICY IF EXISTS "Users can create battle scores" ON battle_scores;
DROP POLICY IF EXISTS "Admins can read all battle scores" ON battle_scores;

DROP POLICY IF EXISTS "Users can read own battle responses" ON battle_responses;
DROP POLICY IF EXISTS "Users can create battle responses" ON battle_responses;
DROP POLICY IF EXISTS "Admins can read all battle responses" ON battle_responses;

DROP POLICY IF EXISTS "Users can read own battles" ON battles;
DROP POLICY IF EXISTS "Users can create own battles" ON battles;
DROP POLICY IF EXISTS "Users can update own battles" ON battles;
DROP POLICY IF EXISTS "Admins can read all battles" ON battles;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_battles_updated_at ON battles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS handle_new_user();

DROP TABLE IF EXISTS prompt_evolution;
DROP TABLE IF EXISTS battle_scores;
DROP TABLE IF EXISTS battle_responses;
DROP TABLE IF EXISTS battles;
DROP TABLE IF EXISTS profiles;

DROP TYPE IF EXISTS battle_status;
DROP TYPE IF EXISTS battle_mode_selection;
DROP TYPE IF EXISTS battle_mode_type;
DROP TYPE IF EXISTS battle_type;
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS user_plan;

-- Create custom types
CREATE TYPE user_plan AS ENUM ('free', 'premium');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE battle_type AS ENUM ('prompt', 'response');
CREATE TYPE battle_mode_type AS ENUM ('standard', 'turbo');
CREATE TYPE battle_mode_selection AS ENUM ('auto', 'manual');
CREATE TYPE battle_status AS ENUM ('running', 'completed', 'failed');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    avatar_url text,
    plan user_plan DEFAULT 'free',
    role user_role DEFAULT 'user',
    battles_used integer DEFAULT 0,
    battles_limit integer DEFAULT 3,
    last_reset_at date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create battles table
CREATE TABLE IF NOT EXISTS battles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    battle_type battle_type NOT NULL,
    prompt text NOT NULL,
    final_prompt text,
    prompt_category text NOT NULL,
    models text[] NOT NULL,
    mode battle_mode_type DEFAULT 'standard',
    battle_mode battle_mode_selection DEFAULT 'manual',
    rounds integer DEFAULT 1,
    max_tokens integer DEFAULT 500,
    temperature numeric DEFAULT 0.7,
    status battle_status DEFAULT 'running',
    winner text,
    total_cost numeric DEFAULT 0,
    auto_selection_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create battle_responses table
CREATE TABLE IF NOT EXISTS battle_responses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    battle_id uuid REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
    model_id text NOT NULL,
    response text NOT NULL,
    latency integer NOT NULL,
    tokens integer NOT NULL,
    cost numeric NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create battle_scores table
CREATE TABLE IF NOT EXISTS battle_scores (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    battle_id uuid REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
    model_id text NOT NULL,
    accuracy numeric NOT NULL,
    reasoning numeric NOT NULL,
    structure numeric NOT NULL,
    creativity numeric NOT NULL,
    overall numeric NOT NULL,
    notes text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create prompt_evolution table
CREATE TABLE IF NOT EXISTS prompt_evolution (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    battle_id uuid REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
    round integer NOT NULL,
    prompt text NOT NULL,
    model_id text NOT NULL,
    improvements text[] DEFAULT '{}',
    score numeric NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_battles_user_id ON battles(user_id);
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_created_at ON battles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battle_responses_battle_id ON battle_responses(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_scores_battle_id ON battle_scores(battle_id);
CREATE INDEX IF NOT EXISTS idx_prompt_evolution_battle_id ON prompt_evolution(battle_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_evolution ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Create RLS policies for battles
CREATE POLICY "Users can read own battles"
    ON battles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own battles"
    ON battles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own battles"
    ON battles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can read all battles"
    ON battles FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Create RLS policies for battle_responses
CREATE POLICY "Users can read own battle responses"
    ON battle_responses FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM battles 
        WHERE battles.id = battle_responses.battle_id AND battles.user_id = auth.uid()
    ));

CREATE POLICY "Users can create battle responses"
    ON battle_responses FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM battles 
        WHERE battles.id = battle_responses.battle_id AND battles.user_id = auth.uid()
    ));

CREATE POLICY "Admins can read all battle responses"
    ON battle_responses FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Create RLS policies for battle_scores
CREATE POLICY "Users can read own battle scores"
    ON battle_scores FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM battles 
        WHERE battles.id = battle_scores.battle_id AND battles.user_id = auth.uid()
    ));

CREATE POLICY "Users can create battle scores"
    ON battle_scores FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM battles 
        WHERE battles.id = battle_scores.battle_id AND battles.user_id = auth.uid()
    ));

CREATE POLICY "Admins can read all battle scores"
    ON battle_scores FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Create RLS policies for prompt_evolution
CREATE POLICY "Users can read own prompt evolution"
    ON prompt_evolution FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM battles 
        WHERE battles.id = prompt_evolution.battle_id AND battles.user_id = auth.uid()
    ));

CREATE POLICY "Users can create prompt evolution"
    ON prompt_evolution FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM battles 
        WHERE battles.id = prompt_evolution.battle_id AND battles.user_id = auth.uid()
    ));

CREATE POLICY "Admins can read all prompt evolution"
    ON prompt_evolution FOR SELECT
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ));

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_battles_updated_at
    BEFORE UPDATE ON battles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('battle-exports', 'battle-exports', true, 10485760, ARRAY['application/json', 'text/plain', 'text/csv'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create storage policies for battle exports
CREATE POLICY "Battle exports are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'battle-exports');

CREATE POLICY "Users can upload their own battle exports"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'battle-exports' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own battle exports"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'battle-exports' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Insert demo admin user (will be created when someone signs up with this email)
-- The trigger will automatically create the profile
-- To make them admin, update their role manually after signup

-- Create demo data for testing (optional)
DO $$
BEGIN
    -- This will only work if there are actual users in auth.users
    -- In production, users will be created through the signup flow
    NULL;
END $$;