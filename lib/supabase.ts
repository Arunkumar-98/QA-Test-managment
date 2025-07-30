import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tbutffculjesqiodwxsh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidXRmZmN1bGplc3Fpb2R3eHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzczNjMsImV4cCI6MjA2ODk1MzM2M30.pbvISdr311KMo7Ia_T3GyDRDCnPBELIWBLw3PkpBSjM'

export const supabase = createClient(supabaseUrl, supabaseKey) 