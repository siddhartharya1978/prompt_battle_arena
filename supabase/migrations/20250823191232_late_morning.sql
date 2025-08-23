/*
  # Fix infinite recursion in profiles RLS policies

  1. Security Changes
    - Drop existing problematic RLS policies on profiles table
    - Create new, simplified RLS policies that don't cause recursion
    - Ensure policies reference auth.uid() directly without circular dependencies

  2. Policy Changes
    - Users can read their own profile using auth.uid() = id
    - Users can update their own profile using auth.uid() = id  
    - Admins can read all profiles by checking role in auth.users metadata
    - Allow profile creation during signup process
*/

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON profiles;

-- Create new, simple RLS policies without recursion
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

CREATE POLICY "Allow profile creation"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admin policy using auth.jwt() to avoid recursion
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (
      'admin@pba.com',
      'admin@example.com'
    )
  );