// Test script to update password directly using access token
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ylzileeqhrsosgdylnce.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsemlsZWVxaHJzb3NnZHlsbmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzI0NzcsImV4cCI6MjA2NzMwODQ3N30.VLFvnIq4Rw3-PyawgE33d1VRADZCNmgGa46WVpJHLOQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPasswordUpdate() {
  console.log('=== TESTING PASSWORD UPDATE ===')
  
  try {
    const email = 'courtney@collectivedigital.uk'
    const newPassword = 'Courtney2024!'
    
    // First, sign in with the access token to get authenticated
    console.log('1. Signing in with access token...')
    
    // Use the access token from the URL you provided
    const accessToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNzdzBJYlV3cUk5Ky9wRDkiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3lsemlsZWVxaHJzb3NnZHlsbmNlLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmMzRmMzZiOC0yODU4LTQ1MjItYTFhOC1hYzZmYTcyOTJjNzEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzUyMTU1NTQwLCJpYXQiOjE3NTIxNTE5NDAsImVtYWlsIjoiY291cnRuZXlAY29sbGVjdGl2ZWRpZ2l0YWwudWsiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiY291cnRuZXlAY29sbGVjdGl2ZWRpZ2l0YWwudWsiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IkNvdXJ0bmV5IEhvYmJzIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJyb2xlIjoiYWRtaW4iLCJzdWIiOiJmMzRmMzZiOC0yODU4LTQ1MjItYTFhOC1hYzZmYTcyOTJjNzEifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvdHAiLCJ0aW1lc3RhbXAiOjE3NTIxNTE5NDB9XSwic2Vzc2lvbl9pZCI6IjE3YTM4YmQ4LTU3OWQtNGJkMC05MGFlLTZjYjA3NmEwMDQ1NyIsImlzX2Fub255bW91cyI6ZmFsc2V9.aADeSIAtdxuZJq2ZbTapZZfJ2K_-9Q-MqyNHf_uup5g'
    
    // Set the session manually
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: 'arga5uu4mbv4'
    })
    
    if (sessionError) {
      console.error('❌ Failed to set session:', sessionError)
      return
    }
    
    console.log('✅ Session set successfully')
    console.log('User:', sessionData.user?.email)
    
    // Now try to update the password
    console.log('2. Updating password...')
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (updateError) {
      console.error('❌ Password update failed:', updateError)
      return
    }
    
    console.log('✅ Password updated successfully!')
    console.log('Updated user:', updateData.user?.email)
    
    // Test the new password
    console.log('3. Testing new password...')
    const { data: testData, error: testError } = await supabase.auth.signInWithPassword({
      email: email,
      password: newPassword
    })
    
    if (testError) {
      console.error('❌ New password test failed:', testError)
    } else {
      console.log('✅ New password works!')
      console.log('Test user:', testData.user?.email)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testPasswordUpdate() 