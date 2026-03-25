
-- 1. 在 User Profiles 增加 XP 欄位
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;

-- 2. 建立 XP 規則表 (管理者可調整)
CREATE TABLE IF NOT EXISTS public.coach_xp_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'lesson', 'certification', 'review', 'event', 'other'
    title TEXT NOT NULL,
    xp_value INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 預設插入您提到的規則
INSERT INTO public.coach_xp_rules (category, title, xp_value, description) VALUES
('lesson', '每堂課加成', 10, '完成每堂課程登記後獲得'),
('certification', '四大證照 (四大證照)', 5000, '運動相關、至少兩天課、術科+筆試'),
('certification', '一般證照 (一般證照)', 1000, '運動相關、二日以上課程'),
('certification', '短期證照 (上課考試一天內)', 400, '單日完成之證照考核'),
('certification', '研習證書', 250, '研習性質之證明文件'),
('review', 'Google 五星好評 (每5人)', 30, '學員專屬好評回饋')
ON CONFLICT DO NOTHING;

-- 4. 建立等級門檻表
CREATE TABLE IF NOT EXISTS public.coach_levels (
    level INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    min_xp INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入預設等級規則
INSERT INTO public.coach_levels (level, title, min_xp) VALUES
(1, '見習教練', 0),
(2, '入門教練', 1000),
(3, '初階教練', 2000),
(4, '資深教練', 3500),
(5, '專業教練', 5000),
(6, '菁英教練', 6500),
(7, '專精教練', 8000),
(8, '核心教練', 10000),
(9, '至尊教練', 13000),
(10, '首席教練', 16000),
(11, '品牌代表教練', 20000)
ON CONFLICT (level) DO UPDATE SET title = EXCLUDED.title, min_xp = EXCLUDED.min_xp;

-- 5. 建立 XP 申請表 (周課堂/活動)
CREATE TABLE IF NOT EXISTS public.coach_xp_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES auth.users(id),
    coach_email TEXT,
    type TEXT NOT NULL, -- 'weekly_lessons', 'event'
    lessons_count INTEGER, -- 只有周課堂有
    apply_xp INTEGER NOT NULL,
    notes TEXT,
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT '待審核', -- '待審核', '已核准', '已退件'
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 權限開啟
ALTER TABLE public.coach_xp_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_xp_applications DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.coach_xp_rules TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.coach_levels TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.coach_xp_applications TO anon, authenticated, service_role;


-- 建立教練通知表 (用於收件夾)
CREATE TABLE IF NOT EXISTS public.coach_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_email TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'system',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 權限調整
ALTER TABLE public.coach_notifications DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.coach_notifications TO anon, authenticated, service_role;

