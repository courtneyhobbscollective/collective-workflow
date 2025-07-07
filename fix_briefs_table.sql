-- Fix briefs table to match TypeScript interfaces
-- Run this in your Supabase SQL Editor

-- Drop the existing briefs table if it exists
DROP TABLE IF EXISTS briefs CASCADE;

-- Create the correct briefs table with proper column names
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  work_type TEXT DEFAULT 'photography' CHECK (work_type IN ('photography', 'videography', 'design', 'marketing')),
  project_value DECIMAL(10,2) DEFAULT 0,
  po_number TEXT,
  due_date DATE,
  deliverables JSONB DEFAULT '[]',
  estimated_hours JSONB DEFAULT '{"shoot": 0, "edit": 0}',
  template TEXT DEFAULT 'standard',
  stage TEXT DEFAULT 'incoming' CHECK (stage IN ('incoming', 'pre-production', 'production', 'amend-1', 'amend-2', 'final-delivery', 'client-submission')),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('weekly', 'bi-weekly', 'monthly')),
  assigned_staff TEXT[] DEFAULT '{}',
  review_urls JSONB DEFAULT '{}',
  contract_signed BOOLEAN DEFAULT FALSE,
  tasks JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_briefs_client_id ON briefs(client_id);
CREATE INDEX IF NOT EXISTS idx_briefs_stage ON briefs(stage);
CREATE INDEX IF NOT EXISTS idx_briefs_due_date ON briefs(due_date);

-- Enable Row Level Security
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for briefs
CREATE POLICY "Users can view all briefs" ON briefs
  FOR SELECT USING (true);

CREATE POLICY "Users can insert briefs" ON briefs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update briefs" ON briefs
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete briefs" ON briefs
  FOR DELETE USING (true);

-- Create staff table if it doesn't exist
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

-- Enable Row Level Security for staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff
CREATE POLICY "Users can view all staff" ON staff
  FOR SELECT USING (true);

CREATE POLICY "Users can insert staff" ON staff
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update staff" ON staff
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete staff" ON staff
  FOR DELETE USING (true);

-- Add action_url column to notifications table if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT; 