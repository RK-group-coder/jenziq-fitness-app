
-- 1. 建立學員等級表
CREATE TABLE IF NOT EXISTS student_levels (
    level INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    min_xp INTEGER NOT NULL,
    privileges TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 建立學員 XP 規則表
CREATE TABLE IF NOT EXISTS student_xp_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    xp_value INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 關閉 RLS (確保管理端可直接讀寫)
ALTER TABLE student_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_xp_rules DISABLE ROW LEVEL SECURITY;

-- 4. 插入預設學員規則 (XP Rules)
TRUNCATE student_xp_rules;
INSERT INTO student_xp_rules (category, title, xp_value, description) VALUES
('daily', '每日簽到', 10, '每日首次開啟 APP 獲得'),
('exercise', '完成單次訓練', 50, '完成一組預定的訓練內容'),
('goal', '達成周目標', 200, '達成本周設定的運動次數目標'),
('social', '分享成果', 20, '將訓練成果分享到社群媒體'),
('review', '給予課程評論', 30, '完成課程後留下真實評價');

-- 5. 插入重設學員等級門檻 (Levels)
TRUNCATE student_levels;
INSERT INTO student_levels (level, title, min_xp, privileges) VALUES
(1, '新手學院', 0, ARRAY['獲得新手徽章', '解鎖基礎訓練記錄']),
(2, '基礎學員', 100, ARRAY['獲得基礎學員勳章', '可使用自定義訓練目標']),
(3, '成長學院', 300, ARRAY['獲得成長動能徽章', '解鎖進階運動數據圖表']),
(4, '穩定學員', 500, ARRAY['獲得規律律動徽章', '享有精選健康文章閱讀權']),
(5, '資深學員', 1000, ARRAY['獲得資深學員徽章', '課程購買享 98 折優惠']),
(6, '精進學員', 1500, ARRAY['獲得精進之星徽章', '解鎖隱藏訓練模式（測試中）']),
(7, '菁英學員', 2000, ARRAY['獲得菁英領航徽章', '課程購買享 95 折優惠']),
(8, '核心學員', 3000, ARRAY['獲得核心力量徽章', '每日簽到獎勵經驗值雙倍']),
(9, '典範學員', 5000, ARRAY['獲得典範大師徽章', '享有專屬 VIP 線上客服通道']),
(10, '品牌模範學員', 10000, ARRAY['最高榮譽：模範領袖徽章', '解鎖全套限量 APP 主題', '官方網站優先推薦及曝光', '受邀參加品牌線下活動與拍攝']);

-- 6. 強制重新載入 Schema 快取 (這是最關鍵的一步)
NOTIFY pgrst, 'reload schema';
