-- Fix user profiles to ensure all auth users have corresponding profiles
-- Run this in your Supabase SQL Editor

-- First, let's see what auth users exist without profiles
SELECT 
  au.id as auth_user_id,
  au.email,
  au.raw_user_meta_data
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Create profiles for any auth users that don't have them
INSERT INTO profiles (id, name, email, role, avatar_url, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'staff') as role,
  COALESCE(au.raw_user_meta_data->>'avatar_url', '') as avatar_url,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify all auth users now have profiles
SELECT 
  au.id as auth_user_id,
  au.email,
  p.id as profile_id,
  p.name,
  p.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- Update the notifications table to ensure the foreign key constraint is properly set
-- First, let's check if there are any notifications with invalid user_ids
SELECT 
  n.id,
  n.user_id,
  n.title,
  p.id as profile_exists
FROM notifications n
LEFT JOIN profiles p ON n.user_id = p.id
WHERE p.id IS NULL;

-- If there are any notifications with invalid user_ids, we can either:
-- 1. Delete them (if they're not important)
-- 2. Update them to use a valid user_id

-- Option 1: Delete notifications with invalid user_ids (uncomment if needed)
-- DELETE FROM notifications 
-- WHERE user_id NOT IN (SELECT id FROM profiles);

-- Option 2: Update notifications to use the first admin user (uncomment if needed)
-- UPDATE notifications 
-- SET user_id = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
-- WHERE user_id NOT IN (SELECT id FROM profiles);

-- Ensure the foreign key constraint is properly enforced
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE; 