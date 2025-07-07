-- Quick Chat Tables Check and Create Script
-- Run this in Supabase SQL Editor to set up chat functionality

-- Check if chat_channels table exists, create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_channels') THEN
        CREATE TABLE chat_channels (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            participants TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_chat_channels_client_id ON chat_channels(client_id);
        CREATE INDEX idx_chat_channels_name ON chat_channels(name);
        
        -- Enable RLS
        ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
        
        -- Basic RLS policy (allow all for now)
        CREATE POLICY "Allow all operations" ON chat_channels FOR ALL USING (true);
        
        RAISE NOTICE 'chat_channels table created successfully';
    ELSE
        RAISE NOTICE 'chat_channels table already exists';
    END IF;
END $$;

-- Check if chat_messages table exists, create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        CREATE TABLE chat_messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
            sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'text' CHECK (type IN ('text', 'image', 'gif', 'file')),
            mentions TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_chat_messages_channel_id ON chat_messages(channel_id);
        CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
        CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
        
        -- Enable RLS
        ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
        
        -- Basic RLS policy (allow all for now)
        CREATE POLICY "Allow all operations" ON chat_messages FOR ALL USING (true);
        
        RAISE NOTICE 'chat_messages table created successfully';
    ELSE
        RAISE NOTICE 'chat_messages table already exists';
    END IF;
END $$;

-- Check if chat_channel_id column exists in clients table, add if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'chat_channel_id'
    ) THEN
        ALTER TABLE clients ADD COLUMN chat_channel_id UUID REFERENCES chat_channels(id);
        CREATE INDEX idx_clients_chat_channel_id ON clients(chat_channel_id);
        RAISE NOTICE 'chat_channel_id column added to clients table';
    ELSE
        RAISE NOTICE 'chat_channel_id column already exists in clients table';
    END IF;
END $$;

-- Enable real-time for chat_messages
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
        RAISE NOTICE 'Real-time enabled for chat_messages';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Real-time already enabled for chat_messages';
    END;
END $$;

-- Create default channels if they don't exist
INSERT INTO chat_channels (client_id, name, participants)
SELECT 
    NULL,
    'general',
    array_agg(id::text)
FROM profiles 
WHERE role IN ('admin', 'staff')
ON CONFLICT (name) DO NOTHING;

INSERT INTO chat_channels (client_id, name, participants)
SELECT 
    NULL,
    'staff',
    array_agg(id::text)
FROM profiles 
WHERE role IN ('admin', 'staff')
ON CONFLICT (name) DO NOTHING;

-- Show current channels
SELECT 'Current chat channels:' as info;
SELECT id, name, client_id, array_length(participants, 1) as participant_count 
FROM chat_channels 
ORDER BY created_at; 