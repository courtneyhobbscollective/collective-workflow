// Test script to verify the updated password reset flow
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ylzileeqhrsosgdylnce.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsemlsZWVxaHJzb3NnZHlsbmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzI0NzcsImV4cCI6MjA2NzMwODQ3N30.VLFvnIq4Rw3-PyawgE33d1VRADZCNmgGa46WVpJHLOQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testResetFlow() {
  console.log('=== TESTING UPDATED PASSWORD RESET FLOW ===')
  
  try {
    const email = 'courtney@collectivedigital.uk'
    
    console.log('1. Testing Supabase connection...')
    const { data: testData, error: testError } = await supabase.from('profiles').select('*').limit(1)
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError)
      return
    }
    
    console.log('✅ Supabase connection working')
    
    console.log('2. Sending password reset email with updated redirect URL...')
    console.log('Redirect URL: http://localhost:5173/reset-password/')
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/reset-password' // No trailing slash or hash
    })
    
    if (error) {
      console.error('❌ Password reset failed:', error)
      return
    }
    
    console.log('✅ Password reset email sent successfully!')
    console.log('Response data:', data)
    
    console.log('\n📧 Check your email for the reset link')
    console.log('🔗 The link should now redirect to: http://localhost:5173/reset-password/')
    console.log('🔑 The access token should be included in the URL hash')
    
    console.log('\n📋 IMPORTANT: You also need to update your Supabase project settings:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to Authentication → URL Configuration')
    console.log('3. Add this URL to the "Redirect URLs" list:')
    console.log('   http://localhost:5173/reset-password/')
    console.log('4. Save the changes')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testResetFlow() 