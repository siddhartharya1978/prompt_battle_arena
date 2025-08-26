@@ .. @@
 -- Admin role assignment trigger
 CREATE OR REPLACE FUNCTION handle_new_user()
 RETURNS trigger AS $$
 BEGIN
   INSERT INTO public.profiles (id, email, name, role)
   VALUES (
     new.id,
     new.email,
     COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
     CASE 
       WHEN new.email = 'siddhartharya.ai@gmail.com' THEN 'admin'::user_role
       WHEN new.email = 'admin@pba.com' THEN 'admin'::user_role
       ELSE 'user'::user_role
     END
   );
   RETURN new;
 END;
 $$ LANGUAGE plpgsql SECURITY DEFINER;
 
 CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW EXECUTE FUNCTION handle_new_user();
+
+-- Create admin user directly
+-- Note: In production, you should sign up through the UI for proper password hashing
+-- This is for development/demo purposes only
+DO $$
+BEGIN
+  -- Insert admin user into auth.users (this is normally done by Supabase Auth)
+  -- For security, you should actually sign up through the UI with these credentials
+  -- This ensures proper password hashing and security
+  
+  -- The trigger above will automatically create the profile with admin role
+  -- when you sign up with siddhartharya.ai@gmail.com
+  
+  RAISE NOTICE 'Admin user setup: Please sign up with siddhartharya.ai@gmail.com / admin123 through the UI';
+  RAISE NOTICE 'The system will automatically assign admin role to this email address';
+END $$;