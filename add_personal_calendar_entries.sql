-- Add personal_calendar_entries table for staff to manage their own calendar entries
-- Run this in your Supabase SQL editor

CREATE TABLE personal_calendar_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  entry_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  entry_type VARCHAR(50) NOT NULL DEFAULT 'meeting', -- meeting, client_call, personal, other
  meeting_link VARCHAR(500), -- Google Meet, Zoom, etc.
  location VARCHAR(255),
  is_all_day BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, tentative, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_personal_calendar_entries_staff_id ON personal_calendar_entries(staff_id);
CREATE INDEX idx_personal_calendar_entries_date ON personal_calendar_entries(entry_date);
CREATE INDEX idx_personal_calendar_entries_staff_date ON personal_calendar_entries(staff_id, entry_date);

-- Add RLS policies
ALTER TABLE personal_calendar_entries ENABLE ROW LEVEL SECURITY;

-- Staff can view their own entries
CREATE POLICY "Staff can view own personal calendar entries" ON personal_calendar_entries
  FOR SELECT USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE id = staff_id
  ));

-- Staff can insert their own entries
CREATE POLICY "Staff can insert own personal calendar entries" ON personal_calendar_entries
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT id FROM auth.users WHERE id = staff_id
  ));

-- Staff can update their own entries
CREATE POLICY "Staff can update own personal calendar entries" ON personal_calendar_entries
  FOR UPDATE USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE id = staff_id
  ));

-- Staff can delete their own entries
CREATE POLICY "Staff can delete own personal calendar entries" ON personal_calendar_entries
  FOR DELETE USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE id = staff_id
  ));

-- Admins can view all entries
CREATE POLICY "Admins can view all personal calendar entries" ON personal_calendar_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.id = auth.uid() 
      AND staff.role = 'Admin'
    )
  );

-- Add comments
COMMENT ON TABLE personal_calendar_entries IS 'Personal calendar entries created by staff members for meetings, client calls, etc.';
COMMENT ON COLUMN personal_calendar_entries.entry_type IS 'Type of calendar entry: meeting, client_call, personal, other';
COMMENT ON COLUMN personal_calendar_entries.meeting_link IS 'URL for video meeting (Google Meet, Zoom, etc.)';
COMMENT ON COLUMN personal_calendar_entries.status IS 'Status of the calendar entry: confirmed, tentative, cancelled'; 