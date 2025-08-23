/*
  # Complete Database Reset and Migration for Prompt Battle Arena
  
  This migration safely drops all existing objects and recreates the complete schema.
  It is idempotent and can be run multiple times safely.
  
  ## What this migration does:
  1. Drops all existing tables, types, policies, triggers, and functions
  2. Creates clean schema with proper relationships
  3. Sets up Row Level Security policies
  4. Creates triggers for automatic profile creation and timestamps
  5. Establishes admin and user roles with proper permissions
  
  ## Tables Created:
  - profiles: User profiles with plan and usage tracking
  - battles: Battle configurations and results
  - battle_responses: Model responses for battles
  - battle_scores: Scoring data for each model
  - prompt_evolution: Prompt refinement tracking
  
  ## Security:
  - RLS enabled on all tables
  - Users can only access their own data
  - Admins can access all data for management
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

DROP POLICY IF EXISTS "Users can update own battles" ON battles;
DROP POLICY IF EXISTS "Users can read own battles" ON battles;
DROP POLICY IF EXISTS "Users can create own battles" ON battles;
DROP POLICY IF EXISTS "Admins can read all battles" ON battles;

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

-- Drop triggers
DROP TRIGGER IF EXISTS update_prompt_evolution_updated_at ON prompt_evolution;
DROP TRIGGER IF EXISTS update_battle_scores_updated_at ON battle_scores;
DROP TRIGGER IF EXISTS update_battle_responses_updated_at ON battle_responses;
DROP TRIGGER IF EXISTS update_battles_updated_at ON battles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop tables
DROP TABLE IF EXISTS prompt_evolution CASCADE;
DROP TABLE IF EXISTS battle_scores CASCADE;
DROP TABLE IF EXISTS battle_responses CASCADE;
DROP TABLE IF EXISTS battles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS increment_battle_usage(uuid) CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS battle_status CASCADE;
DROP TYPE IF EXISTS battle_mode_selection CASCADE;
DROP TYPE IF EXISTS battle_mode_type CASCADE;
DROP TYPE IF EXISTS battle_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_plan CASCADE;

-- Create custom types
CREATE TYPE user_plan AS ENUM ('free', 'premium');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE battle_type AS ENUM ('prompt', 'response');
CREATE TYPE battle_mode_type AS ENUM ('standard', 'turbo');
CREATE TYPE battle_mode_selection AS ENUM ('auto', 'manual');
CREATE TYPE battle_status AS ENUM ('running', 'completed', 'failed');

-- Create utility functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, avatar_url, plan, role, battles_used, battles_limit, last_reset_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face'),
        'free'::user_plan,
        CASE 
            WHEN NEW.email = 'admin@pba.com' THEN 'admin'::user_role
            ELSE 'user'::user_role
        END,
        0,
        3,
        CURRENT_DATE
    );
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

CREATE OR REPLACE FUNCTION increment_battle_usage(user_id uuid)
RETURNS void AS $$
BEGIN
    -- Check if it's a new day and reset if needed
    UPDATE profiles 
    SET 
        battles_used = CASE 
            WHEN last_reset_at < CURRENT_DATE THEN 1
            ELSE battles_used + 1
        END,
        last_reset_at = CASE 
            WHEN last_reset_at < CURRENT_DATE THEN CURRENT_DATE
            ELSE last_reset_at
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_id;
END;
$$ language 'plpgsql' security definer;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    avatar_url text,
    plan user_plan DEFAULT 'free'::user_plan,
    role user_role DEFAULT 'user'::user_role,
    battles_used integer DEFAULT 0,
    battles_limit integer DEFAULT 3,
    last_reset_at date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create battles table
CREATE TABLE IF NOT EXISTS battles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    battle_type battle_type NOT NULL,
    prompt text NOT NULL,
    final_prompt text,
    prompt_category text NOT NULL,
    models text[] NOT NULL,
    mode battle_mode_type DEFAULT 'standard'::battle_mode_type,
    battle_mode battle_mode_selection DEFAULT 'manual'::battle_mode_selection,
    rounds integer DEFAULT 1,
    max_tokens integer DEFAULT 500,
    temperature numeric DEFAULT 0.7,
    status battle_status DEFAULT 'running'::battle_status,
    winner text,
    total_cost numeric DEFAULT 0,
    auto_selection_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create battle_responses table
CREATE TABLE IF NOT EXISTS battle_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id uuid NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    model_id text NOT NULL,
    response text NOT NULL,
    latency integer NOT NULL,
    tokens integer NOT NULL,
    cost numeric NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create battle_scores table
CREATE TABLE IF NOT EXISTS battle_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id uuid NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
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
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    battle_id uuid NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
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
    ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
    ON profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'::user_role
        )
    );

-- Create RLS policies for battles
CREATE POLICY "Users can read own battles"
    ON battles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own battles"
    ON battles
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own battles"
    ON battles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can read all battles"
    ON battles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'::user_role
        )
    );

-- Create RLS policies for battle_responses
CREATE POLICY "Users can read own battle responses"
    ON battle_responses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM battles 
            WHERE battles.id = battle_responses.battle_id 
            AND battles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create battle responses"
    ON battle_responses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM battles 
            WHERE battles.id = battle_responses.battle_id 
            AND battles.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can read all battle responses"
    ON battle_responses
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'::user_role
        )
    );

-- Create RLS policies for battle_scores
CREATE POLICY "Users can read own battle scores"
    ON battle_scores
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM battles 
            WHERE battles.id = battle_scores.battle_id 
            AND battles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create battle scores"
    ON battle_scores
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM battles 
            WHERE battles.id = battle_scores.battle_id 
            AND battles.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can read all battle scores"
    ON battle_scores
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'::user_role
        )
    );

-- Create RLS policies for prompt_evolution
CREATE POLICY "Users can read own prompt evolution"
    ON prompt_evolution
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM battles 
            WHERE battles.id = prompt_evolution.battle_id 
            AND battles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create prompt evolution"
    ON prompt_evolution
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM battles 
            WHERE battles.id = prompt_evolution.battle_id 
            AND battles.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can read all prompt evolution"
    ON prompt_evolution
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'::user_role
        )
    );

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_battles_updated_at
    BEFORE UPDATE ON battles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Insert demo admin user if not exists
DO $$
BEGIN
    -- This will be handled by the trigger when the user signs up
    -- No need to insert directly into profiles table
END $$;