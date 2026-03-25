import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').filter(line => line.includes('=')).forEach(line => {
    const key = line.substring(0, line.indexOf('=')).trim();
    const val = line.substring(line.indexOf('=') + 1).trim();
    env[key] = val;
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function checkRLS() {
    const { data, error } = await supabase.rpc('get_policies_status'); // This rpc might not exist, let's just try to read profiles of others

    console.log('--- Profiles fetched via Anon ---');
    const { data: p } = await supabase.from('user_profiles').select('*');
    console.log(p);
}

checkRLS();
