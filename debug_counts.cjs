const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let v = (match[2]||'').trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.substring(1, v.length - 1);
    env[match[1]] = v;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data: courses } = await supabase.from('coach_schedule').select('status, location');
  console.log('--- Course List ---');
  courses.forEach(c => {
    console.log(`Status: ${c.status} | Location: "${c.location}"`);
  });
  
  const { data: locations } = await supabase.from('locations').select('name');
  console.log('--- Locations Table ---');
  locations.forEach(l => {
    console.log(`Name: "${l.name}"`);
  });
  
  process.exit(0);
}
check();
