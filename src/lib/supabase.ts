import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jpcyqojysjgpybikfgcd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwY3lxb2p5c2pncHliaWtmZ2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjc4OTQsImV4cCI6MjA3OTk0Mzg5NH0.3y70J292fK8tchUZcp-lm2yKhrjp9bWtdzH8uCnW8Ls'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
