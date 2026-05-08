import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://flfpwpexcuegauzoldel.supabase.co"
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZnB3cGV4Y3VlZ2F1em9sZGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNDc0OTUsImV4cCI6MjA5MzYyMzQ5NX0.LMxKNHjRNScsb2jK51LTZ8crsnpXBvSbtjeh-0BWgMs"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)