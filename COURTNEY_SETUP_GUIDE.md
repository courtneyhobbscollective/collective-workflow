# Courtney's Setup Guide

## 🚀 Quick Setup for Local Development

### Step 1: Set up Supabase Project

1. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com) and sign up/login
   - Click "New Project"
   - Choose your organization
   - Enter project details:
     - Name: `collective-workflow`
     - Database Password: (create a strong password)
     - Region: (choose closest to you)
   - Click "Create new project"

2. **Get your project credentials:**
   - In your Supabase dashboard, go to **Settings** → **API**
   - Copy the **Project URL** (starts with `https://`)
   - Copy the **anon public** key (starts with `eyJ`)

### Step 2: Update Environment Variables

1. **Edit the `.env` file** in your project root:
   ```bash
   # Replace the placeholder values with your actual Supabase credentials
   VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
   ```

### Step 3: Set up Database Tables

1. **Run the database setup script:**
   - In your Supabase dashboard, go to **SQL Editor**
   - Copy and paste the contents of `complete_database_setup.sql`
   - Click "Run" to create all the necessary tables

### Step 4: Create Your User Account

1. **Create user in Supabase Auth:**
   - In your Supabase dashboard, go to **Authentication** → **Users**
   - Click "Add User"
   - Enter:
     - Email: `courtney@collectivedigital.uk`
     - Password: (set a secure password)
   - In the user metadata, add:
     ```json
     {
       "name": "Courtney Hobbs",
       "role": "admin"
     }
     ```

2. **Create your profile in the database:**
   - Go to **SQL Editor** in Supabase
   - Copy and paste the contents of `setup-courtney-user.sql`
   - **Important:** Replace the UUID placeholder with your actual user ID
   - To find your user ID:
     - Go to **Authentication** → **Users**
     - Click on your user
     - Copy the UUID from the user details
   - Click "Run" to create your profile

### Step 5: Test the Setup

1. **Restart your development server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Open your browser:**
   - Navigate to `http://localhost:5173`
   - You should see the login page

3. **Sign in:**
   - Email: `courtney@collectivedigital.uk`
   - Password: (the password you set in Step 4)

## 🔧 Troubleshooting

### Common Issues:

1. **"Database connection error"**
   - Check your `.env` file has the correct Supabase URL and key
   - Make sure your Supabase project is active

2. **"Login failed"**
   - Verify your user exists in Supabase Auth
   - Check that your profile exists in the `profiles` table
   - Ensure the user ID in your profile matches the Auth user ID

3. **"Table doesn't exist"**
   - Run the `complete_database_setup.sql` script in Supabase SQL Editor

4. **Environment variables not loading**
   - Restart your development server after updating `.env`
   - Make sure the file is named exactly `.env` (not `.env.local`)

### Getting Your User ID:

If you need to find your user ID for the profile creation:

```sql
-- Run this in Supabase SQL Editor to find your user ID
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'courtney@collectivedigital.uk';
```

## 🎯 Next Steps

Once you're signed in successfully:

1. **Explore the dashboard** - You should see the main dashboard with admin access
2. **Test the features** - Try creating clients, staff, briefs, etc.
3. **Check real-time updates** - Test the chat and notification features
4. **Review the billing system** - Explore the automated billing features

## 📞 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Ensure all database tables are created correctly
4. Check that RLS policies are properly configured

---

**Happy coding! 🚀** 