const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
    const idx = line.indexOf('=');
    if (idx > -1) {
        env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
    }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function check() {
  const { data, error } = await supabase.from('coach_schedule').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(Object.keys(data[0] || {})));
  }
}
check();
