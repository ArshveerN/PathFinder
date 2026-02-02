import { createClient } from '@supabase/supabase-js'

// Prefer Vite-injected envs, but fall back to the known values in .env
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lizixhskuaptkbgoituc.supabase.co'
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpeml4aHNrdWFwdGtiZ29pdHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODk5NTksImV4cCI6MjA4NTQ2NTk1OX0.SSpx7bOByr7bx72SVWOykbX2BOTt2f0BejzuG_bRfl0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export default supabase
