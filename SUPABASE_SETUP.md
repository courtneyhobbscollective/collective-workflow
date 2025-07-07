# Supabase Setup Guide

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `your-project-name`
   - Database Password: (create a strong password)
   - Region: (choose closest to you)
5. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)

## Step 3: Update Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Test the Connection

1. Start your development server: `npm run dev`
2. Open your browser to `http://localhost:5173`
3. You should see a "Supabase Connection Status" card on the dashboard
4. If it shows "Connected successfully!", you're all set!

## Step 5: Create Your Database Tables

You can create tables through the Supabase dashboard or using SQL. Here are some example tables for your app:

```sql
-- Users table (extends Supabase auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Briefs table
CREATE TABLE public.briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  stage TEXT DEFAULT 'incoming',
  project_value DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Next Steps

- Set up Row Level Security (RLS) policies
- Configure authentication
- Create API functions
- Set up real-time subscriptions

## Troubleshooting

- **Connection failed**: Check your environment variables are correct
- **CORS errors**: Make sure your Supabase project URL is correct
- **Authentication issues**: Check your RLS policies and auth settings 