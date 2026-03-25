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
  const { data: users } = await supabase.from('user_profiles').select('*').eq('role', 'coach');
  console.log('--- Coaches ---');
  users.forEach(u => {
    console.log(`Email: ${u.email} | BranchID: ${u.branch_id} | Location: ${u.location}`);
  });
  
  const { data: locs } = await supabase.from('locations').select('*');
  console.log('--- Locations ---');
  console.log(locs);
  
  process.exit(0);
}
check();
