
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uxbqrpsmvaighyjrdfwd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YnFycHNtdmFpZ2h5anJkZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDY2MzcsImV4cCI6MjA4Nzc4MjYzN30.M-Btija9Y57AbDdTt5ddgnndtCnqOz9Or9fON0V-E8g';

const supabase = createClient(supabaseUrl, supabaseKey);

import fs from 'fs';

async function inspect() {
    const { data: stLevels, error: slError } = await supabase.from('student_levels').select('*').limit(1);
    const { data: stRules, error: srError } = await supabase.from('student_xp_rules').select('*').limit(1);

    console.log('Student Levels Error:', slError?.message);
    console.log('Student Rules Error:', srError?.message);
    console.log('Student Levels:', stLevels);
    console.log('Student Rules:', stRules);
}

inspect();
