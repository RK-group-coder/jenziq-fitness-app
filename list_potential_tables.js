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

async function listTables() {
    const list = [
        'user_profiles',
        'membership_plans',
        'user_memberships',
        'orders',
        'purchases',
        'notifications'
    ];
    
    for (const table of list) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                console.log(`Table ${table}: MISSING (${error.message})`);
            } else {
                const cols = data.length > 0 ? Object.keys(data[0]).join(', ') : '(empty table)';
                console.log(`Table ${table}: EXISTS. Sample columns: ${cols}`);
            }
        } catch (e) {
            console.log(`Table ${table}: ERROR (${e.message})`);
        }
    }
}

listTables();
