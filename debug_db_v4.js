
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uxbqrpsmvaighyjrdfwd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YnFycHNtdmFpZ2h5anJkZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDY2MzcsImV4cCI6MjA4Nzc4MjYzN30.M-Btija9Y57AbDdTt5ddgnndtCnqOz9Or9fON0V-E8g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- STUDENT LEVELS ---');
    const { data, error } = await supabase.from('student_levels').select('*');
    if (error) {
        console.error('Error fetching student_levels:', error.message);
    } else {
        console.log('Count:', data.length);
        console.log('Data:', JSON.stringify(data, null, 2));
    }
}

inspect();
