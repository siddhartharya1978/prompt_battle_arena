/*
  # Complete Prompt Battle Arena Database Schema

  1. New Tables
    - `profiles` - User profiles with subscription and usage tracking
    - `battles` - Battle records with type, mode, and configuration
    - `battle_responses` - Model responses for response battles
    - `battle_scores` - AI judge scores for all battles
    - `prompt_evolution` - Prompt refinement tracking for prompt battles

  2. Security
    - Enable RLS on all tables
    - User-specific access policies
    - Admin access policies
    - Secure foreign key relationships

  3. Functions
    - Auto profile creation trigger
    - Updated timestamp triggers
    - Battle usage increment function
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
  CREATE TYPE user_plan AS ENUM ('free', 'premium');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE battle_type AS ENUM ('prompt', 'response');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE battle_mode_type AS ENUM ('standard', 'turbo');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE battle_mode_selection AS ENUM ('auto', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE battle_status AS ENUM ('running', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  battle_id uuid NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  round integer NOT NULL,
  prompt text NOT NULL,
  model_id text NOT NULL,
  improvements text[] DEFAULT '{}',
  score numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_evolution ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Battles policies
CREATE POLICY "Users can read own battles" ON battles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own battles" ON battles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own battles" ON battles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all battles" ON battles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Battle responses policies
CREATE POLICY "Users can read own battle responses" ON battle_responses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM battles 
    WHERE id = battle_responses.battle_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create battle responses" ON battle_responses
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM battles 
    WHERE id = battle_responses.battle_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can read all battle responses" ON battle_responses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Battle scores policies
CREATE POLICY "Users can read own battle scores" ON battle_scores
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM battles 
    WHERE id = battle_scores.battle_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create battle scores" ON battle_scores
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM battles 
    WHERE id = battle_scores.battle_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can read all battle scores" ON battle_scores
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Prompt evolution policies
CREATE POLICY "Users can read own prompt evolution" ON prompt_evolution
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM battles 
    WHERE id = prompt_evolution.battle_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create prompt evolution" ON prompt_evolution
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM battles 
    WHERE id = prompt_evolution.battle_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can read all prompt evolution" ON prompt_evolution
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_battles_updated_at ON battles;
CREATE TRIGGER update_battles_updated_at
  BEFORE UPDATE ON battles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create profile creation trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face')
  );
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create battle usage increment function
CREATE OR REPLACE FUNCTION increment_battle_usage(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET battles_used = battles_used + 1
  WHERE id = user_id;
END;
$$ language 'plpgsql' security definer;