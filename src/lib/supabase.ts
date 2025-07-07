import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Since we're hardcoding the values, they should always be valid
const isValidUrl = supabaseUrl && supabaseUrl.startsWith('https://')
const isValidKey = supabaseAnonKey && supabaseAnonKey.startsWith('eyJ')

export const supabase = isValidUrl && isValidKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null 