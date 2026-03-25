const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 讀取 .env 檔案
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log('--- Checking user_logins table ---');
  const { data, error, status } = await supabase.from('user_logins').select('*', { count: 'exact', head: true });
  
  if (error) {
    console.log('Error Code:', error.code);
    console.log('Error Message:', error.message);
    if (error.code === '42P01') {
      console.log('>>> TABLE DOES NOT EXIST <<<');
    }
  } else {
    console.log('Table exists. Status:', status);
    console.log('Total entries:', data === null ? 0 : data);
  }
  process.exit(0);
}
check();
