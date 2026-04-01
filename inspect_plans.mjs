import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function inspectPlans() {
    try {
        const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
        const { data, error } = await supabase
            .from('membership_plans')
            .select('*');
        
        if (error) {
            console.log('ERROR: ' + error.message);
        } else {
            console.log('PLANS_DATA: ' + JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.log('CRASH: ' + e.message);
    }
}

inspectPlans();
