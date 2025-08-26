/*
  # Fix Admin User Setup - Handle Existing Auth User
  
  This migration handles the case where siddhartharya.ai@gmail.com already exists
  in auth.users but needs proper profile setup and admin role assignment.
*/

-- =====================================================
-- PHASE 1: CREATE PROFILE FOR EXISTING AUTH USER
-- =====================================================

-- First, let's check if the user exists in auth.users and create profile
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Find the existing auth user
    SELECT id, email, raw_user_meta_data
    INTO user_record
    FROM auth.users 
    WHERE email = 'siddhartharya.ai@gmail.com';
    
    IF FOUND THEN
        -- Create profile for existing auth user
        INSERT INTO public.profiles (id, email, name, role, plan, battles_used, battles_limit)
        VALUES (
            user_record.id,
            user_record.email,
            COALESCE(
                user_record.raw_user_meta_data->>'name', 
                user_record.raw_user_meta_data->>'full_name', 
                'Admin User'
            ),
            'admin'::user_role,
            'premium'::user_plan,
            0,
            999999 -- Unlimited for admin
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'admin'::user_role,
            plan = 'premium'::user_plan,
            battles_limit = 999999,
            updated_at = now();
        
        RAISE NOTICE 'Profile created/updated for existing user: %', user_record.email;
    ELSE
        RAISE NOTICE 'User % not found in auth.users', 'siddhartharya.ai@gmail.com';
    END IF;
END $$;

-- =====================================================
-- PHASE 2: RESET PASSWORD FOR ADMIN USER
-- =====================================================

-- Update the password for the admin user to 'admin123'
-- Note: This uses Supabase's internal password hashing
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Get the user ID
    SELECT id INTO user_id
    FROM auth.users 
    WHERE email = 'siddhartharya.ai@gmail.com';
    
    IF FOUND THEN
        -- Update password using Supabase's auth.users table
        -- The password will be properly hashed by Supabase
        UPDATE auth.users 
        SET 
            encrypted_password = crypt('admin123', gen_salt('bf')),
            updated_at = now()
        WHERE id = user_id;
        
        RAISE NOTICE 'Password updated for admin user';
    END IF;
END $$;

-- =====================================================
-- PHASE 3: ENSURE ADMIN PERMISSIONS
-- =====================================================

-- Make sure the admin user has all necessary permissions
UPDATE profiles 
SET 
    role = 'admin'::user_role,
    plan = 'premium'::user_plan,
    battles_limit = 999999,
    updated_at = now()
WHERE email = 'siddhartharya.ai@gmail.com';

-- =====================================================
-- PHASE 4: VERIFICATION
-- =====================================================

-- Verify the admin user setup
SELECT 
    p.id,
    p.email,
    p.name,
    p.role,
    p.plan,
    p.battles_limit,
    u.email_confirmed_at,
    u.created_at as auth_created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email = 'siddhartharya.ai@gmail.com';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

/*
  🎉 ADMIN USER SETUP COMPLETE!
  
  ✅ Profile created for existing auth user
  ✅ Password reset to 'admin123'
  ✅ Admin role assigned
  ✅ Premium plan activated
  ✅ Unlimited battles granted
  
  NEXT STEPS:
  1. Try logging in with: siddhartharya.ai@gmail.com / admin123
  2. You should now have full admin access
  3. Navigate to /admin to verify admin panel access
  
  STATUS: ADMIN USER READY FOR LOGIN
*/