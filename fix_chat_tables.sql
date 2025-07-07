-- Fix Chat Tables - Add missing columns and ensure correct structure
-- Run this in Supabase SQL Editor to fix the chat functionality

-- Check if participants column exists in chat_channels, add if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chat_channels' 
        AND column_name = 'participants'
    ) THEN
        ALTER TABLE chat_channels ADD COLUMN participants TEXT[] DEFAULT '{}';
        RAISE NOTICE 'participants column added to chat_channels table';
    ELSE
        RAISE NOTICE 'participants column already exists in chat_channels table';
    END IF;
END $$;

-- Check if updated_at column exists in chat_channels, add if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chat_channels' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE chat_channels ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'updated_at column added to chat_channels table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in chat_channels table';
    END IF;
END $$;

-- Check if mentions column exists in chat_messages, add if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'mentions'
    ) THEN
        ALTER TABLE chat_messages ADD COLUMN mentions TEXT[] DEFAULT '{}';
        RAISE NOTICE 'mentions column added to chat_messages table';
    ELSE
        RAISE NOTICE 'mentions column already exists in chat_messages table';
    END IF;
END $$;

-- Check if type column exists in chat_messages, add if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE chat_messages ADD COLUMN type VARCHAR(50) DEFAULT 'text';
        -- Add check constraint if it doesn't exist
        BEGIN
            ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_type_check 
            CHECK (type IN ('text', 'image', 'gif', 'file'));
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE 'type check constraint already exists';
        END;
        RAISE NOTICE 'type column added to chat_messages table';
    ELSE
        RAISE NOTICE 'type column already exists in chat_messages table';
    END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
    -- chat_channels indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_channels_client_id') THEN
        CREATE INDEX idx_chat_channels_client_id ON chat_channels(client_id);
        RAISE NOTICE 'Created index idx_chat_channels_client_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_channels_name') THEN
        CREATE INDEX idx_chat_channels_name ON chat_channels(name);
        RAISE NOTICE 'Created index idx_chat_channels_name';
    END IF;
    
    -- chat_messages indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_channel_id') THEN
        CREATE INDEX idx_chat_messages_channel_id ON chat_messages(channel_id);
        RAISE NOTICE 'Created index idx_chat_messages_channel_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_sender_id') THEN
        CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
        RAISE NOTICE 'Created index idx_chat_messages_sender_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_created_at') THEN
        CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
        RAISE NOTICE 'Created index idx_chat_messages_created_at';
    END IF;
    
    -- clients index
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_clients_chat_channel_id') THEN
        CREATE INDEX idx_clients_chat_channel_id ON clients(chat_channel_id);
        RAISE NOTICE 'Created index idx_clients_chat_channel_id';
    END IF;
END $$;

-- Enable RLS if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'chat_channels' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on chat_channels';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'chat_messages' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on chat_messages';
    END IF;
END $$;

-- Create basic RLS policies if they don't exist
DO $$
BEGIN
    -- chat_channels policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_channels' AND policyname = 'Allow all operations') THEN
        CREATE POLICY "Allow all operations" ON chat_channels FOR ALL USING (true);
        RAISE NOTICE 'Created RLS policy for chat_channels';
    END IF;
    
    -- chat_messages policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chat_messages' AND policyname = 'Allow all operations') THEN
        CREATE POLICY "Allow all operations" ON chat_messages FOR ALL USING (true);
        RAISE NOTICE 'Created RLS policy for chat_messages';
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
DO $$
BEGIN
    -- Create general channel
    IF NOT EXISTS (SELECT 1 FROM chat_channels WHERE name = 'general') THEN
        INSERT INTO chat_channels (client_id, name, participants)
        SELECT 
            NULL,
            'general',
            array_agg(id::text)
        FROM profiles 
        WHERE role IN ('admin', 'staff');
        RAISE NOTICE 'Created general channel';
    ELSE
        RAISE NOTICE 'General channel already exists';
    END IF;
    
    -- Create staff channel
    IF NOT EXISTS (SELECT 1 FROM chat_channels WHERE name = 'staff') THEN
        INSERT INTO chat_channels (client_id, name, participants)
        SELECT 
            NULL,
            'staff',
            array_agg(id::text)
        FROM profiles 
        WHERE role IN ('admin', 'staff');
        RAISE NOTICE 'Created staff channel';
    ELSE
        RAISE NOTICE 'Staff channel already exists';
    END IF;
END $$;

-- Show current table structure
SELECT 'chat_channels table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'chat_channels' 
ORDER BY ordinal_position;

SELECT 'chat_messages table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
ORDER BY ordinal_position;

-- Show current channels
SELECT 'Current chat channels:' as info;
SELECT id, name, client_id, array_length(participants, 1) as participant_count 
FROM chat_channels 
ORDER BY created_at; 