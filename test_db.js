import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uxbqrpsmvaighyjrdfwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4YnFycHNtdmFpZ2h5anJkZndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDY2MzcsImV4cCI6MjA4Nzc4MjYzN30.M-Btija9Y57AbDdTt5ddgnndtCnqOz9Or9fON0V-E8g';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('is_featured', { ascending: false })
        .limit(1);

    if (error) {
        console.log('Error found:', error.message);
    } else {
        console.log('Success, is_featured exists.');
    }
}

test();
