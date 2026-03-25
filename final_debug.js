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

async function run() {
    console.log('Profiles:');
    const { data: p } = await supabase.from('user_profiles').select('*');
    p.forEach(x => console.log(`- ${x.email} | ${x.name} | ${x.role} | ${x.branch}`));

    console.log('\nFriends:');
    const { data: f } = await supabase.from('friends').select('*');
    f.forEach(x => console.log(`- ${x.user_email} -> ${x.friend_email}`));
}
run();
