import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function dumpUsers() {
    const tables = ['user_permissions', 'user_logins', 'articles'];
    for (const table of tables) {
        console.log(`--- Table: ${table} ---`);
        const { data, error } = await supabase.from(table).select('*').limit(5);
        if (error) {
            console.log(`Error in ${table}: ${error.message}`);
        } else {
            console.log(JSON.stringify(data, null, 2));
        }
    }
}

dumpUsers();
