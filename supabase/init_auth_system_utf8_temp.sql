
-- 建立使用者權限表
CREATE TABLE IF NOT EXISTS public.user_permissions (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL, -- 'manager', 'coach', 'student'
    user_id_string TEXT NOT NULL, -- 編號
    password TEXT NOT NULL,
    status TEXT DEFAULT '未註冊', -- '未註冊', '已註冊'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立使用者資料表
CREATE TABLE IF NOT EXISTS public.user_profiles (
    email TEXT PRIMARY KEY REFERENCES public.user_permissions(email) ON DELETE CASCADE,
    name TEXT,
    gender TEXT,
    age INTEGER,
    phone TEXT,
    branch TEXT, -- 只有教練需要
    first_login_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入超級管理者
INSERT INTO public.user_permissions (email, role, user_id_string, password, status)
VALUES ('test@gmail.com', 'admin', 'SUPER_ADMIN', '111', '已註冊')
ON CONFLICT (email) DO NOTHING;

-- 開放權限以便測試
ALTER TABLE public.user_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.user_permissions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_profiles TO anon, authenticated, service_role;

