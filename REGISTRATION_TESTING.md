# User Registration Testing Guide

## 🧪 Testing the Registration System

### Prerequisites
1. **Supabase Setup**: Ensure your Supabase project is configured with the updated database schema
2. **Environment Variables**: Verify your `.env.local` file has the correct Supabase credentials
3. **Database Schema**: Run the updated `database-setup.sql` in your Supabase SQL editor

### Step-by-Step Testing

#### 1. **Database Setup Verification**
```sql
-- Run this in Supabase SQL Editor to verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'clients', 'staff', 'briefs', 'invoices', 'notifications');
```

#### 2. **RLS Policies Verification**
```sql
-- Check that profiles table has INSERT policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
```

#### 3. **Frontend Testing**

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to the app**:
   - Open `http://localhost:5173`
   - You should see the login/registration form

3. **Test Registration Flow**:
   - Click "Don't have an account? Sign up"
   - Fill out the registration form:
     - **Name**: Test User
     - **Email**: test@example.com
     - **Password**: testpassword123
     - **Confirm Password**: testpassword123
     - **Role**: Staff Member
   - Click "Create Account"

4. **Verify Success**:
   - User should be automatically logged in
   - Dashboard should load with user information
   - Check the browser console for any errors

#### 4. **Database Verification**

1. **Check Supabase Dashboard**:
   - Go to your Supabase project dashboard
   - Navigate to **Authentication** → **Users**
   - Verify the new user appears in the list

2. **Check Profiles Table**:
   - Go to **Table Editor** → **profiles**
   - Verify the user profile was created with correct data

3. **Verify Data Integrity**:
   ```sql
   -- Check user profile data
   SELECT * FROM profiles WHERE email = 'test@example.com';
   
   -- Verify role is set correctly
   SELECT name, email, role, created_at FROM profiles ORDER BY created_at DESC LIMIT 5;
   ```

#### 5. **Test Login Flow**

1. **Logout and Login**:
   - Click logout in the app
   - Use the same credentials to log back in
   - Verify user data is loaded correctly

2. **Test Error Handling**:
   - Try registering with an existing email
   - Try logging in with wrong password
   - Verify error messages are displayed

#### 6. **Advanced Testing**

1. **Test Role-Based Access**:
   - Create an admin user
   - Verify admin sees all navigation items
   - Create a staff user
   - Verify staff sees limited navigation

2. **Test Profile Updates**:
   - Verify user profile data is fetched correctly
   - Check that user metadata is stored properly

### 🔍 Troubleshooting

#### Common Issues

1. **"Failed to resolve import" errors**:
   - Ensure all new components are properly imported
   - Check file paths and component exports

2. **Supabase connection errors**:
   - Verify environment variables in `.env.local`
   - Check Supabase project URL and anon key
   - Ensure Supabase project is active

3. **RLS policy errors**:
   - Run the updated database schema
   - Check that INSERT policy exists for profiles table
   - Verify user has proper permissions

4. **Registration fails silently**:
   - Check browser console for errors
   - Verify Supabase Auth settings
   - Check email confirmation settings

#### Debug Commands

```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors
npm run lint
```

### 📊 Expected Results

#### Successful Registration
- ✅ User account created in Supabase Auth
- ✅ User profile created in profiles table
- ✅ User automatically logged in
- ✅ Dashboard loads with user data
- ✅ Navigation shows correct role-based items

#### Database State
- ✅ `auth.users` table has new user
- ✅ `profiles` table has corresponding profile
- ✅ RLS policies allow proper access
- ✅ User can read/write their own data

### 🧹 Cleanup

After testing, you can clean up test data:

```sql
-- Remove test users (replace with actual test email)
DELETE FROM profiles WHERE email LIKE 'test%@example.com';
-- Note: This will also remove the auth user due to foreign key constraint
```

### 🚀 Next Steps

Once registration is working:

1. **Remove test component** from Dashboard
2. **Add email verification** if needed
3. **Implement password reset** functionality
4. **Add user profile editing**
5. **Set up email notifications**

### 📝 Notes

- The registration system creates both an auth user and a profile record
- Users are automatically logged in after successful registration
- Role-based access control is implemented at the database level
- Error handling includes user-friendly messages
- All data is properly typed with TypeScript 