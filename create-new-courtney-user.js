// Create a new user account for Courtney
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ylzileeqhrsosgdylnce.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsemlsZWVxaHJzb3NnZHlsbmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzI0NzcsImV4cCI6MjA2NzMwODQ3N30.VLFvnIq4Rw3-PyawgE33d1VRADZCNmgGa46WVpJHLOQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createNewCourtneyUser() {
  console.log('=== CREATING NEW COURTNEY USER ===')
  
  try {
    const email = 'courtney@collectivedigital.uk'
    const password = 'password123' // Simple password for testing
    
    // First, check if user already exists
    console.log('1. Checking if user exists...')
    const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    
    if (existingUser) {
      console.log('✅ User already exists and password works!')
      console.log('Email:', existingUser.user.email)
      console.log('ID:', existingUser.user.id)
      return
    }
    
    console.log('❌ User does not exist or password is wrong')
    
    // Create new user
    console.log('2. Creating new user...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: 'Courtney Hobbs',
          role: 'admin'
        }
      }
    })
    
    if (signUpError) {
      console.error('❌ User creation failed:', signUpError)
      return
    }
    
    console.log('✅ User created successfully!')
    console.log('User ID:', signUpData.user?.id)
    console.log('Email:', signUpData.user?.email)
    
    // Create profile
    if (signUpData.user) {
      console.log('3. Creating user profile...')
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: signUpData.user.id,
            name: 'Courtney Hobbs',
            email: email,
            role: 'admin',
            avatar_url: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
      
      if (profileError) {
        console.error('❌ Profile creation failed:', profileError)
      } else {
        console.log('✅ Profile created successfully!')
      }
    }
    
    console.log('\n🎉 NEW USER ACCOUNT READY!')
    console.log('Email: courtney@collectivedigital.uk')
    console.log('Password: password123')
    console.log('Role: admin')
    console.log('\nYou can now sign in at http://localhost:5173')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createNewCourtneyUser() 