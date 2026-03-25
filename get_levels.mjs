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

async function getLevels() {
    console.log('Fetching levels...');
    const { data: coachLevels } = await supabase.from('coach_levels').select('*').order('level');
    const { data: studentLevels } = await supabase.from('student_levels').select('*').order('level');
    fs.writeFileSync('levels_data.json', JSON.stringify({ coachLevels, studentLevels }, null, 2));
    console.log('Done!');
}

getLevels();
