-- Create storage bucket for client assets
-- Run this in your Supabase SQL editor

-- First, create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-assets',
  'client-assets',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload client assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view client assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update client assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete client assets" ON storage.objects;

-- Create the policies
CREATE POLICY "Allow authenticated users to upload client assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'client-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view client assets" ON storage.objects
FOR SELECT USING (
  bucket_id = 'client-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update client assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'client-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete client assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'client-assets' 
  AND auth.role() = 'authenticated'
); 