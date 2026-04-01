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
    const { data: profile } = await supabase.from('user_profiles').select('*').limit(1);
    if (profile && profile.length > 0) {
        console.log('Columns:', Object.keys(profile[0]));
        console.log('Sample data:', profile[0]);
    } else {
        console.log('No profiles found.');
    }
}

inspectProfiles();
