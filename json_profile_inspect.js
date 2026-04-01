import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectProfiles() {
    const { data: profile, error } = await supabase.from('user_profiles').select('*').limit(1);
    const output = { error, profile };
    fs.writeFileSync('profile_inspect_result.json', JSON.stringify(output, null, 2));
    console.log('Results written to profile_inspect_result.json');
}

inspectProfiles();
