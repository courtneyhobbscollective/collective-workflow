// Test script to verify forgot password functionality
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ylzileeqhrsosgdylnce.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsemlsZWVxaHJzb3NnZHlsbmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzI0NzcsImV4cCI6MjA2NzMwODQ3N30.VLFvnIq4Rw3-PyawgE33d1VRADZCNmgGa46WVpJHLOQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testForgotPassword() {
  console.log('Testing forgot password functionality...')
  
  try {
    const testEmail = 'courtney@collectivedigital.uk'
    
    console.log('Sending password reset email to:', testEmail)
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:5173/reset-password/' // Added trailing slash
    })
    
    if (error) {
      console.error('❌ Password reset failed:', error)
      return
    }
    
    console.log('✅ Password reset email sent successfully!')
    console.log('Data:', data)
    console.log('\nCheck your email for the reset link.')
    console.log('The link should redirect to: http://localhost:5173/reset-password')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testForgotPassword() 