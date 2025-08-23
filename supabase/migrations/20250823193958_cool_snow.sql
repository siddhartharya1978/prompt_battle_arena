/*
  # Create Demo Accounts

  1. Demo Accounts
    - Create demo user account (demo@example.com)
    - Create demo admin account (admin@pba.com)
    - Both accounts have verified email status
    - Admin account has admin role in profiles table

  2. Security
    - Accounts are created with proper authentication
    - Profiles are automatically created via trigger
    - Admin role is properly assigned
*/

-- Create demo user account
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'demo@example.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Demo User"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Create demo admin account
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@pba.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Demo Admin"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Ensure profiles are created for demo accounts
INSERT INTO profiles (
  id,
  email,
  name,
  avatar_url,
  plan,
  role,
  battles_used,
  battles_limit
) 
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', 'Demo User'),
  'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
  'free'::user_plan,
  CASE 
    WHEN u.email = 'admin@pba.com' THEN 'admin'::user_role
    ELSE 'user'::user_role
  END,
  0,
  CASE 
    WHEN u.email = 'admin@pba.com' THEN 999
    ELSE 3
  END
FROM auth.users u
WHERE u.email IN ('demo@example.com', 'admin@pba.com')
ON CONFLICT (id) DO UPDATE SET
  role = CASE 
    WHEN excluded.email = 'admin@pba.com' THEN 'admin'::user_role
    ELSE 'user'::user_role
  END,
  battles_limit = CASE 
    WHEN excluded.email = 'admin@pba.com' THEN 999
    ELSE 3
  END;