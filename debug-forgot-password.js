// Debug script to test the exact forgot password functionality
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ylzileeqhrsosgdylnce.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsemlsZWVxaHJzb3NnZHlsbmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzI0NzcsImV4cCI6MjA2NzMwODQ3N30.VLFvnIq4Rw3-PyawgE33d1VRADZCNmgGa46WVpJHLOQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugForgotPassword() {
  console.log('=== DEBUGGING FORGOT PASSWORD ===')
  
  try {
    const testEmail = 'courtney@collectivedigital.uk'
    
    console.log('1. Testing Supabase connection...')
    const { data: testData, error: testError } = await supabase.from('profiles').select('*').limit(1)
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError)
      return
    }
    
    console.log('✅ Supabase connection working')
    
    console.log('2. Sending password reset email to:', testEmail)
    console.log('3. Redirect URL will be: http://localhost:5173/reset-password')
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:5173/reset-password/' // Added trailing slash
    })
    
    if (error) {
      console.error('❌ Password reset failed:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      return
    }
    
    console.log('✅ Password reset email sent successfully!')
    console.log('Response data:', data)
    console.log('\n📧 Check your email for the reset link')
    console.log('🔗 The link should redirect to: http://localhost:5173/reset-password')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    console.error('Error stack:', error.stack)
  }
}

debugForgotPassword() 