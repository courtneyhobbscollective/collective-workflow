-- Migration: Add brand and asset fields to clients table
alter table clients
add column brand_guidelines_url text,
add column tone_of_voice_url text,
add column fonts jsonb,
add column color_palette jsonb,
add column social_logins jsonb; 