-- Chat Tables Setup for Creative Agency SaaS Platform

-- Create chat_channels table
CREATE TABLE IF NOT EXISTS chat_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    participants TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'text' CHECK (type IN ('text', 'image', 'gif', 'file')),
    mentions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_channels_client_id ON chat_channels(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_name ON chat_channels(name);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_channels
CREATE POLICY "Users can view channels they participate in" ON chat_channels
    FOR SELECT USING (
        auth.uid()::text = ANY(participants) OR 
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can insert channels" ON chat_channels
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can update channels" ON chat_channels
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

CREATE POLICY "Admins can delete channels" ON chat_channels
    FOR DELETE USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- Create RLS policies for chat_messages
CREATE POLICY "Users can view messages in channels they participate in" ON chat_messages
    FOR SELECT USING (
        channel_id IN (
            SELECT id FROM chat_channels 
            WHERE auth.uid()::text = ANY(participants) OR 
                  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
        )
    );

CREATE POLICY "Users can insert messages in channels they participate in" ON chat_messages
    FOR INSERT WITH CHECK (
        channel_id IN (
            SELECT id FROM chat_channels 
            WHERE auth.uid()::text = ANY(participants) OR 
                  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
        ) AND
        sender_id = auth.uid()
    );

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (
        sender_id = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

CREATE POLICY "Users can delete their own messages or admins can delete any" ON chat_messages
    FOR DELETE USING (
        sender_id = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

-- Enable real-time for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Create function to automatically add staff to channels
CREATE OR REPLACE FUNCTION add_staff_to_channels()
RETURNS TRIGGER AS $$
BEGIN
    -- Add all staff members to the new channel
    UPDATE chat_channels 
    SET participants = (
        SELECT array_agg(id::text) 
        FROM profiles 
        WHERE role IN ('admin', 'staff')
    )
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add staff to new channels
CREATE TRIGGER trigger_add_staff_to_channels
    AFTER INSERT ON chat_channels
    FOR EACH ROW
    EXECUTE FUNCTION add_staff_to_channels();

-- Create function to get channel participants with details
CREATE OR REPLACE FUNCTION get_channel_participants(channel_uuid UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.email,
        p.role,
        p.avatar_url
    FROM profiles p
    WHERE p.id::text = ANY(
        SELECT participants 
        FROM chat_channels 
        WHERE id = channel_uuid
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to search messages
CREATE OR REPLACE FUNCTION search_channel_messages(
    channel_uuid UUID,
    search_query TEXT,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    channel_id UUID,
    sender_id UUID,
    content TEXT,
    type TEXT,
    mentions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    sender_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.id,
        cm.channel_id,
        cm.sender_id,
        cm.content,
        cm.type,
        cm.mentions,
        cm.created_at,
        p.name as sender_name
    FROM chat_messages cm
    JOIN profiles p ON cm.sender_id = p.id
    WHERE cm.channel_id = channel_uuid
    AND cm.content ILIKE '%' || search_query || '%'
    ORDER BY cm.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Insert default staff channel if it doesn't exist
INSERT INTO chat_channels (client_id, name, participants)
SELECT 
    NULL,
    'staff',
    array_agg(id::text)
FROM profiles 
WHERE role IN ('admin', 'staff')
ON CONFLICT (name) DO NOTHING;

-- Add chat_channel_id column to clients table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'chat_channel_id'
    ) THEN
        ALTER TABLE clients ADD COLUMN chat_channel_id UUID REFERENCES chat_channels(id);
    END IF;
END $$;

-- Create index for chat_channel_id in clients table
CREATE INDEX IF NOT EXISTS idx_clients_chat_channel_id ON clients(chat_channel_id);

COMMENT ON TABLE chat_channels IS 'Chat channels for clients and staff communication';
COMMENT ON TABLE chat_messages IS 'Individual messages within chat channels';
COMMENT ON COLUMN chat_channels.client_id IS 'Reference to client (NULL for staff channels)';
COMMENT ON COLUMN chat_channels.participants IS 'Array of user IDs who can access this channel';
COMMENT ON COLUMN chat_messages.mentions IS 'Array of user IDs mentioned in the message'; 