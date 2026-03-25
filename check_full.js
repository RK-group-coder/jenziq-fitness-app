import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

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
    console.log('--- Checking all user_profiles ---');
    const { data: profiles, error } = await supabase.from('user_profiles').select('*');
    if (error) {
        console.error('ERROR:', error);
        return;
    }
    profiles.forEach(p => {
        console.log(`[PROFILE] Name: ${p.name}, Email: ${p.email}, Branch: ${p.branch}, Role: ${p.role}`);
    });
}

check();
