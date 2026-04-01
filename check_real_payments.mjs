import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkRealData() {
    console.log('--- Checking real Payment Notifications ---');
    const { data: notices, error } = await supabase
        .from('notifications')
        .select('*')
        .or('tag.eq.公告,tag.eq.繳費')
        .limit(10);

    if (error) {
        console.error('Error fetching notices:', error.message);
        return;
    }

    console.log(`Found ${notices?.length || 0} real notifications`);
    if (notices && notices.length > 0) {
        console.log('Sample Notice Content:', notices[0].content);
        console.log('Sample Target:', notices[0].target_email || notices[0].target_role);
    }
    
    // Check if there is a payment_history table or similar
    const { error: tblError } = await supabase.from('payment_history').select('*').limit(1);
    if (tblError) {
        console.log('Table "payment_history" does not exist yet. Using notifications for now.');
    } else {
        console.log('Table "payment_history" found! Will use it for real payment statuses.');
    }
}

checkRealData();
