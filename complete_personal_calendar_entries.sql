-- Complete personal_calendar_entries setup (run after table creation)
-- Run this in your Supabase SQL editor

-- Add indexes for better performance (skip if already exist)
CREATE INDEX IF NOT EXISTS idx_personal_calendar_entries_staff_id ON personal_calendar_entries(staff_id);
CREATE INDEX IF NOT EXISTS idx_personal_calendar_entries_date ON personal_calendar_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_personal_calendar_entries_staff_date ON personal_calendar_entries(staff_id, entry_date);

-- Add RLS policies (skip if already exist)
ALTER TABLE personal_calendar_entries ENABLE ROW LEVEL SECURITY;

-- Staff can view their own entries
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_calendar_entries' AND policyname = 'Staff can view own personal calendar entries') THEN
        CREATE POLICY "Staff can view own personal calendar entries" ON personal_calendar_entries
          FOR SELECT USING (auth.uid() IN (
            SELECT id FROM auth.users WHERE id = staff_id
          ));
    END IF;
END $$;

-- Staff can insert their own entries
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_calendar_entries' AND policyname = 'Staff can insert own personal calendar entries') THEN
        CREATE POLICY "Staff can insert own personal calendar entries" ON personal_calendar_entries
          FOR INSERT WITH CHECK (auth.uid() IN (
            SELECT id FROM auth.users WHERE id = staff_id
          ));
    END IF;
END $$;

-- Staff can update their own entries
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_calendar_entries' AND policyname = 'Staff can update own personal calendar entries') THEN
        CREATE POLICY "Staff can update own personal calendar entries" ON personal_calendar_entries
          FOR UPDATE USING (auth.uid() IN (
            SELECT id FROM auth.users WHERE id = staff_id
          ));
    END IF;
END $$;

-- Staff can delete their own entries
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_calendar_entries' AND policyname = 'Staff can delete own personal calendar entries') THEN
        CREATE POLICY "Staff can delete own personal calendar entries" ON personal_calendar_entries
          FOR DELETE USING (auth.uid() IN (
            SELECT id FROM auth.users WHERE id = staff_id
          ));
    END IF;
END $$;

-- Admins can view all entries
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_calendar_entries' AND policyname = 'Admins can view all personal calendar entries') THEN
        CREATE POLICY "Admins can view all personal calendar entries" ON personal_calendar_entries
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM staff 
              WHERE staff.id = auth.uid() 
              AND staff.role = 'Admin'
            )
          );
    END IF;
END $$;

-- Add comments
COMMENT ON TABLE personal_calendar_entries IS 'Personal calendar entries created by staff members for meetings, client calls, etc.';
COMMENT ON COLUMN personal_calendar_entries.entry_type IS 'Type of calendar entry: meeting, client_call, personal, other';
COMMENT ON COLUMN personal_calendar_entries.meeting_link IS 'URL for video meeting (Google Meet, Zoom, etc.)';
COMMENT ON COLUMN personal_calendar_entries.status IS 'Status of the calendar entry: confirmed, tentative, cancelled'; 