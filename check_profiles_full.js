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

async function checkUserProfiles() {
    const { data: columns, error: colErr } = await supabase.rpc('get_table_columns', { table_name: 'user_profiles' });
    // If RPC doesn't exist, we fallback
    if (colErr) {
        const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
        if (error) {
            console.error(error);
        } else {
            console.log('User Profile Columns (sample):', Object.keys(data[0] || {}));
        }
    } else {
        console.log('User Profile Columns:', columns);
    }
    
    const { data: profiles, error: profErr } = await supabase.from('user_profiles').select('*').limit(5);
    if (!profErr) console.log('Sample profiles:', JSON.stringify(profiles, null, 2));
}

checkUserProfiles();
