-- Fix Database 500 Errors - Drop and recreate tables with proper structure
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing tables (this will clear all data)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_channels CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS briefs CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 2: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  type TEXT DEFAULT 'project' CHECK (type IN ('project', 'retainer')),
  brand_assets TEXT[] DEFAULT '{}',
  brand_guidelines TEXT,
  brand_tone_of_voice TEXT,
  brand_colors TEXT[] DEFAULT '{}',
  brand_fonts TEXT[] DEFAULT '{}',
  social_media JSONB DEFAULT '[]',
  contract_template TEXT,
  chat_channel_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create briefs table
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  stage TEXT DEFAULT 'draft' CHECK (stage IN ('draft', 'review', 'approved', 'in_progress', 'completed')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  budget DECIMAL(10,2),
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES briefs(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  issued_date DATE DEFAULT CURRENT_DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create chat_channels table
CREATE TABLE chat_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Create chat_messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 9: Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 10: Create indexes
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_type ON clients(type);
CREATE INDEX idx_briefs_stage ON briefs(stage);
CREATE INDEX idx_briefs_status ON briefs(status);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);

-- Step 11: Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 12: Create RLS Policies
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Clients policies
CREATE POLICY "Users can view all clients" ON clients
  FOR SELECT USING (true);

CREATE POLICY "Users can insert clients" ON clients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update clients" ON clients
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete clients" ON clients
  FOR DELETE USING (true);

-- Briefs policies
CREATE POLICY "Users can view all briefs" ON briefs
  FOR SELECT USING (true);

CREATE POLICY "Users can insert briefs" ON briefs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update briefs" ON briefs
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete briefs" ON briefs
  FOR DELETE USING (true);

-- Invoices policies
CREATE POLICY "Users can view all invoices" ON invoices
  FOR SELECT USING (true);

CREATE POLICY "Users can insert invoices" ON invoices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update invoices" ON invoices
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete invoices" ON invoices
  FOR DELETE USING (true);

-- Chat channels policies
CREATE POLICY "Users can view all chat channels" ON chat_channels
  FOR SELECT USING (true);

CREATE POLICY "Users can insert chat channels" ON chat_channels
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update chat channels" ON chat_channels
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete chat channels" ON chat_channels
  FOR DELETE USING (true);

-- Chat messages policies
CREATE POLICY "Users can view all chat messages" ON chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update chat messages" ON chat_messages
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete chat messages" ON chat_messages
  FOR DELETE USING (true);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Step 13: Verify all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'clients', 'briefs', 'invoices', 'chat_channels', 'chat_messages', 'notifications')
ORDER BY table_name; 