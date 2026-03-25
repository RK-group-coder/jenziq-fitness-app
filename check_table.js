import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Manually parse .env.local because we are in a node script
const envContent = readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
    console.log('Checking notifications table...');
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .limit(1);

    if (error) {
        console.error('TABLE ERROR:', error.message);
        if (error.message.includes('relation "public.notifications" does not exist')) {
            console.log('The table "notifications" was not found in the database.');
        }
    } else {
        console.log('TABLE EXISTS: Success!');
    }
}

checkTable();
