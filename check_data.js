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

async function checkData() {
    console.log('--- Profiles ---');
    const { data: profiles } = await supabase.from('user_profiles').select('email, name, role, branch');
    profiles?.forEach(p => console.log(`${p.name} (${p.email}): role=${p.role}, branch=${p.branch}`));

    console.log('\n--- Permissions ---');
    const { data: perms } = await supabase.from('user_permissions').select('email, role');
    perms?.forEach(p => console.log(`${p.email}: role=${p.role}`));
}

checkData();
