const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 手動模擬 env 手抓
let env = {};
try {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim();
  });
} catch(e) {}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('user_logins').select('*', { count: 'exact' });
  console.log('Error:', JSON.stringify(error, null, 2));
  console.log('Count:', data?.length);
  process.exit(0);
}
check();
