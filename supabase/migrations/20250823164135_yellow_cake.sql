/*
  # Complete Schema Reset and Rebuild
  
  This migration completely resets and rebuilds the entire schema to fix authentication issues.
  
  1. Clean up existing objects
  2. Recreate all enums, tables, functions, triggers, and policies
  3. Ensure proper profile auto-creation
  4. Fix all authentication flow issues
*/

-- Drop existing objects in correct order
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_battles_updated_at ON battles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

DROP TABLE IF EXISTS prompt_evolution CASCADE;
DROP TABLE IF EXISTS battle_scores CASCADE;
DROP TABLE IF EXISTS battle_responses CASCADE;
DROP TABLE IF EXISTS battles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS battle_status CASCADE;
DROP TYPE IF EXISTS battle_mode_selection CASCADE;
DROP TYPE IF EXISTS battle_mode_type CASCADE;
DROP TYPE IF EXISTS battle_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_plan CASCADE;

-- Create enums
CREATE TYPE user_plan AS ENUM ('free', 'premium');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE battle_type AS ENUM ('prompt', 'response');
CREATE TYPE battle_mode_type AS ENUM ('standard', 'turbo');
CREATE TYPE battle_mode_selection AS ENUM ('auto', 'manual');
CREATE TYPE battle_status AS ENUM ('running', 'completed', 'failed');

-- Create profiles table
CREATE TABLE profiles (
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
CREATE TABLE battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE TABLE battle_responses (
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
CREATE TABLE battle_scores (
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
CREATE TABLE prompt_evolution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  round integer NOT NULL,
  prompt text NOT NULL,
  model_id text NOT NULL,
  improvements text[] DEFAULT '{}',
  score numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_battles_user_id ON battles(user_id);
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battles_created_at ON battles(created_at DESC);
CREATE INDEX idx_battle_responses_battle_id ON battle_responses(battle_id);
CREATE INDEX idx_battle_scores_battle_id ON battle_scores(battle_id);
CREATE INDEX idx_prompt_evolution_battle_id ON prompt_evolution(battle_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_evolution ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profile auto-creation function with comprehensive error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email text;
  user_name text;
  default_avatar text := 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face';
BEGIN
  -- Get email from auth.users
  user_email := NEW.email;
  
  -- Extract name from multiple sources with fallbacks
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(user_email, '@', 1)
  );
  
  -- Ensure we have a valid name
  IF user_name IS NULL OR trim(user_name) = '' THEN
    user_name := split_part(user_email, '@', 1);
  END IF;
  
  -- Insert profile with comprehensive error handling
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      name,
      avatar_url,
      plan,
      role,
      battles_used,
      battles_limit,
      last_reset_at,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      user_email,
      user_name,
      default_avatar,
      'free'::user_plan,
      CASE 
        WHEN user_email = 'admin@pba.com' THEN 'admin'::user_role
        ELSE 'user'::user_role
      END,
      0,
      3,
      CURRENT_DATE,
      now(),
      now()
    );
    
    RAISE LOG 'Profile created successfully for user: % with name: %', NEW.id, user_name;
    
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE LOG 'Profile already exists for user: %', NEW.id;
    WHEN OTHERS THEN
      RAISE LOG 'Error creating profile for user %: % %', NEW.id, SQLSTATE, SQLERRM;
      -- Don't re-raise the error to prevent auth failure
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_battles_updated_at
  BEFORE UPDATE ON battles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow trigger to insert profiles" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for battles
CREATE POLICY "Users can read own battles" ON battles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own battles" ON battles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own battles" ON battles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can read all battles" ON battles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for battle_responses
CREATE POLICY "Users can read own battle responses" ON battle_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM battles 
      WHERE id = battle_responses.battle_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create battle responses" ON battle_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM battles 
      WHERE id = battle_responses.battle_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all battle responses" ON battle_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for battle_scores
CREATE POLICY "Users can read own battle scores" ON battle_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM battles 
      WHERE id = battle_scores.battle_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create battle scores" ON battle_scores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM battles 
      WHERE id = battle_scores.battle_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all battle scores" ON battle_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for prompt_evolution
CREATE POLICY "Users can read own prompt evolution" ON prompt_evolution
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM battles 
      WHERE id = prompt_evolution.battle_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create prompt evolution" ON prompt_evolution
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM battles 
      WHERE id = prompt_evolution.battle_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all prompt evolution" ON prompt_evolution
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert demo users if they don't exist
DO $$
BEGIN
  -- Check if demo user exists in auth.users, if not, we can't create profile
  -- This is just for reference - actual users must be created through Supabase Auth
  RAISE LOG 'Schema reset complete. Demo users should be created through Supabase Auth UI or registration flow.';
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;