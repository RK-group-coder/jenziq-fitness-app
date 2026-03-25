-- Create student_levels table if not exists
CREATE TABLE IF NOT EXISTS student_levels (
    level INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    min_xp INTEGER NOT NULL,
    privileges TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Truncate and insert/upsert the requested student levels
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
(10, '品牌模範學員', 10000, ARRAY['最高榮譽：模範領袖徽章', '解鎖全套限量 APP 主題', '官方網站優先推薦及曝光', '受邀參加品牌線下活動與拍攝'])
ON CONFLICT (level) DO UPDATE SET
    title = EXCLUDED.title,
    min_xp = EXCLUDED.min_xp,
    privileges = EXCLUDED.privileges;
