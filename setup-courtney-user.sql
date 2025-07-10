-- Setup script for Courtney's user account
-- Run this in your Supabase SQL Editor after creating the user in Supabase Auth

-- First, create the user in Supabase Auth (via the Supabase dashboard)
-- Go to Authentication > Users > Add User
-- Email: courtney@collectivedigital.uk
-- Password: [set a secure password]
-- Set role to 'admin' in user metadata

-- Then create the corresponding profile
-- Replace the UUID below with the actual user ID from Supabase Auth
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  avatar_url,
  created_at,
  updated_at
) VALUES (
  -- Replace this UUID with the actual user ID from Supabase Auth
  '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
  'Courtney Hobbs',
  'courtney@collectivedigital.uk',
  'admin',
  '',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Alternative: Create a profile for any existing user
-- Replace the UUID below with an actual user ID from your Supabase Auth
/*
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  avatar_url,
  created_at,
  updated_at
) 
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.email),
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'admin'),
  '',
  au.created_at,
  NOW()
FROM auth.users au
WHERE au.email = 'courtney@collectivedigital.uk'
ON CONFLICT (id) DO NOTHING;
*/ 