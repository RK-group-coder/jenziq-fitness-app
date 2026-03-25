import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugDashboardData() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const results = {};
    
    // 1. user_profiles
    const { data: profiles, error: profErr } = await supabase.from('user_profiles').select('email, role, branch_id, userIdString');
    results.user_profiles = profErr ? { error: profErr.message } : profiles;
    
    // 2. coach_schedule (approved)
    const { data: approvedSchedules, error: schedErr } = await supabase.from('coach_schedule').select('*').eq('status', 'approved');
    results.approved_schedules = schedErr ? { error: schedErr.message } : approvedSchedules;
    
    // 3. user_logins (this month)
    const { count: loginCount, error: loginErr } = await supabase.from('user_logins').select('*', { count: 'exact', head: true }).gte('login_at', firstDay);
    results.login_count_this_month = loginErr ? { error: loginErr.message } : loginCount;

    // 4. locations
    const { data: locations, error: locErr } = await supabase.from('locations').select('*');
    results.locations = locErr ? { error: locErr.message } : locations;

    writeFileSync('debug_dashboard_data.json', JSON.stringify(results, null, 2));
}

debugDashboardData();
