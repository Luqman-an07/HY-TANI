import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fryfjkxjessllfikxbct.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyeWZqa3hqZXNzbGxmaWt4YmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzU1MTUsImV4cCI6MjA4NTA1MTUxNX0.37LfG_RSyunPhtMMCBei49XCySuu7KgVzzpF_i_7j8U'

export const supabase = createClient(supabaseUrl, supabaseKey)