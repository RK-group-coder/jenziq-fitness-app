import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').map(l => l.trim()).filter(l => l && l.includes('=')).forEach(line => {
    const key = line.substring(0, line.indexOf('=')).trim();
    const val = line.substring(line.indexOf('=') + 1).trim();
    env[key] = val;
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function check() {
    const { data: profiles } = await supabase.from('user_profiles').select('*');
    const { data: friends } = await supabase.from('friends').select('*');
    const output = { profiles, friends };
    writeFileSync('debug_output.json', JSON.stringify(output, null, 2));
    console.log('Result written to debug_output.json');
}

check();
