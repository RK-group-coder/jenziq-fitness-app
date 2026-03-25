import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

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
    const results = {};
    const tables = ['user_permissions', 'articles'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(5);
        if (error) {
            results[table] = `Error: ${error.message}`;
        } else {
            results[table] = data;
        }
    }
    writeFileSync('dump_results.json', JSON.stringify(results, null, 2));
}

dumpUsers();
