
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uxbqrpsmvaighyjrdfwd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YnFycHNtdmFpZ2h5anJkZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDY2MzcsImV4cCI6MjA4Nzc4MjYzN30.M-Btija9Y57AbDdTt5ddgnndtCnqOz9Or9fON0V-E8g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- COACH LEVELS ---');
    const { data: cLevels } = await supabase.from('coach_levels').select('level, title, min_xp').order('level');
    console.log(cLevels);

    console.log('--- STUDENT LEVELS ---');
    const { data: sLevels } = await supabase.from('student_levels').select('level, title, min_xp').order('level');
    console.log(sLevels);

    console.log('--- TABLES INFO ---');
    const { data: tables } = await supabase.rpc('get_tables_info'); // if exists
    console.log(tables);
}

inspect();
