-- Final Database Setup - Staff Image Upload & UI Improvements
-- Run this in your Supabase SQL Editor to ensure all changes are applied

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure staff table has all required columns for image upload
ALTER TABLE staff ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS monthly_available_hours INTEGER DEFAULT 160;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 0;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- Ensure staff table has the correct structure
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  avatar_url TEXT,
  monthly_available_hours INTEGER DEFAULT 160,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for staff table
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all staff" ON staff;
DROP POLICY IF EXISTS "Users can insert staff" ON staff;
DROP POLICY IF EXISTS "Users can update staff" ON staff;
DROP POLICY IF EXISTS "Users can delete staff" ON staff;
DROP POLICY IF EXISTS "Admin can manage staff" ON staff;

-- Create comprehensive RLS policies for staff
CREATE POLICY "Users can view all staff" ON staff
  FOR SELECT USING (true);

CREATE POLICY "Users can insert staff" ON staff
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update staff" ON staff
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete staff" ON staff
  FOR DELETE USING (true);

-- Ensure profiles table exists and has avatar_url column
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Ensure notifications table has action_url column
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Create or update the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_staff_updated_at ON staff;
CREATE TRIGGER update_staff_updated_at 
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('staff', 'profiles')
ORDER BY table_name, ordinal_position;

-- Show current staff data (if any exists)
SELECT 
  id,
  name,
  email,
  role,
  CASE 
    WHEN avatar_url IS NOT NULL AND length(avatar_url) > 0 
    THEN 'Has avatar' 
    ELSE 'No avatar' 
  END as avatar_status,
  monthly_available_hours,
  hourly_rate,
  skills,
  created_at
FROM staff
ORDER BY created_at DESC; 