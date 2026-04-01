import { createClient } from '@supabase/supabase-api';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function simulateMembership() {
    const email = '001@example.com'; // 假設學員001的帳號
    
    // 我們嘗試將這些資訊寫入 user_profiles
    // 如果欄位不存在，這會報錯，如果是這樣，我們可能需要先在 Supabase 建立欄位
    const { error } = await supabase
        .from('user_profiles')
        .update({
            membership_name: '恆常習慣方案',
            membership_end_at: '2027/04/01',
            months: 24,
            points_details: '每月 8 堂大地課程點數'
        })
        .eq('email', email);

    if (error) {
        console.error('Update failed:', error.message);
    } else {
        console.log('Successfully simulated membership for 001');
    }
}

simulateMembership();
