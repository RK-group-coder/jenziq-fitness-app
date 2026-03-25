import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        const val = line.substring(line.indexOf('=') + 1).trim();
        env[key.trim()] = val;
    }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function check() {
    const { data: perms } = await supabase.from('user_permissions').select('*');
    const { data: profiles } = await supabase.from('user_profiles').select('*');
    writeFileSync('full_data.json', JSON.stringify({ perms, profiles }, null, 2));
}

check();
