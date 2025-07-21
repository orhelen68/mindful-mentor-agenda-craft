import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csysoafafvychbtefews.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzeXNvYWZhZnZ5Y2hidGVmZXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTcwNjksImV4cCI6MjA2ODY3MzA2OX0.zEBkhQP5cxt2lyXvM73rNlfKN7zNO7vAfGugmhYhMcs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);