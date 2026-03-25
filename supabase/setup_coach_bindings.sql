-- 建立教練綁定請求表
CREATE TABLE IF NOT EXISTS public.coach_bindings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_email TEXT NOT NULL,
    coach_email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'unbound')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 安全策略為 everyone
ALTER TABLE public.coach_bindings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.coach_bindings TO anon, authenticated, service_role;

-- 確保 notifications 可以針對特定人
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_email TEXT;
