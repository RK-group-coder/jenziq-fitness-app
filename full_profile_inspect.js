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
    if (error) {
        console.error('Error:', error);
        return;
    }
    if (profile && profile.length > 0) {
        const columns = Object.keys(profile[0]);
        console.log('--- User Profiles Columns ---');
        columns.forEach(col => console.log(`- ${col}`));
        console.log('\n--- Sample Data ---');
        console.log(JSON.stringify(profile[0], null, 2));
    } else {
        console.log('No profiles found.');
    }
}

inspectProfiles();
