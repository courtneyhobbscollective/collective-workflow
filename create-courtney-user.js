// Script to create Courtney's user account
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ylzileeqhrsosgdylnce.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsemlsZWVxaHJzb3NnZHlsbmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzI0NzcsImV4cCI6MjA2NzMwODQ3N30.VLFvnIq4Rw3-PyawgE33d1VRADZCNmgGa46WVpJHLOQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createCourtneyUser() {
  console.log('Creating Courtney\'s user account...')
  
  try {
    // First, create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'courtney@collectivedigital.uk',
      password: 'Courtney2024!', // You can change this password later
      options: {
        data: {
          name: 'Courtney Hobbs',
          role: 'admin'
        }
      }
    })
    
    if (authError) {
      console.error('Error creating user in Auth:', authError)
      return
    }
    
    if (authData.user) {
      console.log('✅ User created in Auth:', authData.user.id)
      
      // Now create the profile in the database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            name: 'Courtney Hobbs',
            email: 'courtney@collectivedigital.uk',
            role: 'admin',
            avatar_url: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
      
      if (profileError) {
        console.error('Error creating profile:', profileError)
        return
      }
      
      console.log('✅ Profile created successfully:', profileData[0])
      console.log('\n🎉 Courtney\'s account is ready!')
      console.log('Email: courtney@collectivedigital.uk')
      console.log('Password: Courtney2024!')
      console.log('Role: admin')
      console.log('\nYou can now sign in at http://localhost:5173')
      
    } else {
      console.log('No user data returned from signup')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

createCourtneyUser() 