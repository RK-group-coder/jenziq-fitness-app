import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkTable() {
    try {
        const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
        const { data, error } = await supabase
            .from('membership_plans')
            .select('*')
            .limit(1);
        
        if (error) {
            console.log('TABLE_MISSING: ' + error.message);
        } else {
            console.log('TABLE_EXISTS');
        }
    } catch (e) {
        console.log('ERROR: ' + e.message);
    }
}

checkTable();
