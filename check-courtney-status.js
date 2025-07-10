// Script to check Courtney's user status and reset password if needed
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ylzileeqhrsosgdylnce.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsemlsZWVxaHJzb3NnZHlsbmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzI0NzcsImV4cCI6MjA2NzMwODQ3N30.VLFvnIq4Rw3-PyawgE33d1VRADZCNmgGa46WVpJHLOQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCourtneyStatus() {
  console.log('Checking Courtney\'s user status...')
  
  try {
    // Try to sign in with the password we set
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'courtney@collectivedigital.uk',
      password: 'Courtney2024!'
    })
    
    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message)
      
      // Try to reset the password
      console.log('Attempting to reset password...')
      const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
        'courtney@collectivedigital.uk',
        {
          redirectTo: 'http://localhost:5173/reset-password/' // Added trailing slash
        }
      )
      
      if (resetError) {
        console.error('❌ Password reset failed:', resetError)
        return
      }
      
      console.log('✅ Password reset email sent!')
      console.log('Check your email for a password reset link.')
      console.log('Or try signing in with a different password.')
      
    } else {
      console.log('✅ Sign in successful!')
      console.log('User ID:', signInData.user.id)
      console.log('Email confirmed:', signInData.user.email_confirmed_at)
      
      // Check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
      
      if (profileError) {
        console.error('Error checking profile:', profileError)
        return
      }
      
      if (profileData && profileData.length > 0) {
        console.log('✅ Profile exists:', profileData[0])
      } else {
        console.log('❌ Profile does not exist, creating it...')
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: signInData.user.id,
              name: 'Courtney Hobbs',
              email: 'courtney@collectivedigital.uk',
              role: 'admin',
              avatar_url: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select()
        
        if (createError) {
          console.error('Error creating profile:', createError)
          return
        }
        
        console.log('✅ Profile created:', newProfile[0])
      }
      
      console.log('\n🎉 You can now sign in at http://localhost:5173')
      console.log('Email: courtney@collectivedigital.uk')
      console.log('Password: Courtney2024!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkCourtneyStatus() 