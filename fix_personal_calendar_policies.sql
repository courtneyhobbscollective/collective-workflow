-- Fix RLS policies for personal_calendar_entries
-- Run this in your Supabase SQL editor

-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view own personal calendar entries" ON personal_calendar_entries;
DROP POLICY IF EXISTS "Staff can insert own personal calendar entries" ON personal_calendar_entries;
DROP POLICY IF EXISTS "Staff can update own personal calendar entries" ON personal_calendar_entries;
DROP POLICY IF EXISTS "Staff can delete own personal calendar entries" ON personal_calendar_entries;
DROP POLICY IF EXISTS "Admins can view all personal calendar entries" ON personal_calendar_entries;

-- Create corrected policies
-- Staff can view their own entries (check by email)
CREATE POLICY "Staff can view own personal calendar entries" ON personal_calendar_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.id = staff_id 
      AND staff.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Staff can insert their own entries
CREATE POLICY "Staff can insert own personal calendar entries" ON personal_calendar_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.id = staff_id 
      AND staff.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Staff can update their own entries
CREATE POLICY "Staff can update own personal calendar entries" ON personal_calendar_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.id = staff_id 
      AND staff.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Staff can delete their own entries
CREATE POLICY "Staff can delete own personal calendar entries" ON personal_calendar_entries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.id = staff_id 
      AND staff.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Admins can view all entries
CREATE POLICY "Admins can view all personal calendar entries" ON personal_calendar_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND staff.role = 'Admin'
    )
  ); 