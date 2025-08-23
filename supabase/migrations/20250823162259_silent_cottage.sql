/*
  # Fix profile creation to properly save user name from signup

  1. Updates
    - Fix handle_new_user function to extract name from auth.users metadata
    - Ensure profile gets the full name provided during signup
    - Add fallback logic for name extraction

  2. Security
    - Maintains existing RLS policies
    - Ensures proper error handling
*/

-- Drop and recreate the handle_new_user function with proper name handling
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- Get user email
  user_email := NEW.email;
  
  -- Extract name from user metadata, with fallbacks
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.user_metadata->>'name',
    NEW.user_metadata->>'full_name',
    split_part(user_email, '@', 1),
    'User'
  );

  -- Insert profile with proper error handling
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
      'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
      'free',
      'user',
      0,
      3,
      CURRENT_DATE,
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the user creation
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update existing profiles that might have missing names
UPDATE public.profiles 
SET name = COALESCE(
  NULLIF(name, ''),
  split_part(email, '@', 1),
  'User'
)
WHERE name IS NULL OR name = '' OR name = 'User';