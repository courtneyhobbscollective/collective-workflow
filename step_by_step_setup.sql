-- Step-by-Step Database Setup - Safe for existing databases
-- Run this in your Supabase SQL Editor

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create clients table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS clients (
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

-- Step 4: Add missing columns to existing clients table (if they don't exist)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'project' CHECK (type IN ('project', 'retainer'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_assets TEXT[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_guidelines TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_tone_of_voice TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_colors TEXT[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_fonts TEXT[] DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Step 5: Create briefs table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS briefs (
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

-- Step 6: Create invoices table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS invoices (
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

-- Step 7: Create chat_channels table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Create chat_messages table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 9: Create notifications table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 10: Create indexes (only if columns exist)
DO $$
BEGIN
  -- Check if status column exists in clients table before creating index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
  END IF;
  
  -- Check if type column exists in clients table before creating index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'type') THEN
    CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
  END IF;
  
  -- Check if stage column exists in briefs table before creating index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'briefs' AND column_name = 'stage') THEN
    CREATE INDEX IF NOT EXISTS idx_briefs_stage ON briefs(stage);
  END IF;
  
  -- Check if status column exists in briefs table before creating index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'briefs' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_briefs_status ON briefs(status);
  END IF;
  
  -- Check if status column exists in invoices table before creating index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
  END IF;
  
  -- Check if user_id and read columns exist in notifications table before creating index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'user_id') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
  END IF;
END $$;

-- Step 11: Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 12: Create RLS Policies (with IF NOT EXISTS to avoid conflicts)
DO $$
BEGIN
  -- Profiles policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles') THEN
    CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
  
  -- Clients policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can view all clients') THEN
    CREATE POLICY "Users can view all clients" ON clients FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can insert clients') THEN
    CREATE POLICY "Users can insert clients" ON clients FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can update clients') THEN
    CREATE POLICY "Users can update clients" ON clients FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can delete clients') THEN
    CREATE POLICY "Users can delete clients" ON clients FOR DELETE USING (true);
  END IF;
  
  -- Briefs policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'briefs' AND policyname = 'Users can view all briefs') THEN
    CREATE POLICY "Users can view all briefs" ON briefs FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'briefs' AND policyname = 'Users can insert briefs') THEN
    CREATE POLICY "Users can insert briefs" ON briefs FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'briefs' AND policyname = 'Users can update briefs') THEN
    CREATE POLICY "Users can update briefs" ON briefs FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'briefs' AND policyname = 'Users can delete briefs') THEN
    CREATE POLICY "Users can delete briefs" ON briefs FOR DELETE USING (true);
  END IF;
  
  -- Invoices policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can view all invoices') THEN
    CREATE POLICY "Users can view all invoices" ON invoices FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can insert invoices') THEN
    CREATE POLICY "Users can insert invoices" ON invoices FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can update invoices') THEN
    CREATE POLICY "Users can update invoices" ON invoices FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can delete invoices') THEN
    CREATE POLICY "Users can delete invoices" ON invoices FOR DELETE USING (true);
  END IF;
  
  -- Chat channels policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_channels' AND policyname = 'Users can view all chat channels') THEN
    CREATE POLICY "Users can view all chat channels" ON chat_channels FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_channels' AND policyname = 'Users can insert chat channels') THEN
    CREATE POLICY "Users can insert chat channels" ON chat_channels FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_channels' AND policyname = 'Users can update chat channels') THEN
    CREATE POLICY "Users can update chat channels" ON chat_channels FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_channels' AND policyname = 'Users can delete chat channels') THEN
    CREATE POLICY "Users can delete chat channels" ON chat_channels FOR DELETE USING (true);
  END IF;
  
  -- Chat messages policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can view all chat messages') THEN
    CREATE POLICY "Users can view all chat messages" ON chat_messages FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can insert chat messages') THEN
    CREATE POLICY "Users can insert chat messages" ON chat_messages FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can update chat messages') THEN
    CREATE POLICY "Users can update chat messages" ON chat_messages FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Users can delete chat messages') THEN
    CREATE POLICY "Users can delete chat messages" ON chat_messages FOR DELETE USING (true);
  END IF;
  
  -- Notifications policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
    CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can insert notifications') THEN
    CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications') THEN
    CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can delete their own notifications') THEN
    CREATE POLICY "Users can delete their own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 13: Verify all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'clients', 'briefs', 'invoices', 'chat_channels', 'chat_messages', 'notifications')
ORDER BY table_name; 