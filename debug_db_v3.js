
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uxbqrpsmvaighyjrdfwd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YnFycHNtdmFpZ2h5anJkZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDY2MzcsImV4cCI6MjA4Nzc4MjYzN30.M-Btija9Y57AbDdTt5ddgnndtCnqOz9Or9fON0V-E8g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    const { data: c } = await supabase.from('coach_levels').select('level,title').order('level');
    const { data: s } = await supabase.from('student_levels').select('level,title').order('level');
    console.log('--- COACH (COUNT: ' + (c?.length || 0) + ') ---');
    console.log(c);
    console.log('--- STUDENT (COUNT: ' + (s?.length || 0) + ') ---');
    console.log(s);
}

inspect();
