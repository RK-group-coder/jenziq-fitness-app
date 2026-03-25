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

async function debugFriends() {
    console.log('--- Checking user_profiles ---');
    const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*');
    console.log(JSON.stringify(profiles, null, 2));

    console.log('--- Checking friends ---');
    const { data: friends } = await supabase
        .from('friends')
        .select('*');
    console.log(JSON.stringify(friends, null, 2));
}

debugFriends();
