import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lmajrojnrnrwlerjxatk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtYWpyb2pucm5yd2xlcmp4YXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTQ1MjQsImV4cCI6MjA5MzU5MDUyNH0.JiWjd8_tmM5UmnugiBbZldWSgwGpsNE0PA8_QQYlhUc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { supabaseUrl, supabaseAnonKey };
