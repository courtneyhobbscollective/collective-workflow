-- Create client_messages table for CRM messaging functionality
-- Run this in your Supabase SQL editor

CREATE TABLE client_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL DEFAULT 'general', -- general, urgent, update, reminder
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_client_messages_client_id ON client_messages(client_id);
CREATE INDEX idx_client_messages_sent_at ON client_messages(sent_at);
CREATE INDEX idx_client_messages_message_type ON client_messages(message_type);

-- Add RLS policies
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all client messages
CREATE POLICY "Allow authenticated users to view client messages" ON client_messages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert client messages
CREATE POLICY "Allow authenticated users to insert client messages" ON client_messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update client messages
CREATE POLICY "Allow authenticated users to update client messages" ON client_messages
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete client messages
CREATE POLICY "Allow authenticated users to delete client messages" ON client_messages
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_messages_updated_at
  BEFORE UPDATE ON client_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_client_messages_updated_at(); 