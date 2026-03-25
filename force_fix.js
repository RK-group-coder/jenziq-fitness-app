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

async function fix() {
    console.log('Fixing roles...');
    await supabase.from('user_profiles').update({ role: 'coach' }).eq('email', 'testcoach001@gmail.com');
    await supabase.from('user_profiles').update({ role: 'coach' }).eq('email', 'testcoach002@gmail.com');

    console.log('Adding friendships...');
    const friendshipData = [
        { user_email: 'testcoach001@gmail.com', friend_email: 'testcoach002@gmail.com' },
        { user_email: 'testcoach002@gmail.com', friend_email: 'testcoach001@gmail.com' }
    ];
    const { error } = await supabase.from('friends').upsert(friendshipData, { onConflict: 'user_email,friend_email' });

    if (error) {
        console.error('Friendship Error:', error);
    } else {
        console.log('Friendships added successfully!');
    }
}
fix();
