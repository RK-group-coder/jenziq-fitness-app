const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function checkTable() {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .limit(1);
    
    if (error) {
        process.stdout.write('TABLE_MISSING\n');
        process.stderr.write(error.message + '\n');
    } else {
        process.stdout.write('TABLE_EXISTS\n');
    }
}

checkTable();
