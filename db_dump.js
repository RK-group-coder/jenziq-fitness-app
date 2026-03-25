import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    const value = rest.join('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
    console.log('Fetching data...');
    const { data: profiles } = await supabase.from('user_profiles').select('email, name, role, branch');
    const { data: friends } = await supabase.from('friends').select('*');
    const { data: permissions } = await supabase.from('user_permissions').select('email, role, status');
    
    const result = {
        profiles,
        friends,
        permissions
    };
    
    writeFileSync('db_debug_dump.json', JSON.stringify(result, null, 2));
    console.log('Done! Written to db_debug_dump.json');
}

debug();
