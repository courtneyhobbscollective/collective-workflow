// Debug script to check password authentication
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ylzileeqhrsosgdylnce.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsemlsZWVxaHJzb3NnZHlsbmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzI0NzcsImV4cCI6MjA2NzMwODQ3N30.VLFvnIq4Rw3-PyawgE33d1VRADZCNmgGa46WVpJHLOQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugPasswordIssue() {
  console.log('=== DEBUGGING PASSWORD ISSUE ===')
  
  try {
    const email = 'courtney@collectivedigital.uk'
    
    // Test 1: Try to sign in with the new password
    console.log('1. Testing sign in with new password...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'Courtney2024!' // Try the original password first
    })
    
    if (signInError) {
      console.log('❌ Sign in failed with original password:', signInError.message)
      
      // Test 2: Try with a different password
      console.log('2. Trying with a different password...')
      const { data: signInData2, error: signInError2 } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'password123'
      })
      
      if (signInError2) {
        console.log('❌ Sign in failed with password123:', signInError2.message)
      } else {
        console.log('✅ Sign in successful with password123')
        console.log('User data:', signInData2.user)
      }
      
    } else {
      console.log('✅ Sign in successful with original password')
      console.log('User data:', signInData.user)
    }
    
    // Test 3: Check if we can reset the password again
    console.log('3. Testing password reset...')
    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/reset-password/' // Added trailing slash
    })
    
    if (resetError) {
      console.error('❌ Password reset failed:', resetError)
    } else {
      console.log('✅ Password reset email sent successfully')
      console.log('Check your email for a new reset link')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugPasswordIssue() 