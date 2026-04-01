const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function inspectPlans() {
    try {
        const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
        const { data, error } = await supabase
            .from('membership_plans')
            .select('*');
        
        if (error) {
            fs.writeFileSync('db_output.txt', 'ERROR: ' + error.message);
        } else {
            fs.writeFileSync('db_output.txt', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        fs.writeFileSync('db_output.txt', 'CRASH: ' + e.message);
    }
}

inspectPlans();
