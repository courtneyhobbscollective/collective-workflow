// Test script to check Supabase connection and user existence
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ylzileeqhrsosgdylnce.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsemlsZWVxaHJzb3NnZHlsbmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzI0NzcsImV4cCI6MjA2NzMwODQ3N30.VLFvnIq4Rw3-PyawgE33d1VRADZCNmgGa46WVpJHLOQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('*').limit(1)
    
    if (error) {
      console.error('Connection error:', error)
      return
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('Sample data:', data)
    
    // Check if Courtney's user exists
    const { data: courtneyData, error: courtneyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'courtney@collectivedigital.uk')
    
    if (courtneyError) {
      console.error('Error checking for Courtney:', courtneyError)
      return
    }
    
    if (courtneyData && courtneyData.length > 0) {
      console.log('✅ Courtney\'s profile found:', courtneyData[0])
    } else {
      console.log('❌ Courtney\'s profile not found in database')
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testConnection() 