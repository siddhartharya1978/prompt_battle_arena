/*
  # Initial Schema Setup for Prompt Battle Arena

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `name` (text)
      - `avatar_url` (text, nullable)
      - `plan` (enum: free, premium)
      - `role` (enum: user, admin)
      - `battles_used` (integer, default 0)
      - `battles_limit` (integer, default 3)
      - `last_reset_at` (date, default today)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `battles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `battle_type` (enum: prompt, response)
      - `prompt` (text)
      - `final_prompt` (text, nullable)
      - `prompt_category` (text)
      - `models` (text array)
      - `mode` (enum: standard, turbo)
      - `battle_mode` (enum: auto, manual)
      - `rounds` (integer)
      - `max_tokens` (integer)
      - `temperature` (numeric)
      - `status` (enum: running, completed, failed)
      - `winner` (text, nullable)
      - `total_cost` (numeric)
      - `auto_selection_reason` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `battle_responses`
      - `id` (uuid, primary key)
      - `battle_id` (uuid, references battles)
      - `model_id` (text)
      - `response` (text)
      - `latency` (integer)
      - `tokens` (integer)
      - `cost` (numeric)
      - `created_at` (timestamp)

    - `battle_scores`
      - `id` (uuid, primary key)
      - `battle_id` (uuid, references battles)
      - `model_id` (text)
      - `accuracy` (numeric)
      - `reasoning` (numeric)
      - `structure` (numeric)
      - `creativity` (numeric)
      - `overall` (numeric)
      - `notes` (text)
      - `created_at` (timestamp)

    - `prompt_evolution`
      - `id` (uuid, primary key)
      - `battle_id` (uuid, references battles)
      - `round` (integer)
      - `prompt` (text)
      - `model_id` (text)
      - `improvements` (text array)
      - `score` (numeric)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add admin policies for admin users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_plan AS ENUM ('free', 'premium');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE battle_type AS ENUM ('prompt', 'response');
CREATE TYPE battle_mode_type AS ENUM ('standard', 'turbo');
CREATE TYPE battle_mode_selection AS ENUM ('auto', 'manual');
CREATE TYPE battle_status AS ENUM ('running', 'completed', 'failed');

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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  battle_id uuid REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
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

-- Create policies for profiles
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
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for battles
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
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for battle_responses
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
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for battle_scores
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
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create policies for prompt_evolution
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
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_battles_updated_at
  BEFORE UPDATE ON battles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to reset daily battle usage
CREATE OR REPLACE FUNCTION reset_daily_battles()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET battles_used = 0, last_reset_at = CURRENT_DATE
  WHERE last_reset_at < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;