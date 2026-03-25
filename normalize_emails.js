import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    const value = rest.join('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function normalize() {
    console.log('Starting normalization...');

    // 1. user_profiles
    const { data: profiles } = await supabase.from('user_profiles').select('email');
    if (profiles) {
        for (const p of profiles) {
            if (p.email !== p.email.toLowerCase()) {
                console.log(`Normalizing profile: ${p.email}`);
                await supabase.from('user_profiles').update({ email: p.email.toLowerCase() }).eq('email', p.email);
            }
        }
    }

    // 2. user_permissions
    const { data: perms } = await supabase.from('user_permissions').select('email');
    if (perms) {
        for (const p of perms) {
            if (p.email !== p.email.toLowerCase()) {
                console.log(`Normalizing permission: ${p.email}`);
                await supabase.from('user_permissions').update({ email: p.email.toLowerCase() }).eq('email', p.email);
            }
        }
    }

    // 3. friends
    const { data: friends } = await supabase.from('friends').select('id, user_email, friend_email');
    if (friends) {
        for (const f of friends) {
            const updates = {};
            if (f.user_email !== f.user_email.toLowerCase()) updates.user_email = f.user_email.toLowerCase();
            if (f.friend_email !== f.friend_email.toLowerCase()) updates.friend_email = f.friend_email.toLowerCase();
            
            if (Object.keys(updates).length > 0) {
                console.log(`Normalizing friend record ${f.id}`);
                await supabase.from('friends').update(updates).eq('id', f.id);
            }
        }
    }

    console.log('Normalization complete!');
}

normalize();
