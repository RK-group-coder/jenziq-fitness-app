-- ==========================================
-- 徹底解決支援中心 (管理員) 權限報錯的終極腳本
-- ==========================================

-- 1. 先滿足外鍵約束：在 user_permissions 建立管理員帳號
-- 密碼設為 111 (對應你的系統預設)
INSERT INTO public.user_permissions (email, role, user_id_string, password, status)
VALUES ('test@gmail.com', 'admin', 'SUPPORT_ADMIN', '111', '已註冊')
ON CONFLICT (email) DO UPDATE SET role = 'admin', status = '已註冊';

-- 2. 建立管理員名片 (在 user_profiles)
-- 確保 role 欄位存在 (如果之前沒加過)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='role') THEN
        ALTER TABLE user_profiles ADD COLUMN role TEXT;
    END IF;
END $$;

INSERT INTO public.user_profiles (email, name, role, first_login_completed)
VALUES ('test@gmail.com', '支援中心', 'admin', true)
ON CONFLICT (email) DO UPDATE SET name = '支援中心', role = 'admin', first_login_completed = true;

-- 3. 讓所有現有用戶自動與支援中心建立連結
-- 先刪除重複的，再重新建立
DELETE FROM friends WHERE (user_email = 'test@gmail.com') OR (friend_email = 'test@gmail.com');

-- 建立雙向好友關係
INSERT INTO friends (user_email, friend_email)
SELECT email, 'test@gmail.com' FROM user_profiles WHERE email != 'test@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO friends (user_email, friend_email)
SELECT 'test@gmail.com', email FROM user_profiles WHERE email != 'test@gmail.com'
ON CONFLICT DO NOTHING;

-- 4. 確保 RLS 權限允許讀取
ALTER TABLE public.user_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.user_permissions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_profiles TO anon, authenticated, service_role;
